import React, { useState, useEffect } from 'react';
import { Patient, Appointment, MedicalRecord, AuditLogEntry } from '../types';
import { hospitalStore } from '../store/hospitalStore';
import { useToast } from './Toast';
import {
  fmtDate,
  fmtTime,
  fmtDateTime,
  patientToFhir,
  encounterToFhir,
  conditionToFhir,
  observationsFromRecord,
} from '../utils/formatters';
import { deptColor, STATUS_OPTIONS, ICD10_COMMON, DEPARTMENTS } from '../constants';
import {
  Activity,
  Heart,
  Thermometer,
  Scale,
  Calendar,
  FileText,
  Clock,
  CheckCircle,
  Copy,
  Printer,
  Edit,
  Shield,
  Stethoscope,
  Sparkles,
} from 'lucide-react';

interface PatientFolderProps {
  patientId: number;
  onEditFolder: (patientId: number) => void;
  onBack: () => void;
  onOpenCard: (appointment: Appointment) => void;
  isOfficer?: boolean;
}

export const PatientFolder: React.FC<PatientFolderProps> = ({
  patientId,
  onEditFolder,
  onBack,
  onOpenCard,
  isOfficer = true,
}) => {
  const { toast } = useToast();
  const [patient, setPatient] = useState<(Patient & { appointments: Appointment[] }) | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'appointments' | 'records' | 'fhir' | 'activity'>('overview');

  // Appointments form
  const [showNewAppt, setShowNewAppt] = useState(false);
  const [apptForm, setApptForm] = useState({
    date: new Date().toISOString().slice(0, 10),
    time: '09:00',
    department: 'General',
    provider_name: '',
    location: '',
    reason: '',
  });

  // Medical Records state
  const [records, setRecords] = useState<MedicalRecord[]>([]);
  const [showNewRecord, setShowNewRecord] = useState(false);
  const [editingRecord, setEditingRecord] = useState<MedicalRecord | null>(null);
  const [recordForm, setRecordForm] = useState({
    diagnosis_code: '',
    diagnosis_label: '',
    bp_systolic: '',
    bp_diastolic: '',
    temperature_c: '',
    pulse_bpm: '',
    respiratory_rate: '',
    weight_kg: '',
    height_cm: '',
    report: '',
  });

  // Audit activity state
  const [activity, setActivity] = useState<AuditLogEntry[]>([]);

  // FHIR preview modal state
  const [fhirJsonPreview, setFhirJsonPreview] = useState<{ title: string; json: any } | null>(null);

  const loadData = () => {
    const p = hospitalStore.getPatient(patientId);
    if (p) {
      setPatient(p);
      setApptForm((prev) => ({ ...prev, department: p.department }));
    }
    if (isOfficer) {
      setRecords(hospitalStore.listMedicalRecords(patientId));
      setActivity(hospitalStore.getAuditLog(patientId));
    }
  };

  useEffect(() => {
    loadData();
    const unsub = hospitalStore.subscribe(loadData);
    return unsub;
  }, [patientId, isOfficer]);

  if (!patient) {
    return (
      <div className="panel empty-state">
        <h3>Patient Folder Not Found</h3>
        <p>The requested hospital folder could not be found or has been moved.</p>
        <button className="btn secondary small" onClick={onBack}>
          ← Back
        </button>
      </div>
    );
  }

  const dc = deptColor(patient.department);

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    try {
      hospitalStore.createAppointment({
        patient_id: patient.id,
        date: apptForm.date,
        time: apptForm.time,
        department: apptForm.department as any,
        provider_name: apptForm.provider_name.trim(),
        location: apptForm.location.trim() || undefined,
        reason: apptForm.reason.trim() || undefined,
        status: 'scheduled',
      });
      toast('Appointment booked');
      setShowNewAppt(false);
      setApptForm({
        date: new Date().toISOString().slice(0, 10),
        time: '09:00',
        department: patient.department,
        provider_name: '',
        location: '',
        reason: '',
      });
    } catch (err: any) {
      toast(err.message || 'Failed to create appointment', true);
    }
  };

  const handleStatusChange = (aid: number, newStatus: string) => {
    try {
      hospitalStore.updateAppointment(aid, { status: newStatus as any });
      toast('Status updated');
    } catch (err: any) {
      toast(err.message || 'Failed to update status', true);
    }
  };

  const handleCreateRecord = (e: React.FormEvent) => {
    e.preventDefault();
    if (!recordForm.report.trim()) {
      toast('Report content cannot be empty', true);
      return;
    }
    try {
      hospitalStore.createMedicalRecord(patient.id, {
        report: recordForm.report.trim(),
        diagnosis_code: recordForm.diagnosis_code.trim() || undefined,
        diagnosis_label: recordForm.diagnosis_label.trim() || undefined,
        bp_systolic: recordForm.bp_systolic ? Number(recordForm.bp_systolic) : undefined,
        bp_diastolic: recordForm.bp_diastolic ? Number(recordForm.bp_diastolic) : undefined,
        temperature_c: recordForm.temperature_c ? Number(recordForm.temperature_c) : undefined,
        pulse_bpm: recordForm.pulse_bpm ? Number(recordForm.pulse_bpm) : undefined,
        respiratory_rate: recordForm.respiratory_rate ? Number(recordForm.respiratory_rate) : undefined,
        weight_kg: recordForm.weight_kg ? Number(recordForm.weight_kg) : undefined,
        height_cm: recordForm.height_cm ? Number(recordForm.height_cm) : undefined,
      });
      toast("Doctor's report saved");
      setShowNewRecord(false);
      setRecordForm({
        diagnosis_code: '',
        diagnosis_label: '',
        bp_systolic: '',
        bp_diastolic: '',
        temperature_c: '',
        pulse_bpm: '',
        respiratory_rate: '',
        weight_kg: '',
        height_cm: '',
        report: '',
      });
    } catch (err: any) {
      toast(err.message || 'Failed to save report', true);
    }
  };

  const handleSaveRecordEdit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingRecord || !editingRecord.report.trim()) return;
    try {
      hospitalStore.updateMedicalRecord(editingRecord.id, {
        report: editingRecord.report.trim(),
        diagnosis_code: editingRecord.diagnosis_code || undefined,
        diagnosis_label: editingRecord.diagnosis_label || undefined,
        bp_systolic: editingRecord.bp_systolic ? Number(editingRecord.bp_systolic) : undefined,
        bp_diastolic: editingRecord.bp_diastolic ? Number(editingRecord.bp_diastolic) : undefined,
        temperature_c: editingRecord.temperature_c ? Number(editingRecord.temperature_c) : undefined,
        pulse_bpm: editingRecord.pulse_bpm ? Number(editingRecord.pulse_bpm) : undefined,
        respiratory_rate: editingRecord.respiratory_rate ? Number(editingRecord.respiratory_rate) : undefined,
        weight_kg: editingRecord.weight_kg ? Number(editingRecord.weight_kg) : undefined,
        height_cm: editingRecord.height_cm ? Number(editingRecord.height_cm) : undefined,
      });
      toast('Report updated');
      setEditingRecord(null);
    } catch (err: any) {
      toast(err.message || 'Failed to update report', true);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast('Copied to clipboard');
  };

  const kv = (k: string, v?: string | number | null) => (
    <div className="kv-item">
      <div className="k">{k}</div>
      <div className="v">{v !== undefined && v !== null && v !== '' ? v : '—'}</div>
    </div>
  );

  // Latest Vitals Computation for graphical display
  const latestVitals = records.find(
    (r) =>
      r.bp_systolic ||
      r.temperature_c ||
      r.pulse_bpm ||
      r.weight_kg ||
      r.height_cm
  );

  // Calculate BMI if height and weight exist
  const bmi =
    latestVitals?.weight_kg && latestVitals?.height_cm
      ? (latestVitals.weight_kg / Math.pow(latestVitals.height_cm / 100, 2)).toFixed(1)
      : null;

  const upcomingAppts = (patient.appointments || []).filter((a) =>
    ['scheduled', 'checked-in'].includes(a.status)
  );
  const pastAppts = (patient.appointments || []).filter(
    (a) => !['scheduled', 'checked-in'].includes(a.status)
  );

  return (
    <div>
      <div className="folder" style={{ ['--dept-color' as any]: dc }}>
        {/* Tab department indicator */}
        <div className="folder-tab-label">{patient.department}</div>

        {/* Header with MRN, Seal & Barcode Graphic */}
        <div className="folder-header">
          <div style={{ flex: 1, minWidth: 260 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
              <span className="dept-swatch" style={{ background: dc, width: 14, height: 14, borderRadius: 3 }} />
              <div className="name" style={{ margin: 0, fontWeight: 700 }}>
                {patient.first_name} {patient.last_name}
              </div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
              <div className="mrn mono" style={{ fontSize: '.88rem', fontWeight: 600, color: 'var(--navy)' }}>
                MRN: {patient.mrn}
              </div>
              <span style={{ fontSize: '.75rem', color: 'var(--ink-soft)' }}>
                Opened {fmtDate(patient.created_at)}
              </span>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            {/* Visual Barcode Graphic representation */}
            <div
              className="mrn-barcode-box no-print"
              title={`Digital Barcode: ${patient.mrn}`}
              style={{
                background: '#fff',
                padding: '4px 8px',
                border: '1px solid var(--line)',
                borderRadius: 3,
                textAlign: 'center',
              }}
            >
              <svg width="80" height="24" viewBox="0 0 100 30" style={{ display: 'block' }}>
                <rect x="0" y="0" width="3" height="30" fill="#2A2520" />
                <rect x="6" y="0" width="1" height="30" fill="#2A2520" />
                <rect x="9" y="0" width="4" height="30" fill="#2A2520" />
                <rect x="16" y="0" width="2" height="30" fill="#2A2520" />
                <rect x="21" y="0" width="5" height="30" fill="#2A2520" />
                <rect x="29" y="0" width="2" height="30" fill="#2A2520" />
                <rect x="34" y="0" width="3" height="30" fill="#2A2520" />
                <rect x="40" y="0" width="1" height="30" fill="#2A2520" />
                <rect x="44" y="0" width="4" height="30" fill="#2A2520" />
                <rect x="51" y="0" width="2" height="30" fill="#2A2520" />
                <rect x="56" y="0" width="6" height="30" fill="#2A2520" />
                <rect x="65" y="0" width="2" height="30" fill="#2A2520" />
                <rect x="70" y="0" width="3" height="30" fill="#2A2520" />
                <rect x="76" y="0" width="1" height="30" fill="#2A2520" />
                <rect x="80" y="0" width="4" height="30" fill="#2A2520" />
                <rect x="87" y="0" width="2" height="30" fill="#2A2520" />
                <rect x="92" y="0" width="5" height="30" fill="#2A2520" />
              </svg>
              <span style={{ fontSize: '.6rem', fontFamily: 'monospace', letterSpacing: '.05em', color: 'var(--ink-soft)' }}>
                {patient.mrn}
              </span>
            </div>

            {/* Official Heraldic Seal Stamp */}
            <div style={{ position: 'relative', width: 44, height: 44 }} title="Wayfind Official Registry Seal">
              <img
                src="/src/assets/images/hospital_crest_seal_1793191646767.jpg"
                alt="Hospital Seal"
                width={44}
                height={44}
                style={{
                  borderRadius: '50%',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
                  border: '1px solid var(--manila)',
                  display: 'block',
                }}
              />
            </div>

            <div className="stamp">{isOfficer ? 'Active Folder' : 'Read-only'}</div>
          </div>
        </div>

        {/* View Tabs */}
        <div className="view-tabs">
          <button
            type="button"
            className={`view-tab ${activeTab === 'overview' ? 'active' : ''}`}
            onClick={() => setActiveTab('overview')}
          >
            Overview
          </button>
          <button
            type="button"
            className={`view-tab ${activeTab === 'appointments' ? 'active' : ''}`}
            onClick={() => setActiveTab('appointments')}
          >
            Appointments ({patient.appointments?.length || 0})
          </button>
          {isOfficer && (
            <>
              <button
                type="button"
                className={`view-tab ${activeTab === 'records' ? 'active' : ''}`}
                onClick={() => setActiveTab('records')}
              >
                Doctor's Reports ({records.length})
              </button>
              <button
                type="button"
                className={`view-tab ${activeTab === 'fhir' ? 'active' : ''}`}
                onClick={() => setActiveTab('fhir')}
              >
                EHR / FHIR
              </button>
              <button
                type="button"
                className={`view-tab ${activeTab === 'activity' ? 'active' : ''}`}
                onClick={() => setActiveTab('activity')}
              >
                Activity ({activity.length})
              </button>
            </>
          )}
        </div>

        {/* Tab 1: Overview */}
        {activeTab === 'overview' && (
          <div>
            {/* Visual Vitals Dashboard Snapshot (if recorded) */}
            {latestVitals && (
              <div
                style={{
                  background: '#fff',
                  border: '1px solid var(--line)',
                  borderRadius: 6,
                  padding: '16px 20px',
                  marginBottom: 20,
                  boxShadow: 'var(--shadow)',
                }}
              >
                <div className="flex-between" style={{ marginBottom: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--navy-deep)', fontWeight: 600, fontSize: '.88rem' }}>
                    <Activity size={16} color="var(--teal)" />
                    <span>Latest Clinical Vitals Snapshot</span>
                  </div>
                  <span style={{ fontSize: '.75rem', color: 'var(--ink-soft)' }}>
                    Recorded on {fmtDate(latestVitals.created_at)}
                  </span>
                </div>

                <div className="stat-row" style={{ marginBottom: 0, gap: 12 }}>
                  {latestVitals.bp_systolic && latestVitals.bp_diastolic && (
                    <div className="stat-card" style={{ padding: '12px 14px', borderLeftColor: latestVitals.bp_systolic > 140 ? 'var(--rust)' : 'var(--teal)' }}>
                      <div className="num" style={{ fontSize: '1.4rem' }}>
                        {latestVitals.bp_systolic}/{latestVitals.bp_diastolic}
                      </div>
                      <div className="label" style={{ fontSize: '.7rem' }}>
                        Blood Pressure (mmHg)
                      </div>
                    </div>
                  )}

                  {latestVitals.pulse_bpm && (
                    <div className="stat-card accent-teal" style={{ padding: '12px 14px' }}>
                      <div className="num" style={{ fontSize: '1.4rem' }}>
                        {latestVitals.pulse_bpm} <span style={{ fontSize: '.8rem', fontWeight: 500 }}>bpm</span>
                      </div>
                      <div className="label" style={{ fontSize: '.7rem' }}>
                        Pulse Rate
                      </div>
                    </div>
                  )}

                  {latestVitals.temperature_c && (
                    <div className="stat-card" style={{ padding: '12px 14px', borderLeftColor: latestVitals.temperature_c > 37.5 ? 'var(--rust)' : 'var(--manila)' }}>
                      <div className="num" style={{ fontSize: '1.4rem' }}>
                        {latestVitals.temperature_c}°C
                      </div>
                      <div className="label" style={{ fontSize: '.7rem' }}>
                        Temperature
                      </div>
                    </div>
                  )}

                  {bmi && (
                    <div className="stat-card accent-rust" style={{ padding: '12px 14px' }}>
                      <div className="num" style={{ fontSize: '1.4rem' }}>
                        {bmi} <span style={{ fontSize: '.8rem', fontWeight: 500 }}>BMI</span>
                      </div>
                      <div className="label" style={{ fontSize: '.7rem' }}>
                        {latestVitals.weight_kg} kg · {latestVitals.height_cm} cm
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

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
              <Shield size={16} color="var(--teal)" /> Next of Kin
            </h3>
            <div className="kv-grid">
              {kv('Name', patient.next_of_kin_name)}
              {kv('Relationship', patient.next_of_kin_relationship)}
              {kv('Phone', patient.next_of_kin_phone)}
              {kv('Address', patient.next_of_kin_address)}
            </div>

            <hr className="section-divider" />
            <div className="kv-grid">
              {kv('Folder opened', fmtDate(patient.created_at))}
              {kv('Last updated', fmtDate(patient.updated_at))}
              {kv('Consent on file', patient.consent_given ? 'Confirmed (Explicit)' : 'Pending')}
            </div>

            {isOfficer && (
              <>
                <hr className="section-divider" />
                <button
                  type="button"
                  className="btn secondary small"
                  onClick={() => onEditFolder(patient.id)}
                >
                  <Edit size={14} /> Edit folder details
                </button>
              </>
            )}
          </div>
        )}

        {/* Tab 2: Appointments */}
        {activeTab === 'appointments' && (
          <div>
            <div className="flex-between">
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                <Calendar size={18} color="var(--teal)" /> Upcoming Appointments
              </h3>
              {isOfficer && (
                <button
                  type="button"
                  className="btn small"
                  onClick={() => setShowNewAppt(!showNewAppt)}
                >
                  {showNewAppt ? 'Cancel' : '+ Schedule Appointment'}
                </button>
              )}
            </div>

            {showNewAppt && (
              <div
                className="panel"
                style={{ background: 'var(--paper-dim)', boxShadow: 'none', margin: '14px 0' }}
              >
                <form onSubmit={handleCreateAppointment}>
                  <div className="grid-3">
                    <div className="field required">
                      <label>Date</label>
                      <input
                        type="date"
                        required
                        value={apptForm.date}
                        onChange={(e) => setApptForm({ ...apptForm, date: e.target.value })}
                      />
                    </div>
                    <div className="field required">
                      <label>Time</label>
                      <input
                        type="time"
                        required
                        value={apptForm.time}
                        onChange={(e) => setApptForm({ ...apptForm, time: e.target.value })}
                      />
                    </div>
                    <div className="field required">
                      <label>Department</label>
                      <select
                        value={apptForm.department}
                        onChange={(e) => setApptForm({ ...apptForm, department: e.target.value })}
                        required
                      >
                        {DEPARTMENTS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="grid-2">
                    <div className="field required">
                      <label>Provider</label>
                      <input
                        placeholder="Dr. Okafor"
                        required
                        value={apptForm.provider_name}
                        onChange={(e) => setApptForm({ ...apptForm, provider_name: e.target.value })}
                      />
                    </div>
                    <div className="field">
                      <label>Location / room</label>
                      <input
                        placeholder="Room 104, OPD"
                        value={apptForm.location}
                        onChange={(e) => setApptForm({ ...apptForm, location: e.target.value })}
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>Reason for visit</label>
                    <input
                      placeholder="Follow-up consultation, tests review..."
                      value={apptForm.reason}
                      onChange={(e) => setApptForm({ ...apptForm, reason: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn small" type="submit">
                      Save Appointment
                    </button>
                    <button
                      type="button"
                      className="btn ghost small"
                      onClick={() => setShowNewAppt(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <table style={{ marginTop: 12 }}>
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
                {upcomingAppts.length ? (
                  upcomingAppts.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {fmtDate(a.date)}
                        <div style={{ color: 'var(--ink-soft)', fontSize: '.78rem' }}>
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
                          style={{ marginRight: 6 }}
                        >
                          <Printer size={13} /> Card
                        </button>
                        {isOfficer && (
                          <select
                            className="small"
                            style={{ width: 'auto', display: 'inline-block', padding: '5px 8px' }}
                            value={a.status}
                            onChange={(e) => handleStatusChange(a.id, e.target.value)}
                          >
                            {STATUS_OPTIONS.map((s) => (
                              <option key={s} value={s}>
                                {s}
                              </option>
                            ))}
                          </select>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6}>
                      <div className="empty-state">No upcoming appointments.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>

            <hr className="section-divider" />
            <h3>Past & Other Appointments</h3>
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
                {pastAppts.length ? (
                  pastAppts.map((a) => (
                    <tr key={a.id}>
                      <td>
                        {fmtDate(a.date)}
                        <div style={{ color: 'var(--ink-soft)', fontSize: '.78rem' }}>
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
                      <div className="empty-state">No appointment history yet.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        {/* Tab 3: Doctor's Reports (confidential) */}
        {isOfficer && activeTab === 'records' && (
          <div>
            <div className="flex-between">
              <div>
                <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Stethoscope size={18} color="var(--rust)" /> Confidential Doctor's Reports
                </h3>
                <p className="helper-text" style={{ marginTop: 4, marginBottom: 0 }}>
                  Confidential — never visible to the patient's own portal.
                </p>
              </div>
              <button
                type="button"
                className="btn small"
                onClick={() => setShowNewRecord(!showNewRecord)}
              >
                {showNewRecord ? 'Cancel' : '+ Add Clinical Report'}
              </button>
            </div>

            {showNewRecord && (
              <div
                className="panel"
                style={{ background: 'var(--paper-dim)', boxShadow: 'none', margin: '14px 0' }}
              >
                <form onSubmit={handleCreateRecord}>
                  <div className="grid-2">
                    <div className="field">
                      <label>Diagnosis (ICD-10 Common Selection)</label>
                      <select
                        onChange={(e) => {
                          const val = e.target.value;
                          if (!val || val === 'other') return;
                          const [code, label] = val.split('|||');
                          setRecordForm((prev) => ({
                            ...prev,
                            diagnosis_code: code,
                            diagnosis_label: label,
                          }));
                        }}
                      >
                        <option value="">Select common diagnosis…</option>
                        {ICD10_COMMON.map(([code, label]) => (
                          <option key={code} value={`${code}|||${label}`}>
                            {code} — {label}
                          </option>
                        ))}
                        <option value="other">Other / type manually below…</option>
                      </select>
                    </div>
                    <div className="field">
                      <label>Diagnosis code (ICD-10)</label>
                      <input
                        placeholder="e.g. I10, B54, J45.9"
                        value={recordForm.diagnosis_code}
                        onChange={(e) =>
                          setRecordForm({ ...recordForm, diagnosis_code: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="field">
                    <label>Diagnosis description</label>
                    <input
                      placeholder="e.g. Essential (primary) hypertension"
                      value={recordForm.diagnosis_label}
                      onChange={(e) =>
                        setRecordForm({ ...recordForm, diagnosis_label: e.target.value })
                      }
                    />
                  </div>

                  <hr className="section-divider" />
                  <h4 style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 6 }}>
                    <Activity size={16} color="var(--teal)" /> Patient Vital Signs (Optional)
                  </h4>
                  <div className="grid-3">
                    <div className="field">
                      <label>BP systolic (mmHg)</label>
                      <input
                        type="number"
                        placeholder="120"
                        value={recordForm.bp_systolic}
                        onChange={(e) =>
                          setRecordForm({ ...recordForm, bp_systolic: e.target.value })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>BP diastolic (mmHg)</label>
                      <input
                        type="number"
                        placeholder="80"
                        value={recordForm.bp_diastolic}
                        onChange={(e) =>
                          setRecordForm({ ...recordForm, bp_diastolic: e.target.value })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Temperature (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="36.8"
                        value={recordForm.temperature_c}
                        onChange={(e) =>
                          setRecordForm({ ...recordForm, temperature_c: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid-3">
                    <div className="field">
                      <label>Pulse rate (bpm)</label>
                      <input
                        type="number"
                        placeholder="72"
                        value={recordForm.pulse_bpm}
                        onChange={(e) =>
                          setRecordForm({ ...recordForm, pulse_bpm: e.target.value })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Respiratory rate (/min)</label>
                      <input
                        type="number"
                        placeholder="16"
                        value={recordForm.respiratory_rate}
                        onChange={(e) =>
                          setRecordForm({ ...recordForm, respiratory_rate: e.target.value })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Body weight (kg)</label>
                      <input
                        type="number"
                        step="0.1"
                        placeholder="70"
                        value={recordForm.weight_kg}
                        onChange={(e) =>
                          setRecordForm({ ...recordForm, weight_kg: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="field" style={{ maxWidth: 180 }}>
                    <label>Height (cm)</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="170"
                      value={recordForm.height_cm}
                      onChange={(e) =>
                        setRecordForm({ ...recordForm, height_cm: e.target.value })
                      }
                    />
                  </div>

                  <hr className="section-divider" />
                  <div className="field required">
                    <label>Clinical Report & Examination Notes</label>
                    <textarea
                      rows={4}
                      required
                      placeholder="Examination, treatment plan, prescriptions, and visit progress notes…"
                      value={recordForm.report}
                      onChange={(e) => setRecordForm({ ...recordForm, report: e.target.value })}
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn small" type="submit">
                      Save Clinical Report
                    </button>
                    <button
                      type="button"
                      className="btn ghost small"
                      onClick={() => setShowNewRecord(false)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Edit Report Modal / Inline Form */}
            {editingRecord && (
              <div
                className="panel"
                style={{
                  background: 'var(--paper-dim)',
                  borderColor: 'var(--teal)',
                  boxShadow: 'var(--shadow-lift)',
                  marginBottom: 18,
                }}
              >
                <div className="flex-between" style={{ marginBottom: 10 }}>
                  <strong style={{ color: 'var(--navy-deep)' }}>Edit Clinical Report #{editingRecord.id}</strong>
                  <button
                    type="button"
                    className="btn ghost small"
                    onClick={() => setEditingRecord(null)}
                  >
                    ✕ Cancel
                  </button>
                </div>
                <form onSubmit={handleSaveRecordEdit}>
                  <div className="grid-2">
                    <div className="field">
                      <label>Diagnosis Code</label>
                      <input
                        value={editingRecord.diagnosis_code || ''}
                        onChange={(e) =>
                          setEditingRecord({ ...editingRecord, diagnosis_code: e.target.value })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Diagnosis Label</label>
                      <input
                        value={editingRecord.diagnosis_label || ''}
                        onChange={(e) =>
                          setEditingRecord({ ...editingRecord, diagnosis_label: e.target.value })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid-3">
                    <div className="field">
                      <label>BP Systolic</label>
                      <input
                        type="number"
                        value={editingRecord.bp_systolic ?? ''}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            bp_systolic: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>BP Diastolic</label>
                      <input
                        type="number"
                        value={editingRecord.bp_diastolic ?? ''}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            bp_diastolic: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </div>
                    <div className="field">
                      <label>Temperature (°C)</label>
                      <input
                        type="number"
                        step="0.1"
                        value={editingRecord.temperature_c ?? ''}
                        onChange={(e) =>
                          setEditingRecord({
                            ...editingRecord,
                            temperature_c: e.target.value ? Number(e.target.value) : undefined,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="field required">
                    <label>Report Content</label>
                    <textarea
                      rows={5}
                      required
                      value={editingRecord.report}
                      onChange={(e) =>
                        setEditingRecord({ ...editingRecord, report: e.target.value })
                      }
                    />
                  </div>
                  <div style={{ display: 'flex', gap: 10 }}>
                    <button className="btn small" type="submit">
                      Save Updated Report
                    </button>
                    <button
                      type="button"
                      className="btn ghost small"
                      onClick={() => setEditingRecord(null)}
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            <div style={{ marginTop: 14 }}>
              {records.length ? (
                records.map((r) => {
                  return (
                    <div
                      key={r.id}
                      className="panel"
                      style={{
                        boxShadow: 'none',
                        borderColor: 'var(--line)',
                        marginBottom: 14,
                        borderLeft: '4px solid var(--rust)',
                      }}
                    >
                      <div className="flex-between" style={{ marginBottom: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <strong>{r.author_name || 'Health Officer'}</strong>
                          <span style={{ fontSize: '.72rem', color: 'var(--ink-soft)' }}>
                            ({r.author_email || 'officer@wayfind.org'})
                          </span>
                        </div>
                        <span style={{ fontSize: '.78rem', color: 'var(--ink-soft)' }}>
                          {fmtDateTime(r.created_at)}
                        </span>
                      </div>

                      {r.diagnosis_label && (
                        <div
                          className="chip status-checked-in"
                          style={{ marginBottom: 10 }}
                        >
                          {r.diagnosis_code ? `${r.diagnosis_code} · ` : ''}
                          {r.diagnosis_label}
                        </div>
                      )}

                      {/* Graphical vitals strip */}
                      {(r.bp_systolic || r.temperature_c || r.pulse_bpm || r.weight_kg) && (
                        <div
                          style={{
                            display: 'flex',
                            gap: 12,
                            flexWrap: 'wrap',
                            background: 'var(--paper-dim)',
                            padding: '8px 12px',
                            borderRadius: 4,
                            marginBottom: 10,
                            fontSize: '.82rem',
                          }}
                        >
                          {r.bp_systolic && r.bp_diastolic && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Heart size={13} color="var(--rust)" />
                              <strong>BP:</strong> {r.bp_systolic}/{r.bp_diastolic} mmHg
                            </span>
                          )}
                          {r.pulse_bpm && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Activity size={13} color="var(--teal)" />
                              <strong>Pulse:</strong> {r.pulse_bpm} bpm
                            </span>
                          )}
                          {r.temperature_c && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Thermometer size={13} color="var(--manila-dark)" />
                              <strong>Temp:</strong> {r.temperature_c}°C
                            </span>
                          )}
                          {r.weight_kg && (
                            <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                              <Scale size={13} />
                              <strong>Weight:</strong> {r.weight_kg} kg
                            </span>
                          )}
                        </div>
                      )}

                      <p style={{ whiteSpace: 'pre-wrap', margin: '8px 0' }}>{r.report}</p>

                      <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 8 }}>
                        <button
                          type="button"
                          className="btn ghost small"
                          onClick={() => setEditingRecord(r)}
                        >
                          <Edit size={13} /> Edit Report & Vitals
                        </button>
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="empty-state">No doctor's reports recorded yet.</div>
              )}
            </div>
          </div>
        )}

        {/* Tab 4: EHR / FHIR */}
        {isOfficer && activeTab === 'fhir' && (
          <div>
            <p style={{ color: 'var(--ink-soft)' }}>
              This folder is mapped to standards-based HL7 FHIR R4 resources (Patient, Encounter,
              Condition, Observation) for seamless digital health interoperability with external EHR/EMR systems.
            </p>

            <div className="field">
              <label>FHIR Resource Endpoint Identifier</label>
              <input readOnly className="mono" value={`Patient/${patient.id} (System: urn:hospital:mrn, Value: ${patient.mrn})`} />
            </div>

            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 20 }}>
              <button
                type="button"
                className="btn secondary small"
                onClick={() =>
                  setFhirJsonPreview({
                    title: `FHIR Patient Resource — ${patient.first_name} ${patient.last_name}`,
                    json: patientToFhir(patient),
                  })
                }
              >
                View Patient FHIR JSON
              </button>
              {records.length > 0 && (
                <>
                  <button
                    type="button"
                    className="btn ghost small"
                    onClick={() =>
                      setFhirJsonPreview({
                        title: `FHIR Encounters (${records.length})`,
                        json: records.map(encounterToFhir),
                      })
                    }
                  >
                    View Encounters ({records.length})
                  </button>
                  <button
                    type="button"
                    className="btn ghost small"
                    onClick={() =>
                      setFhirJsonPreview({
                        title: `FHIR Conditions (${records.length})`,
                        json: records.map(conditionToFhir),
                      })
                    }
                  >
                    View Conditions ({records.length})
                  </button>
                  <button
                    type="button"
                    className="btn ghost small"
                    onClick={() =>
                      setFhirJsonPreview({
                        title: 'FHIR Observations (Vitals)',
                        json: records.flatMap(observationsFromRecord),
                      })
                    }
                  >
                    View Observations
                  </button>
                </>
              )}
            </div>

            {fhirJsonPreview && (
              <div
                className="panel"
                style={{
                  background: 'var(--navy-deep)',
                  color: '#A9DC76',
                  boxShadow: 'none',
                }}
              >
                <div className="flex-between" style={{ marginBottom: 10 }}>
                  <strong style={{ color: '#fff', fontSize: '.9rem' }}>
                    {fhirJsonPreview.title}
                  </strong>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      type="button"
                      className="btn small"
                      style={{ background: 'var(--navy)', color: '#fff' }}
                      onClick={() => copyToClipboard(JSON.stringify(fhirJsonPreview.json, null, 2))}
                    >
                      <Copy size={13} /> Copy JSON
                    </button>
                    <button
                      type="button"
                      className="btn small"
                      style={{ background: 'rgba(255,255,255,0.1)', color: '#fff' }}
                      onClick={() => setFhirJsonPreview(null)}
                    >
                      ✕ Close
                    </button>
                  </div>
                </div>
                <pre
                  className="mono"
                  style={{
                    margin: 0,
                    fontSize: '.8rem',
                    overflowX: 'auto',
                    maxHeight: 400,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {JSON.stringify(fhirJsonPreview.json, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Tab 5: Activity Log */}
        {isOfficer && activeTab === 'activity' && (
          <div>
            <p className="helper-text">
              Every folder creation, access, doctor's report, and edit is logged for patient privacy and regulatory compliance.
            </p>
            <table>
              <thead>
                <tr>
                  <th>When</th>
                  <th>Officer / User</th>
                  <th>Action</th>
                  <th>Detail</th>
                </tr>
              </thead>
              <tbody>
                {activity.length ? (
                  activity.map((a) => (
                    <tr key={a.id}>
                      <td>{fmtDateTime(a.created_at)}</td>
                      <td>{a.actor_email || a.actor_role}</td>
                      <td>
                        <span style={{ textTransform: 'capitalize' }}>
                          {a.action.replace(/_/g, ' ')}
                        </span>
                      </td>
                      <td style={{ color: 'var(--ink-soft)', fontSize: '.85rem' }}>
                        {a.detail || '—'}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={4}>
                      <div className="empty-state">No activity logged yet for this folder.</div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
