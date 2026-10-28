import React from 'react';

interface OfficerPortalViewProps {
  onLogin: () => void;
  onSignup: () => void;
  onBackToHome: () => void;
}

export const OfficerPortalView: React.FC<OfficerPortalViewProps> = ({
  onLogin,
  onSignup,
  onBackToHome,
}) => {
  return (
    <div style={{ maxWidth: 480, margin: '0 auto', padding: '60px 24px' }}>
      <div style={{ marginBottom: 20 }}>
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
            marginBottom: 12,
          }}
        >
          <img src="/img/logo.svg" alt="" width={20} height={20} />
          ← Hospital Home
        </button>
      </div>

      <div style={{ textAlign: 'center', marginBottom: 44 }}>
        <img src="/img/logo.svg" alt="" width={56} height={56} style={{ marginBottom: 8 }} />
        <div
          style={{
            fontFamily: "'Zilla Slab', serif",
            fontSize: '1.1rem',
            color: 'var(--ink-soft)',
            letterSpacing: '.08em',
            textTransform: 'uppercase',
          }}
        >
          Wayfind General
        </div>
        <h1 style={{ fontSize: '2rem', margin: '4px 0 10px' }}>Health Officer Portal</h1>
        <p style={{ color: 'var(--ink-soft)', maxWidth: 400, margin: '0 auto' }}>
          Staff access to patient folders, appointments, and complaints. Every login is verified by email code.
        </p>
      </div>

      <div className="panel" style={{ textAlign: 'center', padding: '36px 28px' }}>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
          <button type="button" className="btn" onClick={onLogin}>
            Log In
          </button>
          <button type="button" className="btn secondary" onClick={onSignup}>
            Register
          </button>
        </div>
      </div>

      <p style={{ textAlign: 'center', marginTop: 20, fontSize: '.8rem', color: 'var(--ink-soft)' }}>
        This link is for hospital staff only. Patients should use the patient portal.
      </p>
    </div>
  );
};
