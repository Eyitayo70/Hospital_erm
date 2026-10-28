import React, { useState } from 'react';
import { hospitalStore } from '../store/hospitalStore';
import { useToast } from '../components/Toast';

interface PatientLoginViewProps {
  onSuccess: () => void;
  onNavigateSignup: () => void;
  onNavigateForgotPassword: () => void;
  onBackToHome: () => void;
}

export const PatientLoginView: React.FC<PatientLoginViewProps> = ({
  onSuccess,
  onNavigateSignup,
  onNavigateForgotPassword,
  onBackToHome,
}) => {
  const { toast } = useToast();
  const [email, setEmail] = useState('sarah.jenkins@example.com');
  const [password, setPassword] = useState('password123');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast('Email and password are required', true);
      return;
    }
    setLoading(true);
    try {
      hospitalStore.patientLogin(email.trim(), password);
      toast('Welcome back to your patient portal');
      onSuccess();
    } catch (err: any) {
      toast(err.message || 'Incorrect email or password', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: '0 24px' }}>
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
        <h1 style={{ margin: 0 }}>Patient Log In</h1>
      </div>

      <div className="panel">
        <form onSubmit={handleSubmit}>
          <div className="field required">
            <label>Email</label>
            <input
              type="email"
              required
              autoFocus
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
          </div>
          <div className="field required">
            <label>Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>
          <button
            className="btn"
            type="submit"
            style={{ width: '100%', justifyContent: 'center' }}
            disabled={loading}
          >
            Log In
          </button>
        </form>

        <div
          style={{
            marginTop: 16,
            padding: '10px 12px',
            background: 'var(--paper-dim)',
            borderRadius: 4,
            fontSize: '.78rem',
            color: 'var(--ink-soft)',
          }}
        >
          Demo Patient: <strong>sarah.jenkins@example.com</strong>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: 16 }}>
        <a onClick={onNavigateSignup} style={{ cursor: 'pointer' }}>
          Don't have a folder yet? Open one
        </a>
      </p>
      <p style={{ textAlign: 'center', marginTop: 8 }}>
        <a onClick={onNavigateForgotPassword} style={{ cursor: 'pointer' }}>
          Forgot your password?
        </a>
      </p>
    </div>
  );
};
