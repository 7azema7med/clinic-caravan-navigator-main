import { Patient, Clinic } from './types';

export function generatePrescriptionPDF(patient: Patient, clinic: Clinic | null | undefined) {
  const content = `
    <div style="font-family: 'Cairo', sans-serif; direction: rtl; text-align: right; padding: 20px; color: #1e293b; max-width: 800px; margin: auto; background: white;">
      <div style="text-align: center; border-bottom: 2px solid #0891b2; padding-bottom: 10px; margin-bottom: 20px;">
        <h1 style="color: #0891b2; margin: 0; font-size: 24px;">الوصفة الطبية (Prescription)</h1>
        <p style="margin: 5px 0 0; color: #64748b;">قافلة طبية - ${clinic?.nameAr || patient.clinicName}</p>
      </div>

      <div style="display: flex; justify-content: space-between; margin-bottom: 20px; background: #f8fafc; padding: 15px; border-radius: 8px;">
        <div>
          <p style="margin: 0 0 5px;"><strong>تذكرة رقم:</strong> ${patient.ticketNumber}</p>
          <p style="margin: 0;"><strong>التاريخ:</strong> ${patient.examinedAt?.split(',')[0] || new Date().toLocaleDateString('en-EG')}</p>
        </div>
        <div>
          <p style="margin: 0 0 5px;"><strong>اسم المريض:</strong> ${patient.fullNameAr}</p>
          <p style="margin: 0;"><strong>العمر:</strong> ${patient.age} سنة</p>
        </div>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">الشكوى الرئيسية (Complaint)</h3>
        <p style="margin-top: 5px;">${patient.mainComplaint}</p>
      </div>

      <div style="margin-bottom: 20px;">
        <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">التشخيص (Diagnosis)</h3>
        <p style="margin-top: 5px;">${patient.diagnosis || 'غير مسجل'}</p>
      </div>

      <div style="margin-bottom: 30px;">
        <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">العلاج (Treatment) - Rx</h3>
        <p style="margin-top: 5px; white-space: pre-wrap;">${patient.treatment || 'غير مسجل'}</p>
      </div>

      ${patient.investigation ? `
        <div style="margin-bottom: 30px;">
          <h3 style="color: #0f172a; border-bottom: 1px solid #e2e8f0; padding-bottom: 5px;">فحوصات مطلوبة (Investigations)</h3>
          <p style="margin-top: 5px; white-space: pre-wrap;">${patient.investigation}</p>
        </div>
      ` : ''}

      ${patient.referral ? `
        <div style="margin-bottom: 30px; background: #fef2f2; padding: 10px; border-radius: 8px; border-right: 4px solid #ef4444;">
          <h3 style="color: #b91c1c; margin-top: 0;">تحويل (Referral)</h3>
          <p style="margin: 5px 0 0;">${patient.referralNote || 'مطلوب تحويل'}</p>
        </div>
      ` : ''}

      <div style="display: flex; justify-content: space-between; margin-top: 50px; padding-top: 20px; border-top: 1px solid #cbd5e1;">
        <div style="text-align: center;">
          <p style="margin: 0 0 5px; color: #64748b;">توقيع الطبيب</p>
          <p style="font-weight: bold; margin: 0;">د. ${patient.doctorSignature || clinic?.doctorName || ''}</p>
        </div>
        <div style="text-align: center;">
          <p style="margin: 0 0 5px; color: #64748b;">الطالب</p>
          <p style="font-weight: bold; margin: 0;">${patient.examStudentSignature || ''}</p>
        </div>
      </div>
    </div>
  `;

  printHTML(content, `Prescription_${patient.ticketNumber}.pdf`);
}

export function generateClinicReportPDF(clinicName: string, patients: Patient[]) {
  const examined = patients.filter(p => p.examined);
  const waiting = patients.filter(p => !p.examined && p.status !== 'absent');
  const absent = patients.filter(p => p.status === 'absent');

  let rows = '';
  patients.forEach(p => {
    const status = p.examined ? 'تم الكشف' : p.status === 'absent' ? 'غائب' : 'انتظار';
    const statusColor = p.examined ? '#16a34a' : p.status === 'absent' ? '#ef4444' : '#d97706';
    rows += `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-family: monospace;">${p.ticketNumber}</td>
        <td style="padding: 10px;">${p.fullNameAr}</td>
        <td style="padding: 10px;">${p.age}</td>
        <td style="padding: 10px;">${p.mainComplaint}</td>
        <td style="padding: 10px; color: ${statusColor}; font-weight: bold;">${status}</td>
        <td style="padding: 10px;">${p.diagnosis || '-'}</td>
      </tr>
    `;
  });

  const content = `
    <div style="font-family: 'Cairo', sans-serif; direction: rtl; text-align: right; padding: 20px; color: #1e293b; background: white;">
      <div style="text-align: center; border-bottom: 2px solid #0891b2; padding-bottom: 10px; margin-bottom: 20px;">
        <h1 style="color: #0891b2; margin: 0;">تقرير عيادة ${clinicName}</h1>
        <p style="margin: 5px 0 0; color: #64748b;">تاريخ التقرير: ${new Date().toLocaleDateString('en-EG')} - ${new Date().toLocaleTimeString('en-EG')}</p>
      </div>

      <div style="display: flex; gap: 20px; margin-bottom: 30px; justify-content: center;">
        <div style="background: #f1f5f9; padding: 15px 30px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #64748b;">إجمالي المرضى</p>
          <h2 style="margin: 5px 0 0; color: #0f172a;">${patients.length}</h2>
        </div>
        <div style="background: #ecfdf5; padding: 15px 30px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #64748b;">تم الكشف</p>
          <h2 style="margin: 5px 0 0; color: #059669;">${examined.length}</h2>
        </div>
        <div style="background: #fffbeb; padding: 15px 30px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #64748b;">انتظار</p>
          <h2 style="margin: 5px 0 0; color: #d97706;">${waiting.length}</h2>
        </div>
        <div style="background: #fef2f2; padding: 15px 30px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #64748b;">غياب</p>
          <h2 style="margin: 5px 0 0; color: #dc2626;">${absent.length}</h2>
        </div>
      </div>

      <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
        <thead>
          <tr style="background: #f8fafc; text-align: right;">
            <th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e1;">التذكرة</th>
            <th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e1;">الاسم</th>
            <th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e1;">العمر</th>
            <th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e1;">الشكوى</th>
            <th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e1;">الحالة</th>
            <th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e1;">التشخيص</th>
          </tr>
        </thead>
        <tbody>
          ${rows}
        </tbody>
      </table>
    </div>
  `;

  printHTML(content, `ClinicReport_${clinicName.replace(/\s+/g, '_')}.pdf`);
}

