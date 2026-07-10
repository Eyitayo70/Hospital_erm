"""
Hospital Registry — backend API
Flask + SQLite. Two separate portals share this one backend/database:
  - Patients: self-register, view their own read-only folder + appointments,
    submit complaints. Cannot edit anything or see doctor's reports.
  - Health Officers: email+password+one-time-code login, full access to
    every patient folder, appointments, complaints, and confidential
    doctor's reports.

Run:  python3 app.py   (serves on http://localhost:5000)
"""
import os
import sqlite3
import datetime
import re
import secrets
import smtplib
from email.mime.text import MIMEText
from functools import wraps
from flask import Flask, request, jsonify, g, send_from_directory, session
from werkzeug.security import generate_password_hash, check_password_hash

import config

DB_PATH = "hospital.db"
DATABASE_URL = os.environ.get("DATABASE_URL")
USE_POSTGRES = bool(DATABASE_URL)

if USE_POSTGRES:
    import psycopg2
    import psycopg2.extras
    # Render's DATABASE_URL sometimes uses the old "postgres://" scheme,
    # which psycopg2 doesn't accept — normalize it.
    if DATABASE_URL.startswith("postgres://"):
        DATABASE_URL = DATABASE_URL.replace("postgres://", "postgresql://", 1)

app = Flask(__name__, static_folder="public", static_url_path="")
app.secret_key = config.SECRET_KEY
app.config.update(
    SESSION_COOKIE_SAMESITE="Lax",
    SESSION_COOKIE_SECURE=os.environ.get("RENDER") is not None,
)


# ---------------------------------------------------------------- database
class PGCursor:
    """Wraps a psycopg2 cursor so call sites written for sqlite3 (which
    returns rows and .lastrowid directly from .execute()) keep working
    unchanged."""
    def __init__(self, cur):
        self._cur = cur
        self.lastrowid = None

    def fetchone(self):
        return self._cur.fetchone()

    def fetchall(self):
        return self._cur.fetchall()


class PGConn:
    """Wraps a psycopg2 connection so the rest of the app can keep calling
    db.execute(sql_with_question_marks, params) exactly as it did for
    sqlite3, without touching every call site."""
    def __init__(self, conn):
        self.conn = conn

    def execute(self, sql, params=()):
        pg_sql = sql.replace("?", "%s")
        is_insert = pg_sql.strip().upper().startswith("INSERT")
        if is_insert and "RETURNING" not in pg_sql.upper():
            pg_sql = pg_sql.rstrip().rstrip(";") + " RETURNING id"
        cur = self.conn.cursor(cursor_factory=psycopg2.extras.RealDictCursor)
        cur.execute(pg_sql, params)
        wrapped = PGCursor(cur)
        if is_insert:
            try:
                row = cur.fetchone()
                wrapped.lastrowid = row["id"] if row else None
            except Exception:
                wrapped.lastrowid = None
        return wrapped

    def executescript(self, script):
        cur = self.conn.cursor()
        cur.execute(script)
        self.conn.commit()

    def commit(self):
        self.conn.commit()

    def close(self):
        self.conn.close()


def get_db():
    if "db" not in g:
        if USE_POSTGRES:
            raw = psycopg2.connect(DATABASE_URL)
            g.db = PGConn(raw)
        else:
            g.db = sqlite3.connect(DB_PATH)
            g.db.row_factory = sqlite3.Row
            g.db.execute("PRAGMA foreign_keys = ON")
    return g.db


@app.teardown_appcontext
def close_db(exc):
    db = g.pop("db", None)
    if db is not None:
        db.close()


SCHEMA = """
CREATE TABLE IF NOT EXISTS patients (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    mrn TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT,
    age INTEGER,
    sex TEXT,
    blood_group TEXT,
    address TEXT,
    state_of_origin TEXT,
    occupation TEXT,
    religion TEXT,
    next_of_kin_name TEXT,
    next_of_kin_phone TEXT,
    next_of_kin_address TEXT,
    next_of_kin_relationship TEXT,
    email TEXT,
    department TEXT DEFAULT 'General',
    consent_given INTEGER NOT NULL DEFAULT 0,
    consent_at TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS appointments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_code TEXT UNIQUE NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    department TEXT NOT NULL,
    provider_name TEXT NOT NULL,
    reason TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled',
    location TEXT,
    notes TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS medical_records (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    appointment_id INTEGER REFERENCES appointments(id) ON DELETE SET NULL,
    author_name TEXT,
    author_email TEXT,
    report TEXT NOT NULL,
    diagnosis_code TEXT,
    diagnosis_label TEXT,
    bp_systolic INTEGER,
    bp_diastolic INTEGER,
    temperature_c REAL,
    pulse_bpm INTEGER,
    respiratory_rate INTEGER,
    weight_kg REAL,
    height_cm REAL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS audit_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    actor_role TEXT NOT NULL,
    actor_email TEXT,
    actor_id INTEGER,
    action TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    detail TEXT,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS complaints (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    patient_id INTEGER NOT NULL REFERENCES patients(id) ON DELETE CASCADE,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'open',
    response TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK (role IN ('patient', 'officer')),
    full_name TEXT,
    phone TEXT,
    role_title TEXT,
    patient_id INTEGER REFERENCES patients(id) ON DELETE CASCADE,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS officer_otp (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS password_resets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    code TEXT NOT NULL,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS ehr_sync_log (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    direction TEXT NOT NULL,
    resource_type TEXT NOT NULL,
    resource_id TEXT,
    status TEXT NOT NULL,
    detail TEXT,
    created_at TEXT NOT NULL
);
"""

