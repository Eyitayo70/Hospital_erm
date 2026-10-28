import React from 'react';
import { hospitalStore } from '../store/hospitalStore';
import { useToast } from '../components/Toast';
import {
  FolderOpen,
  ShieldCheck,
  CalendarCheck,
  Stethoscope,
  HeartPulse,
  Users,
  Building2,
  Lock,
  ArrowRight,
  Sparkles,
} from 'lucide-react';

interface HomeViewProps {
  onNavigatePatientLogin: () => void;
  onNavigatePatientSignup: () => void;
  onNavigateOfficerPortal: () => void;
  onQuickOfficerLogin: () => void;
  onQuickPatientLogin: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigatePatientLogin,
  onNavigatePatientSignup,
  onNavigateOfficerPortal,
  onQuickOfficerLogin,
  onQuickPatientLogin,
}) => {
  const { toast } = useToast();
  const stats = hospitalStore.getDashboardStats();

  return (
    <div style={{ maxWidth: 1040, margin: '0 auto', padding: '36px 20px 60px' }}>
      {/* Graphical Hero Banner with Generated Hospital Image */}
      <div
        style={{
          position: 'relative',
          borderRadius: 8,
          overflow: 'hidden',
          marginBottom: 36,
          boxShadow: 'var(--shadow-lift)',
          border: '1px solid var(--line)',
        }}
      >
        <img
          src="/src/assets/images/hospital_hero_medical_1793191631692.jpg"
          alt="Wayfind General Hospital Reception"
          style={{
            width: '100%',
            height: '320px',
            objectFit: 'cover',
            display: 'block',
          }}
        />
        {/* Deep contrast scrim */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background:
              'linear-gradient(to top, rgba(22, 41, 63, 0.94) 0%, rgba(22, 41, 63, 0.6) 50%, rgba(22, 41, 63, 0.25) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'flex-end',
            padding: '34px 38px',
            color: '#fff',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
            <img src="/img/logo.svg" alt="" width={32} height={32} />
            <span
              style={{
                fontFamily: "'Zilla Slab', serif",
                fontSize: '1rem',
                letterSpacing: '.1em',
                textTransform: 'uppercase',
                color: 'var(--manila)',
                fontWeight: 600,
              }}
            >
              Wayfind General Hospital
            </span>
          </div>

          <h1 style={{ color: '#fff', fontSize: '2.4rem', margin: '0 0 8px', letterSpacing: '-0.01em' }}>
            Central Hospital Registry &amp; EHR
          </h1>

          <p style={{ color: '#E4DCC2', maxWidth: 600, margin: 0, fontSize: '.98rem', lineHeight: 1.5 }}>
            Electronic medical folder management, real-time appointment scheduling, confidential clinical records, and WHO digital health governance.
          </p>
        </div>
      </div>

      {/* Live Hospital Metrics Strip */}
      <div
        className="panel"
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
          gap: 16,
          padding: '16px 24px',
          marginBottom: 32,
          background: '#fff',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--paper-dim)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <FolderOpen size={20} color="var(--manila-dark)" />
          </div>
          <div>
            <div className="mono tabular-nums" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--navy-deep)' }}>
              {stats.total_patients} Folders
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--ink-soft)' }}>Archived on active file</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--teal-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <CalendarCheck size={20} color="var(--teal)" />
          </div>
          <div>
            <div className="mono tabular-nums" style={{ fontWeight: 700, fontSize: '1.25rem', color: 'var(--teal)' }}>
              {stats.today_appointments} Bookings
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--ink-soft)' }}>Clinical visits scheduled today</div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 40, height: 40, borderRadius: 6, background: 'var(--sage-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <ShieldCheck size={20} color="var(--sage)" />
          </div>
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: 'var(--navy-deep)' }}>
              HL7 FHIR &amp; NDPR
            </div>
            <div style={{ fontSize: '.75rem', color: 'var(--ink-soft)' }}>Audit-verified governance</div>
          </div>
        </div>
      </div>

      {/* Two Portal Cards Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24, marginBottom: 30 }}>
        {/* Patient Portal Card */}
        <div
          className="panel"
          style={{
            padding: '32px 28px',
            borderTop: '4px solid var(--teal)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <HeartPulse size={22} color="var(--teal)" />
              <div style={{ textTransform: 'uppercase', fontSize: '.72rem', letterSpacing: '.1em', color: 'var(--teal)', fontWeight: 700 }}>
                For Patients
              </div>
            </div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: 8 }}>Patient Portal</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '.92rem', lineHeight: 1.5 }}>
              Open your confidential hospital folder, view your medical appointment schedule, and submit inquiries or complaints directly to the hospital front desk.
            </p>
          </div>

          <div style={{ marginTop: 24 }}>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <button
                type="button"
                className="btn"
                style={{ flex: 1, minWidth: 140 }}
                onClick={onNavigatePatientSignup}
              >
                Open a Folder
              </button>
              <button
                type="button"
                className="btn secondary"
                style={{ flex: 1, minWidth: 120 }}
                onClick={onNavigatePatientLogin}
              >
                Log In
              </button>
            </div>
          </div>
        </div>

        {/* Health Officer Portal Card */}
        <div
          className="panel"
          style={{
            padding: '32px 28px',
            borderTop: '4px solid var(--manila)',
            background: 'linear-gradient(180deg, #FFFFFF 0%, var(--paper) 100%)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
          }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
              <Stethoscope size={22} color="var(--navy-deep)" />
              <div style={{ textTransform: 'uppercase', fontSize: '.72rem', letterSpacing: '.1em', color: 'var(--navy-deep)', fontWeight: 700 }}>
                Hospital Staff Only
              </div>
            </div>
            <h2 style={{ fontSize: '1.6rem', marginBottom: 8 }}>Health Officer Portal</h2>
            <p style={{ color: 'var(--ink-soft)', fontSize: '.92rem', lineHeight: 1.5 }}>
              Authorized access for Doctors, Nurses, and Records Officers. Manage patient folders, diagnostic coding (ICD-10), vital signs, scheduling, and FHIR interoperability.
            </p>
          </div>

          <div style={{ marginTop: 24 }}>
            <button
              type="button"
              className="btn"
              style={{ width: '100%', background: 'var(--navy-deep)' }}
              onClick={onNavigateOfficerPortal}
            >
              Enter Health Officer Portal →
            </button>
          </div>
        </div>
      </div>

      {/* Quick Evaluation Demo Bar */}
      <div
        style={{
          padding: '16px 20px',
          background: 'var(--paper-dim)',
          borderRadius: 6,
          border: '1px solid var(--line)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 12,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Sparkles size={16} color="var(--manila-dark)" />
          <span style={{ fontSize: '.84rem', color: 'var(--ink)', fontWeight: 600 }}>
            Instant Testing &amp; Role Switcher:
          </span>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          <button
            type="button"
            className="btn ghost small"
            onClick={() => {
              onQuickOfficerLogin();
              toast('Logged in as Health Records Officer');
            }}
          >
            Login as Officer (Amina Bello, RN)
          </button>
          <button
            type="button"
            className="btn ghost small"
            onClick={() => {
              onQuickPatientLogin();
              toast('Logged in as Patient (Sarah Jenkins)');
            }}
          >
            Login as Patient (Sarah Jenkins)
          </button>
        </div>
      </div>
    </div>
  );
};
