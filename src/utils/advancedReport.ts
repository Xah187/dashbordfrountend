import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import apiClient from '../api/config';
import { companiesSubscribedApi, Company, Branch } from '../pages/CompaniesSubscribed/api/companiesSubscribedApi';

// ============================================================
// الأنواع
// ============================================================

export interface CompanyReportData {
  companyName: string;
  companyId: number;
  phone: string;
  isActive: boolean;
  subscriptionStart: string;
  subscriptionEnd: string;
  city: string;
  country: string;
  totalBranches: number;
  totalEmployees: number;
  totalProjects: number;
  openProjects: number;
  closedProjects: number;
  activeProjects: number;
  inactiveProjects: number;
}

// ============================================================
// جلب جميع الشركات
// GET /api/companies?page=N&limit=50
// ============================================================

async function fetchAllCompanies(): Promise<Company[]> {
  const all: Company[] = [];
  let page = 1;

  while (true) {
    const resp = await companiesSubscribedApi.getCompanies({
      page,
      limit: 50,
      search: '',
      number: 0,
    });

    if (!resp.success || !resp.data || resp.data.length === 0) break;

    all.push(...resp.data);

    const total = resp.countcompany ?? 0;
    if (!total || all.length >= total || resp.data.length < 50) break;
    page++;
  }

  return all;
}

// ============================================================
// جلب تفاصيل شركة من endpoint المركزي للـ Dashboard
// GET /api/companies/:id/details
//
// هذا الـ endpoint يقرأ مباشرة من قاعدة البيانات بدون
// فلترة بصلاحيات المستخدم — مثالي للـ Dashboard الإداري
//
// يُرجع:
//   subsCount      → عدد الفروع
//   projectsCount  → إجمالي المشاريع (مفتوحة + مغلقة)
//   employeesCount → عدد الموظفين
// ============================================================

interface CompanyDetails {
  subsCount: number;
  projectsCount: number;
  employeesCount: number;
}

async function fetchCompanyDetails(companyId: number): Promise<CompanyDetails> {
  try {
    const resp = await apiClient.get(`/companies/${companyId}/details`);
    if (resp.data?.success && resp.data?.data) {
      const d = resp.data.data;
      return {
        subsCount: Number(d.subsCount) || 0,
        projectsCount: Number(d.projectsCount) || 0,
        employeesCount: Number(d.employeesCount) || 0,
      };
    }
  } catch (err) {
    console.error(`خطأ في جلب تفاصيل الشركة ${companyId}:`, err);
  }
  return { subsCount: 0, projectsCount: 0, employeesCount: 0 };
}

// ============================================================
// جلب عدد المشاريع المغلقة لكل فرع
//
// BringDataprojectClosed → Disabled='false' → لا يفلتر بـ PhoneNumber
// يُرجع 15 مشروعاً في كل دفعة، نكرر مع IDfinlty حتى ننتهي
//
// BringProject يفلتر بـ PhoneNumber من الـ session لذا لا نستخدمه
// بدلاً عن ذلك: openProjects = totalProjects - closedProjects
// ============================================================

async function fetchClosedProjectsForBranch(branchId: number): Promise<number> {
  let closed = 0;
  let lastId = 0;
  let emptyStreak = 0;

  while (true) {
    try {
      const resp = await apiClient.get('/brinshCompany/BringDataprojectClosed', {
        params: { IDCompanySub: branchId, IDfinlty: lastId },
      });

      const isOk =
        resp.data?.success === true ||
        resp.data?.success === 'تمت العملية بنجاح';
      if (!isOk) break;

      const batch: any[] = resp.data.data ?? [];

      if (batch.length === 0) {
        emptyStreak++;
        // الـ endpoint يُرجع مصفوفة فارغة عند الانتهاء
        if (emptyStreak >= 2) break;
        lastId += 5;
        continue;
      }

      emptyStreak = 0;
      closed += batch.length;

      // تحديث lastId للدفعة التالية
      const last = batch[batch.length - 1];
      const newId: number = last?.ProjectID ?? last?.id ?? lastId;
      lastId = newId <= lastId ? lastId + 5 : newId;

      // إذا رجع أقل من 15 معناه وصلنا للنهاية
      if (batch.length < 15) break;
    } catch {
      break;
    }
  }

  return closed;
}