# Same schema, translated for Postgres: AUTOINCREMENT -> SERIAL, and no
# PRAGMA needed since Postgres enforces foreign keys by default.
SCHEMA_PG = SCHEMA.replace("INTEGER PRIMARY KEY AUTOINCREMENT", "SERIAL PRIMARY KEY")


def init_db():
    if USE_POSTGRES:
        conn = psycopg2.connect(DATABASE_URL)
        cur = conn.cursor()
        cur.execute(SCHEMA_PG)
        conn.commit()
        conn.close()
    else:
        conn = sqlite3.connect(DB_PATH)
        conn.executescript(SCHEMA)
        conn.commit()
        conn.close()


init_db()


def now():
    return datetime.datetime.now(datetime.timezone.utc).isoformat(timespec="seconds").replace("+00:00", "Z")


def next_mrn(db):
    year = datetime.datetime.now(datetime.timezone.utc).year
    row = db.execute(
        "SELECT mrn FROM patients WHERE mrn LIKE ? ORDER BY id DESC LIMIT 1", (f"HF-{year}-%",)
    ).fetchone()
    seq = int(row["mrn"].split("-")[-1]) + 1 if row else 1
    return f"HF-{year}-{seq:05d}"


def next_appt_code(db):
    year = datetime.datetime.now(datetime.timezone.utc).year
    row = db.execute(
        "SELECT appointment_code FROM appointments WHERE appointment_code LIKE ? ORDER BY id DESC LIMIT 1",
        (f"AP-{year}-%",),
    ).fetchone()
    seq = int(row["appointment_code"].split("-")[-1]) + 1 if row else 1
    return f"AP-{year}-{seq:05d}"


def err(msg, code=400):
    return jsonify({"error": msg}), code


def log_sync(db, direction, resource_type, resource_id, status, detail):
    db.execute(
        "INSERT INTO ehr_sync_log (direction, resource_type, resource_id, status, detail, created_at) VALUES (?,?,?,?,?,?)",
        (direction, resource_type, resource_id, status, detail, now()),
    )
    db.commit()


def log_audit(db, action, resource_type, resource_id=None, detail=None):
    """Record who did what, to which record, and when — for accountability
    and to support data-protection audit requirements (NDPR/WHO digital
    health governance guidance)."""
    db.execute(
        """INSERT INTO audit_log (actor_role, actor_email, actor_id, action, resource_type, resource_id, detail, created_at)
           VALUES (?,?,?,?,?,?,?,?)""",
        (
            session.get("role", "anonymous"), session.get("email"),
            session.get("patient_id") if session.get("role") == "patient" else None,
            action, resource_type, str(resource_id) if resource_id is not None else None,
            detail, now(),
        ),
    )
    db.commit()


# --------------------------------------------------------------------- auth
def login_required(role):
    def decorator(fn):
        @wraps(fn)
        def wrapper(*args, **kwargs):
            if session.get("role") != role:
                return err("Not authenticated", 401)
            return fn(*args, **kwargs)
        return wrapper
    return decorator


def send_email(to_addr, subject, body):
    """Send an email via SMTP using config.py credentials.
    Falls back to logging the message to the console if SMTP isn't configured."""
    if not config.SMTP_ADDRESS or not config.SMTP_PASSWORD:
        print(f"\n[EMAIL NOT CONFIGURED — printing instead]\nTo: {to_addr}\nSubject: {subject}\n{body}\n")
        return False
    msg = MIMEText(body)
    msg["Subject"] = subject
    msg["From"] = f"{config.SENDER_NAME} <{config.SMTP_ADDRESS}>"
    msg["To"] = to_addr
    try:
        with smtplib.SMTP(config.SMTP_HOST, config.SMTP_PORT, timeout=10) as server:
            if config.SMTP_USE_TLS:
                server.starttls()
            server.login(config.SMTP_ADDRESS, config.SMTP_PASSWORD)
            server.sendmail(config.SMTP_ADDRESS, [to_addr], msg.as_string())
        return True
    except Exception as e:
        print(f"[EMAIL SEND FAILED: {e}] — printing instead]\nTo: {to_addr}\nSubject: {subject}\n{body}\n")
        return False


@app.route("/api/auth/me", methods=["GET"])
def auth_me():
    if not session.get("role"):
        return jsonify({"authenticated": False})
    return jsonify({
        "authenticated": True,
        "role": session["role"],
        "email": session.get("email"),
        "full_name": session.get("full_name"),
        "patient_id": session.get("patient_id"),
    })


@app.route("/api/auth/logout", methods=["POST"])
def auth_logout():
    session.clear()
    return jsonify({"ok": True})


REQUIRED_PATIENT_FIELDS = ["first_name", "last_name"]
PATIENT_FIELDS = [
    "first_name", "last_name", "phone", "age", "sex", "blood_group", "address",
    "state_of_origin", "occupation", "religion", "next_of_kin_name",
    "next_of_kin_phone", "next_of_kin_address", "next_of_kin_relationship",
    "department",
]


