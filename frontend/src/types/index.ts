// frontend/src/types/index.ts
// Medipath HMS — TypeScript Domain Types
// Mirrors EduPath-SMS types but for healthcare

// ─── Enums ─────────────────────────────────────────────────────────────────

export type Role =
  | 'ADMIN' | 'DOCTOR' | 'NURSE' | 'RECEPTIONIST'
  | 'PHARMACIST' | 'LAB_TECHNICIAN' | 'PATIENT';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER' | 'PREFER_NOT_TO_SAY';

export type BloodGroup =
  | 'A_POSITIVE' | 'A_NEGATIVE' | 'B_POSITIVE' | 'B_NEGATIVE'
  | 'AB_POSITIVE' | 'AB_NEGATIVE' | 'O_POSITIVE' | 'O_NEGATIVE' | 'UNKNOWN';

export type AppointmentStatus =
  | 'SCHEDULED' | 'CONFIRMED' | 'IN_PROGRESS' | 'COMPLETED'
  | 'CANCELLED' | 'NO_SHOW' | 'RESCHEDULED';

export type AppointmentType =
  | 'OPD' | 'INPATIENT' | 'FOLLOW_UP' | 'EMERGENCY' | 'TELEMEDICINE' | 'PROCEDURE';

export type AdmissionStatus = 'ADMITTED' | 'DISCHARGED' | 'TRANSFERRED' | 'ABSCONDED' | 'DECEASED';

export type BillingStatus =
  | 'PENDING' | 'PARTIALLY_PAID' | 'PAID' | 'WAIVED' | 'CANCELLED' | 'REFUNDED';

export type PaymentMethod =
  | 'CASH' | 'MPESA' | 'NHIF' | 'SHA' | 'INSURANCE' | 'CREDIT' | 'BANK_TRANSFER' | 'WAIVER';

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED' | 'CANCELLED' | 'REFUNDED';

export type PrescriptionStatus = 'ISSUED' | 'DISPENSED' | 'PARTIALLY_DISPENSED' | 'CANCELLED';

export type LabTestStatus =
  | 'REQUESTED' | 'SAMPLE_COLLECTED' | 'PROCESSING' | 'COMPLETED' | 'CANCELLED';

export type StaffStatus = 'ACTIVE' | 'ON_LEAVE' | 'SUSPENDED' | 'TERMINATED' | 'RETIRED';

export type DepartmentType = 'CLINICAL' | 'DIAGNOSTIC' | 'SUPPORT' | 'ADMINISTRATIVE';

export type TriagePriority = 'IMMEDIATE' | 'URGENT' | 'LESS_URGENT' | 'NON_URGENT' | 'DECEASED';

// ─── Auth ──────────────────────────────────────────────────────────────────

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
  isActive: boolean;
  isVerified: boolean;
  lastLoginAt?: string;
  patient?: PatientSummary;
  staffProfile?: StaffSummary;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: AuthUser;
}

// ─── Patient ───────────────────────────────────────────────────────────────

export interface PatientSummary {
  id: string;
  patientNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  county?: string;
  bloodGroup: BloodGroup;
  nhifNumber?: string;
  shaNumber?: string;
  registeredAt: string;
  isActive: boolean;
}

export interface Patient extends PatientSummary {
  nationalId?: string;
  passportNumber?: string;
  altPhone?: string;
  email?: string;
  subCounty?: string;
  ward?: string;
  village?: string;
  postalAddress?: string;
  allergies: string[];
  chronicConditions: string[];
  emergencyContact?: string;
  emergencyPhone?: string;
  emergencyRelation?: string;
  insuranceProvider?: string;
  insurancePolicyNo?: string;
  insuranceExpiry?: string;
  user?: { email: string; isActive: boolean };
  nextOfKin?: NextOfKin[];
  appointments?: AppointmentSummary[];
  admissions?: AdmissionSummary[];
  vitalSigns?: VitalSign[];
}

export interface NextOfKin {
  id: string;
  name: string;
  relationship: string;
  phone: string;
  altPhone?: string;
  address?: string;
  isPrimary: boolean;
}

export interface RegisterPatientDto {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  middleName?: string;
  dateOfBirth: string;
  gender: Gender;
  phone: string;
  nationalId?: string;
  county?: string;
}

// ─── Staff ─────────────────────────────────────────────────────────────────

export interface StaffSummary {
  id: string;
  staffNumber: string;
  firstName: string;
  middleName?: string;
  lastName: string;
  role: Role;
  title?: string;
  specialisation?: string;
  departmentId?: string;
  department?: DepartmentSummary;
}

export interface StaffProfile extends StaffSummary {
  gender: Gender;
  phone: string;
  nationalId?: string;
  licenseNumber?: string;
  licenseExpiry?: string;
  qualifications: string[];
  joinDate: string;
  status: StaffStatus;
  photo?: string;
  county?: string;
  user?: { email: string };
}

// ─── Departments ───────────────────────────────────────────────────────────

export interface DepartmentSummary {
  id: string;
  name: string;
  code: string;
  type: DepartmentType;
}

export interface Department extends DepartmentSummary {
  description?: string;
  location?: string;
  phone?: string;
  isActive: boolean;
  head?: StaffSummary;
}

// ─── Appointments ──────────────────────────────────────────────────────────

export interface AppointmentSummary {
  id: string;
  appointmentNo: string;
  type: AppointmentType;
  status: AppointmentStatus;
  scheduledAt: string;
  doctor?: StaffSummary;
  department?: DepartmentSummary;
}

