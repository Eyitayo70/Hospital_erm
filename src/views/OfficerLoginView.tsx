import React, { useState } from 'react';
import { hospitalStore } from '../store/hospitalStore';
import { useToast } from '../components/Toast';

interface OfficerLoginViewProps {
  onSuccess: () => void;
  onNavigateSignup: () => void;
  onNavigateForgotPassword: () => void;
  onBackToPortal: () => void;
}

export const OfficerLoginView: React.FC<OfficerLoginViewProps> = ({
  onSuccess,
  onNavigateSignup,
  onNavigateForgotPassword,
  onBackToPortal,
}) => {
  const { toast } = useToast();
  const [step, setStep] = useState<'password' | 'code'>('password');
  const [email, setEmail] = useState('officer@wayfind.org');
  const [password, setPassword] = useState('password123');
  const [code, setCode] = useState('');
  const [simulatedCode, setSimulatedCode] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleRequestCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      toast('Work email and password are required', true);
      return;
    }
    setLoading(true);
    try {
      const res = hospitalStore.officerRequestCode(email);
      setSimulatedCode(res.simulatedCode);
      setStep('code');
      toast('Verification code generated');
    } catch (err: any) {
      toast(err.message || 'Authentication error', true);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast('Please enter the 6-digit code', true);
      return;
    }
    setLoading(true);
    try {
      hospitalStore.officerVerifyCode(email, code.trim());
      toast('Authenticated successfully');
      onSuccess();
    } catch (err: any) {
      toast(err.message || 'Invalid code', true);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '60px auto', padding: '0 24px' }}>
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
        <h1 style={{ margin: 0 }}>Health Officer Log In</h1>
      </div>

      {step === 'password' && (
        <div className="panel">
          <form onSubmit={handleRequestCode}>
            <div className="field required">
              <label>Work email</label>
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
              Send Login Code
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
            Demo Officer Email: <strong>officer@wayfind.org</strong>
          </div>
        </div>
      )}

      {step === 'code' && (
        <div className="panel">
          <p style={{ color: 'var(--ink-soft)' }}>
            We sent a 6-digit code to <strong>{email}</strong>. It expires in 10 minutes.
          </p>

          {simulatedCode && (
            <div
              style={{
                marginBottom: 16,
                padding: '10px 14px',
                background: 'var(--teal-light)',
                border: '1px solid var(--teal)',
                borderRadius: 4,
                color: 'var(--teal)',
                fontSize: '.88rem',
              }}
            >
              Simulated Officer Code: <strong>{simulatedCode}</strong> (or enter <strong>123456</strong>)
            </div>
          )}

          <form onSubmit={handleVerifyCode}>
            <div className="field required">
              <label>Login code (6 digits)</label>
              <input
                name="code"
                maxLength={6}
                inputMode="numeric"
                required
                autoFocus
                placeholder="123456"
                value={code}
                onChange={(e) => setCode(e.target.value)}
              />
            </div>
            <button
              className="btn"
              type="submit"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              Verify &amp; Log In
            </button>
          </form>
          <button
            type="button"
            className="btn ghost small"
            style={{ marginTop: 10 }}
            onClick={() => {
              setStep('password');
              setCode('');
            }}
          >
            ← Use a different email
          </button>
        </div>
      )}

      <p style={{ textAlign: 'center', marginTop: 16 }}>
        <a onClick={onNavigateSignup} style={{ cursor: 'pointer' }}>
          Need an account? Register
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