// ============================================================
// جلب جميع فروع شركة
// GET /api/companies/:id/subs?number=N
// ============================================================

async function fetchAllBranches(companyId: number): Promise<Branch[]> {
  const all: Branch[] = [];
  let lastId = 0;

  while (true) {
    const resp = await companiesSubscribedApi.getCompanyBranches(companyId, lastId, 50);
    if (!resp.success || !resp.data || resp.data.length === 0) break;

    const unique = resp.data.filter((b) => !all.some((x) => x.id === b.id));
    all.push(...unique);

    if (resp.data.length < 50) break;
    lastId = resp.data[resp.data.length - 1].id;
  }

  return all;
}

// ============================================================
// الدالة الرئيسية لتجميع بيانات التقرير
// ============================================================

export const generateAdvancedReportData = async (
  onProgress?: (msg: string) => void
): Promise<CompanyReportData[]> => {
  const log = (msg: string) => {
    console.log(msg);
    onProgress?.(msg);
  };

  log('🚀 بدء استخراج التقرير الشامل...');

  // 1. جلب قائمة الشركات
  log('📋 جارٍ جلب قائمة الشركات...');
  const companies = await fetchAllCompanies();
  log(`✅ تم جلب ${companies.length} شركة`);

  const report: CompanyReportData[] = [];

  // 2. معالجة كل شركة
  for (let i = 0; i < companies.length; i++) {
    const company = companies[i];
    log(`🏢 [${i + 1}/${companies.length}] ${company.name}`);

    // أ. جلب الأرقام الإجمالية من /:id/details (قراءة مباشرة من DB بدون قيود صلاحيات)
    const details = await fetchCompanyDetails(company.id);

    log(
      `  └─ فروع: ${details.subsCount} | موظفون: ${details.employeesCount} | إجمالي مشاريع: ${details.projectsCount}`
    );

    // ب. جلب الفروع لحساب المشاريع المغلقة
    //    openProjects = totalProjects - closedProjects
    //    (لأن BringProject يفلتر بـ session PhoneNumber ولا يصلح للداش بورد المركزي)
    let closedProjects = 0;
    let companyPhone = '—';

    // 1. محاولة جلب هاتف مدير النظام أو أول موظف للشركة (والذي غالباً هو مالك الشركة)
    try {
      const employeesRes = await companiesSubscribedApi.getCompanyEmployees(company.id, 0, 1);
      if (employeesRes.success && employeesRes.data && employeesRes.data.length > 0) {
        companyPhone = employeesRes.data[0].PhoneNumber || '—';
      }
    } catch (e) {
      console.error(`لم نتمكن من جلب موظفي الشركة ${company.id}`, e);
    }

    if (details.subsCount > 0) {
      const branches = await fetchAllBranches(company.id).catch(() => [] as Branch[]);

      // 2. كخيار بديل، إذا لم نجد رقم هاتف المالك، نأخذ رقم هاتف أول فرع
      if (branches.length > 0 && (companyPhone === '—' || !companyPhone)) {
        companyPhone = branches[0].phone || '—';
      }

      // جلب المشاريع المغلقة بشكل متوازٍ لكل الفروع
      const closedPerBranch = await Promise.all(
        branches.map((branch) =>
          fetchClosedProjectsForBranch(branch.id).catch(() => 0)
        )
      );

      closedProjects = closedPerBranch.reduce((sum, n) => sum + n, 0);
    }

    // جلب إحصائيات الاشتراكات للشركة (المشاريع المفعلة وغير المفعلة)
    let activeProjects = 0;
    let inactiveProjects = 0;
    // بما أننا لا نستطيع جلب الإحصائيات الدقيقة بدون تعديل الباك اند،
    // سنعتبر أن الشركة النشطة لديها كل مشاريعها مفعلة، والمتوقفة كل مشاريعها غير مفعلة
    if (company.isActive) {
      activeProjects = details.projectsCount;
    } else {
      inactiveProjects = details.projectsCount;
    }

    // المشاريع المفتوحة = الإجمالي من /details - المغلقة
    const openProjects = Math.max(0, details.projectsCount - closedProjects);

    log(`  └─ مشاريع نشطة: ${openProjects} | مغلقة: ${closedProjects}`);

    report.push({
      companyName: company.name || 'بدون اسم',
      companyId: company.id,
      phone: companyPhone,
      isActive: company.isActive,
      subscriptionStart: company.subscriptionStart || '',
      subscriptionEnd: company.subscriptionEnd || '',
      city: company.city || '',
      country: company.country || '',
      totalBranches: details.subsCount,
      totalEmployees: details.employeesCount,
      totalProjects: details.projectsCount,
      openProjects,
      closedProjects,
      activeProjects,
      inactiveProjects,
    });
  }

  log(`🎉 اكتمل التقرير! (${report.length} شركة)`);
  return report;
};

