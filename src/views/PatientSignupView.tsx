import React, { useState } from 'react';
import { hospitalStore } from '../store/hospitalStore';
import { useToast } from '../components/Toast';

interface PatientSignupViewProps {
  onSuccess: () => void;
  onNavigateLogin: () => void;
  onBackToHome: () => void;
}

export const PatientSignupView: React.FC<PatientSignupViewProps> = ({
  onSuccess,
  onNavigateLogin,
  onBackToHome,
}) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    email: '',
    password: '',
    first_name: '',
    last_name: '',
    phone: '',
    age: '',
    sex: '',
    blood_group: '',
    occupation: '',
    address: '',
    state_of_origin: '',
    religion: '',
    next_of_kin_name: '',
    next_of_kin_relationship: '',
    next_of_kin_phone: '',
    next_of_kin_address: '',
    consent: false,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email.trim() || form.password.length < 6) {
      toast('A valid email and password of at least 6 characters are required', true);
      return;
    }
    if (!form.first_name.trim() || !form.last_name.trim()) {
      toast('First and last names are required', true);
      return;
    }
    if (!form.consent) {
      toast('You must consent to data collection to open your folder', true);
      return;
    }

    try {
      hospitalStore.patientSignup({
        email: form.email,
        password: form.password,
        first_name: form.first_name,
        last_name: form.last_name,
        phone: form.phone || undefined,
        age: form.age ? Number(form.age) : undefined,
        sex: form.sex || undefined,
        blood_group: form.blood_group || undefined,
        occupation: form.occupation || undefined,
        address: form.address || undefined,
        state_of_origin: form.state_of_origin || undefined,
        religion: form.religion || undefined,
        next_of_kin_name: form.next_of_kin_name || undefined,
        next_of_kin_relationship: form.next_of_kin_relationship || undefined,
        next_of_kin_phone: form.next_of_kin_phone || undefined,
        next_of_kin_address: form.next_of_kin_address || undefined,
        consent: form.consent,
      });
      toast('Patient folder created successfully');
      onSuccess();
    } catch (err: any) {
      toast(err.message || 'Signup failed', true);
    }
  };

  return (
    <div style={{ maxWidth: 640, margin: '0 auto', padding: '44px 24px 60px' }}>
      <div style={{ marginBottom: 24 }}>
        <button
          type="button"
          onClick={onBackToHome}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            fontSize: '.85rem',
            color: 'var(--ink-soft)',
            textDecoration: 'none',
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            padding: 0,
            marginBottom: 6,
          }}
        >
          <img src="/img/logo.svg" alt="" width={20} height={20} />
          ← Wayfind General Hospital Registry
        </button>
        <h1 style={{ margin: 0 }}>Open Your Patient Folder</h1>
        <p style={{ color: 'var(--ink-soft)' }}>
          Create your own account to view your folder and appointments any time.
        </p>
      </div>

      <div className="panel">
        <form onSubmit={handleSubmit}>
          <h3>Login details</h3>
          <div className="grid-2">
            <div className="field required">
              <label>Email</label>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
              />
            </div>
            <div className="field required">
              <label>Password</label>
              <input
                type="password"
                minLength={6}
                required
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
              />
            </div>
          </div>
          <p className="helper-text">At least 6 characters. You'll use this to log back in.</p>

          <hr className="section-divider" />
          <h3>Personal details</h3>
          <div className="grid-2">
            <div className="field required">
              <label>First name</label>
              <input
                required
                value={form.first_name}
                onChange={(e) => setForm({ ...form, first_name: e.target.value })}
              />
            </div>
            <div className="field required">
              <label>Last name</label>
              <input
                required
                value={form.last_name}
                onChange={(e) => setForm({ ...form, last_name: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-3">
            <div className="field">
              <label>Phone number</label>
              <input
                placeholder="0802-555-0100"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Age</label>
              <input
                type="number"
                min="0"
                max="130"
                value={form.age}
                onChange={(e) => setForm({ ...form, age: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Sex</label>
              <select
                value={form.sex}
                onChange={(e) => setForm({ ...form, sex: e.target.value })}
              >
                <option value="">Not specified</option>
                <option value="Female">Female</option>
                <option value="Male">Male</option>
              </select>
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Blood group</label>
              <select
                value={form.blood_group}
                onChange={(e) => setForm({ ...form, blood_group: e.target.value })}
              >
                <option value="">Unknown</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
              </select>
            </div>
            <div className="field">
              <label>Occupation</label>
              <input
                value={form.occupation}
                onChange={(e) => setForm({ ...form, occupation: e.target.value })}
              />
            </div>
          </div>

          <div className="field">
            <label>Address</label>
            <input
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
          </div>

          <div className="grid-2">
            <div className="field">
              <label>State of origin</label>
              <input
                value={form.state_of_origin}
                onChange={(e) => setForm({ ...form, state_of_origin: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Religion</label>
              <input
                value={form.religion}
                onChange={(e) => setForm({ ...form, religion: e.target.value })}
              />
            </div>
          </div>

          <hr className="section-divider" />
          <h3>Next of kin</h3>
          <div className="grid-2">
            <div className="field">
              <label>Next of kin's name</label>
              <input
                value={form.next_of_kin_name}
                onChange={(e) => setForm({ ...form, next_of_kin_name: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Relationship</label>
              <input
                placeholder="e.g. Spouse, Parent, Sibling"
                value={form.next_of_kin_relationship}
                onChange={(e) => setForm({ ...form, next_of_kin_relationship: e.target.value })}
              />
            </div>
          </div>

          <div className="grid-2">
            <div className="field">
              <label>Next of kin's phone number</label>
              <input
                value={form.next_of_kin_phone}
                onChange={(e) => setForm({ ...form, next_of_kin_phone: e.target.value })}
              />
            </div>
            <div className="field">
              <label>Next of kin's house address</label>
              <input
                value={form.next_of_kin_address}
                onChange={(e) => setForm({ ...form, next_of_kin_address: e.target.value })}
              />
            </div>
          </div>

          <hr className="section-divider" />
          <div className="field" style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <input
              type="checkbox"
              id="patientConsentCheck"
              style={{ width: 'auto', marginTop: 4 }}
              checked={form.consent}
              onChange={(e) => setForm({ ...form, consent: e.target.checked })}
              required
            />
            <label
              htmlFor="patientConsentCheck"
              style={{
                textTransform: 'none',
                fontWeight: 400,
                fontSize: '.85rem',
                color: 'var(--ink)',
                letterSpacing: 0,
                cursor: 'pointer',
              }}
            >
              I consent to Wayfind General Hospital collecting and storing the information above for the purpose of my care, appointment scheduling, and hospital records, in line with applicable data protection law.
            </label>
          </div>

          <div className="flex-between" style={{ marginTop: 14 }}>
            <span className="helper-text" style={{ margin: 0 }}>
              An MRN is assigned automatically.
            </span>
            <button className="btn" type="submit">
              Create Folder
            </button>
          </div>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: 16 }}>
        <a onClick={onNavigateLogin} style={{ cursor: 'pointer' }}>
          Already have a folder? Log in
        </a>
      </p>
    </div>
  );
};