@app.route("/api/auth/patient/signup", methods=["POST"])
def patient_signup():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    missing = [f for f in REQUIRED_PATIENT_FIELDS if not data.get(f)]
    if not email:
        missing.append("email")
    if missing:
        return err(f"Missing required fields: {', '.join(missing)}")
    if len(password) < 6:
        return err("Password must be at least 6 characters")
    if not data.get("consent"):
        return err("You must consent to data collection to open a folder")

    db = get_db()
    if db.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone():
        return err("An account with this email already exists")

    ts = now()
    mrn = next_mrn(db)
    fields = {k: data.get(k) for k in PATIENT_FIELDS}
    if not fields.get("department"):
        fields["department"] = "General"
    cur = db.execute(
        f"""INSERT INTO patients (mrn, {", ".join(fields.keys())}, email, consent_given, consent_at, created_at, updated_at)
           VALUES (?,{", ".join(["?"] * len(fields))},?,?,?,?,?)""",
        (mrn, *fields.values(), email, 1, ts, ts, ts),
    )
    patient_id = cur.lastrowid
    db.execute(
        "INSERT INTO users (email, password_hash, role, full_name, patient_id, created_at) VALUES (?,?,?,?,?,?)",
        (email, generate_password_hash(password), "patient", f"{data['first_name']} {data['last_name']}", patient_id, ts),
    )
    db.commit()
    log_sync(db, "out", "Patient", mrn, "created", "Patient self-registered via portal")

    session.clear()
    session["role"] = "patient"
    session["email"] = email
    session["patient_id"] = patient_id
    session["full_name"] = f"{data['first_name']} {data['last_name']}"
    log_audit(db, "create_patient", "Patient", patient_id, "Patient self-registered, consent given")
    patient = db.execute("SELECT * FROM patients WHERE id=?", (patient_id,)).fetchone()
    return jsonify(dict(patient)), 201


@app.route("/api/auth/patient/login", methods=["POST"])
def patient_login():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email=? AND role='patient'", (email,)).fetchone()
    if not user or not check_password_hash(user["password_hash"], password):
        return err("Incorrect email or password", 401)
    session.clear()
    session["role"] = "patient"
    session["email"] = user["email"]
    session["patient_id"] = user["patient_id"]
    session["full_name"] = user["full_name"]
    log_audit(db, "login", "Patient", user["patient_id"], "Patient logged in")
    return jsonify({"ok": True, "patient_id": user["patient_id"]})


@app.route("/api/auth/officer/signup", methods=["POST"])
def officer_signup():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    full_name = (data.get("full_name") or "").strip()
    role_title = (data.get("role_title") or "").strip()
    phone = (data.get("phone") or "").strip()
    if not email or not full_name or not role_title or len(password) < 6:
        return err("Full name, role, email, and a password of at least 6 characters are required")
    db = get_db()
    if db.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone():
        return err("An account with this email already exists")
    db.execute(
        "INSERT INTO users (email, password_hash, role, full_name, phone, role_title, created_at) VALUES (?,?,?,?,?,?,?)",
        (email, generate_password_hash(password), "officer", full_name, phone, role_title, now()),
    )
    db.commit()
    return jsonify({"ok": True}), 201


@app.route("/api/auth/officer/request-code", methods=["POST"])
def officer_request_code():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    password = data.get("password") or ""
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email=? AND role='officer'", (email,)).fetchone()
    if not user or not check_password_hash(user["password_hash"], password):
        return err("Incorrect email or password", 401)

    code = f"{secrets.randbelow(1000000):06d}"
    expires = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=10)).isoformat()
    db.execute(
        "INSERT INTO officer_otp (user_id, code, expires_at, created_at) VALUES (?,?,?,?)",
        (user["id"], code, expires, now()),
    )
    db.commit()
    send_email(
        email, "Your Hospital Registry login code",
        f"Hi {user['full_name']},\n\nYour one-time login code is: {code}\n"
        f"It expires in 10 minutes. If you didn't request this, you can ignore this email.",
    )
    return jsonify({"ok": True, "message": "Code sent to email"})


@app.route("/api/auth/officer/verify-code", methods=["POST"])
def officer_verify_code():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    code = (data.get("code") or "").strip()
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email=? AND role='officer'", (email,)).fetchone()
    if not user:
        return err("Incorrect email or code", 401)

    # TEMPORARY testing fallback (see config.OFFICER_STATIC_CODE) — accept
    # a fixed code so officers can log in while email delivery is being
    # debugged. Remove config.OFFICER_STATIC_CODE once email works.
    if config.OFFICER_STATIC_CODE and code == config.OFFICER_STATIC_CODE:
        session.clear()
        session["role"] = "officer"
        session["email"] = user["email"]
        session["full_name"] = user["full_name"]
        log_audit(db, "login", "Officer", user["id"], "Logged in using static fallback code")
        return jsonify({"ok": True})

    otp = db.execute(
        "SELECT * FROM officer_otp WHERE user_id=? AND code=? AND used=0 ORDER BY id DESC LIMIT 1",
        (user["id"], code),
    ).fetchone()
    if not otp:
        return err("Incorrect email or code", 401)
    if datetime.datetime.now(datetime.timezone.utc) > datetime.datetime.fromisoformat(otp["expires_at"]):
        return err("Code expired — request a new one", 401)
    db.execute("UPDATE officer_otp SET used=1 WHERE id=?", (otp["id"],))
    db.commit()
    session.clear()
    session["role"] = "officer"
    session["email"] = user["email"]
    session["full_name"] = user["full_name"]
    log_audit(db, "login", "Officer", user["id"], "Logged in with emailed code")
    return jsonify({"ok": True})


