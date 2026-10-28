import React from 'react';
import { Appointment } from '../types';
import { fmtDate, fmtTime } from '../utils/formatters';
import { deptColor } from '../constants';
import { Printer, X, Calendar, Clock, MapPin, UserCheck, Shield } from 'lucide-react';

interface AppointmentCardModalProps {
  appointment: Appointment | null;
  onClose: () => void;
}

export const AppointmentCardModal: React.FC<AppointmentCardModalProps> = ({
  appointment,
  onClose,
}) => {
  if (!appointment) return null;

  const dc = deptColor(appointment.department);

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        backgroundColor: 'rgba(22, 41, 63, 0.7)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        zIndex: 999,
        backdropFilter: 'blur(3px)',
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div style={{ maxWidth: 500, width: '100%' }}>
        <div className="no-print flex-between" style={{ marginBottom: 14 }}>
          <button className="btn ghost small" onClick={onClose}>
            ← Close
          </button>
          <div style={{ display: 'flex', gap: 8 }}>
            <button className="btn small" onClick={() => window.print()}>
              <Printer size={14} /> Print Appointment Card
            </button>
          </div>
        </div>

        {/* Printable Card */}
        <div className="appt-card">
          <div className="head" style={{ background: dc, position: 'relative' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <img
                src="/img/logo.svg"
                alt=""
                width={28}
                height={28}
                style={{ filter: 'brightness(0) invert(1)' }}
              />
              <div>
                <div className="h-title" style={{ fontSize: '1.1rem' }}>
                  Wayfind General Hospital
                </div>
                <div style={{ fontSize: '.72rem', opacity: 0.9, letterSpacing: '.05em', textTransform: 'uppercase' }}>
                  Official Appointment Card
                </div>
              </div>
            </div>

            <div style={{ textAlign: 'right' }}>
              <div className="h-code mono" style={{ color: '#fff', fontWeight: 700 }}>
                {appointment.appointment_code}
              </div>
              <div className="mono" style={{ fontSize: '.75rem', opacity: 0.9 }}>
                MRN: {appointment.mrn || 'ON FILE'}
              </div>
            </div>
          </div>

          <div className="body" style={{ position: 'relative' }}>
            {/* Background Watermark Seal */}
            <div
              style={{
                position: 'absolute',
                right: 20,
                bottom: 20,
                opacity: 0.08,
                pointerEvents: 'none',
              }}
            >
              <img
                src="/src/assets/images/hospital_crest_seal_1793191646767.jpg"
                alt=""
                width={160}
                height={160}
                style={{ borderRadius: '50%' }}
              />
            </div>

            <div className="row">
              <span className="k">Patient Name</span>
              <strong style={{ fontSize: '1rem', color: 'var(--navy-deep)' }}>
                {appointment.first_name} {appointment.last_name}
              </strong>
            </div>

            <div className="row">
              <span className="k">Appointment Date</span>
              <span style={{ fontWeight: 600 }}>{fmtDate(appointment.date)}</span>
            </div>

            <div className="row">
              <span className="k">Appointment Time</span>
              <span className="mono" style={{ fontWeight: 600 }}>{fmtTime(appointment.time)}</span>
            </div>

            <div className="row">
              <span className="k">Department</span>
              <span>
                <span className="dept-swatch" style={{ background: dc }} />
                {appointment.department}
              </span>
            </div>

            <div className="row">
              <span className="k">Consulting Provider</span>
              <span>{appointment.provider_name}</span>
            </div>

            <div className="row">
              <span className="k">Clinic Location</span>
              <span>{appointment.location || 'Main hospital OPD'}</span>
            </div>

            <div className="row">
              <span className="k">Reason for Visit</span>
              <span>{appointment.reason || 'Medical consultation'}</span>
            </div>

            <div className="row">
              <span className="k">Current Status</span>
              <span className={`chip status-${appointment.status}`}>
                {appointment.status.replace('-', ' ')}
              </span>
            </div>

            {/* Barcode representation */}
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px dashed var(--line)', textAlign: 'center' }}>
              <svg width="120" height="24" viewBox="0 0 100 25" style={{ display: 'inline-block' }}>
                <rect x="0" y="0" width="3" height="25" fill="#2A2520" />
                <rect x="6" y="0" width="1" height="25" fill="#2A2520" />
                <rect x="9" y="0" width="4" height="25" fill="#2A2520" />
                <rect x="16" y="0" width="2" height="25" fill="#2A2520" />
                <rect x="21" y="0" width="5" height="25" fill="#2A2520" />
                <rect x="29" y="0" width="2" height="25" fill="#2A2520" />
                <rect x="34" y="0" width="3" height="25" fill="#2A2520" />
                <rect x="40" y="0" width="1" height="25" fill="#2A2520" />
                <rect x="44" y="0" width="4" height="25" fill="#2A2520" />
                <rect x="51" y="0" width="2" height="25" fill="#2A2520" />
                <rect x="56" y="0" width="6" height="25" fill="#2A2520" />
                <rect x="65" y="0" width="2" height="25" fill="#2A2520" />
                <rect x="70" y="0" width="3" height="25" fill="#2A2520" />
                <rect x="76" y="0" width="1" height="25" fill="#2A2520" />
                <rect x="80" y="0" width="4" height="25" fill="#2A2520" />
                <rect x="87" y="0" width="2" height="25" fill="#2A2520" />
                <rect x="92" y="0" width="5" height="25" fill="#2A2520" />
              </svg>
              <div style={{ fontSize: '.65rem', fontFamily: 'monospace', color: 'var(--ink-soft)' }}>
                {appointment.appointment_code}
              </div>
            </div>
          </div>

          <div className="foot">
            Please arrive 15 minutes before your time. Bring your photo identification card and this appointment card.
          </div>
        </div>
      </div>
    </div>
  );
};
