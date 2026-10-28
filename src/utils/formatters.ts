import { Patient, Appointment, MedicalRecord } from '../types';
import { VITAL_LOINC } from '../constants';

export function fmtDate(iso?: string | null): string {
  if (!iso) return '—';
  const clean = iso.slice(0, 10);
  const d = new Date(clean + 'T00:00:00');
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

export function fmtDateTime(iso?: string | null): string {
  if (!iso) return '—';
  const d = new Date(iso.replace(' ', 'T'));
  if (isNaN(d.getTime())) return iso;
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export function fmtTime(hhmm?: string | null): string {
  if (!hhmm) return '—';
  const [hStr, mStr] = hhmm.split(':');
  const h = Number(hStr);
  const m = Number(mStr);
  if (isNaN(h) || isNaN(m)) return hhmm;
  const period = h >= 12 ? 'PM' : 'AM';
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, '0')} ${period}`;
}

export function initials(first?: string, last?: string): string {
  return `${(first || '?')[0]}${(last || '?')[0]}`.toUpperCase();
}

export function nowIso(): string {
  return new Date().toISOString().replace(/\.\d{3}Z$/, 'Z');
}

export function todayDateStr(): string {
  const d = new Date();
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function offsetDateStr(daysOffset: number, baseDate: Date = new Date()): string {
  const d = new Date(baseDate);
  d.setDate(d.getDate() + daysOffset);
  const year = d.getFullYear();
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatTrendDayLabel(dateStr: string, isToday: boolean = false): { dayLabel: string; shortDay: string; monthDay: string } {
  const d = new Date(dateStr + 'T00:00:00');
  if (isNaN(d.getTime())) {
    return { dayLabel: dateStr, shortDay: '', monthDay: '' };
  }
  const shortDay = d.toLocaleDateString(undefined, { weekday: 'short' });
  const monthDay = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  return {
    dayLabel: isToday ? `Today (${shortDay})` : `${shortDay}, ${monthDay}`,
    shortDay,
    monthDay,
  };
}

// FHIR Resource converters (HL7 FHIR R4)
export function patientToFhir(p: Patient) {
  return {
    resourceType: 'Patient',
    id: String(p.id),
    identifier: [{ system: 'urn:hospital:mrn', value: p.mrn }],
    name: [{ family: p.last_name, given: [p.first_name] }],
    gender: (p.sex || 'unknown').toLowerCase(),
    telecom: [
      p.phone ? { system: 'phone', value: p.phone } : null,
      p.email ? { system: 'email', value: p.email } : null,
    ].filter(Boolean),
    address: p.address ? [{ text: p.address }] : [],
    extension: [
      {
        url: 'http://hl7.org/fhir/StructureDefinition/patient-religion',
        valueString: p.religion || undefined,
      },
      {
        url: 'urn:hospital:department',
        valueString: p.department,
      },
    ].filter(e => e.valueString !== undefined),
  };
}

export function appointmentToFhir(a: Appointment) {
  const start = `${a.date}T${a.time}:00`;
  const statusMap: Record<string, string> = {
    scheduled: 'booked',
    'checked-in': 'arrived',
    completed: 'fulfilled',
    cancelled: 'cancelled',
    'no-show': 'noshow',
  };
  return {
    resourceType: 'Appointment',
    id: String(a.id),
    identifier: [{ system: 'urn:hospital:appointment', value: a.appointment_code }],
    status: statusMap[a.status] || 'booked',
    description: a.reason,
    start,
    serviceType: [{ text: a.department }],
    participant: [
      { actor: { display: a.provider_name }, status: 'accepted' },
      { actor: { reference: `Patient/${a.patient_id}` }, status: 'accepted' },
    ],
  };
}

export function encounterToFhir(r: MedicalRecord) {
  return {
    resourceType: 'Encounter',
    id: String(r.id),
    status: 'finished',
    class: {
      system: 'http://terminology.hl7.org/CodeSystem/v3-ActCode',
      code: 'AMB',
      display: 'ambulatory',
    },
    subject: { reference: `Patient/${r.patient_id}` },
    period: { start: r.created_at },
    reasonCode: r.diagnosis_label ? [{ text: r.diagnosis_label }] : [],
  };
}

export function conditionToFhir(r: MedicalRecord) {
  return {
    resourceType: 'Condition',
    id: String(r.id),
    subject: { reference: `Patient/${r.patient_id}` },
    encounter: { reference: `Encounter/${r.id}` },
    recordedDate: r.created_at,
    code: {
      coding: [
        {
          system: 'http://hl7.org/fhir/sid/icd-10',
          code: r.diagnosis_code || 'R69',
          display: r.diagnosis_label || 'Illness, unspecified',
        },
      ],
      text: r.diagnosis_label || 'Illness, unspecified',
    },
  };
}

export function observationsFromRecord(r: MedicalRecord) {
  const obs = [];
  for (const [key, [loinc, display, unit]] of Object.entries(VITAL_LOINC)) {
    const value = (r as any)[key];
    if (value === null || value === undefined) continue;
    obs.push({
      resourceType: 'Observation',
      id: `${r.id}-${key}`,
      status: 'final',
      code: {
        coding: [{ system: 'http://loinc.org', code: loinc, display }],
        text: display,
      },
      subject: { reference: `Patient/${r.patient_id}` },
      effectiveDateTime: r.created_at,
      valueQuantity: { value, unit, system: 'http://unitsofmeasure.org' },
    });
  }
  return obs;
}