@app.route("/api/auth/request-password-reset", methods=["POST"])
def request_password_reset():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    role = data.get("role")
    if role not in ("patient", "officer"):
        return err("role must be 'patient' or 'officer'")
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email=? AND role=?", (email, role)).fetchone()
    if user:
        code = f"{secrets.randbelow(1000000):06d}"
        expires = (datetime.datetime.now(datetime.timezone.utc) + datetime.timedelta(minutes=15)).isoformat()
        db.execute(
            "INSERT INTO password_resets (user_id, code, expires_at, created_at) VALUES (?,?,?,?)",
            (user["id"], code, expires, now()),
        )
        db.commit()
        send_email(
            email, "Reset your Hospital Registry password",
            f"Hi {user['full_name']},\n\nYour password reset code is: {code}\n"
            f"It expires in 15 minutes. If you didn't request this, you can ignore this email.",
        )
    return jsonify({"ok": True, "message": "If that account exists, a reset code has been sent."})


@app.route("/api/auth/reset-password", methods=["POST"])
def reset_password():
    data = request.get_json(force=True, silent=True) or {}
    email = (data.get("email") or "").strip().lower()
    role = data.get("role")
    code = (data.get("code") or "").strip()
    new_password = data.get("new_password") or ""
    if role not in ("patient", "officer"):
        return err("role must be 'patient' or 'officer'")
    if len(new_password) < 6:
        return err("Password must be at least 6 characters")
    db = get_db()
    user = db.execute("SELECT * FROM users WHERE email=? AND role=?", (email, role)).fetchone()
    if not user:
        return err("Incorrect email or code", 401)
    reset = db.execute(
        "SELECT * FROM password_resets WHERE user_id=? AND code=? AND used=0 ORDER BY id DESC LIMIT 1",
        (user["id"], code),
    ).fetchone()
    if not reset:
        return err("Incorrect email or code", 401)
    if datetime.datetime.now(datetime.timezone.utc) > datetime.datetime.fromisoformat(reset["expires_at"]):
        return err("Code expired — request a new one", 401)
    db.execute("UPDATE password_resets SET used=1 WHERE id=?", (reset["id"],))
    db.execute("UPDATE users SET password_hash=? WHERE id=?", (generate_password_hash(new_password), user["id"]))
    db.commit()
    return jsonify({"ok": True})


# ---------------------------------------------------------------- complaints
@app.route("/api/me/complaints", methods=["GET"])
@login_required("patient")
def my_complaints():
    db = get_db()
    rows = db.execute(
        "SELECT * FROM complaints WHERE patient_id=? ORDER BY created_at DESC", (session["patient_id"],)
    ).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/me/complaints", methods=["POST"])
@login_required("patient")
def submit_complaint():
    data = request.get_json(force=True, silent=True) or {}
    message = (data.get("message") or "").strip()
    if not message:
        return err("Complaint message cannot be empty")
    db = get_db()
    ts = now()
    cur = db.execute(
        "INSERT INTO complaints (patient_id, message, status, created_at, updated_at) VALUES (?,?,?,?,?)",
        (session["patient_id"], message, "open", ts, ts),
    )
    db.commit()
    row = db.execute("SELECT * FROM complaints WHERE id=?", (cur.lastrowid,)).fetchone()
    return jsonify(dict(row)), 201


@app.route("/api/complaints", methods=["GET"])
@login_required("officer")
def list_complaints():
    db = get_db()
    status = request.args.get("status")
    sql = "SELECT c.*, p.first_name, p.last_name, p.mrn FROM complaints c JOIN patients p ON p.id = c.patient_id"
    params = []
    if status:
        sql += " WHERE c.status=?"
        params.append(status)
    sql += " ORDER BY c.created_at DESC"
    rows = db.execute(sql, params).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/complaints/<int:cid>", methods=["PUT"])
@login_required("officer")
def update_complaint(cid):
    db = get_db()
    existing = db.execute("SELECT * FROM complaints WHERE id=?", (cid,)).fetchone()
    if not existing:
        return err("Complaint not found", 404)
    data = request.get_json(force=True, silent=True) or {}
    status = data.get("status")
    response = data.get("response")
    if status and status not in ("open", "in-progress", "resolved"):
        return err("Invalid status")
    updates = {}
    if status:
        updates["status"] = status
    if response is not None:
        updates["response"] = response
    if not updates:
        return err("Nothing to update")
    updates["updated_at"] = now()
    set_clause = ", ".join(f"{k}=?" for k in updates)
    db.execute(f"UPDATE complaints SET {set_clause} WHERE id=?", (*updates.values(), cid))
    db.commit()
    row = db.execute("SELECT * FROM complaints WHERE id=?", (cid,)).fetchone()
    return jsonify(dict(row))


# ------------------------------------------------------------ patient portal
@app.route("/api/me/patient", methods=["GET"])
@login_required("patient")
def my_patient_record():
    db = get_db()
    p = db.execute("SELECT * FROM patients WHERE id=?", (session["patient_id"],)).fetchone()
    if not p:
        return err("Patient record not found", 404)
    appts = db.execute(
        "SELECT * FROM appointments WHERE patient_id=? ORDER BY date, time", (session["patient_id"],)
    ).fetchall()
    result = dict(p)
    result["appointments"] = [dict(a) for a in appts]
    return jsonify(result)


# ------------------------------------------------------------ static pages
@app.route("/")
def home():
    return send_from_directory("public", "home.html")


@app.route("/<path:path>")
def static_proxy(path):
    return send_from_directory("public", path)


# ------------------------------------------------------------------ patients
@app.route("/api/patients", methods=["GET"])
@login_required("officer")
def list_patients():
    db = get_db()
    q = request.args.get("q", "").strip()
    if q:
        like = f"%{q}%"
        rows = db.execute(
            """SELECT * FROM patients
               WHERE first_name LIKE ? OR last_name LIKE ? OR mrn LIKE ? OR phone LIKE ?
               ORDER BY created_at DESC""",
            (like, like, like, like),
        ).fetchall()
    else:
        rows = db.execute("SELECT * FROM patients ORDER BY created_at DESC").fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/patients", methods=["POST"])
