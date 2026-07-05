# Wayfind General — Hospital Registry

Two fully separate portals sharing one backend and database:

- **Patients** (`/`) — self-register with full intake details (personal
  info + next of kin), log in with email + password, view their own
  read-only folder and appointments, submit complaints. Cannot see
  doctor's reports. Cannot edit their own data once submitted.
- **Health Officers** (`/officer-portal.html`) — register with name,
  hospital role, and phone; log in with email + password + a one-time
  code emailed to them. Full access: every patient folder, scheduling,
  confidential doctor's reports, and complaint responses.

These two links are never cross-referenced — neither portal shows any
trace of the other's login page.

## Run it

```bash
pip install -r requirements.txt
python3 app.py
```

Open **http://localhost:5000** for the patient side.
Open **http://localhost:5000/officer-portal.html** for staff.

## Set up email for officer login codes + password resets

Open **`config.py`** and fill in:
```python
SMTP_ADDRESS = "youraddress@gmail.com"
SMTP_PASSWORD = "your-app-password"
```
Gmail: turn on 2-Step Verification, then create an **App Password**
(Google Account → Security → App passwords) — use that, not your real
password.

**Until you fill this in**, codes print to the terminal running
`python3 app.py` instead of emailing, so you can keep testing without
email set up:
```
[EMAIL NOT CONFIGURED — printing instead]
To: officer@example.com
Your one-time login code is: 123456
```

On Render (or similar), set `SMTP_ADDRESS` / `SMTP_PASSWORD` /
`HOSPITAL_SECRET_KEY` as **Environment Variables** in the dashboard
instead of editing `config.py` — they take priority automatically.

## What a patient fills in at registration

First name, last name, phone, age, sex, blood group, address, state of
origin, occupation, religion, and next of kin (name, phone, address,
relationship) — plus an email + password to log back in.

## What a patient can and can't do

| | Patients | Health Officers |
|---|---|---|
| View own folder | ✅ read-only | ✅ (and everyone else's) |
| Edit folder details | ❌ (must visit in person) | ✅ |
| View own appointments | ✅ | ✅ (and everyone else's, can schedule) |
| See doctor's reports | ❌ never | ✅ can write and edit |
| Submit a complaint | ✅ | — |
| Review/respond to complaints | ❌ | ✅ |
| Reset own password | ✅ via emailed code | ✅ via emailed code |

Every officer-only and patient-only API route checks the session
server-side (`@login_required(...)`), so this is enforced by the
backend, not just hidden UI — confirmed by testing that a patient
session gets a hard 401 if it calls an officer-only endpoint (like
doctor's reports) directly.

## Face recognition for staff login

Not implemented yet — deliberately. Real face-based login needs either
a browser-based model (face-api.js, free but not enterprise-grade) or
a paid cloud API (AWS Rekognition / Azure Face, needs an account +
cost), plus real handling of biometric-data consent and storage law in
your jurisdiction. Officer login is email + password + one-time code
for now; revisit this once you're past the testing phase.

## Data model

- `patients` — the hospital folder (personal + next-of-kin fields)
- `appointments` — linked to a patient
- `medical_records` — confidential doctor's reports, linked to a
  patient (and optionally an appointment); **never** exposed via any
  patient-facing endpoint
- `users` — login credentials; `role` is `patient` or `officer`
- `officer_otp` / `password_resets` — one-time codes, expire after
  10/15 minutes respectively
- `complaints` — linked to a patient, with status + officer response
- `ehr_sync_log` — audit trail of FHIR imports/exports

## Connecting to a real EHR/EMR

`/fhir/Patient` and `/fhir/Appointment` endpoints in `app.py` return
HL7 FHIR-shaped resources. These aren't session-gated since external
EHR systems authenticate differently (typically OAuth2/SMART-on-FHIR);
add an API key check there before exposing this beyond your own network.

## Before using this with real patient data

This is a solid testing foundation, not a compliance-certified system.
Before handling real PHI, add: HTTPS everywhere, rate limiting on login
and code-verification endpoints, stronger password rules, full audit
logging of every access, a HIPAA/NDPR-appropriate hosting setup and
legal review for your jurisdiction (Nigeria's NDPR applies to health
data collected here, similar to how GDPR/HIPAA apply elsewhere).
