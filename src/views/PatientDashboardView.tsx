import React, { useState, useEffect } from 'react';
import { hospitalStore } from '../store/hospitalStore';
import { Patient, Appointment, Complaint } from '../types';
import { fmtDate, fmtTime } from '../utils/formatters';
import { deptColor } from '../constants';
import { useToast } from '../components/Toast';
import { Printer, Calendar, Clock, MessageSquare, Shield, Activity, LogOut } from 'lucide-react';

interface PatientDashboardViewProps {
  patientId: number;
  onLogout: () => void;
  onOpenCard: (appointment: Appointment) => void;
  onSwitchToOfficer: () => void;
}

export const PatientDashboardView: React.FC<PatientDashboardViewProps> = ({
  patientId,
  onLogout,
  onOpenCard,
  onSwitchToOfficer,
}) => {
  const { toast } = useToast();
  const [patient, setPatient] = useState<(Patient & { appointments: Appointment[] }) | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [complaintText, setComplaintText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const loadData = () => {
    const p = hospitalStore.getPatient(patientId);
    if (p) {
      setPatient(p);
      setComplaints(hospitalStore.myComplaints(p.id));
    }
  };

  useEffect(() => {
    loadData();
    const unsub = hospitalStore.subscribe(loadData);
    return unsub;
  }, [patientId]);

  if (!patient) {
    return (
      <div style={{ maxWidth: 840, margin: '40px auto', padding: '0 24px' }}>
        <div className="panel empty-state">
          <h3>Patient Folder Not Found</h3>
          <p>Please log in again with your registered email.</p>
          <button className="btn small" onClick={onLogout}>
            Log In
          </button>
        </div>
      </div>
    );
  }

  const dc = deptColor(patient.department);
  const upcoming = (patient.appointments || []).filter((a) =>
    ['scheduled', 'checked-in'].includes(a.status)
  );
  const past = (patient.appointments || []).filter(
    (a) => !['scheduled', 'checked-in'].includes(a.status)
  );

  const handleSubmitComplaint = (e: React.FormEvent) => {
    e.preventDefault();
    if (!complaintText.trim()) return;
    setIsSubmitting(true);
    try {
      hospitalStore.submitComplaint(patient.id, complaintText.trim());
      setComplaintText('');
      toast('Complaint submitted to hospital front desk');
    } catch (err: any) {
      toast(err.message || 'Failed to submit complaint', true);
    } finally {
      setIsSubmitting(false);
    }
  };

  const kv = (k: string, v?: string | number | null) => (
    <div className="kv-item">
      <div className="k">{k}</div>
      <div className="v">{v !== undefined && v !== null && v !== '' ? v : '—'}</div>
    </div>
  );

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '34px 20px 60px' }}>
      {/* Top Header Bar */}
      <div className="flex-between" style={{ marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <img src="/img/logo.svg" alt="" width={38} height={38} />
          <div>
            <div className="eyebrow" style={{ color: 'var(--teal)' }}>Patient Self-Service Portal</div>
            <h1 style={{ margin: 0 }}>My Hospital Folder</h1>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
          <button
            type="button"
            className="btn secondary small no-print"
            onClick={onSwitchToOfficer}
            title="Switch to Health Officer Portal"
          >
            Staff Portal →
          </button>
          <button
            type="button"
            className="btn ghost small"
            onClick={onLogout}
          >
            <LogOut size={14} /> Log out
          </button>
        </div>
      </div>

      {/* The Manila Folder Card with Seal and Barcode */}
      <div className="folder" style={{ ['--dept-color' as any]: dc }}>
        <div className="folder-tab-label">{patient.department}</div>
        <div className="folder-header">
          <div>
            <div className="name" style={{ fontWeight: 700 }}>
              {patient.first_name} {patient.last_name}
            </div>
            <div className="mrn mono" style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--navy)' }}>
              MRN: {patient.mrn}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src="/src/assets/images/hospital_crest_seal_1793191646767.jpg"
              alt="Seal"
              width={38}
              height={38}
              style={{ borderRadius: '50%', boxShadow: '0 2px 4px rgba(0,0,0,0.1)' }}
            />
            <div className="stamp">Patient Copy · Read-only</div>
          </div>
        </div>

        <div className="kv-grid">
          {kv('Age', patient.age ? `${patient.age} years` : undefined)}
          {kv('Sex', patient.sex)}
          {kv('Blood group', patient.blood_group)}
          {kv('Phone', patient.phone)}
          {kv('Email', patient.email)}
          {kv('Occupation', patient.occupation)}
          {kv('Religion', patient.religion)}
          {kv('State of origin', patient.state_of_origin)}
          {kv('Address', patient.address)}
        </div>

        <hr className="section-divider" />
        <h3 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
          <Shield size={16} color="var(--teal)" /> Next of Kin Information
        </h3>
        <div className="kv-grid">
          {kv('Name', patient.next_of_kin_name)}
          {kv('Relationship', patient.next_of_kin_relationship)}
          {kv('Phone', patient.next_of_kin_phone)}
          {kv('Address', patient.next_of_kin_address)}
        </div>

        <p className="helper-text" style={{ marginTop: 18, marginBottom: 0 }}>
          To update your contact details or folder information, please visit the hospital front desk and speak with a health records officer.
        </p>
      </div>

      {/* Upcoming Appointments */}
      <div className="panel">
        <div className="flex-between" style={{ marginBottom: 12 }}>
          <h2 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="var(--teal)" /> Upcoming Appointments
          </h2>
          <span style={{ fontSize: '.78rem', color: 'var(--ink-soft)' }}>
            {upcoming.length} scheduled visit{upcoming.length === 1 ? '' : 's'}
          </span>
        </div>
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Department</th>
              <th>Provider</th>
              <th>Reason</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {upcoming.length ? (
              upcoming.map((a) => (
                <tr key={a.id}>
                  <td>
                    <div style={{ fontWeight: 600 }}>{fmtDate(a.date)}</div>
                    <div className="mono" style={{ color: 'var(--ink-soft)', fontSize: '.78rem' }}>
                      {fmtTime(a.time)}
                    </div>
                  </td>
                  <td>
                    <span
                      className="dept-swatch"
                      style={{ background: deptColor(a.department) }}
                    />
                    {a.department}
                  </td>
                  <td>{a.provider_name}</td>
                  <td>{a.reason || '—'}</td>
                  <td>
                    <span className={`chip status-${a.status}`}>
                      {a.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="no-print" style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn ghost small"
                      onClick={() => onOpenCard(a)}
                    >
                      <Printer size={13} /> View Card
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">
                    No upcoming appointments. The hospital records team will schedule these for you.
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Past Appointments */}
      <div className="panel">
        <h2 style={{ marginBottom: 12 }}>Past Visits</h2>
        <table>
          <thead>
            <tr>
              <th>When</th>
              <th>Department</th>
              <th>Provider</th>
              <th>Reason</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {past.length ? (
              past.map((a) => (
                <tr key={a.id}>
                  <td>
                    {fmtDate(a.date)}
                    <div className="mono" style={{ color: 'var(--ink-soft)', fontSize: '.78rem' }}>
                      {fmtTime(a.time)}
                    </div>
                  </td>
                  <td>
                    <span
                      className="dept-swatch"
                      style={{ background: deptColor(a.department) }}
                    />
                    {a.department}
                  </td>
                  <td>{a.provider_name}</td>
                  <td>{a.reason || '—'}</td>
                  <td>
                    <span className={`chip status-${a.status}`}>
                      {a.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="no-print" style={{ textAlign: 'right' }}>
                    <button
                      type="button"
                      className="btn ghost small"
                      onClick={() => onOpenCard(a)}
                    >
                      <Printer size={13} /> Card
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">No past appointments recorded.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Complaints */}
      <div className="panel">
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
          <MessageSquare size={18} color="var(--navy)" />
          <h2 style={{ margin: 0 }}>Direct Inquiries &amp; Complaints</h2>
        </div>
        <p style={{ color: 'var(--ink-soft)', fontSize: '.88rem' }}>
          Have feedback regarding clinic wait times, facilities, or questions? Submit directly to hospital administration below.
        </p>

        <form onSubmit={handleSubmitComplaint} style={{ marginBottom: 20 }}>
          <div className="field">
            <textarea
              rows={3}
              required
              placeholder="Tell us what happened or describe your concern…"
              value={complaintText}
              onChange={(e) => setComplaintText(e.target.value)}
            />
          </div>
          <button className="btn small" type="submit" disabled={isSubmitting}>
            Submit to Front Desk
          </button>
        </form>

        <div>
          {complaints.length ? (
            complaints.map((c) => (
              <div
                key={c.id}
                className="panel"
                style={{
                  boxShadow: 'none',
                  borderColor: 'var(--line)',
                  padding: '16px 18px',
                  marginBottom: 12,
                }}
              >
                <div className="flex-between" style={{ marginBottom: 8 }}>
                  <span
                    className={`chip status-${
                      c.status === 'resolved'
                        ? 'completed'
                        : c.status === 'in-progress'
                        ? 'checked-in'
                        : 'scheduled'
                    }`}
                  >
                    {c.status.replace('-', ' ')}
                  </span>
                  <span style={{ fontSize: '.76rem', color: 'var(--ink-soft)' }}>
                    {fmtDate(c.created_at)}
                  </span>
                </div>
                <p style={{ marginBottom: c.response ? '10px' : '0' }}>{c.message}</p>
                {c.response && (
                  <div
                    style={{
                      background: 'var(--paper-dim)',
                      borderRadius: 4,
                      padding: '10px 14px',
                      fontSize: '.88rem',
                      borderLeft: '3px solid var(--teal)',
                    }}
                  >
                    <strong style={{ color: 'var(--navy-deep)' }}>Hospital Administration Response:</strong>{' '}
                    {c.response}
                  </div>
                )}
              </div>
            ))
          ) : (
            <p style={{ color: 'var(--ink-soft)' }}>No complaints submitted yet.</p>
          )}
        </div>
      </div>
    </div>
  );
};