@login_required("officer")
def create_patient():
    data = request.get_json(force=True, silent=True) or {}
    missing = [f for f in REQUIRED_PATIENT_FIELDS if not data.get(f)]
    if missing:
        return err(f"Missing required fields: {', '.join(missing)}")
    if not data.get("consent"):
        return err("Patient consent must be confirmed before a folder can be opened")

    db = get_db()
    email = (data.get("email") or "").strip().lower() or None
    password = data.get("password") or ""
    if email and db.execute("SELECT id FROM users WHERE email=?", (email,)).fetchone():
        return err("An account with this email already exists")
    if email and len(password) < 6:
        return err("If setting up portal access, password must be at least 6 characters")

    ts = now()
    mrn = next_mrn(db)
    fields = {k: data.get(k) for k in PATIENT_FIELDS}
    if not fields.get("department"):
        fields["department"] = "General"
    cur = db.execute(
        f"""INSERT INTO patients (mrn, {", ".join(fields.keys())}, email, consent_given, consent_at, created_at, updated_at)
           VALUES (?,{", ".join(["?"] * len(fields))},?,?,?,?,?)""",
        (mrn, *fields.values(), email, 1, ts, ts, ts),
    )
    patient_id = cur.lastrowid
    if email and password:
        db.execute(
            "INSERT INTO users (email, password_hash, role, full_name, patient_id, created_at) VALUES (?,?,?,?,?,?)",
            (email, generate_password_hash(password), "patient", f"{data['first_name']} {data['last_name']}", patient_id, ts),
        )
    db.commit()
    patient = db.execute("SELECT * FROM patients WHERE id=?", (patient_id,)).fetchone()
    log_sync(db, "out", "Patient", mrn, "created", "New hospital folder opened by officer")
    log_audit(db, "create_patient", "Patient", patient_id, "Folder opened by officer, consent confirmed")
    return jsonify(dict(patient)), 201


@app.route("/api/patients/<int:pid>", methods=["GET"])
@login_required("officer")
def get_patient(pid):
    db = get_db()
    p = db.execute("SELECT * FROM patients WHERE id=?", (pid,)).fetchone()
    if not p:
        return err("Patient not found", 404)
    appts = db.execute(
        "SELECT * FROM appointments WHERE patient_id=? ORDER BY date DESC, time DESC", (pid,)
    ).fetchall()
    result = dict(p)
    result["appointments"] = [dict(a) for a in appts]
    log_audit(db, "view_patient", "Patient", pid)
    return jsonify(result)


@app.route("/api/patients/<int:pid>", methods=["PUT"])
@login_required("officer")
def update_patient(pid):
    db = get_db()
    p = db.execute("SELECT * FROM patients WHERE id=?", (pid,)).fetchone()
    if not p:
        return err("Patient not found", 404)
    data = request.get_json(force=True, silent=True) or {}
    updates = {k: data[k] for k in PATIENT_FIELDS if k in data}
    if not updates:
        return err("No updatable fields provided")
    updates["updated_at"] = now()
    set_clause = ", ".join(f"{k}=?" for k in updates)
    db.execute(f"UPDATE patients SET {set_clause} WHERE id=?", (*updates.values(), pid))
    db.commit()
    updated = db.execute("SELECT * FROM patients WHERE id=?", (pid,)).fetchone()
    log_sync(db, "out", "Patient", updated["mrn"], "updated", "Folder details updated")
    log_audit(db, "update_patient", "Patient", pid, f"Fields changed: {', '.join(updates.keys())}")
    return jsonify(dict(updated))


# ----------------------------------------------------- medical records (confidential)
VITALS_FIELDS = ["bp_systolic", "bp_diastolic", "temperature_c", "pulse_bpm", "respiratory_rate", "weight_kg", "height_cm"]


@app.route("/api/patients/<int:pid>/medical-records", methods=["GET"])
@login_required("officer")
def list_medical_records(pid):
    db = get_db()
    if not db.execute("SELECT id FROM patients WHERE id=?", (pid,)).fetchone():
        return err("Patient not found", 404)
    rows = db.execute(
        "SELECT * FROM medical_records WHERE patient_id=? ORDER BY created_at DESC", (pid,)
    ).fetchall()
    log_audit(db, "view_medical_records", "Patient", pid, "Doctor's reports viewed")
    return jsonify([dict(r) for r in rows])


