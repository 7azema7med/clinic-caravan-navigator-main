import { Patient } from './types';

// ── Logo helper ──
function logoHeader(logoUrl?: string | null, orgName?: string): string {
  const logoHtml = logoUrl
    ? `<img src="${logoUrl}" alt="Logo" style="width:56px;height:56px;object-fit:contain;border-radius:8px;margin-bottom:4px;" />`
    : `<div style="width:56px;height:56px;background:#0891b2;border-radius:8px;display:flex;align-items:center;justify-content:center;margin-bottom:4px;">
         <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
           <path d="M4.8 2.3A.3.3 0 1 0 5 2H4a2 2 0 0 0-2 2v5a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6V4a2 2 0 0 0-2-2h-1a.2.2 0 1 0 .3.3"/>
           <path d="M8 15v1a6 6 0 0 0 6 6v0a6 6 0 0 0 6-6v-4"/>
           <circle cx="20" cy="10" r="2"/>
         </svg>
       </div>`;

  return `
    <div style="display:flex;align-items:center;gap:14px;margin-bottom:6px;">
      ${logoHtml}
      <div>
        <h1 style="color:#0891b2;margin:0;font-size:22px;font-weight:700;">${orgName || 'القافلة الطبية'}</h1>
        <p style="margin:2px 0 0;color:#64748b;font-size:13px;">نظام إدارة العيادة</p>
      </div>
    </div>
  `;
}

// ── Prescription PDF ──
export function generatePrescriptionPDF(
  patient: Patient,
  clinic: { nameAr?: string; doctorName?: string } | null | undefined,
  logoUrl?: string | null,
  orgName?: string,
) {
  const content = `
    <div style="font-family:'Cairo',sans-serif;direction:rtl;text-align:right;padding:24px;color:#1e293b;max-width:800px;margin:auto;background:white;">
      <div style="display:flex;justify-content:space-between;align-items:flex-start;border-bottom:2px solid #0891b2;padding-bottom:14px;margin-bottom:20px;">
        ${logoHeader(logoUrl, orgName)}
        <div style="text-align:left;color:#64748b;font-size:12px;">
          <p style="margin:0;">تذكرة رقم: <strong style="color:#0f172a;font-size:16px;">${patient.ticketNumber}</strong></p>
          <p style="margin:4px 0 0;">التاريخ: ${patient.examinedAt?.split('T')[0] ?? new Date().toLocaleDateString('ar-EG')}</p>
        </div>
      </div>

      <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-bottom:20px;background:#f8fafc;padding:14px;border-radius:8px;">
        <div>
          <p style="margin:0 0 4px;color:#64748b;font-size:12px;">اسم المريض</p>
          <p style="margin:0;font-weight:700;font-size:15px;">${patient.fullNameAr}</p>
        </div>
        <div>
          <p style="margin:0 0 4px;color:#64748b;font-size:12px;">العمر</p>
          <p style="margin:0;font-weight:700;font-size:15px;">${patient.age} سنة</p>
        </div>
        <div>
          <p style="margin:0 0 4px;color:#64748b;font-size:12px;">العيادة</p>
          <p style="margin:0;">${clinic?.nameAr || patient.clinicName}</p>
        </div>
        ${patient.phone ? `<div><p style="margin:0 0 4px;color:#64748b;font-size:12px;">الهاتف</p><p style="margin:0;">${patient.phone}</p></div>` : ''}
      </div>

      <div style="margin-bottom:18px;">
        <h3 style="color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:8px;font-size:14px;">الشكوى الرئيسية</h3>
        <p style="margin:0;">${patient.mainComplaint || '—'}</p>
      </div>

      <div style="margin-bottom:18px;">
        <h3 style="color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:8px;font-size:14px;">التشخيص (Diagnosis)</h3>
        <p style="margin:0;">${patient.diagnosis || 'غير مسجل'}</p>
      </div>

      <div style="margin-bottom:24px;">
        <h3 style="color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:8px;font-size:14px;">العلاج (Treatment) — Rx</h3>
        <p style="margin:0;white-space:pre-wrap;">${patient.treatment || 'غير مسجل'}</p>
      </div>

      ${patient.investigation ? `
        <div style="margin-bottom:24px;">
          <h3 style="color:#0f172a;border-bottom:1px solid #e2e8f0;padding-bottom:5px;margin-bottom:8px;font-size:14px;">فحوصات مطلوبة</h3>
          <p style="margin:0;white-space:pre-wrap;">${patient.investigation}</p>
        </div>` : ''}

      ${patient.referral ? `
        <div style="margin-bottom:24px;background:#fef2f2;padding:12px;border-radius:8px;border-right:4px solid #ef4444;">
          <h3 style="color:#b91c1c;margin:0 0 6px;font-size:14px;">تحويل (Referral)</h3>
          <p style="margin:0;">${patient.referralNote || 'مطلوب تحويل'}</p>
        </div>` : ''}

      <div style="display:flex;justify-content:space-between;margin-top:48px;padding-top:20px;border-top:1px solid #cbd5e1;">
        <div style="text-align:center;">
          <p style="margin:0 0 4px;color:#64748b;font-size:12px;">توقيع الطبيب</p>
          <div style="width:120px;height:1px;background:#94a3b8;margin:8px auto;"></div>
          <p style="font-weight:600;margin:0;">د. ${patient.doctorSignature || clinic?.doctorName || '……………'}</p>
        </div>
        <div style="text-align:center;">
          <p style="margin:0 0 4px;color:#64748b;font-size:12px;">الطالب المسؤول</p>
          <div style="width:120px;height:1px;background:#94a3b8;margin:8px auto;"></div>
          <p style="font-weight:600;margin:0;">${patient.examStudentSignature || '……………'}</p>
        </div>
      </div>

      <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:11px;border-top:1px dashed #e2e8f0;padding-top:10px;">
        هذه الوصفة صادرة من نظام إدارة القافلة الطبية — Medical Caravan System
      </div>
    </div>
  `;
  printHTML(content, `Prescription_${patient.ticketNumber}.pdf`);
}

