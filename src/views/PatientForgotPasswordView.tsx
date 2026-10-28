import React, { useState } from 'react';
import { hospitalStore } from '../store/hospitalStore';
import { useToast } from '../components/Toast';

interface PatientForgotPasswordViewProps {
  onBackToLogin: () => void;
  onBackToHome: () => void;
}

export const PatientForgotPasswordView: React.FC<PatientForgotPasswordViewProps> = ({
  onBackToLogin,
  onBackToHome,
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'request' | 'reset' | 'done'>('request');
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  const handleRequestCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    try {
      const res = hospitalStore.requestPasswordReset(email.trim(), 'patient');
      setSimulatedCode(res.simulatedCode);
      setStep('reset');
      toast('If that account exists, a reset code was sent');
    } catch (err: any) {
      toast(err.message || 'Request failed', true);
    }
  };

  const handleResetPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || newPassword.length < 6) {
      toast('Valid code and password of at least 6 characters required', true);
      return;
    }
    try {
      hospitalStore.resetPassword(email.trim(), 'patient', code.trim());
      setStep('done');
      toast('Password reset successfully');
    } catch (err: any) {
      toast(err.message || 'Reset failed', true);
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
        <h1 style={{ margin: 0 }}>Reset Your Password</h1>
      </div>

      {step === 'request' && (
        <div className="panel">
          <p style={{ color: 'var(--ink-soft)' }}>
            Enter your email — we'll send a reset code.
          </p>
          <form onSubmit={handleRequestCode}>
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
            <button
              className="btn"
              type="submit"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Send Reset Code
            </button>
          </form>
        </div>
      )}

      {step === 'reset' && (
        <div className="panel">
          <p style={{ color: 'var(--ink-soft)' }}>
            We sent a code to <strong>{email}</strong> if an account exists for it. It expires in 15 minutes.
          </p>
          {simulatedCode && (
            <div
              style={{
                marginBottom: 14,
                padding: '8px 12px',
                background: 'var(--teal-light)',
                borderRadius: 4,
                color: 'var(--teal)',
                fontSize: '.85rem',
              }}
            >
              Simulated code: <strong>{simulatedCode}</strong> (or <strong>123456</strong>)
            </div>
          )}
          <form onSubmit={handleResetPassword}>
            <div className="field required">
              <label>Reset code</label>
              <input
                maxLength={6}
                inputMode="numeric"
                required
                autoFocus
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <div className="field required">
              <label>New password</label>
              <input
                type="password"
                minLength={6}
                required
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
            </div>
            <button
              className="btn"
              type="submit"
              style={{ width: '100%', justifyContent: 'center' }}
            >
              Set New Password
            </button>
          </form>
          <button
            type="button"
            className="btn ghost small"
            style={{ marginTop: 10 }}
            onClick={() => setStep('request')}
          >
            ← Start over
          </button>
        </div>
      )}

      {step === 'done' && (
        <div className="panel" style={{ textAlign: 'center' }}>
          <h3>Password Updated</h3>
          <p style={{ color: 'var(--ink-soft)' }}>
            You can now log in with your new password.
          </p>
          <button type="button" className="btn" onClick={onBackToLogin}>
            Log In
          </button>
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 16 }}>
        <a onClick={onBackToLogin} style={{ cursor: 'pointer' }}>
          Back to Log In
        </a>
      </p>
    </div>
  );
};