@app.route("/api/patients/<int:pid>/medical-records", methods=["POST"])
@login_required("officer")
def create_medical_record(pid):
    db = get_db()
    if not db.execute("SELECT id FROM patients WHERE id=?", (pid,)).fetchone():
        return err("Patient not found", 404)
    data = request.get_json(force=True, silent=True) or {}
    report = (data.get("report") or "").strip()
    if not report:
        return err("Report content cannot be empty")
    ts = now()
    vitals = {k: (data.get(k) if data.get(k) not in (None, "") else None) for k in VITALS_FIELDS}
    cur = db.execute(
        """INSERT INTO medical_records
           (patient_id, appointment_id, author_name, author_email, report,
            diagnosis_code, diagnosis_label,
            bp_systolic, bp_diastolic, temperature_c, pulse_bpm, respiratory_rate, weight_kg, height_cm,
            created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            pid, data.get("appointment_id"), session.get("full_name"), session.get("email"), report,
            data.get("diagnosis_code"), data.get("diagnosis_label"),
            vitals["bp_systolic"], vitals["bp_diastolic"], vitals["temperature_c"],
            vitals["pulse_bpm"], vitals["respiratory_rate"], vitals["weight_kg"], vitals["height_cm"],
            ts, ts,
        ),
    )
    db.commit()
    row = db.execute("SELECT * FROM medical_records WHERE id=?", (cur.lastrowid,)).fetchone()
    log_audit(db, "create_medical_record", "Patient", pid, f"Report added (diagnosis: {data.get('diagnosis_label') or 'none coded'})")
    return jsonify(dict(row)), 201


@app.route("/api/medical-records/<int:rid>", methods=["PUT"])
@login_required("officer")
def update_medical_record(rid):
    db = get_db()
    existing = db.execute("SELECT * FROM medical_records WHERE id=?", (rid,)).fetchone()
    if not existing:
        return err("Record not found", 404)
    data = request.get_json(force=True, silent=True) or {}
    report = (data.get("report") or "").strip()
    if not report:
        return err("Report content cannot be empty")
    updates = {"report": report}
    if "diagnosis_code" in data:
        updates["diagnosis_code"] = data.get("diagnosis_code")
    if "diagnosis_label" in data:
        updates["diagnosis_label"] = data.get("diagnosis_label")
    for k in VITALS_FIELDS:
        if k in data:
            updates[k] = data.get(k) if data.get(k) not in ("",) else None
    updates["updated_at"] = now()
    set_clause = ", ".join(f"{k}=?" for k in updates)
    db.execute(f"UPDATE medical_records SET {set_clause} WHERE id=?", (*updates.values(), rid))
    db.commit()
    row = db.execute("SELECT * FROM medical_records WHERE id=?", (rid,)).fetchone()
    log_audit(db, "update_medical_record", "Patient", existing["patient_id"], f"Report {rid} edited")
    return jsonify(dict(row))


# --------------------------------------------------------------- appointments
REQUIRED_APPT_FIELDS = ["patient_id", "date", "time", "department", "provider_name"]


@app.route("/api/appointments", methods=["GET"])
@login_required("officer")
def list_appointments():
    db = get_db()
    patient_id = request.args.get("patient_id")
    status = request.args.get("status")
    date = request.args.get("date")
    sql = """SELECT a.*, p.first_name, p.last_name, p.mrn
             FROM appointments a JOIN patients p ON p.id = a.patient_id WHERE 1=1"""
    params = []
    if patient_id:
        sql += " AND a.patient_id=?"
        params.append(patient_id)
    if status:
        sql += " AND a.status=?"
        params.append(status)
    if date:
        sql += " AND a.date=?"
        params.append(date)
    sql += " ORDER BY a.date, a.time"
    rows = db.execute(sql, params).fetchall()
    return jsonify([dict(r) for r in rows])


@app.route("/api/appointments", methods=["POST"])
@login_required("officer")
def create_appointment():
    data = request.get_json(force=True, silent=True) or {}
    missing = [f for f in REQUIRED_APPT_FIELDS if not data.get(f)]
    if missing:
        return err(f"Missing required fields: {', '.join(missing)}")

    db = get_db()
    patient = db.execute("SELECT * FROM patients WHERE id=?", (data["patient_id"],)).fetchone()
    if not patient:
        return err("Patient not found for this appointment", 404)
    try:
        datetime.date.fromisoformat(data["date"])
    except ValueError:
        return err("date must be in YYYY-MM-DD format")
    if not re.match(r"^\d{2}:\d{2}$", data["time"]):
        return err("time must be in HH:MM (24h) format")

    code = next_appt_code(db)
    ts = now()
    cur = db.execute(
        """INSERT INTO appointments
           (patient_id, appointment_code, date, time, department, provider_name,
            reason, status, location, notes, created_at, updated_at)
           VALUES (?,?,?,?,?,?,?,?,?,?,?,?)""",
        (
            data["patient_id"], code, data["date"], data["time"], data["department"],
            data["provider_name"], data.get("reason"), data.get("status", "scheduled"),
            data.get("location"), data.get("notes"), ts, ts,
        ),
    )
    db.commit()
    appt = db.execute("SELECT * FROM appointments WHERE id=?", (cur.lastrowid,)).fetchone()
    log_sync(db, "out", "Appointment", code, "created", f"Booked for MRN {patient['mrn']}")
    return jsonify(dict(appt)), 201


@app.route("/api/appointments/<int:aid>", methods=["GET"])
@login_required("officer")
def get_appointment(aid):
    db = get_db()
    row = db.execute(
        """SELECT a.*, p.first_name, p.last_name, p.mrn, p.phone
           FROM appointments a JOIN patients p ON p.id = a.patient_id WHERE a.id=?""",
        (aid,),
    ).fetchone()
    if not row:
        return err("Appointment not found", 404)
    return jsonify(dict(row))


@app.route("/api/appointments/<int:aid>", methods=["PUT"])
@login_required("officer")
def update_appointment(aid):
    db = get_db()
    existing = db.execute("SELECT * FROM appointments WHERE id=?", (aid,)).fetchone()
    if not existing:
        return err("Appointment not found", 404)
    data = request.get_json(force=True, silent=True) or {}
    fields = ["date", "time", "department", "provider_name", "reason", "status", "location", "notes"]
    updates = {k: data[k] for k in fields if k in data}
    if updates.get("status") and updates["status"] not in (
        "scheduled", "checked-in", "completed", "cancelled", "no-show"
    ):
        return err("Invalid status")
    if not updates:
        return err("No updatable fields provided")
    updates["updated_at"] = now()
    set_clause = ", ".join(f"{k}=?" for k in updates)
    db.execute(f"UPDATE appointments SET {set_clause} WHERE id=?", (*updates.values(), aid))
    db.commit()
    updated = db.execute("SELECT * FROM appointments WHERE id=?", (aid,)).fetchone()
    log_sync(db, "out", "Appointment", updated["appointment_code"], "updated", "Appointment modified")
    return jsonify(dict(updated))


@app.route("/api/appointments/<int:aid>", methods=["DELETE"])
@login_required("officer")
def delete_appointment(aid):
    db = get_db()
    existing = db.execute("SELECT * FROM appointments WHERE id=?", (aid,)).fetchone()
    if not existing:
        return err("Appointment not found", 404)
    db.execute("DELETE FROM appointments WHERE id=?", (aid,))
    db.commit()
    return jsonify({"deleted": True})


# ------------------------------------------------------------------ dashboard
@app.route("/api/dashboard/stats", methods=["GET"])
@login_required("officer")
def dashboard_stats():
    db = get_db()
    today = datetime.date.today().isoformat()
    total_patients = db.execute("SELECT COUNT(*) c FROM patients").fetchone()["c"]
    today_appts = db.execute("SELECT COUNT(*) c FROM appointments WHERE date=?", (today,)).fetchone()["c"]
    upcoming = db.execute(
        "SELECT COUNT(*) c FROM appointments WHERE date>? AND status='scheduled'", (today,)
    ).fetchone()["c"]
    departments = db.execute(
        "SELECT department, COUNT(*) c FROM patients GROUP BY department ORDER BY c DESC"
    ).fetchall()
    recent_patients = db.execute("SELECT * FROM patients ORDER BY created_at DESC LIMIT 5").fetchall()
    todays_schedule = db.execute(
        """SELECT a.*, p.first_name, p.last_name, p.mrn FROM appointments a
           JOIN patients p ON p.id=a.patient_id WHERE a.date=? ORDER BY a.time""",
        (today,),
    ).fetchall()
    return jsonify({
        "total_patients": total_patients,
        "today_appointments": today_appts,
        "upcoming_appointments": upcoming,
        "departments": [dict(d) for d in departments],
        "recent_patients": [dict(p) for p in recent_patients],
        "todays_schedule": [dict(a) for a in todays_schedule],
    })


@app.route("/api/ehr-sync-log", methods=["GET"])
@login_required("officer")
def sync_log():
    db = get_db()
    rows = db.execute("SELECT * FROM ehr_sync_log ORDER BY id DESC LIMIT 50").fetchall()
    return jsonify([dict(r) for r in rows])


# ---------------------------------------------------------- FHIR-lite bridge
def patient_to_fhir(p):
    return {
        "resourceType": "Patient",
        "id": str(p["id"]),
        "identifier": [{"system": "urn:hospital:mrn", "value": p["mrn"]}],
        "name": [{"family": p["last_name"], "given": [p["first_name"]]}],
        "gender": (p["sex"] or "unknown").lower(),
        "telecom": [t for t in [
            {"system": "phone", "value": p["phone"]} if p["phone"] else None,
            {"system": "email", "value": p["email"]} if p["email"] else None,
        ] if t],
        "address": [{"text": p["address"]}] if p["address"] else [],
    }


def appointment_to_fhir(a):
    start = f"{a['date']}T{a['time']}:00"
    status_map = {
        "scheduled": "booked", "checked-in": "arrived", "completed": "fulfilled",
        "cancelled": "cancelled", "no-show": "noshow",
    }
    return {
        "resourceType": "Appointment",
        "id": str(a["id"]),
        "identifier": [{"system": "urn:hospital:appointment", "value": a["appointment_code"]}],
        "status": status_map.get(a["status"], "booked"),
        "description": a["reason"],
        "start": start,
        "serviceType": [{"text": a["department"]}],
        "participant": [
            {"actor": {"display": a["provider_name"]}, "status": "accepted"},
            {"actor": {"reference": f"Patient/{a['patient_id']}"}, "status": "accepted"},
        ],
    }


@app.route("/fhir/Patient/<int:pid>", methods=["GET"])
def fhir_get_patient(pid):
    db = get_db()
    p = db.execute("SELECT * FROM patients WHERE id=?", (pid,)).fetchone()
    if not p:
        return err("Patient not found", 404)
    return jsonify(patient_to_fhir(p))


@app.route("/fhir/Patient", methods=["GET"])
def fhir_list_patients():
    db = get_db()
    rows = db.execute("SELECT * FROM patients ORDER BY id").fetchall()
    return jsonify({"resourceType": "Bundle", "type": "searchset", "total": len(rows),
                     "entry": [{"resource": patient_to_fhir(p)} for p in rows]})


@app.route("/fhir/Appointment/<int:aid>", methods=["GET"])
def fhir_get_appointment(aid):
    db = get_db()
    a = db.execute("SELECT * FROM appointments WHERE id=?", (aid,)).fetchone()
    if not a:
        return err("Appointment not found", 404)
    return jsonify(appointment_to_fhir(a))


@app.route("/fhir/Appointment", methods=["GET"])
def fhir_list_appointments():
    db = get_db()
    rows = db.execute("SELECT * FROM appointments ORDER BY id").fetchall()
    return jsonify({"resourceType": "Bundle", "type": "searchset", "total": len(rows),
                     "entry": [{"resource": appointment_to_fhir(a)} for a in rows]})


# ------------------------------------ FHIR Encounter / Condition / Observation
# Built from medical_records — each doctor's-report entry is one clinical
# encounter, optionally with a coded diagnosis (Condition) and vital-sign
# measurements (Observation), per HL7 FHIR R4 and WHO's push for
# interoperable, standards-based health data exchange.
VITAL_LOINC = {
    "bp_systolic": ("8480-6", "Systolic blood pressure", "mm[Hg]"),
    "bp_diastolic": ("8462-4", "Diastolic blood pressure", "mm[Hg]"),
    "temperature_c": ("8310-5", "Body temperature", "Cel"),
    "pulse_bpm": ("8867-4", "Heart rate", "/min"),
    "respiratory_rate": ("9279-1", "Respiratory rate", "/min"),
    "weight_kg": ("29463-7", "Body weight", "kg"),
    "height_cm": ("8302-2", "Body height", "cm"),
}


def encounter_to_fhir(r):
    return {
        "resourceType": "Encounter",
        "id": str(r["id"]),
        "status": "finished",
        "class": {"system": "http://terminology.hl7.org/CodeSystem/v3-ActCode", "code": "AMB", "display": "ambulatory"},
        "subject": {"reference": f"Patient/{r['patient_id']}"},
        "period": {"start": r["created_at"]},
        "reasonCode": [{"text": r["diagnosis_label"]}] if r["diagnosis_label"] else [],
    }


def condition_to_fhir(r):
    return {
        "resourceType": "Condition",
        "id": str(r["id"]),
        "subject": {"reference": f"Patient/{r['patient_id']}"},
        "encounter": {"reference": f"Encounter/{r['id']}"},
        "recordedDate": r["created_at"],
        "code": {
            "coding": [{"system": "http://hl7.org/fhir/sid/icd-10", "code": r["diagnosis_code"], "display": r["diagnosis_label"]}],
            "text": r["diagnosis_label"],
        },
    }


def observations_from_record(r):
    obs = []
    for key, (loinc, display, unit) in VITAL_LOINC.items():
        value = r[key]
        if value is None:
            continue
        obs.append({
            "resourceType": "Observation",
            "id": f"{r['id']}-{key}",
            "status": "final",
            "code": {"coding": [{"system": "http://loinc.org", "code": loinc, "display": display}]},
            "subject": {"reference": f"Patient/{r['patient_id']}"},
            "encounter": {"reference": f"Encounter/{r['id']}"},
            "effectiveDateTime": r["created_at"],
            "valueQuantity": {"value": value, "unit": unit},
        })
    return obs


@app.route("/fhir/Encounter/<int:rid>", methods=["GET"])
def fhir_get_encounter(rid):
    db = get_db()
    r = db.execute("SELECT * FROM medical_records WHERE id=?", (rid,)).fetchone()
    if not r:
        return err("Encounter not found", 404)
    return jsonify(encounter_to_fhir(r))


@app.route("/fhir/Encounter", methods=["GET"])
def fhir_list_encounters():
    db = get_db()
    rows = db.execute("SELECT * FROM medical_records ORDER BY id").fetchall()
    return jsonify({"resourceType": "Bundle", "type": "searchset", "total": len(rows),
                     "entry": [{"resource": encounter_to_fhir(r)} for r in rows]})


@app.route("/fhir/Condition/<int:rid>", methods=["GET"])
def fhir_get_condition(rid):
    db = get_db()
    r = db.execute("SELECT * FROM medical_records WHERE id=?", (rid,)).fetchone()
    if not r or not r["diagnosis_code"]:
        return err("Condition not found", 404)
    return jsonify(condition_to_fhir(r))


@app.route("/fhir/Condition", methods=["GET"])
def fhir_list_conditions():
    db = get_db()
    rows = db.execute("SELECT * FROM medical_records WHERE diagnosis_code IS NOT NULL ORDER BY id").fetchall()
    return jsonify({"resourceType": "Bundle", "type": "searchset", "total": len(rows),
                     "entry": [{"resource": condition_to_fhir(r)} for r in rows]})


@app.route("/fhir/Observation", methods=["GET"])
def fhir_list_observations():
    db = get_db()
    rows = db.execute("SELECT * FROM medical_records ORDER BY id").fetchall()
    entries = []
    for r in rows:
        entries.extend(observations_from_record(r))
    return jsonify({"resourceType": "Bundle", "type": "searchset", "total": len(entries),
                     "entry": [{"resource": o} for o in entries]})


@app.route("/fhir/Observation/<string:obs_id>", methods=["GET"])
def fhir_get_observation(obs_id):
    try:
        rid_str, key = obs_id.rsplit("-", 1)
        rid = int(rid_str)
    except ValueError:
        return err("Observation not found", 404)
    if key not in VITAL_LOINC:
        return err("Observation not found", 404)
    db = get_db()
    r = db.execute("SELECT * FROM medical_records WHERE id=?", (rid,)).fetchone()
    if not r or r[key] is None:
        return err("Observation not found", 404)
    matches = [o for o in observations_from_record(r) if o["id"] == obs_id]
    return jsonify(matches[0]) if matches else err("Observation not found", 404)


# --------------------------------------------------------------------- audit
@app.route("/api/audit-log", methods=["GET"])
@login_required("officer")
def get_audit_log():
    db = get_db()
    patient_id = request.args.get("patient_id")
    sql = "SELECT * FROM audit_log"
    params = []
    if patient_id:
        sql += " WHERE resource_id=? AND resource_type='Patient'"
        params.append(patient_id)
    sql += " ORDER BY id DESC LIMIT 200"
    rows = db.execute(sql, params).fetchall()
    return jsonify([dict(r) for r in rows])


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=False, use_reloader=False)