// ============================================================
// تصدير Excel بورقتين (ExcelJS) بتصميم احترافي مبهر
// ============================================================

export const exportToExcel = async (
  data: CompanyReportData[],
  fileName = 'التقرير_الشامل_للشركات'
): Promise<void> => {
  if (data.length === 0) {
    alert('لا توجد بيانات لتصديرها');
    return;
  }

  // 1. حساب الإجماليات
  const totals = data.reduce(
    (acc, r) => ({
      branches: acc.branches + r.totalBranches,
      employees: acc.employees + r.totalEmployees,
      projects: acc.projects + r.totalProjects,
      open: acc.open + r.openProjects,
      closed: acc.closed + r.closedProjects,
      activeP: acc.activeP + r.activeProjects,
      inactiveP: acc.inactiveP + r.inactiveProjects,
    }),
    { branches: 0, employees: 0, projects: 0, open: 0, closed: 0, activeP: 0, inactiveP: 0 }
  );

  // 2. إنشاء الـ Workbook
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Moshrif Dashboard';
  workbook.lastModifiedBy = 'Moshrif Dashboard';
  workbook.created = new Date();
  workbook.modified = new Date();

  // ==========================
  // الورقة الأولى: تفاصيل الشركات
  // ==========================
  const ws1 = workbook.addWorksheet('تفاصيل الشركات', {
    views: [{ rightToLeft: true, showGridLines: false }],
    properties: { defaultRowHeight: 30 }
  });

  // إضافة الشعار إذا أمكن
  const logoBase64 = 'iVBORw0KGgoAAAANSUhEUgAAAGQAAABkCAYAAABw4pVUAAAAAXNSR0IArs4c6QAAA6RJREFUeJzt3TFME1EAxvHvWuZ2xMSSqAtJ6cCghpDIYiASJzAxgQlMACdZ0Ekd1AkZZDMMsBE1smkgoAsDpbpC2VzaJq4tm/buHC4IFFqu13ftV/L9Eje9e9f/671XDhAQkeqsa51/lls9CDlmXe/867Z6EHIs0uoByGkKQkZByCgIGQUhoyBkFISMgpBREDIKQkZByCgIGQUhoyBkFISMgpBREDIKQkZByCgIGQUhoyBkFISMgpBREDIKQkZByCgIGQUhoyBkFISMgpBREDIKQkZByCgIGQUh0xHGQWNx4MHDCAaHLSR7LMTiwY9VKgLZfRdrH1ysfXICHyfRZeHJnIW+fguJLquhsWyte2MpFQMPpyrjPxadTFl4vxIJfNG1LC44WFyoP0oyZWF1LdrQxKiUz7l4POkgu2f2p8qNBonFge0fHUYvvNL4qI3dHf9DjsWB1bUokinzE6RUBAZul42+U4yuIZNTkVBjAMD7lfpm+uxcJJQYgBd7csrsMmz0aIP3wrnwk2JxYP6dv2EPDUeMv2CVTF+z0dGGNRMrDQ1H8Gi69tATXZbvcI0wfc1tu+19/qr2rWh+MfzbZxjaNgjg3brOe9Fn5yLo62/Ou9W0UD6HNEsyZeHLtygW37rI57yd1+S0haHh9p1nRre9v363dd/AblwpGztW+06lS0pByCgIGQUh07QgmbSLTLq5v94xk3ZRyLfXr5QMPcjWhoOBWzbGRrw/vd1lHOyH+yJtbTjo7S5jbMTGnZs2xkft0M9pSqjb3kLexf279pmvhsbiwNfvUVxNmP/wdrDvnbNSosvC9s+o8fMBbbTt3Vx3z/3SdKkIzEwEf9hUzWGp+nHzuebfMoMINUit5wTZPRdvXpqN8vqF8/8Te7VzmmZ6jWrpLmt5yTE2a7c2HHz+WDvwwZ6RU51Sz8MyP1q+7Z2ZsHFYauwYhbyLp7MXv9s2NxzjM3pl6ZIF8daTs4uwX0frhp/HqEdrV6MT4MizWfPP1I0Gqbz9FHL+/t3ujovxUbvu2ZtJuxgbtet6UbJ73i6ske9gyaS98V50iwzC+Dc5JHu8rWypFGwRTaYsxGIX/718DjUXcD9OjtcvE+etRf87ApmWryFymoKQURAyCkJGQcgoCBkFIaMgZBSEjIKQURAyCkJGQcgoCBkFIaMgZBSEjIKQURAyCkJGQcgoCBkFIaMgZBSEjIKQURAyCkJGQcgoCBkFIdPhwl1p9SBERPz5BzLsFsx9E6SMAAAAAElFTkSuQmCC';
  const logoId = workbook.addImage({
    base64: `data:image/png;base64,${logoBase64}`,
    extension: 'png',
  });

  // دمج الخلايا للترويسة
  ws1.mergeCells('A1:N4'); // 14 columns (A to N)
  const titleCell1 = ws1.getCell('A1');
  titleCell1.value = 'التقرير الشامل للشركات والمشاريع';
  titleCell1.font = { name: 'Arial', size: 24, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell1.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell1.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF0F172A' } // Slate-900 لون غامق فخم
  };

  ws1.addImage(logoId, {
    tl: { col: 0.5, row: 0.5 }, // تحريك الشعار لمكان أفضل
    ext: { width: 90, height: 90 } // تكبير الشعار ليكون مبهر
  });

  ws1.getRow(5).height = 15; // صف فارغ فاصل

  // تعريف الأعمدة للورقة الأولى بدون خاصية header لمنع تكرارها في الصف الأول المدمج
  ws1.columns = [
    { key: 'index', width: 6 },
    { key: 'companyId', width: 15 },
    { key: 'companyName', width: 45 },
    { key: 'phone', width: 18 },
    { key: 'city', width: 20 },
    { key: 'country', width: 18 },
    { key: 'isActive', width: 16 },
    { key: 'subStart', width: 18 },
    { key: 'subEnd', width: 18 },
    { key: 'branches', width: 14 },
    { key: 'employees', width: 16 },
    { key: 'projects', width: 18 },
    { key: 'activeProjects', width: 18 },
    { key: 'inactiveProjects', width: 18 },
    { key: 'open', width: 16 },
    { key: 'closed', width: 16 },
  ];

  // تنسيق صف العناوين الفعلي
  const headerRow1 = ws1.getRow(6);
  headerRow1.values = [
    '#', 'الرقم الخاص', 'اسم الشركة', 'رقم الهاتف', 'المدينة', 'الدولة', 'الحالة',
    'تاريخ الاشتراك', 'تاريخ الانتهاء', 'عدد الفروع', 'عدد الموظفين',
    'إجمالي المشاريع', 'مشاريع مفعَّلة (اشتراك)', 'مشاريع غير مفعَّلة', 'مشاريع نشطة', 'مشاريع مغلقة'
  ];
  headerRow1.height = 35;
  headerRow1.eachCell((cell) => {
    cell.font = { name: 'Arial', size: 12, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; // Blue-900 أزرق داكن احترافي
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      left: { style: 'thin', color: { argb: 'FF3B82F6' } }, // فواصل زرقاء فاتحة
      right: { style: 'thin', color: { argb: 'FF3B82F6' } }
    };
  });

  // إضافة البيانات
  data.forEach((item, idx) => {
    const row = ws1.addRow({
      index: idx + 1,
      companyId: item.companyId,
      companyName: item.companyName,
      phone: item.phone,
      city: item.city || '—',
      country: item.country || '—',
      isActive: item.isActive ? 'نشطة ✅' : 'متوقفة ❌',
      subStart: item.subscriptionStart?.slice(0, 10) || '—',
      subEnd: item.subscriptionEnd?.slice(0, 10) || '—',
      branches: item.totalBranches,
      employees: item.totalEmployees,
      projects: item.totalProjects,
      activeProjects: item.activeProjects,
      inactiveProjects: item.inactiveProjects,
      open: item.openProjects,
      closed: item.closedProjects,
    });

    const isRowEven = idx % 2 === 0;
    const baseColor = isRowEven ? 'FFFFFFFF' : 'FFF9FAFB'; // Gray-50 لون رمادي خفيف جداً

    row.eachCell((cell, colNum) => {
      // التنسيق الأساسي
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        bottom: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        left: { style: 'thin', color: { argb: 'FFEEEEEE' } },
        right: { style: 'thin', color: { argb: 'FFEEEEEE' } }
      };

      const colKey = ws1.getColumn(colNum).key as string;

      // تنسيق الأرقام بخط عريض ومحاذاة النصوص
      if (['branches', 'employees', 'projects', 'activeProjects', 'inactiveProjects', 'open', 'closed'].includes(colKey)) {
        cell.numFmt = '#,##0';
        cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FF374151' } };
      } else {
        cell.font = { name: 'Arial', size: 11, color: { argb: 'FF4B5563' } };
      }

      if (['companyName', 'city', 'country'].includes(colKey)) {
        cell.alignment = { vertical: 'middle', horizontal: 'right' };
      }

      // التلوين الأساسي للخلايا
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: baseColor } };

      // تلوين خاص لحالة الشركة (أخضر للنشطة، أحمر للمتوقفة)
      if (colKey === 'isActive') {
        if (item.isActive) {
          cell.font = { name: 'Arial', bold: true, color: { argb: 'FF15803D' } }; // Green-700
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF0FDF4' } }; // Green-50
        } else {
          cell.font = { name: 'Arial', bold: true, color: { argb: 'FFB91C1C' } }; // Red-700
          cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFEF2F2' } }; // Red-50
        }
      }
    });
  });

  // مسافة قبل صف الإجمالي
  ws1.addRow([]);

  // إضافة صف الإجمالي في أسفل الورقة
  const summaryRow = ws1.addRow({
    index: '',
    companyId: '',
    companyName: `📊 الإجمالي الكلي لـ (${data.length}) شركة`,
    phone: '',
    city: '',
    country: '',
    isActive: `نشطة: ${data.filter(d => d.isActive).length} | متوقفة: ${data.filter(d => !d.isActive).length}`,
    subStart: '',
    subEnd: '',
    branches: totals.branches,
    employees: totals.employees,
    projects: totals.projects,
    activeProjects: totals.activeP,
    inactiveProjects: totals.inactiveP,
    open: totals.open,
    closed: totals.closed,
  });

  summaryRow.height = 40;
  summaryRow.eachCell((cell, colNum) => {
    cell.font = { name: 'Arial', size: 13, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Slate-900 فخم جداً
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF1E293B' } },
      bottom: { style: 'medium', color: { argb: 'FF1E293B' } },
    };
    if (colNum >= 10) cell.numFmt = '#,##0';
  });


  // ==========================
  // الورقة الثانية: الملخص التنفيذي
  // ==========================
  const ws2 = workbook.addWorksheet('الملخص التنفيذي', {
    views: [{ rightToLeft: true, showGridLines: false }], // إخفاء الخطوط ليعطي طابع Dashboard
    properties: { defaultRowHeight: 32 }
  });

  ws2.columns = [
    { key: 'spacer', width: 8 },
    { key: 'label', width: 45 },
    { key: 'value', width: 30 },
  ];

  ws2.mergeCells('B1:C4');
  const titleCell2 = ws2.getCell('B1');
  titleCell2.value = 'الملخص التنفيذي (لوحة التحكم المركزية)';
  titleCell2.font = { name: 'Arial', size: 22, bold: true, color: { argb: 'FFFFFFFF' } };
  titleCell2.alignment = { vertical: 'middle', horizontal: 'center' };
  titleCell2.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F172A' } }; // Slate-900

  ws2.addImage(logoId, {
    tl: { col: 1.2, row: 0.5 }, // وضع الشعار في المنتصف ليكون متناسقاً
    ext: { width: 90, height: 90 }
  });

  // إضافة صف العناوين الفرعية للملخص
  const headerRow2 = ws2.getRow(5);
  headerRow2.values = ['', 'المؤشر الإحصائي', 'القيمة'];
  headerRow2.height = 30;
  headerRow2.eachCell((cell, colNum) => {
    if (colNum === 1) return;
    cell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } }; // Blue-900
    cell.alignment = { vertical: 'middle', horizontal: 'center' };
    cell.border = {
      top: { style: 'medium', color: { argb: 'FF1E3A8A' } },
      bottom: { style: 'medium', color: { argb: 'FF1E3A8A' } }
    };
  });

  ws2.getRow(6).height = 15;

  const summaryData = [
    { label: '🏢 إجمالي الشركات المسجلة', value: data.length, type: 'header' },
    { label: '✅ الشركات النشطة', value: data.filter((d) => d.isActive).length, type: 'data' },
    { label: '❌ الشركات المتوقفة', value: data.filter((d) => !d.isActive).length, type: 'data' },
    { label: '──────────', value: '', type: 'divider' },
    { label: '🌍 إجمالي الفروع المتصلة', value: totals.branches, type: 'header' },
    { label: '👥 إجمالي المستخدمين / الموظفين', value: totals.employees, type: 'header' },
    { label: '──────────', value: '', type: 'divider' },
    { label: '🏗️ إجمالي المشاريع في المنصة', value: totals.projects, type: 'header' },
    { label: '🟢 المشاريع النشطة (مفتوحة)', value: totals.open, type: 'data' },
    { label: '🔴 المشاريع المغلقة', value: totals.closed, type: 'data' },
    { label: '──────────', value: '', type: 'divider' },
    { label: '📅 تاريخ استخراج التقرير', value: new Date().toLocaleString('ar-SA'), type: 'info' },
  ];

  summaryData.forEach((item) => {
    const row = ws2.addRow({ spacer: '', label: item.label, value: item.value });

    row.eachCell((cell, colNum) => {
      if (colNum === 1) return;

      cell.alignment = { vertical: 'middle', horizontal: colNum === 2 ? 'right' : 'center' };

      if (item.type === 'divider') {
        cell.font = { color: { argb: 'FFD1D5DB' } }; // Gray-300
      } else if (item.type === 'header') {
        cell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF1E3A8A' } };
        cell.border = { bottom: { style: 'thin', color: { argb: 'FF93C5FD' } } }; // Blue-300
      } else if (item.type === 'data') {
        cell.font = { name: 'Arial', size: 14, bold: true, color: { argb: 'FF374151' } };
        cell.border = { bottom: { style: 'dotted', color: { argb: 'FFE5E7EB' } } }; // Gray-200
      } else if (item.type === 'info') {
        cell.font = { name: 'Arial', size: 12, italic: true, color: { argb: 'FF6B7280' } };
      }

      if (typeof item.value === 'number') {
        cell.numFmt = '#,##0';
      }
    });
  });

  // تصدير الملف كـ Blob وحفظه
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `${fileName}.xlsx`);
};
