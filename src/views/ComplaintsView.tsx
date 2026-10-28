import React, { useState, useEffect } from 'react';
import { hospitalStore } from '../store/hospitalStore';
import { Complaint, ComplaintStatus } from '../types';
import { fmtDate } from '../utils/formatters';
import { useToast } from '../components/Toast';

export const ComplaintsView: React.FC = () => {
  const { toast } = useToast();
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [responses, setResponses] = useState<Record<number, { status: ComplaintStatus; response: string }>>({});

  const loadData = () => {
    const list = hospitalStore.listComplaints((statusFilter as ComplaintStatus) || undefined);
    setComplaints(list);
    const initialMap: Record<number, { status: ComplaintStatus; response: string }> = {};
    for (const c of list) {
      initialMap[c.id] = { status: c.status, response: c.response || '' };
    }
    setResponses(initialMap);
  };

  useEffect(() => {
    loadData();
    const unsub = hospitalStore.subscribe(loadData);
    return unsub;
  }, [statusFilter]);

  const handleSaveResponse = (id: number) => {
    const current = responses[id];
    if (!current) return;
    try {
      hospitalStore.updateComplaint(id, {
        status: current.status,
        response: current.response.trim() || undefined,
      });
      toast('Complaint response saved');
    } catch (err: any) {
      toast(err.message || 'Failed to update complaint', true);
    }
  };

  return (
    <div>
      <div className="searchbar">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          style={{ maxWidth: 220 }}
        >
          <option value="">All statuses</option>
          <option value="open">Open</option>
          <option value="in-progress">In progress</option>
          <option value="resolved">Resolved</option>
        </select>
      </div>

      <div>
        {complaints.length ? (
          complaints.map((c) => {
            const formData = responses[c.id] || { status: c.status, response: c.response || '' };
            return (
              <div key={c.id} className="panel" style={{ marginBottom: 16 }}>
                <div className="flex-between">
                  <div>
                    <strong>
                      {c.first_name} {c.last_name}
                    </strong>
                    <span className="mono" style={{ color: 'var(--ink-soft)', fontSize: '.8rem' }}>
                      {' '}
                      · MRN {c.mrn}
                    </span>
                  </div>
                  <span style={{ fontSize: '.78rem', color: 'var(--ink-soft)' }}>
                    {fmtDate(c.created_at)}
                  </span>
                </div>

                <p style={{ margin: '12px 0', fontSize: '.95rem' }}>{c.message}</p>

                <div className="grid-2" style={{ background: 'var(--paper-dim)', padding: '12px 16px', borderRadius: 4 }}>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) =>
                        setResponses({
                          ...responses,
                          [c.id]: { ...formData, status: e.target.value as ComplaintStatus },
                        })
                      }
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In progress</option>
                      <option value="resolved">Resolved</option>
                    </select>
                  </div>
                  <div className="field" style={{ marginBottom: 0 }}>
                    <label>Response to Patient</label>
                    <input
                      placeholder="Write hospital response..."
                      value={formData.response}
                      onChange={(e) =>
                        setResponses({
                          ...responses,
                          [c.id]: { ...formData, response: e.target.value },
                        })
                      }
                    />
                  </div>
                </div>

                <div style={{ marginTop: 10, display: 'flex', justifyContent: 'flex-end' }}>
                  <button
                    type="button"
                    className="btn small"
                    onClick={() => handleSaveResponse(c.id)}
                  >
                    Save Status & Response
                  </button>
                </div>
              </div>
            );
          })
        ) : (
          <div className="panel empty-state">
            <h3>No complaints found</h3>
            <p>There are no complaints matching the selected filter.</p>
          </div>
        )}
      </div>
    </div>
  );
};