// ── Clinic Report PDF ──
export function generateClinicReportPDF(
  clinicName: string,
  patients: Patient[],
  logoUrl?: string | null,
  orgName?: string,
) {
  const examined = patients.filter(p => p.examined);
  const waiting = patients.filter(p => !p.examined && p.status !== 'absent');
  const absent = patients.filter(p => p.status === 'absent');

  const rows = patients.map(p => {
    const statusLabel = p.examined ? 'تم الكشف' : p.status === 'absent' ? 'غائب' : 'انتظار';
    const statusColor = p.examined ? '#16a34a' : p.status === 'absent' ? '#ef4444' : '#d97706';
    return `
      <tr style="border-bottom:1px solid #e2e8f0;">
        <td style="padding:9px 10px;font-family:monospace;font-weight:600;">${p.ticketNumber}</td>
        <td style="padding:9px 10px;">${p.fullNameAr}</td>
        <td style="padding:9px 10px;text-align:center;">${p.age}</td>
        <td style="padding:9px 10px;">${p.mainComplaint}</td>
        <td style="padding:9px 10px;color:${statusColor};font-weight:600;">${statusLabel}</td>
        <td style="padding:9px 10px;">${p.diagnosis || '—'}</td>
      </tr>`;
  }).join('');

  const content = `
    <div style="font-family:'Cairo',sans-serif;direction:rtl;text-align:right;padding:24px;color:#1e293b;background:white;">
      <div style="border-bottom:2px solid #0891b2;padding-bottom:14px;margin-bottom:20px;">
        ${logoHeader(logoUrl, orgName)}
        <h2 style="color:#0891b2;margin:8px 0 0;font-size:18px;">تقرير عيادة ${clinicName}</h2>
        <p style="margin:4px 0 0;color:#64748b;font-size:12px;">
          تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')} — ${new Date().toLocaleTimeString('ar-EG')}
        </p>
      </div>

      <div style="display:flex;gap:16px;margin-bottom:28px;flex-wrap:wrap;">
        ${[
          ['الإجمالي', patients.length, '#0f172a', '#f1f5f9'],
          ['تم الكشف', examined.length, '#059669', '#ecfdf5'],
          ['انتظار', waiting.length, '#d97706', '#fffbeb'],
          ['غياب', absent.length, '#dc2626', '#fef2f2'],
        ].map(([label, val, color, bg]) => `
          <div style="flex:1;min-width:80px;background:${bg};padding:14px;border-radius:8px;text-align:center;">
            <p style="margin:0;color:#64748b;font-size:12px;">${label}</p>
            <h2 style="margin:4px 0 0;color:${color};">${val}</h2>
          </div>`).join('')}
      </div>

      <table style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px;border-bottom:2px solid #cbd5e1;text-align:right;">التذكرة</th>
            <th style="padding:10px;border-bottom:2px solid #cbd5e1;text-align:right;">الاسم</th>
            <th style="padding:10px;border-bottom:2px solid #cbd5e1;text-align:center;">العمر</th>
            <th style="padding:10px;border-bottom:2px solid #cbd5e1;text-align:right;">الشكوى</th>
            <th style="padding:10px;border-bottom:2px solid #cbd5e1;text-align:right;">الحالة</th>
            <th style="padding:10px;border-bottom:2px solid #cbd5e1;text-align:right;">التشخيص</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>

      <div style="text-align:center;margin-top:32px;color:#94a3b8;font-size:11px;border-top:1px dashed #e2e8f0;padding-top:10px;">
        تم استخراج هذا التقرير من نظام Medical Caravan
      </div>
    </div>
  `;
  printHTML(content, `ClinicReport_${clinicName.replace(/\s+/g, '_')}.pdf`);
}