export interface Appointment extends AppointmentSummary {
  patient?: PatientSummary;
  duration: number;
  reason?: string;
  notes?: string;
  followUpDate?: string;
  medicalRecord?: MedicalRecord;
}

export interface CreateAppointmentDto {
  patientId: string;
  doctorId: string;
  departmentId: string;
  type: AppointmentType;
  scheduledAt: string;
  duration?: number;
  reason?: string;
}

// ─── Admissions ────────────────────────────────────────────────────────────

export interface AdmissionSummary {
  id: string;
  admissionNo: string;
  status: AdmissionStatus;
  admittedAt: string;
  ward?: string;
  bedNumber?: string;
}

export interface Admission extends AdmissionSummary {
  patient?: PatientSummary;
  department?: DepartmentSummary;
  dischargedAt?: string;
  dischargeNotes?: string;
  diagnosis?: string;
}

// ─── Medical Records ───────────────────────────────────────────────────────

export interface MedicalRecord {
  id: string;
  patientId: string;
  doctor?: StaffSummary;
  chiefComplaint: string;
  history?: string;
  examination?: string;
  diagnosis: string[];
  icdCodes: string[];
  plan?: string;
  notes?: string;
  followUpAdvice?: string;
  createdAt: string;
  prescriptions?: Prescription[];
  labRequests?: LabRequest[];
}

// ─── Vitals ────────────────────────────────────────────────────────────────

export interface VitalSign {
  id: string;
  temperature?: number;
  systolicBP?: number;
  diastolicBP?: number;
  heartRate?: number;
  respiratoryRate?: number;
  oxygenSat?: number;
  weight?: number;
  height?: number;
  bmi?: number;
  bloodGlucose?: number;
  painScore?: number;
  notes?: string;
  recordedAt: string;
}

// ─── Triage ────────────────────────────────────────────────────────────────

export interface TriageRecord {
  id: string;
  chiefComplaint: string;
  priority: TriagePriority;
  notes?: string;
  triageTime: string;
  staff?: StaffSummary;
}

// ─── Pharmacy ──────────────────────────────────────────────────────────────

export interface Drug {
  id: string;
  name: string;
  genericName: string;
  brand?: string;
  category: string;
  form: string;
  strength: string;
  unit: string;
  stockQuantity: number;
  reorderLevel: number;
  unitPrice: number;
  requiresPrescription: boolean;
  isControlled: boolean;
  isActive: boolean;
  expiryDate?: string;
  batchNumber?: string;
}

export interface Prescription {
  id: string;
  prescriptionNo: string;
  status: PrescriptionStatus;
  notes?: string;
  issuedAt: string;
  items: PrescriptionItem[];
  doctor?: StaffSummary;
}

export interface PrescriptionItem {
  id: string;
  drug: Pick<Drug, 'id' | 'name' | 'form' | 'strength'>;
  quantity: number;
  dosage: string;
  duration?: string;
  instructions?: string;
}

// ─── Laboratory ────────────────────────────────────────────────────────────

export interface LabTest {
  id: string;
  name: string;
  code: string;
  category: string;
  turnaroundHours: number;
  unitPrice: number;
  normalRange?: string;
  units?: string;
}

export interface LabRequest {
  id: string;
  requestNo: string;
  urgency: string;
  clinicalNotes?: string;
  status: LabTestStatus;
  requestedAt: string;
  requestedBy?: StaffSummary;
  items: LabRequestItem[];
}

export interface LabRequestItem {
  id: string;
  labTest: LabTest;
  result?: LabResult;
}

export interface LabResult {
  id: string;
  value: string;
  unit?: string;
  normalRange?: string;
  isAbnormal: boolean;
  notes?: string;
  resultedAt: string;
}

// ─── Billing ───────────────────────────────────────────────────────────────

export interface Invoice {
  id: string;
  invoiceNo: string;
  patient?: PatientSummary;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  amountPaid: number;
  balance: number;
  status: BillingStatus;
  notes?: string;
  dueDate?: string;
  createdAt: string;
  items: InvoiceItem[];
  payments: Payment[];
}

export interface InvoiceItem {
  id: string;
  description: string;
  category: string;
  quantity: number;
  unitPrice: number;
  discount: number;
  total: number;
}

export interface Payment {
  id: string;
  paymentNo: string;
  amount: number;
  method: PaymentMethod;
  status: PaymentStatus;
  reference?: string;
  paidAt?: string;
  mpesaReceiptNo?: string;
}

export interface MpesaPaymentDto {
  invoiceId: string;
  phone: string;  // 254XXXXXXXXX format
  amount: number;
}

// ─── Notifications ─────────────────────────────────────────────────────────

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'APPOINTMENT' | 'LAB_RESULT' | 'BILLING' | 'SYSTEM';
  isRead: boolean;
  link?: string;
  createdAt: string;
}

// ─── Reports ───────────────────────────────────────────────────────────────

export interface DashboardStats {
  totalPatients: number;
  newPatientsToday: number;
  appointmentsToday: number;
  admittedPatients: number;
  pendingLabRequests: number;
  pendingInvoices: number;
  revenueToday: number;
  revenueThisMonth: number;
}

// ─── API Response Wrappers ─────────────────────────────────────────────────

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export interface ApiError {
  error: string;
  message?: string;
  errors?: Array<{ field: string; message: string }>;
}
