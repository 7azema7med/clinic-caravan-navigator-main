export type UserRole = 'student' | 'admin';
export type StudentAssignment = 'registration' | 'vitals' | 'clinic' | 'research';
export type PatientStatus = 'waiting' | 'examined' | 'absent';

export interface SwitchRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  requesterAssignment: StudentAssignment;
  requesterClinic?: string;
  targetUserId: string;
  targetUserName: string;
  targetAssignment: StudentAssignment;
  targetClinic?: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
}

export interface User {
  id: string;
  username: string;
  email: string;
  studentCode?: string;
  password: string;
  fullName: string;
  role: UserRole;
  assignment?: StudentAssignment;
  assignedClinic?: string;
  loginTime?: string;
  rotationStartTime?: string;
  isActive?: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  nameAr: string;
  doctorName: string;
  isActive: boolean;
}

export interface Patient {
  id: string;
  ticketNumber: string;
  fullNameAr: string;
  age: number;
  phone?: string;
  mainComplaint: string;
  clinicId: string;
  clinicName: string;
  note?: string;
  referToVitals: boolean;
  referToResearch: boolean;
  registeredBy: string;
  registeredAt: string;
  status: PatientStatus;

  // Vital signs
  vitalsCompleted: boolean;
  bloodPressureSystolic?: number;
  bloodPressureDiastolic?: number;
  bloodSugar?: number;
  pulse?: number;
  temperature?: number;
  weight?: number;
  height?: number;
  oxygenSaturation?: number;
  pastHistory?: string;
  vitalsNote?: string;
  vitalsBy?: string;
  vitalsAt?: string;

  // Custom vital fields
  customVitals?: Record<string, string | number>;

  // Examination
  examined: boolean;
  diagnosis?: string;
  treatment?: string;
  investigation?: string;
  referral: boolean;
  referralNote?: string;
  examNote?: string;
  doctorSignature?: string;
  examStudentSignature?: string;
  examinedAt?: string;

  // Research
  researchCompleted?: boolean;
  researchResponses?: Record<string, unknown>;
  researchBy?: string;
  researchAt?: string;
}

export interface CustomVitalField {
  id: string;
  name: string;
  nameAr: string;
  unit: string;
  normalMin?: number;
  normalMax?: number;
  type: 'number' | 'text';
}

export interface VitalRanges {
  bp: {
    normalSysMax: number;
    normalDiaMax: number;
    elevatedSysMin: number;
    elevatedSysMax: number;
    highSysMin: number;
    highSysMax: number;
    highDiaMin: number;
    highDiaMax: number;
    veryHighSysMin: number;
    veryHighDiaMin: number;
    emergencySys: number;
    emergencyDia: number;
  };
  sugar: {
    low: number;
    normalMax: number;
    highMax: number;
    veryHigh: number;
  };
  pulse: {
    low: number;
    normalMax: number;
    highMax: number;
    veryHigh: number;
  };
}

export interface VitalThreshold {
  id: string;
  metric: 'blood_pressure_systolic' | 'blood_pressure_diastolic' | 'blood_sugar' | 'pulse';
  level: string;
  min_value: number | null;
  max_value: number | null;
  color: string;
  label_ar: string;
}

export interface SystemSettings {
  registrationOpen: boolean;
  rotationTimeMinutes: number;
  vitalRanges: VitalRanges;
  vitalThresholds: VitalThreshold[];
  researchQuestions: ResearchQuestion[];
  registrationFields: RegistrationField[];
  customVitalFields: CustomVitalField[];
}

export interface ResearchQuestion {
  id: string;
  question: string;
  questionAr?: string;
  type: 'text' | 'select' | 'multiselect' | 'number' | 'boolean' | 'textarea';
  options?: string[];
  required: boolean;
  order: number;
}

export interface RegistrationField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'select' | 'textarea';
  required: boolean;
  options?: string[];
}

