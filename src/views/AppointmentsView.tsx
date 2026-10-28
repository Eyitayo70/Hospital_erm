import React, { useState, useEffect } from 'react';
import { hospitalStore } from '../store/hospitalStore';
import { Appointment, Patient, AppointmentStatus } from '../types';
import { fmtDate, fmtTime, todayDateStr } from '../utils/formatters';
import { deptColor, STATUS_OPTIONS, DEPARTMENTS } from '../constants';
import { useToast } from '../components/Toast';
import { Calendar, Clock, Printer, Plus, Filter, CheckCircle2 } from 'lucide-react';

interface AppointmentsViewProps {
  onOpenPatient: (patientId: number) => void;
  onOpenCard: (appointment: Appointment) => void;
}

export const AppointmentsView: React.FC<AppointmentsViewProps> = ({
  onOpenPatient,
  onOpenCard,
}) => {
  const { toast } = useToast();
  const [dateFilter, setDateFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [deptFilter, setDeptFilter] = useState<string>('');
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [showNewPanel, setShowNewPanel] = useState(false);

  const [form, setForm] = useState({
    patient_id: '',
    date: todayDateStr(),
    time: '09:00',
    department: 'General',
    provider_name: '',
    location: '',
    reason: '',
  });

  const loadData = () => {
    setAppointments(
      hospitalStore.listAppointments({
        date: dateFilter || undefined,
        status: (statusFilter as AppointmentStatus) || undefined,
        department: deptFilter || undefined,
      })
    );
    setPatients(hospitalStore.listPatients(''));
  };

  useEffect(() => {
    loadData();
    const unsub = hospitalStore.subscribe(loadData);
    return unsub;
  }, [dateFilter, statusFilter, deptFilter]);

  const handleCreateAppointment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.patient_id) {
      toast('Please select a patient', true);
      return;
    }
    try {
      hospitalStore.createAppointment({
        patient_id: Number(form.patient_id),
        date: form.date,
        time: form.time,
        department: form.department as any,
        provider_name: form.provider_name.trim(),
        location: form.location.trim() || undefined,
        reason: form.reason.trim() || undefined,
        status: 'scheduled',
      });
      toast('Appointment booked');
      setShowNewPanel(false);
      setForm({
        patient_id: '',
        date: todayDateStr(),
        time: '09:00',
        department: 'General',
        provider_name: '',
        location: '',
        reason: '',
      });
    } catch (err: any) {
      toast(err.message || 'Failed to book appointment', true);
    }
  };

  const handleStatusChange = (aid: number, newStatus: string) => {
    try {
      hospitalStore.updateAppointment(aid, { status: newStatus as AppointmentStatus });
      toast('Status updated');
    } catch (err: any) {
      toast(err.message || 'Failed to update status', true);
    }
  };

  const setQuickFilter = (type: 'all' | 'today' | 'upcoming') => {
    if (type === 'all') {
      setDateFilter('');
      setStatusFilter('');
    } else if (type === 'today') {
      setDateFilter(todayDateStr());
      setStatusFilter('');
    } else if (type === 'upcoming') {
      setDateFilter('');
      setStatusFilter('scheduled');
    }
  };

  return (
    <div>
      {/* Top bar with quick filters and new booking button */}
      <div className="flex-between" style={{ marginBottom: 18 }}>
        <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
          <button
            type="button"
            className={`btn small ${!dateFilter && !statusFilter ? 'secondary' : 'ghost'}`}
            onClick={() => setQuickFilter('all')}
          >
            All Visits
          </button>
          <button
            type="button"
            className={`btn small ${dateFilter === todayDateStr() ? 'secondary' : 'ghost'}`}
            onClick={() => setQuickFilter('today')}
          >
            Today's Visits
          </button>
          <button
            type="button"
            className={`btn small ${statusFilter === 'scheduled' ? 'secondary' : 'ghost'}`}
            onClick={() => setQuickFilter('upcoming')}
          >
            Scheduled Only
          </button>
        </div>

        <button
          type="button"
          className="btn"
          onClick={() => setShowNewPanel(!showNewPanel)}
        >
          <Plus size={16} /> {showNewPanel ? 'Cancel Booking' : 'Schedule Appointment'}
        </button>
      </div>

      {showNewPanel && (
        <div className="panel" style={{ marginBottom: 22, border: '2px solid var(--teal)' }}>
          <h3 style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Calendar size={18} color="var(--teal)" /> Schedule a Hospital Appointment
          </h3>
          <form onSubmit={handleCreateAppointment}>
            <div className="field required">
              <label>Patient Folder</label>
              <select
                required
                value={form.patient_id}
                onChange={(e) => {
                  const pid = e.target.value;
                  const selectedP = patients.find((p) => p.id === Number(pid));
                  setForm({
                    ...form,
                    patient_id: pid,
                    department: selectedP?.department || form.department,
                  });
                }}
              >
                <option value="">Select a patient…</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.first_name} {p.last_name} — {p.mrn} ({p.department})
                  </option>
                ))}
              </select>
            </div>

            <div className="grid-3">
              <div className="field required">
                <label>Date</label>
                <input
                  type="date"
                  required
                  value={form.date}
                  onChange={(e) => setForm({ ...form, date: e.target.value })}
                />
              </div>
              <div className="field required">
                <label>Time</label>
                <input
                  type="time"
                  required
                  value={form.time}
                  onChange={(e) => setForm({ ...form, time: e.target.value })}
                />
              </div>
              <div className="field required">
                <label>Department</label>
                <select
                  required
                  value={form.department}
                  onChange={(e) => setForm({ ...form, department: e.target.value })}
                >
                  {DEPARTMENTS.map((dept) => (
                    <option key={dept} value={dept}>
                      {dept}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="grid-2">
              <div className="field required">
                <label>Provider (Doctor / Consultant)</label>
                <input
                  placeholder="Dr. Chidi Okafor"
                  required
                  value={form.provider_name}
                  onChange={(e) => setForm({ ...form, provider_name: e.target.value })}
                />
              </div>
              <div className="field">
                <label>Location / Room</label>
                <input
                  placeholder="Consulting Room 2, OPD Wing"
                  value={form.location}
                  onChange={(e) => setForm({ ...form, location: e.target.value })}
                />
              </div>
            </div>

            <div className="field">
              <label>Reason for visit</label>
              <input
                placeholder="Routine hypertension check, follow-up tests, ultrasound..."
                value={form.reason}
                onChange={(e) => setForm({ ...form, reason: e.target.value })}
              />
            </div>

            <div className="flex-between">
              <button
                type="button"
                className="btn ghost"
                onClick={() => setShowNewPanel(false)}
              >
                Cancel
              </button>
              <button className="btn" type="submit">
                Save & Book Appointment
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Filter panel */}
      <div className="panel" style={{ padding: '16px 20px', marginBottom: 20 }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, alignItems: 'end' }}>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Filter Date</label>
            <input
              type="date"
              value={dateFilter}
              onChange={(e) => setDateFilter(e.target.value)}
            />
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Filter Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All statuses</option>
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st.charAt(0).toUpperCase() + st.slice(1).replace('-', ' ')}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <label>Filter Department</label>
            <select
              value={deptFilter}
              onChange={(e) => setDeptFilter(e.target.value)}
            >
              <option value="">All departments</option>
              {DEPARTMENTS.map((d) => (
                <option key={d} value={d}>
                  {d}
                </option>
              ))}
            </select>
          </div>
          <div className="field" style={{ marginBottom: 0 }}>
            <button
              type="button"
              className="btn secondary"
              style={{ width: '100%' }}
              onClick={() => {
                setDateFilter('');
                setStatusFilter('');
                setDeptFilter('');
              }}
            >
              Clear filters
            </button>
          </div>
        </div>
      </div>

      {/* Appointments Table */}
      <div className="panel" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Time</th>
              <th>Patient</th>
              <th>Department</th>
              <th>Provider</th>
              <th>Status</th>
              <th style={{ textAlign: 'right' }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {appointments.length ? (
              appointments.map((a) => (
                <tr
                  key={a.id}
                  className="row-link"
                  onClick={() => onOpenPatient(a.patient_id)}
                >
                  <td className="mono tabular-nums">{fmtDate(a.date)}</td>
                  <td className="mono tabular-nums">{fmtTime(a.time)}</td>
                  <td>
                    <strong>
                      {a.first_name} {a.last_name}
                    </strong>{' '}
                    <span
                      className="mono"
                      style={{ color: 'var(--ink-soft)', fontSize: '.78rem' }}
                    >
                      {a.mrn}
                    </span>
                  </td>
                  <td>
                    <span
                      className="dept-swatch"
                      style={{ background: deptColor(a.department) }}
                    />
                    {a.department}
                  </td>
                  <td>{a.provider_name}</td>
                  <td onClick={(e) => e.stopPropagation()}>
                    <select
                      className="small"
                      style={{ width: 'auto', display: 'inline-block', padding: '4px 6px', fontSize: '.8rem' }}
                      value={a.status}
                      onChange={(e) => handleStatusChange(a.id, e.target.value)}
                    >
                      {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td
                    className="no-print"
                    style={{ textAlign: 'right' }}
                    onClick={(e) => e.stopPropagation()}
                  >
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
                <td colSpan={7}>
                  <div className="empty-state">
                    <h3>No appointments found</h3>
                    <p>Try clearing your filters or schedule a new appointment above.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
