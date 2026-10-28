import React, { useState, useEffect } from 'react';
import { hospitalStore } from '../store/hospitalStore';
import { Patient } from '../types';
import { fmtDate } from '../utils/formatters';
import { deptColor, DEPARTMENTS } from '../constants';
import { Search, FolderPlus, Filter, Users } from 'lucide-react';

interface PatientRegistryViewProps {
  onOpenPatient: (patientId: number) => void;
  onOpenNewFolder: () => void;
}

export const PatientRegistryView: React.FC<PatientRegistryViewProps> = ({
  onOpenPatient,
  onOpenNewFolder,
}) => {
  const [query, setQuery] = useState('');
  const [deptFilter, setDeptFilter] = useState('');
  const [patients, setPatients] = useState<Patient[]>(hospitalStore.listPatients('', ''));

  useEffect(() => {
    const update = () => setPatients(hospitalStore.listPatients(query, deptFilter));
    update();
    const unsub = hospitalStore.subscribe(update);
    return unsub;
  }, [query, deptFilter]);

  const monthLabel = (iso: string) => {
    const d = new Date(iso.slice(0, 10) + 'T00:00:00');
    if (isNaN(d.getTime())) return 'Archive';
    return d.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
  };

  // Group patients by month
  const groupedPatients: { group: string; items: Patient[] }[] = [];
  let currentGroup = '';
  let currentItems: Patient[] = [];

  for (const p of patients) {
    const group = monthLabel(p.created_at);
    if (group !== currentGroup) {
      if (currentItems.length > 0) {
        groupedPatients.push({ group: currentGroup, items: currentItems });
      }
      currentGroup = group;
      currentItems = [p];
    } else {
      currentItems.push(p);
    }
  }
  if (currentItems.length > 0) {
    groupedPatients.push({ group: currentGroup, items: currentItems });
  }

  return (
    <div>
      <div className="searchbar" style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 240 }}>
          <Search
            size={17}
            style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--ink-soft)' }}
          />
          <input
            type="text"
            style={{ paddingLeft: 40 }}
            placeholder="Search by patient name, MRN, phone, or condition…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
          />
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <select
            value={deptFilter}
            onChange={(e) => setDeptFilter(e.target.value)}
            style={{ padding: '11px 14px', borderRadius: 3, border: '1px solid var(--line)', background: '#fff', fontSize: '.92rem' }}
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>

        <button
          type="button"
          className="btn"
          onClick={onOpenNewFolder}
        >
          <FolderPlus size={16} /> Open New Folder
        </button>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0 4px 10px', fontSize: '.82rem', color: 'var(--ink-soft)' }}>
        <span>Showing <strong>{patients.length}</strong> patient folders</span>
        {(query || deptFilter) && (
          <button
            type="button"
            className="btn ghost small"
            onClick={() => {
              setQuery('');
              setDeptFilter('');
            }}
          >
            Clear filters
          </button>
        )}
      </div>

      <div className="panel" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>MRN</th>
              <th>Patient</th>
              <th>Age</th>
              <th>Sex</th>
              <th>Department</th>
              <th>Phone</th>
              <th>Folder opened</th>
            </tr>
          </thead>
          <tbody>
            {groupedPatients.length > 0 ? (
              groupedPatients.map((groupObj) => (
                <React.Fragment key={groupObj.group}>
                  <tr className="month-group-row">
                    <td colSpan={7} className="month-group-header">
                      {groupObj.group}
                    </td>
                  </tr>
                  {groupObj.items.map((p) => (
                    <tr
                      key={p.id}
                      className="row-link"
                      onClick={() => onOpenPatient(p.id)}
                    >
                      <td className="mono">{p.mrn}</td>
                      <td>
                        <strong>
                          {p.first_name} {p.last_name}
                        </strong>
                      </td>
                      <td>{p.age ? `${p.age}y` : '—'}</td>
                      <td>{p.sex ?? '—'}</td>
                      <td>
                        <span
                          className="dept-swatch"
                          style={{ background: deptColor(p.department) }}
                        />
                        {p.department}
                      </td>
                      <td>{p.phone || '—'}</td>
                      <td>{fmtDate(p.created_at)}</td>
                    </tr>
                  ))}
                </React.Fragment>
              ))
            ) : (
              <tr>
                <td colSpan={7}>
                  <div className="empty-state">
                    <h3>No matching folders found</h3>
                    <p>Try searching with another name or phone number, or clear filters.</p>
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