// ── Common Complaints (categorized) ──
export const COMPLAINT_CATEGORIES: Record<string, string[]> = {
  'عام / General': [
    'صداع', 'حمى', 'دوخة', 'ضعف عام', 'فقدان شهية', 'أرق',
    'إرهاق مزمن', 'فقدان وزن', 'زيادة وزن', 'تعرق ليلي',
    'ارتفاع حرارة متكرر', 'إغماء',
  ],
  'جهاز هضمي / GI': [
    'ألم في البطن', 'غثيان', 'إسهال', 'إمساك', 'قيء',
    'حرقة معدة', 'انتفاخ', 'فقدان شهية', 'ألم أسفل البطن',
    'نزيف شرجي', 'بواسير', 'صعوبة في البلع',
  ],
  'تنفسي / Respiratory': [
    'سعال', 'ضيق في التنفس', 'ألم في الصدر', 'رشح وزكام',
    'التهاب في الحلق', 'سعال مزمن', 'بلغم', 'أزيز تنفسي',
    'ضيق تنفس عند المجهود', 'نزيف أنفي',
  ],
  'قلب وأوعية / Cardiac': [
    'ألم في الصدر', 'خفقان', 'ارتفاع ضغط الدم',
    'تورم في القدمين', 'ضيق تنفس عند الاستلقاء',
    'دوخة عند الوقوف',
  ],
  'عضلات ومفاصل / MSK': [
    'ألم في الظهر', 'ألم في المفاصل', 'ألم في الركبة',
    'ألم في الكتف', 'ألم في الرقبة', 'تنميل في الأطراف',
    'تورم مفصلي', 'ألم عضلي', 'ضعف في الأطراف',
    'ألم أسفل الظهر',
  ],
  'أعصاب / Neuro': [
    'صداع شديد', 'دوار وعدم اتزان', 'تنميل في الأطراف',
    'رعشة', 'ضعف في جانب واحد', 'تشنجات',
    'فقدان ذاكرة', 'صداع نصفي',
  ],
  'جلدية / Dermatology': [
    'طفح جلدي', 'حساسية', 'حكة جلدية', 'تقرحات جلدية',
    'تغير لون الجلد', 'جفاف الجلد', 'حب شباب', 'ثآليل',
    'فطريات جلدية', 'حروق',
  ],
  'أنف وأذن وحنجرة / ENT': [
    'ألم في الأذن', 'التهاب في الحلق', 'نزيف أنفي',
    'طنين الأذن', 'ضعف سمع', 'انسداد أنفي', 'بحة في الصوت',
    'التهاب لوزتين', 'دوخة دورانية',
  ],
  'رمد / Eye': [
    'ألم في العين', 'ضعف نظر', 'احمرار العين',
    'إفرازات من العين', 'حكة في العين', 'رؤية مشوشة',
    'حساسية للضوء', 'جفاف العين',
  ],
  'بولي / Urinary': [
    'حرقان في البول', 'ألم في الكلى', 'تكرار التبول',
    'دم في البول', 'سلس بولي', 'ألم أسفل البطن',
  ],
  'غدد / Endocrine': [
    'سكر مرتفع', 'عطش شديد', 'تبول متكرر',
    'زيادة وزن مفاجئة', 'خمول ونعاس', 'تورم في الرقبة',
  ],
};

// Flat list for backward compatibility
export const COMMON_COMPLAINTS = Object.values(COMPLAINT_CATEGORIES).flat().filter(
  (v, i, arr) => arr.indexOf(v) === i
);

export const DEFAULT_VITAL_RANGES: VitalRanges = {
  bp: {
    normalSysMax: 120,
    normalDiaMax: 80,
    elevatedSysMin: 120,
    elevatedSysMax: 129,
    highSysMin: 130,
    highSysMax: 139,
    highDiaMin: 80,
    highDiaMax: 89,
    veryHighSysMin: 140,
    veryHighDiaMin: 90,
    emergencySys: 180,
    emergencyDia: 120,
  },
  sugar: {
    low: 70,
    normalMax: 140,
    highMax: 199,
    veryHigh: 200,
  },
  pulse: {
    low: 60,
    normalMax: 100,
    highMax: 120,
    veryHigh: 120,
  },
};

export const DEFAULT_CLINICS: Clinic[] = [
  { id: '1', name: 'Pediatrics', nameAr: 'أطفال', doctorName: '', isActive: true },
  { id: '2', name: 'Internal Medicine', nameAr: 'باطنة', doctorName: '', isActive: true },
  { id: '3', name: 'Neurology', nameAr: 'مخ وأعصاب', doctorName: '', isActive: true },
  { id: '4', name: 'Dermatology', nameAr: 'جلدية', doctorName: '', isActive: true },
  { id: '5', name: 'ENT', nameAr: 'أنف وأذن وحنجرة', doctorName: '', isActive: true },
  { id: '6', name: 'Orthopedics', nameAr: 'عظام', doctorName: '', isActive: true },
  { id: '7', name: 'Ophthalmology', nameAr: 'رمد', doctorName: '', isActive: true },
  { id: '8', name: 'General Surgery', nameAr: 'جراحة عامة', doctorName: '', isActive: true },
];

export const ADMIN_USER: User = {
  id: 'admin-hazem',
  username: 'Hazrm',
  email: 'hazem@admin.com',
  studentCode: '23018123',
  password: '1232004',
  fullName: 'Hazem Ahmed',
  role: 'admin',
  isActive: true,
};

export const ASSIGNMENT_LABELS: Record<string, string> = {
  registration: 'Patient Registration',
  vitals: 'Vital Signs',
  clinic: 'Clinic Report',
  research: 'Research Questionnaire',
};
