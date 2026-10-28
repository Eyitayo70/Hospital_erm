import React, { useState } from 'react';
import { hospitalStore } from '../store/hospitalStore';
import { useToast } from '../components/Toast';

interface OfficerSignupViewProps {
  onSuccess: () => void;
  onNavigateLogin: () => void;
  onBackToPortal: () => void;
}

export const OfficerSignupView: React.FC<OfficerSignupViewProps> = ({
  onSuccess,
  onNavigateLogin,
  onBackToPortal,
}) => {
  const { toast } = useToast();
  const [form, setForm] = useState({
    full_name: '',
    role_title: '',
    phone: '',
    email: '',
    password: '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name.trim() || !form.role_title.trim() || !form.email.trim() || form.password.length < 6) {
      toast('Full name, role, email, and a password of at least 6 characters are required', true);
      return;
    }
    try {
      hospitalStore.officerSignup({
        full_name: form.full_name,
        role_title: form.role_title,
        phone: form.phone || undefined,
        email: form.email,
      });
      toast('Officer account registered — please log in');
      onSuccess();
    } catch (err: any) {
      toast(err.message || 'Registration failed', true);
    }
  };

  return (
    <div style={{ maxWidth: 440, margin: '60px auto', padding: '0 24px' }}>
      <div style={{ marginBottom: 24 }}>
        <button
          type="button"
          onClick={onBackToPortal}
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
          ← Health Officer Portal
        </button>
        <h1 style={{ margin: 0 }}>Health Officer Registration</h1>
        <p className="helper-text" style={{ marginTop: 6 }}>
          Every login is verified with a one-time code sent to this email, in addition to your password.
        </p>
      </div>

      <div className="panel">
        <form onSubmit={handleSubmit}>
          <div className="field required">
            <label>Full name</label>
            <input
              required
              autoFocus
              value={form.full_name}
              onChange={(e) => setForm({ ...form, full_name: e.target.value })}
            />
          </div>
          <div className="field required">
            <label>Role in hospital</label>
            <input
              placeholder="e.g. Records Officer, Nurse, Doctor"
              required
              value={form.role_title}
              onChange={(e) => setForm({ ...form, role_title: e.target.value })}
            />
          </div>
          <div className="field required">
            <label>Phone number</label>
            <input
              required
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
          </div>
          <div className="field required">
            <label>Work email</label>
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
          <button
            className="btn"
            type="submit"
            style={{ width: '100%', justifyContent: 'center' }}
          >
            Register
          </button>
        </form>
      </div>

      <p style={{ textAlign: 'center', marginTop: 16 }}>
        <a onClick={onNavigateLogin} style={{ cursor: 'pointer' }}>
          Already registered? Log in
        </a>
      </p>
    </div>
  );
};
