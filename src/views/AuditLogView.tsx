import React, { useState, useEffect } from 'react';
import { hospitalStore } from '../store/hospitalStore';
import { AuditLogEntry } from '../types';
import { fmtDateTime } from '../utils/formatters';

interface AuditLogViewProps {
  onOpenPatient: (patientId: number) => void;
}

const ACTION_LABELS: Record<string, string> = {
  login: 'Logged in',
  create_patient: 'Opened folder',
  view_patient: 'Viewed folder',
  update_patient: 'Edited folder',
  create_medical_record: "Added doctor's report",
  update_medical_record: "Edited doctor's report",
  view_medical_records: "Viewed doctor's reports",
};

export const AuditLogView: React.FC<AuditLogViewProps> = ({ onOpenPatient }) => {
  const [activeTab, setActiveTab] = useState<'staff' | 'patients'>('staff');
  const [entries, setEntries] = useState<AuditLogEntry[]>(hospitalStore.getAuditLog());

  useEffect(() => {
    const update = () => setEntries(hospitalStore.getAuditLog());
    const unsub = hospitalStore.subscribe(update);
    return unsub;
  }, []);

  const staffEntries = entries.filter((a) => a.actor_role === 'officer');
  const patientEntries = entries.filter((a) => a.actor_role === 'patient');

  return (
    <div>
      <p className="helper-text">
        Every login, folder access, edit, and clinical report action is recorded here for accountability and to support data-protection compliance (NDPR/WHO digital health governance guidance). Most recent 200 entries.
      </p>

      <div className="view-tabs">
        <button
          type="button"
          className={`view-tab ${activeTab === 'staff' ? 'active' : ''}`}
          onClick={() => setActiveTab('staff')}
        >
          Staff Activity ({staffEntries.length})
        </button>
        <button
          type="button"
          className={`view-tab ${activeTab === 'patients' ? 'active' : ''}`}
          onClick={() => setActiveTab('patients')}
        >
          Patient Activity ({patientEntries.length})
        </button>
      </div>

      {activeTab === 'staff' && (
        <div className="panel" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Officer</th>
                <th>Action</th>
                <th>Resource</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {staffEntries.length ? (
                staffEntries.map((a) => (
                  <tr key={a.id}>
                    <td>{fmtDateTime(a.created_at)}</td>
                    <td>{a.actor_email || 'Health Officer'}</td>
                    <td>{ACTION_LABELS[a.action] || a.action.replace(/_/g, ' ')}</td>
                    <td>
                      {a.resource_type === 'Patient' && a.resource_id ? (
                        <a
                          style={{ cursor: 'pointer' }}
                          onClick={() => onOpenPatient(Number(a.resource_id))}
                        >
                          Patient #{a.resource_id}
                        </a>
                      ) : (
                        a.resource_type
                      )}
                    </td>
                    <td style={{ color: 'var(--ink-soft)', fontSize: '.85rem' }}>
                      {a.detail || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5}>
                    <div className="empty-state">No staff activity recorded yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {activeTab === 'patients' && (
        <div className="panel" style={{ padding: 0 }}>
          <table>
            <thead>
              <tr>
                <th>When</th>
                <th>Patient</th>
                <th>Action</th>
                <th>Detail</th>
              </tr>
            </thead>
            <tbody>
              {patientEntries.length ? (
                patientEntries.map((a) => (
                  <tr key={a.id}>
                    <td>{fmtDateTime(a.created_at)}</td>
                    <td>
                      {a.resource_id ? (
                        <a
                          style={{ cursor: 'pointer' }}
                          onClick={() => onOpenPatient(Number(a.resource_id))}
                        >
                          Patient #{a.resource_id}
                        </a>
                      ) : (
                        a.actor_email || 'Patient'
                      )}
                    </td>
                    <td>{ACTION_LABELS[a.action] || a.action.replace(/_/g, ' ')}</td>
                    <td style={{ color: 'var(--ink-soft)', fontSize: '.85rem' }}>
                      {a.detail || '—'}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={4}>
                    <div className="empty-state">No patient activity recorded yet.</div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};
