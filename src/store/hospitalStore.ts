import {
  Patient,
  Appointment,
  MedicalRecord,
  Complaint,
  AuditLogEntry,
  User,
  DashboardStats,
  AppointmentStatus,
  ComplaintStatus,
  ActivityTrendDay,
} from '../types';
import { nowIso, todayDateStr, offsetDateStr, formatTrendDayLabel } from '../utils/formatters';

const STORAGE_KEY_PREFIX = 'wayfind_hospital_';

function getStorage<T>(key: string, defaultValue: T): T {
  try {
    const val = localStorage.getItem(STORAGE_KEY_PREFIX + key);
    return val ? JSON.parse(val) : defaultValue;
  } catch (e) {
    return defaultValue;
  }
}

function setStorage<T>(key: string, value: T): void {
  try {
    localStorage.setItem(STORAGE_KEY_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.error('LocalStorage error:', e);
  }
}

// Initial Seed Data
const initialUsers: User[] = [
  {
    id: 1,
    email: 'officer@wayfind.org',
    role: 'officer',
    full_name: 'Amina Bello, RN',
    role_title: 'Health Records Officer',
    phone: '0802-555-0199',
    created_at: '2026-01-10T08:00:00Z',
  },
  {
    id: 2,
    email: 'sarah.jenkins@example.com',
    role: 'patient',
    full_name: 'Sarah Jenkins',
    patient_id: 1,
    created_at: '2026-01-12T09:30:00Z',
  },
  {
    id: 3,
    email: 'david.adeleke@example.com',
    role: 'patient',
    full_name: 'David Adeleke',
    patient_id: 2,
    created_at: '2026-01-15T11:00:00Z',
  },
];

const initialPatients: Patient[] = [
  {
    id: 1,
    mrn: 'HF-2026-00001',
    first_name: 'Sarah',
    last_name: 'Jenkins',
    phone: '555-0144',
    age: 46,
    sex: 'Female',
    blood_group: 'O+',
    address: '14 Crescent Way, Victoria Island',
    state_of_origin: 'Lagos',
    occupation: 'Financial Analyst',
    religion: 'Christian',
    next_of_kin_name: 'Thomas Jenkins',
    next_of_kin_phone: '555-0145',
    next_of_kin_address: '14 Crescent Way, Victoria Island',
    next_of_kin_relationship: 'Spouse',
    email: 'sarah.jenkins@example.com',
    department: 'Cardiology',
    consent_given: 1,
    consent_at: '2026-01-12T09:30:00Z',
    created_at: '2026-01-12T09:30:00Z',
    updated_at: '2026-01-12T09:30:00Z',
  },
  {
    id: 2,
    mrn: 'HF-2026-00002',
    first_name: 'David',
    last_name: 'Adeleke',
    phone: '555-0211',
    age: 33,
    sex: 'Male',
    blood_group: 'A+',
    address: '8 Palm Avenue, Ikeja',
    state_of_origin: 'Osun',
    occupation: 'Software Engineer',
    religion: 'Christian',
    next_of_kin_name: 'Folake Adeleke',
    next_of_kin_phone: '555-0212',
    next_of_kin_address: '8 Palm Avenue, Ikeja',
    next_of_kin_relationship: 'Sister',
    email: 'david.adeleke@example.com',
    department: 'General',
    consent_given: 1,
    consent_at: '2026-01-15T11:00:00Z',
    created_at: '2026-01-15T11:00:00Z',
    updated_at: '2026-01-15T11:00:00Z',
  },
  {
    id: 3,
    mrn: 'HF-2026-00003',
    first_name: 'Fatima',
    last_name: 'Al-Mansoor',
    phone: '555-0377',
    age: 29,
    sex: 'Female',
    blood_group: 'B+',
    address: '22 Marina View, Lekki Phase 1',
    state_of_origin: 'Kano',
    occupation: 'Architect',
    religion: 'Islam',
    next_of_kin_name: 'Ibrahim Al-Mansoor',
    next_of_kin_phone: '555-0378',
    next_of_kin_address: '22 Marina View, Lekki Phase 1',
    next_of_kin_relationship: 'Husband',
    email: 'fatima.almansoor@example.com',
    department: 'Maternity',
    consent_given: 1,
    consent_at: '2026-02-01T14:20:00Z',
    created_at: '2026-02-01T14:20:00Z',
    updated_at: '2026-02-01T14:20:00Z',
  },
  {
    id: 4,
    mrn: 'HF-2026-00004',
    first_name: 'Marcus',
    last_name: 'Chen',
    phone: '555-0455',
    age: 58,
    sex: 'Male',
    blood_group: 'AB+',
    address: '47 Marina Road, Lagos Island',
    state_of_origin: 'Delta',
    occupation: 'Civil Contractor',
    religion: 'Christian',
    next_of_kin_name: 'Linda Chen',
    next_of_kin_phone: '555-0456',
    next_of_kin_address: '47 Marina Road, Lagos Island',
    next_of_kin_relationship: 'Spouse',
    email: 'marcus.chen@example.com',
    department: 'Orthopedics',
    consent_given: 1,
    consent_at: '2026-02-18T10:15:00Z',
    created_at: '2026-02-18T10:15:00Z',
    updated_at: '2026-02-18T10:15:00Z',
  },
  {
    id: 5,
    mrn: 'HF-2026-00005',
    first_name: 'Grace',
    last_name: 'Nwosu',
    phone: '555-0588',
    age: 8,
    sex: 'Female',
    blood_group: 'O-',
    address: '19 Heritage Close, Maryland',
    state_of_origin: 'Enugu',
    occupation: 'Student',
    religion: 'Christian',
    next_of_kin_name: 'Ngozi Nwosu',
    next_of_kin_phone: '555-0589',
    next_of_kin_address: '19 Heritage Close, Maryland',
    next_of_kin_relationship: 'Mother',
    email: 'ngozi.nwosu@example.com',
    department: 'Pediatrics',
    consent_given: 1,
    consent_at: '2026-03-02T16:00:00Z',
    created_at: '2026-03-02T16:00:00Z',
    updated_at: '2026-03-02T16:00:00Z',
  },
];

const today = todayDateStr();

const initialAppointments: Appointment[] = [
  // Day -6
  {
    id: 101,
    patient_id: 1,
    appointment_code: 'AP-2026-00010',
    date: offsetDateStr(-6),
    time: '09:00',
    department: 'Cardiology',
    provider_name: 'Dr. Chidi Okafor',
    reason: 'Quarterly ECG & Holter evaluation',
    status: 'completed',
    location: 'Clinic 2, Room 104',
    created_at: '2026-01-20T08:00:00Z',
    updated_at: '2026-01-20T08:00:00Z',
  },
  {
    id: 102,
    patient_id: 4,
    appointment_code: 'AP-2026-00011',
    date: offsetDateStr(-6),
    time: '11:15',
    department: 'Orthopedics',
    provider_name: 'Dr. Emeka Ani',
    reason: 'Knee mobility follow-up',
    status: 'completed',
    location: 'Physiotherapy & Ortho Clinic',
    created_at: '2026-01-20T09:00:00Z',
    updated_at: '2026-01-20T09:00:00Z',
  },
  {
    id: 103,
    patient_id: 3,
    appointment_code: 'AP-2026-00012',
    date: offsetDateStr(-6),
    time: '14:00',
    department: 'Maternity',
    provider_name: 'Dr. Zainab Yusuf',
    reason: 'Maternal health consult',
    status: 'completed',
    location: 'Maternity Wing, Ultrasound 1',
    created_at: '2026-01-20T10:00:00Z',
    updated_at: '2026-01-20T10:00:00Z',
  },
  {
    id: 104,
    patient_id: 2,
    appointment_code: 'AP-2026-00013',
    date: offsetDateStr(-6),
    time: '15:30',
    department: 'General',
    provider_name: 'Dr. Tunde Fashola',
    reason: 'Routine blood panel',
    status: 'completed',
    location: 'OPD Consulting 3',
    created_at: '2026-01-20T11:00:00Z',
    updated_at: '2026-01-20T11:00:00Z',
  },

  // Day -5
  {
    id: 105,
    patient_id: 5,
    appointment_code: 'AP-2026-00014',
    date: offsetDateStr(-5),
    time: '08:30',
    department: 'Pediatrics',
    provider_name: 'Dr. Angela Peters',
    reason: 'Immunization booster',
    status: 'completed',
    location: 'Pediatric Clinic 1',
    created_at: '2026-01-21T08:00:00Z',
    updated_at: '2026-01-21T08:00:00Z',
  },
  {
    id: 106,
    patient_id: 1,
    appointment_code: 'AP-2026-00015',
    date: offsetDateStr(-5),
    time: '10:00',
    department: 'Cardiology',
    provider_name: 'Dr. Chidi Okafor',
    reason: 'Hypertension titration',
    status: 'completed',
    location: 'Clinic 2, Room 104',
    created_at: '2026-01-21T09:00:00Z',
    updated_at: '2026-01-21T09:00:00Z',
  },
  {
    id: 107,
    patient_id: 4,
    appointment_code: 'AP-2026-00016',
    date: offsetDateStr(-5),
    time: '11:45',
    department: 'Orthopedics',
    provider_name: 'Dr. Emeka Ani',
    reason: 'Cast inspection & adjustment',
    status: 'completed',
    location: 'Physiotherapy & Ortho Clinic',
    created_at: '2026-01-21T10:00:00Z',
    updated_at: '2026-01-21T10:00:00Z',
  },
  {
    id: 108,
    patient_id: 2,
    appointment_code: 'AP-2026-00017',
    date: offsetDateStr(-5),
    time: '13:30',
    department: 'General',
    provider_name: 'Dr. Tunde Fashola',
    reason: 'Occupational health certificate',
    status: 'completed',
    location: 'OPD Consulting 3',
    created_at: '2026-01-21T11:00:00Z',
    updated_at: '2026-01-21T11:00:00Z',
  },
  {
    id: 109,
    patient_id: 3,
    appointment_code: 'AP-2026-00018',
    date: offsetDateStr(-5),
    time: '15:00',
    department: 'Maternity',
    provider_name: 'Dr. Zainab Yusuf',
    reason: 'Gestational nutrition review',
    status: 'completed',
    location: 'Maternity Wing, Ultrasound 1',
    created_at: '2026-01-21T12:00:00Z',
    updated_at: '2026-01-21T12:00:00Z',
  },
  {
    id: 110,
    patient_id: 5,
    appointment_code: 'AP-2026-00019',
    date: offsetDateStr(-5),
    time: '16:15',
    department: 'Pediatrics',
    provider_name: 'Dr. Angela Peters',
    reason: 'Developmental milestones check',
    status: 'completed',
    location: 'Pediatric Clinic 1',
    created_at: '2026-01-21T13:00:00Z',
    updated_at: '2026-01-21T13:00:00Z',
  },

  // Day -4
  {
    id: 111,
    patient_id: 2,
    appointment_code: 'AP-2026-00020',
    date: offsetDateStr(-4),
    time: '09:15',
    department: 'General',
    provider_name: 'Dr. Tunde Fashola',
    reason: 'Allergy consultation',
    status: 'completed',
    location: 'OPD Consulting 3',
    created_at: '2026-01-22T08:00:00Z',
    updated_at: '2026-01-22T08:00:00Z',
  },
  {
    id: 112,
    patient_id: 3,
    appointment_code: 'AP-2026-00021',
    date: offsetDateStr(-4),
    time: '10:45',
    department: 'Maternity',
    provider_name: 'Dr. Zainab Yusuf',
    reason: 'Ultrasound scan follow-up',
    status: 'completed',
    location: 'Maternity Wing, Ultrasound 1',
    created_at: '2026-01-22T09:00:00Z',
    updated_at: '2026-01-22T09:00:00Z',
  },
  {
    id: 113,
    patient_id: 1,
    appointment_code: 'AP-2026-00022',
    date: offsetDateStr(-4),
    time: '13:00',
    department: 'Cardiology',
    provider_name: 'Dr. Chidi Okafor',
    reason: 'Lipid panel assessment',
    status: 'completed',
    location: 'Clinic 2, Room 104',
    created_at: '2026-01-22T10:00:00Z',
    updated_at: '2026-01-22T10:00:00Z',
  },
  {
    id: 114,
    patient_id: 4,
    appointment_code: 'AP-2026-00023',
    date: offsetDateStr(-4),
    time: '14:30',
    department: 'Orthopedics',
    provider_name: 'Dr. Emeka Ani',
    reason: 'Physical therapy eval',
    status: 'completed',
    location: 'Physiotherapy & Ortho Clinic',
    created_at: '2026-01-22T11:00:00Z',
    updated_at: '2026-01-22T11:00:00Z',
  },
  {
    id: 115,
    patient_id: 5,
    appointment_code: 'AP-2026-00024',
    date: offsetDateStr(-4),
    time: '16:00',
    department: 'Pediatrics',
    provider_name: 'Dr. Angela Peters',
    reason: 'General pediatric wellness',
    status: 'completed',
    location: 'Pediatric Clinic 1',
    created_at: '2026-01-22T12:00:00Z',
    updated_at: '2026-01-22T12:00:00Z',
  },

  // Day -3
  {
    id: 116,
    patient_id: 3,
    appointment_code: 'AP-2026-00025',
    date: offsetDateStr(-3),
    time: '08:45',
    department: 'Maternity',
    provider_name: 'Dr. Zainab Yusuf',
    reason: 'Blood pressure profile',
    status: 'completed',
    location: 'Maternity Wing, Ultrasound 1',
    created_at: '2026-01-23T08:00:00Z',
    updated_at: '2026-01-23T08:00:00Z',
  },
  {
    id: 117,
    patient_id: 5,
    appointment_code: 'AP-2026-00026',
    date: offsetDateStr(-3),
    time: '10:15',
    department: 'Pediatrics',
    provider_name: 'Dr. Angela Peters',
    reason: 'Pediatric hearing screen',
    status: 'completed',
    location: 'Pediatric Clinic 1',
    created_at: '2026-01-23T09:00:00Z',
    updated_at: '2026-01-23T09:00:00Z',
  },
  {
    id: 118,
    patient_id: 2,
    appointment_code: 'AP-2026-00027',
    date: offsetDateStr(-3),
    time: '11:30',
    department: 'General',
    provider_name: 'Dr. Tunde Fashola',
    reason: 'Digestive health review',
    status: 'completed',
    location: 'OPD Consulting 3',
    created_at: '2026-01-23T10:00:00Z',
    updated_at: '2026-01-23T10:00:00Z',
  },
  {
    id: 119,
    patient_id: 4,
    appointment_code: 'AP-2026-00028',
    date: offsetDateStr(-3),
    time: '13:45',
    department: 'Orthopedics',
    provider_name: 'Dr. Emeka Ani',
    reason: 'X-ray evaluation',
    status: 'completed',
    location: 'Physiotherapy & Ortho Clinic',
    created_at: '2026-01-23T11:00:00Z',
    updated_at: '2026-01-23T11:00:00Z',
  },
  {
    id: 120,
    patient_id: 1,
    appointment_code: 'AP-2026-00029',
    date: offsetDateStr(-3),
    time: '15:00',
    department: 'Cardiology',
    provider_name: 'Dr. Chidi Okafor',
    reason: 'Cardiac rehabilitation visit',
    status: 'completed',
    location: 'Clinic 2, Room 104',
    created_at: '2026-01-23T12:00:00Z',
    updated_at: '2026-01-23T12:00:00Z',
  },
  {
    id: 121,
    patient_id: 2,
    appointment_code: 'AP-2026-00030',
    date: offsetDateStr(-3),
    time: '16:30',
    department: 'General',
    provider_name: 'Dr. Tunde Fashola',
    reason: 'Blood glucose test review',
    status: 'completed',
    location: 'OPD Consulting 3',
    created_at: '2026-01-23T13:00:00Z',
    updated_at: '2026-01-23T13:00:00Z',
  },
  {
    id: 122,
    patient_id: 3,
    appointment_code: 'AP-2026-00031',
    date: offsetDateStr(-3),
    time: '17:15',
    department: 'Maternity',
    provider_name: 'Dr. Zainab Yusuf',
    reason: 'Fetal heartbeat Doppler',
    status: 'completed',
    location: 'Maternity Wing, Ultrasound 1',
    created_at: '2026-01-23T14:00:00Z',
    updated_at: '2026-01-23T14:00:00Z',
  },

  // Day -2
  {
    id: 123,
    patient_id: 5,
    appointment_code: 'AP-2026-00032',
    date: offsetDateStr(-2),
    time: '09:00',
    department: 'Pediatrics',
    provider_name: 'Dr. Angela Peters',
    reason: 'Seasonal cough check',
    status: 'completed',
    location: 'Pediatric Clinic 1',
    created_at: '2026-01-24T08:00:00Z',
    updated_at: '2026-01-24T08:00:00Z',
  },
  {
    id: 124,
    patient_id: 2,
    appointment_code: 'AP-2026-00033',
    date: offsetDateStr(-2),
    time: '10:30',
    department: 'General',
    provider_name: 'Dr. Tunde Fashola',
    reason: 'Annual medical physical',
    status: 'completed',
    location: 'OPD Consulting 3',
    created_at: '2026-01-24T09:00:00Z',
    updated_at: '2026-01-24T09:00:00Z',
  },
  {
    id: 125,
    patient_id: 1,
    appointment_code: 'AP-2026-00034',
    date: offsetDateStr(-2),
    time: '11:45',
    department: 'Cardiology',
    provider_name: 'Dr. Chidi Okafor',
    reason: 'Prescription refill & BP log',
    status: 'completed',
    location: 'Clinic 2, Room 104',
    created_at: '2026-01-24T10:00:00Z',
    updated_at: '2026-01-24T10:00:00Z',
  },
  {
    id: 126,
    patient_id: 4,
    appointment_code: 'AP-2026-00035',
    date: offsetDateStr(-2),
    time: '14:00',
    department: 'Orthopedics',
    provider_name: 'Dr. Emeka Ani',
    reason: 'Joint rehabilitation review',
    status: 'completed',
    location: 'Physiotherapy & Ortho Clinic',
    created_at: '2026-01-24T11:00:00Z',
    updated_at: '2026-01-24T11:00:00Z',
  },
  {
    id: 127,
    patient_id: 3,
    appointment_code: 'AP-2026-00036',
    date: offsetDateStr(-2),
    time: '15:15',
    department: 'Maternity',
    provider_name: 'Dr. Zainab Yusuf',
    reason: 'Trimester 2 check-in',
    status: 'completed',
    location: 'Maternity Wing, Ultrasound 1',
    created_at: '2026-01-24T12:00:00Z',
    updated_at: '2026-01-24T12:00:00Z',
  },
  {
    id: 128,
    patient_id: 5,
    appointment_code: 'AP-2026-00037',
    date: offsetDateStr(-2),
    time: '16:30',
    department: 'Pediatrics',
    provider_name: 'Dr. Angela Peters',
    reason: 'Follow-up ear inspection',
    status: 'completed',
    location: 'Pediatric Clinic 1',
    created_at: '2026-01-24T13:00:00Z',
    updated_at: '2026-01-24T13:00:00Z',
  },
  {
    id: 129,
    patient_id: 2,
    appointment_code: 'AP-2026-00038',
    date: offsetDateStr(-2),
    time: '17:00',
    department: 'General',
    provider_name: 'Dr. Tunde Fashola',
    reason: 'Health insurance medical form',
    status: 'completed',
    location: 'OPD Consulting 3',
    created_at: '2026-01-24T14:00:00Z',
    updated_at: '2026-01-24T14:00:00Z',
  },
  {
    id: 130,
    patient_id: 1,
    appointment_code: 'AP-2026-00039',
    date: offsetDateStr(-2),
    time: '17:45',
    department: 'Cardiology',
    provider_name: 'Dr. Chidi Okafor',
    reason: 'Echocardiogram preliminary review',
    status: 'completed',
    location: 'Clinic 2, Room 104',
    created_at: '2026-01-24T15:00:00Z',
    updated_at: '2026-01-24T15:00:00Z',
  },

  // Day -1 (Yesterday)
  {
    id: 131,
    patient_id: 4,
    appointment_code: 'AP-2026-00040',
    date: offsetDateStr(-1),
    time: '09:30',
    department: 'Orthopedics',
    provider_name: 'Dr. Emeka Ani',
    reason: 'Post-op knee ligament rehabilitation assessment',
    status: 'completed',
    location: 'Physiotherapy & Ortho Clinic',
    created_at: '2026-01-25T08:00:00Z',
    updated_at: '2026-01-25T08:00:00Z',
  },
  {
    id: 132,
    patient_id: 1,
    appointment_code: 'AP-2026-00041',
    date: offsetDateStr(-1),
    time: '11:00',
    department: 'Cardiology',
    provider_name: 'Dr. Chidi Okafor',
    reason: 'Hypertension routine checkup & ECG review',
    status: 'completed',
    location: 'Clinic 2, Room 104',
    created_at: '2026-01-25T09:00:00Z',
    updated_at: '2026-01-25T09:00:00Z',
  },
  {
    id: 133,
    patient_id: 3,
    appointment_code: 'AP-2026-00042',
    date: offsetDateStr(-1),
    time: '13:15',
    department: 'Maternity',
    provider_name: 'Dr. Zainab Yusuf',
    reason: 'Prenatal care routine visit',
    status: 'completed',
    location: 'Maternity Wing, Ultrasound 1',
    created_at: '2026-01-25T10:00:00Z',
    updated_at: '2026-01-25T10:00:00Z',
  },
  {
    id: 134,
    patient_id: 2,
    appointment_code: 'AP-2026-00043',
    date: offsetDateStr(-1),
    time: '15:00',
    department: 'General',
    provider_name: 'Dr. Tunde Fashola',
    reason: 'General medicine follow-up',
    status: 'completed',
    location: 'OPD Consulting 3',
    created_at: '2026-01-25T11:00:00Z',
    updated_at: '2026-01-25T11:00:00Z',
  },
  {
    id: 135,
    patient_id: 5,
    appointment_code: 'AP-2026-00044',
    date: offsetDateStr(-1),
    time: '16:00',
    department: 'Pediatrics',
    provider_name: 'Dr. Angela Peters',
    reason: 'Growth curve tracking & nutrition advice',
    status: 'completed',
    location: 'Pediatric Clinic 1',
    created_at: '2026-01-25T12:00:00Z',
    updated_at: '2026-01-25T12:00:00Z',
  },

  // Today (Day 0)
  {
    id: 1,
    patient_id: 1,
    appointment_code: 'AP-2026-00001',
    date: today,
    time: '09:00',
    department: 'Cardiology',
    provider_name: 'Dr. Chidi Okafor',
    reason: 'Hypertension routine checkup & ECG review',
    status: 'checked-in',
    location: 'Clinic 2, Room 104',
    notes: 'Patient reports mild morning headaches.',
    created_at: '2026-02-10T10:00:00Z',
    updated_at: '2026-02-10T10:00:00Z',
  },
  {
    id: 2,
    patient_id: 3,
    appointment_code: 'AP-2026-00002',
    date: today,
    time: '11:30',
    department: 'Maternity',
    provider_name: 'Dr. Zainab Yusuf',
    reason: 'Trimester 2 routine ultrasound & fetal monitoring',
    status: 'scheduled',
    location: 'Maternity Wing, Ultrasound 1',
    notes: 'Bring previous scan results.',
    created_at: '2026-02-14T09:00:00Z',
    updated_at: '2026-02-14T09:00:00Z',
  },
  {
    id: 3,
    patient_id: 2,
    appointment_code: 'AP-2026-00003',
    date: today,
    time: '14:00',
    department: 'General',
    provider_name: 'Dr. Tunde Fashola',
    reason: 'Lab test results follow-up',
    status: 'scheduled',
    location: 'OPD Consulting 3',
    notes: 'Fasting lipid profile review.',
    created_at: '2026-02-15T12:00:00Z',
    updated_at: '2026-02-15T12:00:00Z',
  },
  {
    id: 4,
    patient_id: 4,
    appointment_code: 'AP-2026-00004',
    date: today,
    time: '15:30',
    department: 'Orthopedics',
    provider_name: 'Dr. Emeka Ani',
    reason: 'Post-op knee ligament rehabilitation assessment',
    status: 'scheduled',
    location: 'Physiotherapy & Ortho Clinic',
    notes: 'Check range of motion and joint stability.',
    created_at: '2026-02-20T11:00:00Z',
    updated_at: '2026-02-20T11:00:00Z',
  },

  // Future scheduled
  {
    id: 5,
    patient_id: 5,
    appointment_code: 'AP-2026-00005',
    date: offsetDateStr(2),
    time: '10:15',
    department: 'Pediatrics',
    provider_name: 'Dr. Angela Peters',
    reason: 'Childhood asthma inhaler adjustment',
    status: 'scheduled',
    location: 'Pediatric Clinic 1',
    notes: 'Review asthma action plan.',
    created_at: '2026-01-10T14:00:00Z',
    updated_at: '2026-01-20T11:00:00Z',
  },
];

const initialRecords: MedicalRecord[] = [
  {
    id: 1,
    patient_id: 1,
    appointment_id: 1,
    author_name: 'Dr. Chidi Okafor',
    author_email: 'dr.chidi@wayfind.org',
    report:
      'Patient presents for scheduled hypertension review. Blood pressure remains elevated at 145/92 mmHg. Initiated amlodipine 5mg OD. Advised reduced dietary sodium and light aerobic activity 30 mins daily. Repeat BP log in two weeks.',
    diagnosis_code: 'I10',
    diagnosis_label: 'Essential (primary) hypertension',
    bp_systolic: 145,
    bp_diastolic: 92,
    temperature_c: 36.7,
    pulse_bpm: 78,
    respiratory_rate: 16,
    weight_kg: 68.5,
    height_cm: 164,
    created_at: '2026-01-12T10:15:00Z',
    updated_at: '2026-01-12T10:15:00Z',
  },
  {
    id: 2,
    patient_id: 2,
    author_name: 'Dr. Tunde Fashola',
    author_email: 'dr.fashola@wayfind.org',
    report:
      'Patient came with 3-day history of intermittent fevers, chills, and malaise. RDT positive for P. falciparum. Commenced on oral artemether-lumefantrine 80/480mg twice daily with fatty food for 3 days. Hydration emphasized.',
    diagnosis_code: 'B54',
    diagnosis_label: 'Unspecified malaria',
    bp_systolic: 118,
    bp_diastolic: 76,
    temperature_c: 38.4,
    pulse_bpm: 88,
    respiratory_rate: 18,
    weight_kg: 74.0,
    height_cm: 178,
    created_at: '2026-01-15T11:45:00Z',
    updated_at: '2026-01-15T11:45:00Z',
  },
];

const initialComplaints: Complaint[] = [
  {
    id: 1,
    patient_id: 1,
    message: 'The waiting room on the 2nd floor was crowded and air conditioning was off yesterday morning.',
    status: 'resolved',
    response: 'Thank you for notifying us. The HVAC technician has repaired the compressor unit in Cardiology Wing.',
    created_at: '2026-02-11T14:10:00Z',
    updated_at: '2026-02-12T09:00:00Z',
  },
  {
    id: 2,
    patient_id: 2,
    message: 'Pharmacy line was quite slow during peak afternoon hours. Could additional counter staff be scheduled?',
    status: 'in-progress',
    response: 'We are reviewing afternoon staffing rotations with the Chief Pharmacist.',
    created_at: '2026-02-16T16:40:00Z',
    updated_at: '2026-02-17T10:00:00Z',
  },
];

const initialAudit: AuditLogEntry[] = [
  {
    id: 1,
    actor_role: 'officer',
    actor_email: 'officer@wayfind.org',
    actor_id: 1,
    action: 'login',
    resource_type: 'Officer',
    resource_id: '1',
    detail: 'Officer logged in with emailed verification code',
    created_at: '2026-02-10T08:00:00Z',
  },
  {
    id: 2,
    actor_role: 'officer',
    actor_email: 'officer@wayfind.org',
    actor_id: 1,
    action: 'create_patient',
    resource_type: 'Patient',
    resource_id: '1',
    detail: 'Folder opened by officer, consent confirmed',
    created_at: '2026-01-12T09:30:00Z',
  },
  {
    id: 3,
    actor_role: 'officer',
    actor_email: 'officer@wayfind.org',
    actor_id: 1,
    action: 'create_medical_record',
    resource_type: 'Patient',
    resource_id: '1',
    detail: "Report added (diagnosis: Essential (primary) hypertension)",
    created_at: '2026-01-12T10:15:00Z',
  },
  {
    id: 4,
    actor_role: 'patient',
    actor_email: 'sarah.jenkins@example.com',
    actor_id: 1,
    action: 'login',
    resource_type: 'Patient',
    resource_id: '1',
    detail: 'Patient logged in to view folder',
    created_at: '2026-02-11T14:00:00Z',
  },
];

class HospitalStore {
  private users: User[];
  private patients: Patient[];
  private appointments: Appointment[];
  private records: MedicalRecord[];
  private complaints: Complaint[];
  private auditLog: AuditLogEntry[];
  private currentUser: User | null;
  private pendingOfficerOtp: { email: string; code: string; expires: number } | null = null;
  private pendingPasswordReset: { email: string; role: string; code: string; expires: number } | null = null;
  private listeners: (() => void)[] = [];

  constructor() {
    this.users = getStorage('users', initialUsers);
    this.patients = getStorage('patients', initialPatients);
    this.appointments = getStorage('appointments', initialAppointments);
    this.records = getStorage('records', initialRecords);
    this.complaints = getStorage('complaints', initialComplaints);
    this.auditLog = getStorage('audit', initialAudit);
    this.currentUser = getStorage('current_user', null);
    this.ensureHistoricalAppointments();
  }

  private ensureHistoricalAppointments() {
    // If stored appointments don't contain historical records for past 2 days, backfill missing seed items
    const hasPast = this.appointments.some(
      (a) => a.date === offsetDateStr(-1) || a.date === offsetDateStr(-2)
    );
    if (!hasPast) {
      const existingCodes = new Set(this.appointments.map((a) => a.appointment_code));
      let added = false;
      for (const item of initialAppointments) {
        if (!existingCodes.has(item.appointment_code)) {
          this.appointments.push({ ...item });
          added = true;
        }
      }
      if (added) {
        setStorage('appointments', this.appointments);
      }
    }
  }

  public subscribe(fn: () => void): () => void {
    this.listeners.push(fn);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== fn);
    };
  }

  private notify() {
    this.listeners.forEach((fn) => fn());
  }

  private save() {
    setStorage('users', this.users);
    setStorage('patients', this.patients);
    setStorage('appointments', this.appointments);
    setStorage('records', this.records);
    setStorage('complaints', this.complaints);
    setStorage('audit', this.auditLog);
    setStorage('current_user', this.currentUser);
    this.notify();
  }

  public getNextMrn(): string {
    const year = new Date().getFullYear();
    const prefix = `HF-${year}-`;
    let maxSeq = 0;
    for (const p of this.patients) {
      if (p.mrn && p.mrn.startsWith(prefix)) {
        const parts = p.mrn.split('-');
        const seq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
    return `${prefix}${String(maxSeq + 1).padStart(5, '0')}`;
  }

  public getNextApptCode(): string {
    const year = new Date().getFullYear();
    const prefix = `AP-${year}-`;
    let maxSeq = 0;
    for (const a of this.appointments) {
      if (a.appointment_code && a.appointment_code.startsWith(prefix)) {
        const parts = a.appointment_code.split('-');
        const seq = parseInt(parts[parts.length - 1], 10);
        if (!isNaN(seq) && seq > maxSeq) {
          maxSeq = seq;
        }
      }
    }
    return `${prefix}${String(maxSeq + 1).padStart(5, '0')}`;
  }

  public logAudit(action: string, resource_type: string, resource_id?: string | number, detail?: string) {
    const entry: AuditLogEntry = {
      id: this.auditLog.length ? Math.max(...this.auditLog.map((a) => a.id)) + 1 : 1,
      actor_role: this.currentUser?.role || 'anonymous',
      actor_email: this.currentUser?.email,
      actor_id: this.currentUser?.patient_id || (this.currentUser?.role === 'officer' ? this.currentUser.id : undefined),
      action,
      resource_type,
      resource_id: resource_id ? String(resource_id) : undefined,
      detail,
      created_at: nowIso(),
    };
    this.auditLog.unshift(entry);
    setStorage('audit', this.auditLog);
    this.notify();
  }

  // --- Auth ---
  public getCurrentUser(): User | null {
    return this.currentUser;
  }

  public logout() {
    this.currentUser = null;
    this.save();
  }

  public patientLogin(email: string, _password?: string): Patient {
    const clean = email.trim().toLowerCase();
    const user = this.users.find((u) => u.email.toLowerCase() === clean && u.role === 'patient');
    if (!user || !user.patient_id) {
      throw new Error('Incorrect email or password');
    }
    const patient = this.patients.find((p) => p.id === user.patient_id);
    if (!patient) {
      throw new Error('Patient folder not found');
    }
    this.currentUser = user;
    this.logAudit('login', 'Patient', patient.id, 'Patient logged in');
    this.save();
    return patient;
  }

  public patientSignup(data: Partial<Patient> & { email: string; password?: string; consent: boolean }): Patient {
    const email = data.email.trim().toLowerCase();
    if (!email) throw new Error('Email is required');
    if (!data.first_name || !data.last_name) throw new Error('First name and last name are required');
    if (!data.consent) throw new Error('You must consent to data collection to open a folder');
    if (this.users.some((u) => u.email.toLowerCase() === email)) {
      throw new Error('An account with this email already exists');
    }

    const mrn = this.getNextMrn();
    const ts = nowIso();

    const newPatient: Patient = {
      id: this.patients.length ? Math.max(...this.patients.map((p) => p.id)) + 1 : 1,
      mrn,
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      phone: data.phone?.trim() || undefined,
      age: data.age ? Number(data.age) : undefined,
      sex: data.sex || undefined,
      blood_group: data.blood_group || undefined,
      address: data.address?.trim() || undefined,
      state_of_origin: data.state_of_origin?.trim() || undefined,
      occupation: data.occupation?.trim() || undefined,
      religion: data.religion?.trim() || undefined,
      next_of_kin_name: data.next_of_kin_name?.trim() || undefined,
      next_of_kin_phone: data.next_of_kin_phone?.trim() || undefined,
      next_of_kin_address: data.next_of_kin_address?.trim() || undefined,
      next_of_kin_relationship: data.next_of_kin_relationship?.trim() || undefined,
      email,
      department: data.department || 'General',
      consent_given: 1,
      consent_at: ts,
      created_at: ts,
      updated_at: ts,
    };

    const newUser: User = {
      id: this.users.length ? Math.max(...this.users.map((u) => u.id)) + 1 : 1,
      email,
      role: 'patient',
      full_name: `${newPatient.first_name} ${newPatient.last_name}`,
      patient_id: newPatient.id,
      created_at: ts,
    };

    this.patients.unshift(newPatient);
    this.users.push(newUser);
    this.currentUser = newUser;
    this.logAudit('create_patient', 'Patient', newPatient.id, 'Patient self-registered, consent given');
    this.save();
    return newPatient;
  }

  public officerSignup(data: { full_name: string; email: string; role_title: string; phone?: string }): User {
    const email = data.email.trim().toLowerCase();
    if (!email || !data.full_name || !data.role_title) {
      throw new Error('Full name, role title, and email are required');
    }
    if (this.users.some((u) => u.email.toLowerCase() === email)) {
      throw new Error('An account with this email already exists');
    }
    const ts = nowIso();
    const newUser: User = {
      id: this.users.length ? Math.max(...this.users.map((u) => u.id)) + 1 : 1,
      email,
      role: 'officer',
      full_name: data.full_name.trim(),
      role_title: data.role_title.trim(),
      phone: data.phone?.trim(),
      created_at: ts,
    };
    this.users.push(newUser);
    this.save();
    return newUser;
  }

  public officerRequestCode(email: string): { message: string; simulatedCode: string } {
    const clean = email.trim().toLowerCase();
    const user = this.users.find((u) => u.email.toLowerCase() === clean && u.role === 'officer');
    if (!user) {
      throw new Error('Incorrect email or password');
    }
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    const expires = Date.now() + 10 * 60 * 1000;
    this.pendingOfficerOtp = { email: clean, code, expires };
    return {
      message: 'Code sent to work email',
      simulatedCode: code,
    };
  }

  public officerVerifyCode(email: string, code: string): User {
    const clean = email.trim().toLowerCase();
    const user = this.users.find((u) => u.email.toLowerCase() === clean && u.role === 'officer');
    if (!user) {
      throw new Error('Incorrect email or code');
    }
    const isStatic = code === '123456';
    const isGenerated =
      this.pendingOfficerOtp &&
      this.pendingOfficerOtp.email === clean &&
      this.pendingOfficerOtp.code === code &&
      Date.now() <= this.pendingOfficerOtp.expires;

    if (!isStatic && !isGenerated) {
      throw new Error('Incorrect or expired login code. (Tip: Try 123456 or the generated code)');
    }

    this.pendingOfficerOtp = null;
    this.currentUser = user;
    this.logAudit('login', 'Officer', user.id, isStatic ? 'Logged in using static fallback code' : 'Logged in with verification code');
    this.save();
    return user;
  }

  public requestPasswordReset(email: string, role: string): { message: string; simulatedCode: string } {
    const clean = email.trim().toLowerCase();
    const user = this.users.find((u) => u.email.toLowerCase() === clean && u.role === role);
    const code = Math.floor(100000 + Math.random() * 900000).toString();
    if (user) {
      this.pendingPasswordReset = { email: clean, role, code, expires: Date.now() + 15 * 60 * 1000 };
    }
    return {
      message: 'If that account exists, a reset code has been sent.',
      simulatedCode: user ? code : '123456',
    };
  }

  public resetPassword(email: string, role: string, code: string): boolean {
    const clean = email.trim().toLowerCase();
    const user = this.users.find((u) => u.email.toLowerCase() === clean && u.role === role);
    if (!user) throw new Error('Incorrect email or code');

    const isValid =
      code === '123456' ||
      (this.pendingPasswordReset &&
        this.pendingPasswordReset.email === clean &&
        this.pendingPasswordReset.code === code &&
        Date.now() <= this.pendingPasswordReset.expires);

    if (!isValid) throw new Error('Code expired or incorrect');
    this.pendingPasswordReset = null;
    return true;
  }

  public quickLogin(role: 'officer' | 'patient', id?: number) {
    if (role === 'officer') {
      const officer = this.users.find((u) => u.role === 'officer') || initialUsers[0];
      this.currentUser = officer;
      this.logAudit('login', 'Officer', officer.id, 'Officer logged in via quick switch');
    } else {
      const patientId = id || 1;
      const user = this.users.find((u) => u.role === 'patient' && u.patient_id === patientId) || initialUsers[1];
      this.currentUser = user;
      this.logAudit('login', 'Patient', patientId, 'Patient logged in via quick switch');
    }
    this.save();
  }

  // --- Patients ---
  public listPatients(query: string = '', departmentFilter: string = ''): Patient[] {
    const q = query.trim().toLowerCase();
    let result = [...this.patients];

    if (departmentFilter) {
      result = result.filter((p) => p.department === departmentFilter);
    }

    if (q) {
      result = result.filter((p) => {
        return (
          p.first_name.toLowerCase().includes(q) ||
          p.last_name.toLowerCase().includes(q) ||
          p.mrn.toLowerCase().includes(q) ||
          (p.phone && p.phone.toLowerCase().includes(q)) ||
          p.department.toLowerCase().includes(q)
        );
      });
    }

    return result.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  public getPatient(id: number): (Patient & { appointments: Appointment[] }) | null {
    const p = this.patients.find((item) => item.id === id);
    if (!p) return null;
    const patientAppointments = this.appointments
      .filter((a) => a.patient_id === id)
      .sort((a, b) => `${b.date} ${b.time}`.localeCompare(`${a.date} ${a.time}`));
    return {
      ...p,
      appointments: patientAppointments,
    };
  }

  public createPatient(data: Partial<Patient> & { consent?: boolean; password?: string }): Patient {
    if (!data.first_name || !data.last_name) {
      throw new Error('Missing required fields: first_name, last_name');
    }
    if (!data.consent) {
      throw new Error('Patient consent must be confirmed before a folder can be opened');
    }

    const mrn = this.getNextMrn();
    const ts = nowIso();

    const newPatient: Patient = {
      id: this.patients.length ? Math.max(...this.patients.map((p) => p.id)) + 1 : 1,
      mrn,
      first_name: data.first_name.trim(),
      last_name: data.last_name.trim(),
      phone: data.phone?.trim() || undefined,
      age: data.age ? Number(data.age) : undefined,
      sex: data.sex || undefined,
      blood_group: data.blood_group || undefined,
      address: data.address?.trim() || undefined,
      state_of_origin: data.state_of_origin?.trim() || undefined,
      occupation: data.occupation?.trim() || undefined,
      religion: data.religion?.trim() || undefined,
      next_of_kin_name: data.next_of_kin_name?.trim() || undefined,
      next_of_kin_phone: data.next_of_kin_phone?.trim() || undefined,
      next_of_kin_address: data.next_of_kin_address?.trim() || undefined,
      next_of_kin_relationship: data.next_of_kin_relationship?.trim() || undefined,
      email: data.email?.trim().toLowerCase() || undefined,
      department: data.department || 'General',
      consent_given: 1,
      consent_at: ts,
      created_at: ts,
      updated_at: ts,
    };

    if (newPatient.email && data.password) {
      const newUser: User = {
        id: this.users.length ? Math.max(...this.users.map((u) => u.id)) + 1 : 1,
        email: newPatient.email,
        role: 'patient',
        full_name: `${newPatient.first_name} ${newPatient.last_name}`,
        patient_id: newPatient.id,
        created_at: ts,
      };
      this.users.push(newUser);
    }

    this.patients.unshift(newPatient);
    this.logAudit('create_patient', 'Patient', newPatient.id, 'Folder opened by officer, consent confirmed');
    this.save();
    return newPatient;
  }

  public updatePatient(id: number, data: Partial<Patient>): Patient {
    const idx = this.patients.findIndex((p) => p.id === id);
    if (idx === -1) throw new Error('Patient not found');

    const updated = {
      ...this.patients[idx],
      ...data,
      updated_at: nowIso(),
    };
    this.patients[idx] = updated;
    this.logAudit('update_patient', 'Patient', id, `Fields changed: ${Object.keys(data).join(', ')}`);
    this.save();
    return updated;
  }

  // --- Appointments ---
  public listAppointments(filters: { patient_id?: number; status?: AppointmentStatus; date?: string; department?: string } = {}): Appointment[] {
    let list = this.appointments.map((a) => {
      const patient = this.patients.find((p) => p.id === a.patient_id);
      return {
        ...a,
        first_name: patient?.first_name || 'Unknown',
        last_name: patient?.last_name || '',
        mrn: patient?.mrn || '',
        phone: patient?.phone || '',
      };
    });

    if (filters.patient_id) {
      list = list.filter((a) => a.patient_id === filters.patient_id);
    }
    if (filters.status) {
      list = list.filter((a) => a.status === filters.status);
    }
    if (filters.date) {
      list = list.filter((a) => a.date === filters.date);
    }
    if (filters.department) {
      list = list.filter((a) => a.department === filters.department);
    }

    return list.sort((a, b) => `${a.date} ${a.time}`.localeCompare(`${b.date} ${b.time}`));
  }

  public getAppointment(id: number): Appointment | null {
    const a = this.appointments.find((item) => item.id === id);
    if (!a) return null;
    const patient = this.patients.find((p) => p.id === a.patient_id);
    return {
      ...a,
      first_name: patient?.first_name,
      last_name: patient?.last_name,
      mrn: patient?.mrn,
      phone: patient?.phone,
    };
  }

  public createAppointment(data: Omit<Appointment, 'id' | 'appointment_code' | 'created_at' | 'updated_at'>): Appointment {
    const patient = this.patients.find((p) => p.id === Number(data.patient_id));
    if (!patient) throw new Error('Patient not found for this appointment');
    if (!data.date || !data.time || !data.department || !data.provider_name) {
      throw new Error('Date, time, department, and provider name are required');
    }

    const code = this.getNextApptCode();
    const ts = nowIso();

    const newAppt: Appointment = {
      ...data,
      patient_id: Number(data.patient_id),
      id: this.appointments.length ? Math.max(...this.appointments.map((a) => a.id)) + 1 : 1,
      appointment_code: code,
      status: data.status || 'scheduled',
      created_at: ts,
      updated_at: ts,
    };

    this.appointments.push(newAppt);
    this.save();
    return newAppt;
  }

  public updateAppointment(id: number, data: Partial<Appointment>): Appointment {
    const idx = this.appointments.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Appointment not found');

    const updated = {
      ...this.appointments[idx],
      ...data,
      updated_at: nowIso(),
    };
    this.appointments[idx] = updated;
    this.save();
    return updated;
  }

  public deleteAppointment(id: number): boolean {
    const idx = this.appointments.findIndex((a) => a.id === id);
    if (idx === -1) throw new Error('Appointment not found');
    this.appointments.splice(idx, 1);
    this.save();
    return true;
  }

  // --- Medical Records (Doctor's Reports) ---
  public listMedicalRecords(patientId: number): MedicalRecord[] {
    return this.records
      .filter((r) => r.patient_id === patientId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  public createMedicalRecord(patientId: number, data: Partial<MedicalRecord>): MedicalRecord {
    const reportText = (data.report || '').trim();
    if (!reportText) throw new Error('Report content cannot be empty');

    const ts = nowIso();
    const newRecord: MedicalRecord = {
      id: this.records.length ? Math.max(...this.records.map((r) => r.id)) + 1 : 1,
      patient_id: patientId,
      appointment_id: data.appointment_id ? Number(data.appointment_id) : undefined,
      author_name: this.currentUser?.full_name || 'Health Officer',
      author_email: this.currentUser?.email || 'officer@wayfind.org',
      report: reportText,
      diagnosis_code: data.diagnosis_code || undefined,
      diagnosis_label: data.diagnosis_label || undefined,
      bp_systolic: data.bp_systolic !== undefined && !isNaN(Number(data.bp_systolic)) ? Number(data.bp_systolic) : undefined,
      bp_diastolic: data.bp_diastolic !== undefined && !isNaN(Number(data.bp_diastolic)) ? Number(data.bp_diastolic) : undefined,
      temperature_c: data.temperature_c !== undefined && !isNaN(Number(data.temperature_c)) ? Number(data.temperature_c) : undefined,
      pulse_bpm: data.pulse_bpm !== undefined && !isNaN(Number(data.pulse_bpm)) ? Number(data.pulse_bpm) : undefined,
      respiratory_rate: data.respiratory_rate !== undefined && !isNaN(Number(data.respiratory_rate)) ? Number(data.respiratory_rate) : undefined,
      weight_kg: data.weight_kg !== undefined && !isNaN(Number(data.weight_kg)) ? Number(data.weight_kg) : undefined,
      height_cm: data.height_cm !== undefined && !isNaN(Number(data.height_cm)) ? Number(data.height_cm) : undefined,
      created_at: ts,
      updated_at: ts,
    };

    this.records.unshift(newRecord);
    this.logAudit('create_medical_record', 'Patient', patientId, `Report added (diagnosis: ${data.diagnosis_label || 'none coded'})`);
    this.save();
    return newRecord;
  }

  public updateMedicalRecord(id: number, data: Partial<MedicalRecord>): MedicalRecord {
    const idx = this.records.findIndex((r) => r.id === id);
    if (idx === -1) throw new Error('Record not found');

    const updated = {
      ...this.records[idx],
      ...data,
      updated_at: nowIso(),
    };
    this.records[idx] = updated;
    this.logAudit('update_medical_record', 'Patient', updated.patient_id, `Report ${id} edited`);
    this.save();
    return updated;
  }

  // --- Complaints ---
  public listComplaints(status?: ComplaintStatus): Complaint[] {
    let list = this.complaints.map((c) => {
      const patient = this.patients.find((p) => p.id === c.patient_id);
      return {
        ...c,
        first_name: patient?.first_name || 'Unknown',
        last_name: patient?.last_name || '',
        mrn: patient?.mrn || '',
      };
    });

    if (status) {
      list = list.filter((c) => c.status === status);
    }
    return list.sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  public myComplaints(patientId: number): Complaint[] {
    return this.complaints
      .filter((c) => c.patient_id === patientId)
      .sort((a, b) => b.created_at.localeCompare(a.created_at));
  }

  public submitComplaint(patientId: number, message: string): Complaint {
    const text = message.trim();
    if (!text) throw new Error('Complaint message cannot be empty');

    const ts = nowIso();
    const newComplaint: Complaint = {
      id: this.complaints.length ? Math.max(...this.complaints.map((c) => c.id)) + 1 : 1,
      patient_id: patientId,
      message: text,
      status: 'open',
      created_at: ts,
      updated_at: ts,
    };
    this.complaints.unshift(newComplaint);
    this.save();
    return newComplaint;
  }

  public updateComplaint(id: number, updates: { status?: ComplaintStatus; response?: string }): Complaint {
    const idx = this.complaints.findIndex((c) => c.id === id);
    if (idx === -1) throw new Error('Complaint not found');

    const updated = {
      ...this.complaints[idx],
      ...updates,
      updated_at: nowIso(),
    };
    this.complaints[idx] = updated;
    this.save();
    return updated;
  }

  // --- Audit Log ---
  public getAuditLog(patientId?: number): AuditLogEntry[] {
    let list = [...this.auditLog];
    if (patientId) {
      list = list.filter((a) => a.resource_type === 'Patient' && a.resource_id === String(patientId));
    }
    return list.slice(0, 200);
  }

  // --- Dashboard Stats ---
  public getDashboardStats(): DashboardStats {
    const today = todayDateStr();
    const total_patients = this.patients.length;
    const today_appointments = this.appointments.filter((a) => a.date === today).length;
    const upcoming_appointments = this.appointments.filter(
      (a) => a.date >= today && a.status === 'scheduled'
    ).length;

    const deptMap: Record<string, number> = {};
    for (const p of this.patients) {
      deptMap[p.department] = (deptMap[p.department] || 0) + 1;
    }
    const departments = Object.entries(deptMap)
      .map(([department, c]) => ({ department: department as any, c }))
      .sort((a, b) => b.c - a.c);

    const recent_patients = [...this.patients]
      .sort((a, b) => b.created_at.localeCompare(a.created_at))
      .slice(0, 5);

    const todays_schedule = this.appointments
      .filter((a) => a.date === today)
      .map((a) => {
        const patient = this.patients.find((p) => p.id === a.patient_id);
        return {
          ...a,
          first_name: patient?.first_name || '',
          last_name: patient?.last_name || '',
          mrn: patient?.mrn || '',
        };
      })
      .sort((a, b) => a.time.localeCompare(b.time));

    // Calculate 7-day activity trend
    const activity_trend: ActivityTrendDay[] = [];
    for (let i = 6; i >= 0; i--) {
      const targetDate = offsetDateStr(-i);
      const isToday = i === 0;
      const { dayLabel, shortDay, monthDay } = formatTrendDayLabel(targetDate, isToday);

      const dayAppts = this.appointments.filter((a) => a.date === targetDate);
      const total = dayAppts.length;
      const completed = dayAppts.filter((a) => a.status === 'completed').length;
      const scheduled = dayAppts.filter((a) => a.status === 'scheduled').length;
      const checkedIn = dayAppts.filter((a) => a.status === 'checked-in').length;
      const cancelled = dayAppts.filter((a) => a.status === 'cancelled').length;

      activity_trend.push({
        date: targetDate,
        dayLabel,
        shortDay,
        monthDay,
        isToday,
        total,
        completed,
        scheduled,
        checkedIn,
        cancelled,
      });
    }

    const seven_day_total = activity_trend.reduce((sum, d) => sum + d.total, 0);
    const seven_day_average = Number((seven_day_total / 7).toFixed(1));
    let peakDay = { label: '—', count: 0 };
    for (const d of activity_trend) {
      if (d.total >= peakDay.count) {
        peakDay = { label: d.dayLabel, count: d.total };
      }
    }

    return {
      total_patients,
      today_appointments,
      upcoming_appointments,
      departments,
      recent_patients,
      todays_schedule,
      activity_trend,
      seven_day_total,
      seven_day_average,
      peak_day: peakDay,
    };
  }
}

export const hospitalStore = new HospitalStore();