export function generateGlobalReportPDF(patients: Patient[], stats: Array<{ clinicName: string; total: number; examined: number; waiting: number; absent: number; }>) {
  const total = stats.reduce((acc, curr) => acc + curr.total, 0);
  const examined = stats.reduce((acc, curr) => acc + curr.examined, 0);
  const waiting = stats.reduce((acc, curr) => acc + curr.waiting, 0);
  const absent = stats.reduce((acc, curr) => acc + curr.absent, 0);

  let statsRows = '';
  stats.forEach(s => {
    statsRows += `
      <tr style="border-bottom: 1px solid #e2e8f0;">
        <td style="padding: 10px; font-weight: bold;">${s.clinicName}</td>
        <td style="padding: 10px; text-align: center;">${s.total}</td>
        <td style="padding: 10px; text-align: center; color: #16a34a;">${s.examined}</td>
        <td style="padding: 10px; text-align: center; color: #d97706;">${s.waiting}</td>
        <td style="padding: 10px; text-align: center; color: #dc2626;">${s.absent}</td>
      </tr>
    `;
  });

  const content = `
    <div style="font-family: 'Cairo', sans-serif; direction: rtl; text-align: right; padding: 20px; color: #1e293b; background: white;">
      <div style="text-align: center; border-bottom: 2px solid #0891b2; padding-bottom: 10px; margin-bottom: 20px;">
        <h1 style="color: #0891b2; margin: 0;">التقرير الشامل للقافلة الطبية</h1>
        <p style="margin: 5px 0 0; color: #64748b;">تاريخ التقرير: ${new Date().toLocaleDateString('en-EG')} - ${new Date().toLocaleTimeString('en-EG')}</p>
      </div>

      <h2 style="color: #0f172a; margin-bottom: 15px;">إحصائيات عامة</h2>
      <div style="display: flex; gap: 20px; margin-bottom: 30px;">
        <div style="flex: 1; background: #f1f5f9; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #64748b;">إجمالي المرضى</p>
          <h2 style="margin: 5px 0 0; color: #0f172a;">${total}</h2>
        </div>
        <div style="flex: 1; background: #ecfdf5; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #64748b;">تم الكشف</p>
          <h2 style="margin: 5px 0 0; color: #059669;">${examined}</h2>
        </div>
        <div style="flex: 1; background: #fffbeb; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #64748b;">انتظار</p>
          <h2 style="margin: 5px 0 0; color: #d97706;">${waiting}</h2>
        </div>
        <div style="flex: 1; background: #fef2f2; padding: 15px; border-radius: 8px; text-align: center;">
          <p style="margin: 0; color: #64748b;">غياب</p>
          <h2 style="margin: 5px 0 0; color: #dc2626;">${absent}</h2>
        </div>
      </div>

      <h2 style="color: #0f172a; margin-bottom: 15px;">إحصائيات العيادات</h2>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 40px;">
        <thead>
          <tr style="background: #f8fafc; text-align: right;">
            <th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e1;">العيادة</th>
            <th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e1; text-align: center;">الإجمالي</th>
            <th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e1; text-align: center;">تم الكشف</th>
            <th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e1; text-align: center;">انتظار</th>
            <th style="padding: 12px 10px; border-bottom: 2px solid #cbd5e1; text-align: center;">غياب</th>
          </tr>
        </thead>
        <tbody>
          ${statsRows}
        </tbody>
      </table>
      
      <div style="text-align: center; margin-top: 50px; color: #94a3b8; font-size: 14px;">
        تم استخراج هذا التقرير من نظام Medical Caravan
      </div>
    </div>
  `;

  printHTML(content, `GlobalReport_${new Date().toISOString().split('T')[0]}.pdf`);
}

function printHTML(html: string, filename: string) {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '-10000px';
  iframe.style.bottom = '-10000px';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) return;

  doc.open();
  doc.write(`
    <html>
      <head>
        <title>${filename}</title>
        <style>
          @import url('https://fonts.googleapis.com/css2?family=Cairo:wght@400;600;700&display=swap');
          body { margin: 0; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
          @page { margin: 20mm; }
        </style>
      </head>
      <body>
        ${html}
      </body>
    </html>
  `);
  doc.close();

  iframe.onload = () => {
    setTimeout(() => {
      iframe.contentWindow?.focus();
      iframe.contentWindow?.print();
      setTimeout(() => {
        document.body.removeChild(iframe);
      }, 1000);
    }, 500);
  };
}