// ── Global Report PDF ──
export function generateGlobalReportPDF(
  patients: Patient[],
  stats: Array<{ clinicName: string; total: number; examined: number; waiting: number; absent: number }>,
  logoUrl?: string | null,
  orgName?: string,
) {
  const total = stats.reduce((a, s) => a + s.total, 0);
  const examined = stats.reduce((a, s) => a + s.examined, 0);
  const waiting = stats.reduce((a, s) => a + s.waiting, 0);
  const absent = stats.reduce((a, s) => a + s.absent, 0);

  const statsRows = stats.map(s => `
    <tr style="border-bottom:1px solid #e2e8f0;">
      <td style="padding:9px 10px;font-weight:600;">${s.clinicName}</td>
      <td style="padding:9px 10px;text-align:center;">${s.total}</td>
      <td style="padding:9px 10px;text-align:center;color:#16a34a;font-weight:600;">${s.examined}</td>
      <td style="padding:9px 10px;text-align:center;color:#d97706;font-weight:600;">${s.waiting}</td>
      <td style="padding:9px 10px;text-align:center;color:#dc2626;font-weight:600;">${s.absent}</td>
    </tr>`).join('');

  const content = `
    <div style="font-family:'Cairo',sans-serif;direction:rtl;text-align:right;padding:24px;color:#1e293b;background:white;">
      <div style="border-bottom:2px solid #0891b2;padding-bottom:14px;margin-bottom:20px;">
        ${logoHeader(logoUrl, orgName)}
        <h2 style="color:#0891b2;margin:8px 0 0;font-size:18px;">التقرير الشامل للقافلة الطبية</h2>
        <p style="margin:4px 0 0;color:#64748b;font-size:12px;">
          تاريخ التقرير: ${new Date().toLocaleDateString('ar-EG')} — ${new Date().toLocaleTimeString('ar-EG')}
        </p>
      </div>

      <h3 style="color:#0f172a;margin-bottom:12px;">إحصائيات عامة</h3>
      <div style="display:flex;gap:16px;margin-bottom:28px;flex-wrap:wrap;">
        ${[
          ['إجمالي المرضى', total, '#0f172a', '#f1f5f9'],
          ['تم الكشف', examined, '#059669', '#ecfdf5'],
          ['انتظار', waiting, '#d97706', '#fffbeb'],
          ['غياب', absent, '#dc2626', '#fef2f2'],
        ].map(([label, val, color, bg]) => `
          <div style="flex:1;min-width:80px;background:${bg};padding:14px;border-radius:8px;text-align:center;">
            <p style="margin:0;color:#64748b;font-size:12px;">${label}</p>
            <h2 style="margin:4px 0 0;color:${color};">${val}</h2>
          </div>`).join('')}
      </div>

      <h3 style="color:#0f172a;margin-bottom:12px;">إحصائيات العيادات</h3>
      <table style="width:100%;border-collapse:collapse;margin-bottom:32px;">
        <thead>
          <tr style="background:#f8fafc;">
            <th style="padding:10px;border-bottom:2px solid #cbd5e1;text-align:right;">العيادة</th>
            <th style="padding:10px;border-bottom:2px solid #cbd5e1;text-align:center;">الإجمالي</th>
            <th style="padding:10px;border-bottom:2px solid #cbd5e1;text-align:center;">تم الكشف</th>
            <th style="padding:10px;border-bottom:2px solid #cbd5e1;text-align:center;">انتظار</th>
            <th style="padding:10px;border-bottom:2px solid #cbd5e1;text-align:center;">غياب</th>
          </tr>
        </thead>
        <tbody>${statsRows}</tbody>
      </table>

      <div style="text-align:center;margin-top:24px;color:#94a3b8;font-size:11px;border-top:1px dashed #e2e8f0;padding-top:10px;">
        تم استخراج هذا التقرير من نظام Medical Caravan — إجمالي المرضى المسجلين: ${patients.length}
      </div>
    </div>
  `;
  printHTML(content, `GlobalReport_${new Date().toISOString().split('T')[0]}.pdf`);
}

// ── Print Helper ──
function printHTML(html: string, filename: string) {
  const iframe = document.createElement('iframe');
  iframe.style.cssText = 'position:fixed;right:-10000px;bottom:-10000px;width:0;height:0;border:0;';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) { document.body.removeChild(iframe); return; }

  doc.open();
  doc.write(`<!DOCTYPE html>
<html dir="rtl" lang="ar">
<head>
  <meta charset="UTF-8" />
  <title>${filename}</title>
  <link rel="preconnect" href="https://fonts.googleapis.com" />
  <link href="https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap" rel="stylesheet" />
  <style>
    body { margin: 0; font-family: 'Cairo', sans-serif; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    @page { margin: 18mm; size: A4; }
    @media print { body { -webkit-print-color-adjust: exact; } }
  </style>
</head>
<body>${html}</body>
</html>`);
  doc.close();

  iframe.onload = () => {
    setTimeout(() => {
      try {
        iframe.contentWindow?.focus();
        iframe.contentWindow?.print();
      } catch {}
      setTimeout(() => {
        if (document.body.contains(iframe)) document.body.removeChild(iframe);
      }, 2000);
    }, 600);
  };
}
