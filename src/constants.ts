import { Department, AppointmentStatus } from './types';

export const DEPARTMENTS: Department[] = [
  'General',
  'Cardiology',
  'Pediatrics',
  'Orthopedics',
  'Neurology',
  'Radiology',
  'Oncology',
  'Emergency',
  'Maternity',
  'Dermatology',
];

export const DEPT_COLORS: Record<Department, string> = {
  General: '#C9A567',
  Cardiology: '#B5482F',
  Pediatrics: '#3D6E63',
  Orthopedics: '#6B7A63',
  Neurology: '#5B5EA6',
  Radiology: '#2E7D8C',
  Oncology: '#8C4A6B',
  Emergency: '#A32424',
  Maternity: '#C77DA0',
  Dermatology: '#B08968',
};

export function deptColor(dept: string): string {
  return DEPT_COLORS[dept as Department] || '#1E3A5F';
}

export const STATUS_OPTIONS: AppointmentStatus[] = [
  'scheduled',
  'checked-in',
  'completed',
  'cancelled',
  'no-show',
];

export const ICD10_COMMON: [string, string][] = [
  ['A09', 'Diarrhoea and gastroenteritis of presumed infectious origin'],
  ['B54', 'Unspecified malaria'],
  ['J00', 'Acute nasopharyngitis (common cold)'],
  ['J06.9', 'Acute upper respiratory infection, unspecified'],
  ['J18.9', 'Pneumonia, unspecified organism'],
  ['J45.9', 'Asthma, unspecified'],
  ['A15.9', 'Respiratory tuberculosis, unspecified'],
  ['E10', 'Type 1 diabetes mellitus'],
  ['E11', 'Type 2 diabetes mellitus'],
  ['I10', 'Essential (primary) hypertension'],
  ['I50.9', 'Heart failure, unspecified'],
  ['N39.0', 'Urinary tract infection, site not specified'],
  ['N18.9', 'Chronic kidney disease, unspecified'],
  ['O80', 'Single spontaneous delivery'],
  ['O26.9', 'Pregnancy-related condition, unspecified'],
  ['Z34.9', 'Normal pregnancy supervision, unspecified'],
  ['K29.7', 'Gastritis, unspecified'],
  ['K35.8', 'Acute appendicitis, other'],
  ['S06.0', 'Concussion'],
  ['T14.9', 'Injury, unspecified'],
  ['L23.9', 'Allergic contact dermatitis, unspecified'],
  ['B01.9', 'Varicella without complication (chickenpox)'],
  ['B05.9', 'Measles without complication'],
  ['G43.9', 'Migraine, unspecified'],
  ['F41.9', 'Anxiety disorder, unspecified'],
  ['F32.9', 'Depressive episode, unspecified'],
  ['M54.5', 'Low back pain'],
  ['M79.1', 'Myalgia'],
  ['R50.9', 'Fever, unspecified'],
  ['R51', 'Headache'],
  ['R10.4', 'Abdominal pain, unspecified'],
  ['Z00.0', 'General adult medical examination'],
];

export const VITALS_FIELDS = [
  'bp_systolic',
  'bp_diastolic',
  'temperature_c',
  'pulse_bpm',
  'respiratory_rate',
  'weight_kg',
  'height_cm',
] as const;

export const VITAL_LOINC = {
  bp_systolic: ['8480-6', 'Systolic blood pressure', 'mm[Hg]'],
  bp_diastolic: ['8462-4', 'Diastolic blood pressure', 'mm[Hg]'],
  temperature_c: ['8310-5', 'Body temperature', 'Cel'],
  pulse_bpm: ['8867-4', 'Heart rate', '/min'],
  respiratory_rate: ['9279-1', 'Respiratory rate', '/min'],
  weight_kg: ['29463-7', 'Body weight', 'kg'],
  height_cm: ['8302-2', 'Body height', 'cm'],
} as const;
