import { Patient } from './types';

/* ── CSV Export Utility ── */

function escapeCSV(val: string): string {
  if (!val) return '';
  const s = String(val);
  if (s.includes(',') || s.includes('"') || s.includes('\n') || s.includes('\r')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Download CSV from array of objects */
function downloadCSV(filename: string, csvContent: string) {
  // BOM prefix for Excel Arabic support
  const bom = '\uFEFF';
  const blob = new Blob([bom + csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${filename}_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

/** Export all patients to CSV */
export function exportPatientsCSV(patients: Patient[], filename: string = 'patients_export') {
  const headers = [
    'رقم التذكرة', 'الاسم', 'العمر', 'الهاتف', 'الشكوى الرئيسية',
    'العيادة', 'ملاحظة', 'الحالة', 'مسجل بواسطة', 'تاريخ التسجيل',
    'علامات حيوية', 'ضغط الدم', 'السكر', 'النبض', 'التاريخ المرضي',
    'تم الكشف', 'التشخيص', 'العلاج', 'الفحوصات', 'تحويل', 'ملاحظة تحويل',
    'الطبيب', 'طالب الكشف', 'تاريخ الكشف',
  ];

  const rows = patients.map(p => [
    p.ticketNumber,
    p.fullNameAr,
    String(p.age),
    p.phone || '',
    p.mainComplaint,
    p.clinicName,
    p.note || '',
    p.status === 'examined' ? 'تم الكشف' : p.status === 'absent' ? 'غائب' : 'انتظار',
    p.registeredBy,
    p.registeredAt,
    p.vitalsCompleted ? 'نعم' : 'لا',
    p.bloodPressureSystolic ? `${p.bloodPressureSystolic}/${p.bloodPressureDiastolic}` : '',
    p.bloodSugar ? String(p.bloodSugar) : '',
    p.pulse ? String(p.pulse) : '',
    p.pastHistory || '',
    p.examined ? 'نعم' : 'لا',
    p.diagnosis || '',
    p.treatment || '',
    p.investigation || '',
    p.referral ? 'نعم' : 'لا',
    p.referralNote || '',
    p.doctorSignature || '',
    p.examStudentSignature || '',
    p.examinedAt || '',
  ]);

  const csvContent = [
    headers.map(h => escapeCSV(h)).join(','),
    ...rows.map(r => r.map(c => escapeCSV(c)).join(',')),
  ].join('\n');

  downloadCSV(filename, csvContent);
}

/** Export per-clinic CSV */
export function exportClinicCSV(clinicName: string, patients: Patient[]) {
  const safeName = clinicName.replace(/[^a-zA-Z0-9\u0600-\u06FF ]/g, '_').trim();
  exportPatientsCSV(patients, `clinic_${safeName}`);
}

/** Export summary CSV (one row per clinic) */
export function exportSummaryCSV(
  stats: Array<{ clinicName: string; total: number; waiting: number; examined: number; absent: number }>
) {
  const headers = ['العيادة', 'إجمالي المرضى', 'انتظار', 'تم الكشف', 'غائب'];
  const rows = stats.map(s => [s.clinicName, String(s.total), String(s.waiting), String(s.examined), String(s.absent)]);

  const csvContent = [
    headers.map(h => escapeCSV(h)).join(','),
    ...rows.map(r => r.map(c => escapeCSV(c)).join(',')),
  ].join('\n');

  downloadCSV('clinics_summary', csvContent);
}
