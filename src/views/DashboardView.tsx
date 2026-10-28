import React, { useState, useEffect } from 'react';
import { hospitalStore } from '../store/hospitalStore';
import { DashboardStats, Appointment, Patient, ActivityTrendDay } from '../types';
import { fmtDate, fmtTime } from '../utils/formatters';
import { deptColor } from '../constants';
import {
  FolderPlus,
  CalendarCheck,
  Users,
  Clock,
  Printer,
  ChevronRight,
  TrendingUp,
  Building2,
  Stethoscope,
  Activity,
  BarChart3,
  Calendar,
} from 'lucide-react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface DashboardViewProps {
  onOpenPatient: (patientId: number) => void;
  onOpenRegistry: () => void;
  onOpenAppointments: () => void;
  onOpenNewFolder: () => void;
  onOpenCard: (appointment: Appointment) => void;
}

const CustomTrendTooltip = ({ active, payload }: any) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload as ActivityTrendDay;
    return (
      <div
        style={{
          backgroundColor: '#FFFFFF',
          border: '1px solid var(--line)',
          borderRadius: 6,
          padding: '10px 14px',
          boxShadow: '0 6px 18px rgba(22, 41, 63, 0.14)',
          fontSize: '0.85rem',
          minWidth: 190,
          color: 'var(--ink)',
        }}
      >
        <div
          style={{
            fontWeight: 600,
            color: 'var(--navy-deep)',
            marginBottom: 4,
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
          }}
        >
          <span>{data.dayLabel}</span>
          {data.isToday && (
            <span
              style={{
                fontSize: '0.68rem',
                padding: '2px 7px',
                background: 'var(--teal-light)',
                color: 'var(--teal)',
                borderRadius: 10,
                fontWeight: 700,
                letterSpacing: '.03em',
              }}
            >
              TODAY
            </span>
          )}
        </div>
        <div style={{ color: 'var(--ink-soft)', fontSize: '0.75rem', marginBottom: 8 }} className="mono">
          {data.date}
        </div>
        <div
          style={{
            borderTop: '1px solid var(--line)',
            paddingTop: 8,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              fontWeight: 700,
              paddingBottom: 4,
              borderBottom: '1px dashed var(--line)',
            }}
          >
            <span style={{ color: 'var(--navy-deep)' }}>Total Appointments:</span>
            <span className="mono" style={{ fontSize: '1rem', color: 'var(--teal)' }}>
              {data.total}
            </span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--teal)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--teal)' }} />
              Completed
            </span>
            <span className="mono font-semibold">{data.completed}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--navy)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--navy)' }} />
              Checked-in
            </span>
            <span className="mono font-semibold">{data.checkedIn}</span>
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '.8rem' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 6, color: 'var(--rust)' }}>
              <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--rust)' }} />
              Scheduled
            </span>
            <span className="mono font-semibold">{data.scheduled}</span>
          </div>
        </div>
      </div>
    );
  }
  return null;
};

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenPatient,
  onOpenRegistry,
  onOpenAppointments,
  onOpenNewFolder,
  onOpenCard,
}) => {
  const [stats, setStats] = useState<DashboardStats>(hospitalStore.getDashboardStats());
  const [chartMode, setChartMode] = useState<'area' | 'bar'>('area');

  useEffect(() => {
    const update = () => setStats(hospitalStore.getDashboardStats());
    const unsub = hospitalStore.subscribe(update);
    return unsub;
  }, []);

  const totalPatients = Math.max(stats.total_patients, 1);
  const trendData = stats.activity_trend || [];

  return (
    <div>
      {/* Stat Cards Row */}
      <div className="stat-row">
        <div className="stat-card" style={{ cursor: 'pointer' }} onClick={onOpenRegistry}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="num tabular-nums">{stats.total_patients}</div>
            <Users size={20} color="var(--manila-dark)" />
          </div>
          <div className="label">Patient folders on file</div>
        </div>

        <div className="stat-card accent-teal" style={{ cursor: 'pointer' }} onClick={onOpenAppointments}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="num tabular-nums">{stats.today_appointments}</div>
            <Clock size={20} color="var(--teal)" />
          </div>
          <div className="label">Appointments today</div>
        </div>

        <div className="stat-card accent-rust" style={{ cursor: 'pointer' }} onClick={onOpenAppointments}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div className="num tabular-nums">{stats.upcoming_appointments}</div>
            <CalendarCheck size={20} color="var(--rust)" />
          </div>
          <div className="label">Upcoming (scheduled)</div>
        </div>
      </div>

      {/* Visual Activity Trend Chart (Recharts) */}
      <div className="panel" style={{ padding: '20px 24px', marginBottom: 22 }}>
        <div className="flex-between" style={{ marginBottom: 16, flexWrap: 'wrap', gap: 12 }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <TrendingUp size={20} color="var(--teal)" />
              <h2 style={{ margin: 0, fontSize: '1.25rem' }}>Appointment Volumes (Last 7 Days)</h2>
              <span
                className="chip"
                style={{
                  fontSize: '.72rem',
                  background: 'var(--teal-light)',
                  color: 'var(--teal)',
                  fontWeight: 600,
                  marginLeft: 4,
                }}
              >
                7-Day Activity
              </span>
            </div>
            <p style={{ margin: '4px 0 0', color: 'var(--ink-soft)', fontSize: '.84rem' }}>
              Daily appointment volumes and clinical attendance across all hospital departments
            </p>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* View Mode Toggle: Area vs Stacked Bar */}
            <div
              style={{
                display: 'inline-flex',
                background: 'var(--paper-dim)',
                padding: 3,
                borderRadius: 4,
                border: '1px solid var(--line)',
              }}
            >
              <button
                type="button"
                onClick={() => setChartMode('area')}
                style={{
                  border: 'none',
                  background: chartMode === 'area' ? '#ffffff' : 'transparent',
                  color: chartMode === 'area' ? 'var(--navy-deep)' : 'var(--ink-soft)',
                  fontWeight: chartMode === 'area' ? 600 : 500,
                  padding: '4px 10px',
                  borderRadius: 3,
                  fontSize: '.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  boxShadow: chartMode === 'area' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all .15s ease',
                }}
              >
                <Activity size={13} /> Area Trend
              </button>
              <button
                type="button"
                onClick={() => setChartMode('bar')}
                style={{
                  border: 'none',
                  background: chartMode === 'bar' ? '#ffffff' : 'transparent',
                  color: chartMode === 'bar' ? 'var(--navy-deep)' : 'var(--ink-soft)',
                  fontWeight: chartMode === 'bar' ? 600 : 500,
                  padding: '4px 10px',
                  borderRadius: 3,
                  fontSize: '.78rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 5,
                  boxShadow: chartMode === 'bar' ? '0 1px 3px rgba(0,0,0,0.08)' : 'none',
                  transition: 'all .15s ease',
                }}
              >
                <BarChart3 size={13} /> Stacked Status
              </button>
            </div>

            <button
              type="button"
              className="btn ghost small"
              onClick={onOpenAppointments}
              style={{ fontSize: '.8rem', padding: '5px 12px' }}
            >
              All Appointments →
            </button>
          </div>
        </div>

        {/* Quick KPI Stat Strip */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))',
            gap: 12,
            padding: '10px 16px',
            background: 'var(--paper-dim)',
            borderRadius: 4,
            marginBottom: 16,
            border: '1px solid var(--line)',
          }}
        >
          <div>
            <div style={{ fontSize: '.72rem', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              7-Day Volume
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--navy-deep)' }} className="mono tabular-nums">
              {stats.seven_day_total ?? 0}{' '}
              <span style={{ fontSize: '.75rem', fontWeight: 400, color: 'var(--ink-soft)' }}>total visits</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '.72rem', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Daily Average
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--teal)' }} className="mono tabular-nums">
              {stats.seven_day_average ?? 0}{' '}
              <span style={{ fontSize: '.75rem', fontWeight: 400, color: 'var(--ink-soft)' }}>/ day</span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '.72rem', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Busiest Day
            </div>
            <div style={{ fontSize: '1.05rem', fontWeight: 600, color: 'var(--navy)' }}>
              {stats.peak_day?.label || '—'}{' '}
              <span className="mono" style={{ fontSize: '.85rem', color: 'var(--rust)', fontWeight: 700 }}>
                ({stats.peak_day?.count ?? 0})
              </span>
            </div>
          </div>
          <div>
            <div style={{ fontSize: '.72rem', color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.04em' }}>
              Today's Schedule
            </div>
            <div style={{ fontSize: '1.25rem', fontWeight: 700, color: 'var(--rust)' }} className="mono tabular-nums">
              {stats.today_appointments}{' '}
              <span style={{ fontSize: '.75rem', fontWeight: 400, color: 'var(--ink-soft)' }}>booked</span>
            </div>
          </div>
        </div>

        {/* Recharts Container */}
        <div style={{ width: '100%', height: 260, minHeight: 260, position: 'relative' }}>
          <ResponsiveContainer width="100%" height={260}>
            {chartMode === 'area' ? (
              <AreaChart data={trendData} margin={{ top: 12, right: 15, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="trendTealGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3D6E63" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#3D6E63" stopOpacity={0.02} />
                  </linearGradient>
                  <linearGradient id="trendNavyGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#1E3A5F" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#1E3A5F" stopOpacity={0.01} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#D8CFB8" vertical={false} opacity={0.6} />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fontSize: 11, fill: '#6B6357' }}
                  axisLine={{ stroke: '#D8CFB8' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#6B6357' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTrendTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
                />
                <Area
                  type="monotone"
                  dataKey="total"
                  name="Total Appointments"
                  stroke="#3D6E63"
                  strokeWidth={2.5}
                  fill="url(#trendTealGrad)"
                  dot={{ r: 4, stroke: '#3D6E63', strokeWidth: 2, fill: '#FFFFFF' }}
                  activeDot={{ r: 6, stroke: '#16293F', strokeWidth: 2, fill: '#3D6E63' }}
                />
                <Area
                  type="monotone"
                  dataKey="completed"
                  name="Completed"
                  stroke="#1E3A5F"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  fill="url(#trendNavyGrad)"
                  dot={{ r: 3, fill: '#1E3A5F' }}
                />
              </AreaChart>
            ) : (
              <BarChart data={trendData} margin={{ top: 12, right: 15, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#D8CFB8" vertical={false} opacity={0.6} />
                <XAxis
                  dataKey="dayLabel"
                  tick={{ fontSize: 11, fill: '#6B6357' }}
                  axisLine={{ stroke: '#D8CFB8' }}
                  tickLine={false}
                />
                <YAxis
                  allowDecimals={false}
                  tick={{ fontSize: 11, fill: '#6B6357' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip content={<CustomTrendTooltip />} />
                <Legend
                  verticalAlign="top"
                  align="right"
                  wrapperStyle={{ fontSize: '12px', paddingBottom: '10px' }}
                />
                <Bar dataKey="completed" name="Completed" stackId="status" fill="#3D6E63" radius={[0, 0, 0, 0]} />
                <Bar dataKey="checkedIn" name="Checked-in" stackId="status" fill="#1E3A5F" radius={[0, 0, 0, 0]} />
                <Bar dataKey="scheduled" name="Scheduled" stackId="status" fill="#B5482F" radius={[3, 3, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* 7-Day Day Ticker / Summary Badges */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(7, 1fr)',
            gap: 8,
            marginTop: 14,
            paddingTop: 12,
            borderTop: '1px solid var(--line)',
          }}
        >
          {trendData.map((day) => (
            <div
              key={day.date}
              style={{
                textAlign: 'center',
                padding: '8px 4px',
                borderRadius: 4,
                background: day.isToday ? 'var(--teal-light)' : 'transparent',
                border: day.isToday ? '1px solid var(--teal)' : '1px solid var(--line)',
                transition: 'all .15s ease',
              }}
            >
              <div
                style={{
                  fontSize: '.74rem',
                  fontWeight: day.isToday ? 700 : 600,
                  color: day.isToday ? 'var(--teal)' : 'var(--ink-soft)',
                }}
              >
                {day.isToday ? 'Today' : day.shortDay}
              </div>
              <div style={{ fontSize: '.68rem', color: 'var(--ink-soft)', marginBottom: 2 }}>
                {day.monthDay}
              </div>
              <div
                className="mono tabular-nums"
                style={{
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: day.isToday ? 'var(--teal)' : 'var(--navy-deep)',
                }}
              >
                {day.total}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Graphical Department Volume Distribution Widget */}
      <div className="panel" style={{ padding: '20px 24px', marginBottom: 22 }}>
        <div className="flex-between" style={{ marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Building2 size={18} color="var(--navy)" />
            <h3 style={{ margin: 0 }}>Active Clinical Departments</h3>
          </div>
          <span style={{ fontSize: '.76rem', color: 'var(--ink-soft)' }}>
            Patient intake distribution
          </span>
        </div>

        {/* Visual Multi-segment Bar */}
        <div
          style={{
            display: 'flex',
            height: 12,
            borderRadius: 6,
            overflow: 'hidden',
            backgroundColor: 'var(--paper-dim)',
            marginBottom: 16,
          }}
        >
          {stats.departments.map((d) => {
            const pct = Math.round((d.c / totalPatients) * 100);
            return (
              <div
                key={d.department}
                style={{
                  width: `${pct}%`,
                  backgroundColor: deptColor(d.department),
                  minWidth: d.c > 0 ? 8 : 0,
                  transition: 'width .3s ease',
                }}
                title={`${d.department}: ${d.c} folders (${pct}%)`}
              />
            );
          })}
        </div>

        {/* Legend grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: '8px 14px' }}>
          {stats.departments.map((d) => (
            <div
              key={d.department}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                fontSize: '.8rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <span className="dept-swatch" style={{ background: deptColor(d.department), margin: 0 }} />
                <span style={{ color: 'var(--ink)' }}>{d.department}</span>
              </div>
              <span className="mono tabular-nums" style={{ color: 'var(--ink-soft)', fontWeight: 600 }}>
                {d.c}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Today's Schedule Panel */}
      <div className="panel">
        <div className="flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <CalendarCheck size={18} color="var(--teal)" />
            <h2>Today's Schedule</h2>
          </div>
          <button
            type="button"
            className="btn ghost small"
            onClick={onOpenAppointments}
          >
            View all appointments →
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>Time</th>
              <th>Department</th>
              <th>Patient</th>
              <th>Provider</th>
              <th>Status</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stats.todays_schedule.length ? (
              stats.todays_schedule.map((a) => (
                <tr
                  key={a.id}
                  className="row-link"
                  onClick={() => onOpenPatient(a.patient_id)}
                >
                  <td className="mono tabular-nums">{fmtTime(a.time)}</td>
                  <td>
                    <span
                      className="dept-swatch"
                      style={{ background: deptColor(a.department) }}
                    />
                    {a.department}
                  </td>
                  <td>
                    <strong>
                      {a.first_name} {a.last_name}
                    </strong>{' '}
                    <span className="mono" style={{ color: 'var(--ink-soft)', fontSize: '.78rem' }}>
                      {a.mrn}
                    </span>
                  </td>
                  <td>{a.provider_name}</td>
                  <td>
                    <span className={`chip status-${a.status}`}>
                      {a.status.replace('-', ' ')}
                    </span>
                  </td>
                  <td className="no-print" style={{ textAlign: 'right' }} onClick={(e) => e.stopPropagation()}>
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
                  <div className="empty-state">
                    <h3>No appointments booked for today</h3>
                    <p>New appointments scheduled for today will automatically appear here.</p>
                  </div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Recently Opened Folders Panel */}
      <div className="panel">
        <div className="flex-between">
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Users size={18} color="var(--manila-dark)" />
            <h2>Recently Opened Folders</h2>
          </div>
          <button
            type="button"
            className="btn ghost small"
            onClick={onOpenRegistry}
          >
            View registry →
          </button>
        </div>
        <table>
          <thead>
            <tr>
              <th>MRN</th>
              <th>Patient</th>
              <th>Department</th>
              <th>Phone</th>
              <th>Opened</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {stats.recent_patients.length ? (
              stats.recent_patients.map((p) => (
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
                  <td>
                    <span
                      className="dept-swatch"
                      style={{ background: deptColor(p.department) }}
                    />
                    {p.department}
                  </td>
                  <td>{p.phone || '—'}</td>
                  <td>{fmtDate(p.created_at)}</td>
                  <td style={{ textAlign: 'right' }}>
                    <span style={{ color: 'var(--teal)', fontSize: '.85rem' }}>Open →</span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={6}>
                  <div className="empty-state">No patients registered yet.</div>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
