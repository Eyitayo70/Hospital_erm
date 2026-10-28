export type Department =
  | 'General'
  | 'Cardiology'
  | 'Pediatrics'
  | 'Orthopedics'
  | 'Neurology'
  | 'Radiology'
  | 'Oncology'
  | 'Emergency'
  | 'Maternity'
  | 'Dermatology';

export type AppointmentStatus =
  | 'scheduled'
  | 'checked-in'
  | 'completed'
  | 'cancelled'
  | 'no-show';

export type ComplaintStatus = 'open' | 'in-progress' | 'resolved';

export type UserRole = 'patient' | 'officer';

export interface User {
  id: number;
  email: string;
  password_hash?: string;
  role: UserRole;
  full_name: string;
  phone?: string;
  role_title?: string;
  patient_id?: number;
  created_at: string;
}

export interface Patient {
  id: number;
  mrn: string;
  first_name: string;
  last_name: string;
  phone?: string;
  age?: number;
  sex?: string;
  blood_group?: string;
  address?: string;
  state_of_origin?: string;
  occupation?: string;
  religion?: string;
  next_of_kin_name?: string;
  next_of_kin_phone?: string;
  next_of_kin_address?: string;
  next_of_kin_relationship?: string;
  email?: string;
  department: Department;
  consent_given: number;
  consent_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Appointment {
  id: number;
  patient_id: number;
  appointment_code: string;
  date: string; // YYYY-MM-DD
  time: string; // HH:MM
  department: Department;
  provider_name: string;
  reason?: string;
  status: AppointmentStatus;
  location?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
  // joined fields
  first_name?: string;
  last_name?: string;
  mrn?: string;
  phone?: string;
}

export interface MedicalRecord {
  id: number;
  patient_id: number;
  appointment_id?: number;
  author_name?: string;
  author_email?: string;
  report: string;
  diagnosis_code?: string;
  diagnosis_label?: string;
  bp_systolic?: number;
  bp_diastolic?: number;
  temperature_c?: number;
  pulse_bpm?: number;
  respiratory_rate?: number;
  weight_kg?: number;
  height_cm?: number;
  created_at: string;
  updated_at: string;
}

export interface Complaint {
  id: number;
  patient_id: number;
  message: string;
  status: ComplaintStatus;
  response?: string;
  created_at: string;
  updated_at: string;
  // joined fields
  first_name?: string;
  last_name?: string;
  mrn?: string;
}

export interface AuditLogEntry {
  id: number;
  actor_role: string;
  actor_email?: string;
  actor_id?: number;
  action: string;
  resource_type: string;
  resource_id?: string;
  detail?: string;
  created_at: string;
}

export interface OfficerOtp {
  id: number;
  user_id: number;
  code: string;
  expires_at: string;
  used: boolean;
  created_at: string;
}

export interface ActivityTrendDay {
  date: string; // YYYY-MM-DD
  dayLabel: string; // e.g. "Wed, Oct 28" or "Today (Wed)"
  shortDay: string; // "Wed"
  monthDay: string; // "Oct 28"
  isToday: boolean;
  total: number;
  completed: number;
  scheduled: number;
  checkedIn: number;
  cancelled: number;
}

export interface DashboardStats {
  total_patients: number;
  today_appointments: number;
  upcoming_appointments: number;
  departments: { department: Department; c: number }[];
  recent_patients: Patient[];
  todays_schedule: Appointment[];
  activity_trend: ActivityTrendDay[];
  seven_day_total: number;
  seven_day_average: number;
  peak_day: { label: string; count: number };
}
