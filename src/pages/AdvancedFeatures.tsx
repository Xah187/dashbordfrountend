import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Card,
  CardContent,
  Typography,
  Tab,
  Tabs,
  Box,
  Button,
  TextField,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Pagination,
  Alert,
  Skeleton,
  ButtonGroup,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  Snackbar
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  AttachMoney as MoneyIcon,
  PictureAsPdf as PdfIcon,
  TableView as ExcelIcon,
  Download as DownloadIcon,
  Edit as EditIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import RefreshIcon from '@mui/icons-material/Refresh';
import Tooltip from '@mui/material/Tooltip';
import Autocomplete from '@mui/material/Autocomplete';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { apiClient, API_BASE_URL } from '../api/config';
import { authUtils } from '../api/config';
import {
  fetchCompanies,
  fetchCompanyEmployees
} from '../api/database-api';
import { fetchSubscriptions } from '../api/subscriptions';
import { fetchDashboardReports } from '../api/dashboard';
import { getSoftSubscriptionStatusChipSx } from '../utils/colorUtils';
import { companiesSubscribedApi } from './CompaniesSubscribed/api';

// Arabic PDF font support (Tajawal)
let TAJAWAL_REG_BASE64: string | null = null;
let TAJAWAL_BOLD_BASE64: string | null = null;

const arrayBufferToBase64 = (buffer: ArrayBuffer) => {
  let binary = '';
  const bytes = new Uint8Array(buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return window.btoa(binary);
};

const loadArabicFont = async () => {
  if (TAJAWAL_REG_BASE64 && TAJAWAL_BOLD_BASE64) return;
  try {
    const [regRes, boldRes] = await Promise.all([
      fetch('/assets/fonts/Tajawal-Regular.ttf'),
      fetch('/assets/fonts/Tajawal-Bold.ttf'),
    ]);
    const [regBuf, boldBuf] = await Promise.all([
      regRes.arrayBuffer(),
      boldRes.arrayBuffer(),
    ]);
    TAJAWAL_REG_BASE64 = arrayBufferToBase64(regBuf);
    TAJAWAL_BOLD_BASE64 = arrayBufferToBase64(boldBuf);
  } catch (e) {
    console.warn('Failed to load Arabic fonts, PDF text may appear garbled.', e);
  }
};

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const AdvancedFeatures: React.FC = () => {
  const [activeTab, setActiveTab] = useState(0);
  const [loading, setLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Data states
  const [requests, setRequests] = useState([]); // الشركات
  const [subscriptions, setSubscriptions] = useState([]); // الاشتراكات
  const [employees, setEmployees] = useState<any[]>([]); // مستخدمين الشركة
  const [employeesLastIds, setEmployeesLastIds] = useState<number[]>([0]);
  const [employeeSearchTerm, setEmployeeSearchTerm] = useState('');
  const [employeeSearchLoading, setEmployeeSearchLoading] = useState(false);
  const [isEmployeeSearchMode, setIsEmployeeSearchMode] = useState(false);
  const [employeeSearchLastIds, setEmployeeSearchLastIds] = useState<number[]>([0]);

  // بحث الشركة لاختيارها لعرض مستخدمينها
  const [companySearchTerm, setCompanySearchTerm] = useState('');
  const [companySearchResults, setCompanySearchResults] = useState<any[]>([]);
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>('');
  const [selectedCompanyName, setSelectedCompanyName] = useState<string>('');
  const [companySearchLoading, setCompanySearchLoading] = useState(false);
  const [companyNoResults, setCompanyNoResults] = useState(false);

  // كاش لجميع الشركات - تحميل مرة واحدة
  const [allCompaniesCache, setAllCompaniesCache] = useState<any[]>([]);
  const [isLoadingAllCompanies, setIsLoadingAllCompanies] = useState(false);

  // حالات نافذة تعديل المستخدم
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editFormData, setEditFormData] = useState<{
    id: string;
    userName: string;
    IDNumber: string;
    PhoneNumber: string;
    job: string;
    jobdiscrption: string;
  }>({
    id: '',
    userName: '',
    IDNumber: '',
    PhoneNumber: '',
    job: '',
    jobdiscrption: '',
  });
  const [editLoading, setEditLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // تم إلغاء ميزة "البحثات الأخيرة"

  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10; // ثابت على 10 عناصر لكل صفحة

  // لا حاجة لتتبّع lastId هنا بعد إزالة نشاطات الدخول

  // Filters
  const [projectFilter, setProjectFilter] = useState('');

  // دوال معالجة تغيير الفلاتر
  const handleProjectFilterChange = (value: string) => {
    setProjectFilter(value);
    setPage(1); // إعادة تعيين الصفحة عند تغيير الفلتر
  };

  // تم إزالة فلترة الحالة

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(1); // إعادة تعيين الصفحة إلى 1 عند تغيير التبويب
    setTotalItems(0);
    setTotalPages(1);
    if (newValue === 2) {
      setEmployeesLastIds([0]);
      setEmployeeSearchLastIds([0]);
    }
  };

  const fetchData = async (endpoint: string, params: any = {}) => {
    try {
      setLoading(true);
      setError(null);

      let paginatedData = [];
      let total = 0;
      let pagination = null;

      // ربط كل endpoint بالـ API الحقيقي المناسب مع pagination
      switch (endpoint) {
        case 'requests':
          // استخدام API الشركات الحقيقي مع pagination
          try {
            const result = await fetchCompanies({ limit: itemsPerPage, page: page });
            paginatedData = result.companies || [];
            pagination = result.pagination;
            total = pagination?.totalItems || 0;


          } catch (error) {
            console.error('❌ Error fetching companies:', error);
            paginatedData = [];
            total = 0;
          }
          break;
        // تم إزالة نشاطات الدخول
        case 'revenue': {
          // الاشتراكات
          try {
            const result = await fetchSubscriptions({ page: page, limit: itemsPerPage });
            paginatedData = result.data || [];
            total = result.pagination?.totalItems || 0;
          } catch (error) {
            console.error('❌ Error fetching subscriptions:', error);
            paginatedData = [];
            total = 0;
          }
          break;
        }
        case 'financial-custody': {
          // تم حذف تبويب قوالب المراحل
          paginatedData = [];
          total = 0;
          break;
        }
        case 'company-employees': {
          if (!selectedCompanyId) {
            paginatedData = [];
            total = 0;
            break;
          }
          try {
            const numberParam = employeesLastIds[page - 1] || 0;
            const result = await fetchCompanyEmployees(String(selectedCompanyId), { lastId: numberParam, limit: itemsPerPage });
            const all = (result.employees || []).sort((a: any, b: any) => (Number(a.id) || 0) - (Number(b.id) || 0));
            const pageData = all.slice(0, itemsPerPage);
            paginatedData = pageData;
            const hasMore = all.length > itemsPerPage;
            const nextLastId = pageData.reduce((m: number, a: any) => Math.max(m, Number(a.id) || 0), numberParam);
            setEmployeesLastIds((prev) => {
              const copy = [...prev];
              copy[page] = nextLastId;
              return copy;
            });
            total = hasMore ? page * itemsPerPage + 1 : (page - 1) * itemsPerPage + pageData.length;
          } catch (error) {
            console.error('❌ Error fetching company employees:', error);
            paginatedData = [];
            total = (page - 1) * itemsPerPage;
          }
          break;
        }
        default:
          throw new Error('نوع البيانات غير مدعوم');
      }

      // تحديث إجمالي العناصر وعدد الصفحات
      setTotalItems(total);
      setTotalPages(Math.ceil(total / itemsPerPage));



      return paginatedData;
    } catch (err: any) {
      console.error('خطأ في جلب البيانات:', err);
      setError(err.response?.data?.message || err.message || 'فشل في جلب البيانات');
      setTotalItems(0);
      setTotalPages(1);
      return [];
    } finally {
      setLoading(false);
    }
  };

  // جلب صفحة نتائج بحث الموظفين بشكل متدرج حسب lastId
  const loadEmployeeSearchPage = async (currentPage: number) => {
    if (activeTab !== 1) return;
    if (!selectedCompanyId) return;
    const term = (employeeSearchTerm || '').trim().toLowerCase();
    if (!term) return;

    try {
      setEmployeeSearchLoading(true);

      const targetCount = itemsPerPage;
      const startLastId = employeeSearchLastIds[currentPage - 1] || 0;
      
      // استخدام API الموظفين وتمرير كلمة البحث للباك إند مباشرة
      const result = await fetchCompanyEmployees(String(selectedCompanyId), { 
        lastId: startLastId, 
        limit: itemsPerPage,
        searchTerm: term
      });
      
      const collected = (result.employees || []) as any[];
      let workingLastId = startLastId;
      if (collected.length > 0) {
        workingLastId = collected.reduce((max, emp) => {
          const id = Number(emp.id) || 0;
          return id > max ? id : max;
        }, startLastId);
      }

      setEmployees(collected);
      setIsEmployeeSearchMode(true);
      // حفظ lastId للصفحة الحالية لاستخدامه في الصفحات التالية
      setEmployeesLastIds((prev) => prev); // بدون تغيير لمسار العرض العادي
      setEmployeeSearchLastIds((prev) => {
        const copy = [...prev];
        copy[currentPage] = workingLastId;
        return copy;
      });

      // حساب إجمالي العناصر بشكل تقديري لدعم الترقيم (يُظهر وجود المزيد إذا كانت الصفحة ممتلئة)
      const hasMore = collected.length === itemsPerPage;
      const total = hasMore ? currentPage * itemsPerPage + 1 : (currentPage - 1) * itemsPerPage + collected.length;
      setTotalItems(total);
      setTotalPages(Math.max(1, Math.ceil(total / itemsPerPage)));
    } catch (e) {
      console.error('❌ Error in employee search:', e);
      setEmployees([]);
      setIsEmployeeSearchMode(true);
      setTotalItems((current) => (page - 1) * itemsPerPage);
      setTotalPages((_) => Math.max(1, page - 1));
    } finally {
      setEmployeeSearchLoading(false);
    }
  };

  const loadData = async (tabIndex: number) => {
    const filters = {
      ...(projectFilter && { projectId: projectFilter })
    };

    switch (tabIndex) {
      case 0: {
        const reqs = await fetchData('requests', filters);
        setRequests(reqs);
        break;
      }
      case 1: {
        // إذا كان وضع البحث مفعلاً، لا نجلب القائمة العادية
        if (isEmployeeSearchMode && employeeSearchTerm.trim()) {
          await loadEmployeeSearchPage(page);
        } else {
          const emps = await fetchData('company-employees', filters);
          setEmployees(emps);
        }
        break;
      }
    }
  };

  // تحميل البيانات عند تغيير التبويب أو الصفحة أو الفلاتر أو الشركة المحددة (للمستخدمين)
  useEffect(() => {
    loadData(activeTab);
  }, [activeTab, page, projectFilter, selectedCompanyId]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'غير محدد';
    return new Date(dateString).toLocaleDateString('en-GB'); // Gregorian date format
  };

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'SAR'
    }).format(amount);
  };

  // يحوّل أي قيمة إلى نص عربي آمن مع استبدال undefined/null/NaN ب"غير محدد"
  const safeText = (value: any, max?: number): string => {
    const raw = value === undefined || value === null ? '' : String(value);
    const t = raw.trim();
    const needsFallback =
      t === '' ||
      t.toLowerCase() === 'undefined' ||
      t.toLowerCase() === 'null' ||
      t.toLowerCase() === 'nan';
    const out = needsFallback ? 'غير محدد' : t;
    return max ? out.substring(0, max) : out;
  };

  // بناء HTML للطباعة (يعتمد على متصفح النظام لطباعة PDF بدعم عربي صحيح)
  const buildPrintableHtml = (dataToExport: any[]) => {
    const title = getTabName();
    const data = dataToExport;
    const printDate = new Date().toLocaleString('ar-SA');

    // رؤوس الأعمدة حسب التبويب
    let headers: string[] = [];
    let rowsHtml = '';
    const num = (i: number) => i + 1;

    if (activeTab === 0) {
      headers = ['م', 'رقم الشركة', 'اسم الشركة', 'المدينة', 'الدولة', 'السجل', 'الفروع المسموحة', 'بداية الاشتراك', 'نهاية الاشتراك'];
      rowsHtml = data.map((item: any, i: number) => `
        <tr>
          <td>${safeText(num(i))}</td>
          <td>${safeText(item.id)}</td>
          <td>${safeText(item.name)}</td>
          <td>${safeText(item.city)}</td>
          <td>${safeText(item.country)}</td>
          <td>${safeText(item.registrationNumber)}</td>
          <td>${safeText(item.branchesAllowed)}</td>
          <td>${safeText(formatDate(item.subscriptionStart))}</td>
          <td>${safeText(formatDate(item.subscriptionEnd))}</td>
        </tr>
      `).join('');
    } else if (activeTab === 1) {
      headers = ['م', 'المعرف', 'الاسم', 'الوظيفة', 'القسم', 'الهاتف', 'الحالة'];
      rowsHtml = data.map((item: any, i: number) => `
        <tr>
          <td>${safeText(num(i))}</td>
          <td>${safeText(item.id)}</td>
          <td>${safeText(item.userName)}</td>
          <td>${safeText(item.job)}</td>
          <td>${safeText(item.jobHOM)}</td>
          <td>${safeText(item.PhoneNumber)}</td>
          <td>${String(item.Activation).toLowerCase() === 'true' ? 'نشط' : 'غير نشط'}</td>
        </tr>
      `).join('');
    }

    const headHtml = headers.map(h => `<th>${h}</th>`).join('');

    return `<!doctype html>
    <html lang="ar" dir="rtl">
    <head>
      <meta charset="utf-8" />
      <title>${title}</title>
      <style>
        @font-face {
          font-family: 'Tajawal';
          src: url('/assets/fonts/Tajawal-Regular.ttf') format('truetype');
          font-weight: normal;
          font-style: normal;
        }
        @font-face {
          font-family: 'Tajawal';
          src: url('/assets/fonts/Tajawal-Bold.ttf') format('truetype');
          font-weight: bold;
          font-style: normal;
        }
        body { font-family: 'Tajawal', Arial, sans-serif; margin: 24px; }
        h1 { margin: 0 0 12px; font-size: 18px; }
        .meta { color: #666; margin-bottom: 16px; font-size: 12px; }
        table { width: 100%; border-collapse: collapse; }
        thead th { background: #297fb9; color: #fff; padding: 8px; font-weight: 700; font-size: 12px; }
        tbody td { border-bottom: 1px solid #eee; padding: 6px 8px; font-size: 12px; }
        tbody tr:nth-child(even) td { background: #fafafa; }
        .footer { margin-top: 12px; font-size: 11px; color: #333; }
        @media print {
          @page { size: A4 landscape; margin: 10mm; }
        }
      </style>
    </head>
    <body>
      <h1>تقرير: ${title}</h1>
      <div class="meta">تاريخ التصدير: ${printDate} • الصفحة ${page} من ${totalPages}</div>
      <table>
        <thead><tr>${headHtml}</tr></thead>
        <tbody>${rowsHtml}</tbody>
      </table>
      <div class="footer">إجمالي السجلات المعروضة: ${data.length}</div>
      <script>window.onload = () => { setTimeout(() => window.print(), 300); };</script>
    </body>
    </html>`;
  };

  const printToPDF = async () => {
    if (isExporting) return;
    try {
      const dataToExport = await getAllExportData();
      if (dataToExport.length === 0) {
        alert('لا توجد بيانات للتصدير');
        return;
      }
      const html = buildPrintableHtml(dataToExport);
      const win = window.open('', '_blank');
      if (win) {
        win.document.open();
        win.document.write(html);
        win.document.close();
      }
    } catch (error) {
      console.error('خطأ في تصدير PDF:', error);
      alert('حدث خطأ في تصدير ملف PDF');
    }
  };
  // ملاحظة: سنعتمد على الخط والمحاذاة فقط بدون إدراج علامات RTL

  const getStatusChip = (status: string) => {
    const raw = (status || '').toString().trim().toLowerCase();
    const labelMap: Record<string, string> = {
      'active': 'نشط',
      'expired': 'منتهي',
      'approved': 'موافق عليه',
      'rejected': 'مرفوض',
      'pending': 'معلق',
      'completed': 'مكتمل',
      'true': 'نشط',
      'false': 'غير نشط'
    };
    const statusForColor = raw === 'true' ? 'active' : raw === 'false' ? 'ملغي' : raw;
    const sx = getSoftSubscriptionStatusChipSx(statusForColor);
    const isUndefinedish = raw === '' || raw === 'undefined' || raw === 'null' || raw === 'nan';
    const label = labelMap[raw] || (isUndefinedish ? 'غير محدد' : status);
    return <Chip label={label} size="small" sx={{ ...sx, fontWeight: 'bold' }} />;
  };

  // Get current tab data helper
  const getCurrentTabData = () => {
    switch (activeTab) {
      case 0: return requests;
      case 1: return employees;
      default: return [];
    }
  };

  // Get tab name helper
  const getTabName = () => {
    const tabNames = [
      'بيانات الشركات',
      'مستخدمين الشركة'
    ];
    return tabNames[activeTab] || 'البيانات';
  };

  // حساب رقم الصف العام
  const getRowNumber = (index: number) => (page - 1) * itemsPerPage + index + 1;

  // تحميل جميع الشركات مرة واحدة (محسّن)
  const loadAllCompanies = async () => {
    if (allCompaniesCache.length > 0) return allCompaniesCache;
    if (isLoadingAllCompanies) return []; // تجنب التحميل المزدوج

    setIsLoadingAllCompanies(true);
    try {
      const allCompanies: any[] = [];
      let currentPage = 1;
      let hasMore = true;
      const pageLimit = 50; // جلب 50 شركة في كل طلب لتسريع العملية

      while (hasMore) {
        const result = await fetchCompanies({ limit: pageLimit, page: currentPage });
        const companies = result?.companies || [];
        allCompanies.push(...companies);

        // التحقق من وجود المزيد
        hasMore = Boolean(result?.hasMore) && companies.length === pageLimit;
        currentPage++;

        // حماية من حلقات لا نهائية (حد أقصى 100 صفحة = 5000 شركة)
        if (currentPage > 100) break;
      }

      console.log(`✅ Loaded ${allCompanies.length} companies into cache`);
      setAllCompaniesCache(allCompanies);
      return allCompanies;
    } catch (e) {
      console.error('❌ Error loading all companies:', e);
      return [];
    } finally {
      setIsLoadingAllCompanies(false);
    }
  };

  // بحث الشركات من الكاش (سريع جداً)
  const handleSearchCompanies = async () => {
    try {
      if (!companySearchTerm || companySearchTerm.trim().length < 2) {
        setCompanySearchResults([]);
        setCompanyNoResults(false);
        return;
      }

      let currentCache = allCompaniesCache;

      // إذا لم يتم تحميل الكاش بعد، نحمله الآن ونستخدم النتيجة فوراً
      if (currentCache.length === 0 && !isLoadingAllCompanies) {
        currentCache = await loadAllCompanies() || [];
      }

      // البحث من الكاش المحلي (فوري)
      const term = companySearchTerm.trim().toLowerCase();
      const filtered = currentCache.filter((c: any) => {
        const name = String(c?.name || '').toLowerCase();
        const city = String(c?.city || '').toLowerCase();
        const reg = String(c?.registrationNumber || '').toLowerCase();
        const id = String(c?.id || '').toLowerCase();
        return name.includes(term) || city.includes(term) || reg.includes(term) || id.includes(term);
      }).map((c: any) => ({
        id: c.id,
        name: c.name,
        city: c.city,
        country: c.country,
        registrationNumber: c.registrationNumber,
      }));

      setCompanySearchResults(filtered);
      setCompanyNoResults(filtered.length === 0);
    } catch (e) {
      console.error('❌ Error searching companies:', e);
      setCompanySearchResults([]);
      setCompanyNoResults(false);
    }
  };

  const handleSelectCompany = (company: any) => {
    setSelectedCompanyId(String(company.id));
    setSelectedCompanyName(company.name || '');
    setPage(1);
    setEmployees([]);
    setEmployeeSearchTerm('');
    setIsEmployeeSearchMode(false);
    // لا نمسح نتائج البحث بعد الاختيار - نتركها للمستخدم
    // setCompanySearchResults([]); // إزالة هذا السطر
  };

  // تطبيق الفلاتر
  const applyFilters = () => {
    if (companySearchTerm.trim().length >= 2) {
      handleSearchCompanies();
    }
  };

  // مسح جميع الفلاتر
  const clearAllFilters = () => {
    if (companySearchTerm.trim().length >= 2) {
      handleSearchCompanies();
    }
  };

  // البحث من البحثات الأخيرة
  // تم حذف searchFromHistory بعد إلغاء البحثات الأخيرة

  // معالجة تغيير نص البحث
  const handleSearchTermChange = (value: string) => {
    setCompanySearchTerm(value);

    // إذا كان النص فارغاً، نمسح النتائج والبيانات المعروضة
    if (!value.trim()) {
      setCompanySearchResults([]);
      setCompanyNoResults(false);
      // مسح بيانات الشركة المعروضة
      setSelectedCompanyId('');
      setSelectedCompanyName('');
      setEmployees([]);
      setPage(1);
    }
  };

  // مسح البحث والنتائج
  const clearSearch = () => {
    setCompanySearchTerm('');
    setCompanySearchResults([]);
    setCompanyNoResults(false);
    // مسح بيانات الشركة المعروضة
    setSelectedCompanyId('');
    setSelectedCompanyName('');
    setEmployees([]);
    setPage(1);
  };

  // دوال نافذة تعديل المستخدم
  const handleOpenEditDialog = (employee: any) => {
    setEditFormData({
      id: String(employee.id || ''),
      userName: employee.userName || '',
      IDNumber: employee.IDNumber || '',
      PhoneNumber: employee.PhoneNumber || '',
      job: employee.job || '',
      jobdiscrption: employee.jobdiscrption || '',
    });
    setEditDialogOpen(true);
  };

  const handleCloseEditDialog = () => {
    setEditDialogOpen(false);
    setEditFormData({
      id: '',
      userName: '',
      IDNumber: '',
      PhoneNumber: '',
      job: '',
      jobdiscrption: '',
    });
  };

  const handleEditFormChange = (field: string, value: string) => {
    setEditFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSaveEdit = async () => {
    if (!editFormData.userName.trim()) {
      setSnackbar({ open: true, message: 'اسم المستخدم مطلوب', severity: 'error' });
      return;
    }
    if (!editFormData.PhoneNumber.trim()) {
      setSnackbar({ open: true, message: 'رقم الهاتف مطلوب', severity: 'error' });
      return;
    }

    try {
      setEditLoading(true);

      const requestBody = {
        id: editFormData.id,
        userName: editFormData.userName,
        IDNumber: editFormData.IDNumber,
        PhoneNumber: editFormData.PhoneNumber,
        job: editFormData.job,
        jobdiscrption: editFormData.jobdiscrption,
        IDCompany: selectedCompanyId,
      };

      console.log('📤 Sending edit request:', requestBody);

      const response = await apiClient.put('/user/v2/updat', requestBody);

      console.log('📥 Edit response:', response.data);

      if (response.data?.success === true || response.data?.success === 'تمت العملية بنجاح') {
        setSnackbar({ open: true, message: 'تم تعديل بيانات المستخدم بنجاح', severity: 'success' });
        handleCloseEditDialog();
        // إعادة تحميل بيانات الموظفين
        loadData(2);
      } else {
        const errorMessage = response.data?.message || response.data?.errors
          ? Object.values(response.data.errors || {}).join(', ')
          : 'فشل في تعديل البيانات';
        setSnackbar({ open: true, message: errorMessage, severity: 'error' });
      }
    } catch (error: any) {
      console.error('❌ Error updating user:', error);
      const errorMessage = error.response?.data?.message || error.message || 'حدث خطأ أثناء التعديل';
      setSnackbar({ open: true, message: errorMessage, severity: 'error' });
    } finally {
      setEditLoading(false);
    }
  };

  const handleCloseSnackbar = () => {
    setSnackbar((prev) => ({ ...prev, open: false }));
  };

  // تحميل جميع الشركات عند الدخول لتبويب مستخدمين الشركة
  useEffect(() => {
    if (activeTab === 1 && allCompaniesCache.length === 0 && !isLoadingAllCompanies) {
      loadAllCompanies();
    }
  }, [activeTab]);

  // تحسين البحث: تنفيذ تلقائي مع إكمال تلقائي (debounce)
  useEffect(() => {
    if (activeTab !== 1) return;
    const term = companySearchTerm.trim();
    if (term.length < 2) {
      setCompanySearchResults([]);
      setCompanyNoResults(false);
      return;
    }
    setCompanySearchLoading(true);
    const t = setTimeout(async () => {
      try {
        await handleSearchCompanies();
      } catch (e) {
        console.error('❌ Error searching companies:', e);
        setCompanySearchResults([]);
        setCompanyNoResults(false);
      } finally {
        setCompanySearchLoading(false);
      }
    }, 200); // تقليل debounce time لأن البحث الآن محلي وسريع
    return () => clearTimeout(t);
  }, [companySearchTerm, activeTab, allCompaniesCache]);

  // بحث الموظفين بالاسم (debounce) مع جلب متدرج
  useEffect(() => {
    if (activeTab !== 1) return;
    if (!selectedCompanyId) return;
    const term = (employeeSearchTerm || '').trim();
    if (!term) {
      setIsEmployeeSearchMode(false);
      setEmployeeSearchLastIds([0]);
      // إعادة تحميل القائمة العادية
      loadData(2);
      return;
    }
    // تفعيل وضع البحث وإعادة تعيين مؤشرات الترقيم
    setIsEmployeeSearchMode(true);
    setPage(1);
    setEmployees([]);
    setEmployeeSearchLastIds([0]);
    const timer = setTimeout(() => {
      // تحميل الصفحة الأولى من نتائج البحث
      loadEmployeeSearchPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [employeeSearchTerm, selectedCompanyId, activeTab]);

  // عند تغيير الصفحة في وضع البحث، نجلب الصفحة المطلوبة فوراً
  // ملاحظة: لا نحتاج تأثير منفصل عند تغيير الصفحة لأن loadData يتكفّل بذلك

  // دالة لجلب كافة البيانات للتصدير
  const getAllExportData = async () => {
    try {
      setIsExporting(true);
      if (activeTab === 0) {
        if (allCompaniesCache.length === 0) {
          await loadAllCompanies();
        }
        if (companySearchTerm && companySearchTerm.trim().length >= 2) {
          const term = companySearchTerm.trim().toLowerCase();
          return allCompaniesCache.filter((c: any) => {
            const name = String(c?.name || '').toLowerCase();
            const city = String(c?.city || '').toLowerCase();
            const reg = String(c?.registrationNumber || '').toLowerCase();
            const id = String(c?.id || '').toLowerCase();
            return name.includes(term) || city.includes(term) || reg.includes(term) || id.includes(term);
          });
        }
        return allCompaniesCache;
      } else if (activeTab === 1) {
        if (!selectedCompanyId) return [];
        let allEmps: any[] = [];
        let lastId = 0;
        let hasMore = true;
        let iters = 0;
        while (hasMore && iters < 100) {
          iters++;
          const res = await fetchCompanyEmployees(String(selectedCompanyId), { lastId, limit: 100 });
          const emps = res.employees || [];
          if (emps.length === 0) break;
          allEmps = [...allEmps, ...emps];
          const maxId = emps.reduce((m: number, e: any) => Math.max(m, Number(e.id) || 0), lastId);
          if (maxId <= lastId || emps.length < 100) hasMore = false;
          lastId = maxId;
        }
        if (isEmployeeSearchMode && employeeSearchTerm.trim()) {
           const term = employeeSearchTerm.trim().toLowerCase();
           const termDigits = term.replace(/[^0-9]/g, '');
           return allEmps.filter((e: any) => {
              const name = String(e?.userName || '').toLowerCase();
              const rawPhone = String(e?.PhoneNumber ?? '');
              const phoneDigits = rawPhone.replace(/[^0-9]/g, '');
              const phoneMatches = termDigits ? phoneDigits.includes(termDigits) : rawPhone.includes(term);
              return name.includes(term) || phoneMatches;
           });
        }
        return allEmps;
      }
      return [];
    } catch (e) {
      console.error('Error fetching all data for export:', e);
      return [];
    } finally {
      setIsExporting(false);
    }
  };

  // Export to Excel function
  const exportToExcel = async () => {
    if (isExporting) return;
    try {
      const dataToExport = await getAllExportData();
      if (dataToExport.length === 0) {
        alert('لا توجد بيانات للتصدير');
        return;
      }

      // Prepare data based on active tab
      let worksheetData: any[] = [];
      let headers: string[] = [];

      switch (activeTab) {
        case 0: // Companies Data
          headers = ['م', 'رقم الشركة', 'اسم الشركة', 'المدينة', 'البلد', 'السجل التجاري', 'عدد الفروع المسموحة', 'تاريخ بداية الاشتراك', 'تاريخ انتهاء الاشتراك'];
          worksheetData = dataToExport.map((item: any, idx: number) => [
            idx + 1,
            safeText(item.id),
            safeText(item.name),
            safeText(item.city),
            safeText(item.country),
            safeText(item.registrationNumber),
            item.branchesAllowed || 0,
            safeText(formatDate(item.subscriptionStart)),
            safeText(formatDate(item.subscriptionEnd))
          ]);
          break;
        case 1: // Company Employees (tab 2 now)
          headers = ['م', 'المعرف', 'الاسم', 'الوظيفة', 'القسم', 'الهاتف', 'الحالة'];
          worksheetData = dataToExport.map((item: any, idx: number) => [
            idx + 1,
            safeText(item.id),
            safeText(item.userName),
            safeText(item.job),
            safeText(item.jobHOM),
            safeText(item.PhoneNumber),
            String(item.Activation).toLowerCase() === 'true' ? 'نشط' : 'غير نشط'
          ]);
          break;
      }

      // Create workbook and worksheet
      const ws = XLSX.utils.aoa_to_sheet([headers, ...worksheetData]);
      const wb = XLSX.utils.book_new();

      // Set column widths (auto width fallback)
      try {
        const colWidths = headers.map((h, i) => {
          const headerLen = String(h).length;
          const maxCellLen = worksheetData.reduce((m, row) => {
            const v = row?.[i];
            const s = v === undefined || v === null ? '' : String(v);
            return Math.max(m, s.length);
          }, headerLen);
          // Arabic characters tend to be visually wider; add padding
          return { wch: Math.min(Math.max(maxCellLen + 2, 12), 40) };
        });
        ws['!cols'] = colWidths;
      } catch {
        ws['!cols'] = headers.map(() => ({ wch: 15 }));
      }

      XLSX.utils.book_append_sheet(wb, ws, getTabName());

      // Generate filename
      const fileName = `${getTabName()}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`;

      // Save file
      // Ensure Excel opens Arabic text correctly by using bookType: 'xlsx'
      XLSX.writeFile(wb, fileName, { bookType: 'xlsx' } as any);
    } catch (error) {
      console.error('خطأ في تصدير Excel:', error);
      alert('حدث خطأ في تصدير ملف Excel');
    }
  };

  // Export to PDF function with Arabic support
  const exportToPDF = async () => {
    if (isExporting) return;
    try {
      // Ensure Arabic fonts loaded
      await loadArabicFont();
      const dataToExport = await getAllExportData();
      if (dataToExport.length === 0) {
        alert('لا توجد بيانات للتصدير');
        return;
      }

      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
      // Register and use Tajawal font if available
      try {
        if (TAJAWAL_REG_BASE64) {
          (doc as any).addFileToVFS('Tajawal-Regular.ttf', TAJAWAL_REG_BASE64);
          (doc as any).addFont('Tajawal-Regular.ttf', 'Tajawal', 'normal');
        }
        if (TAJAWAL_BOLD_BASE64) {
          (doc as any).addFileToVFS('Tajawal-Bold.ttf', TAJAWAL_BOLD_BASE64);
          (doc as any).addFont('Tajawal-Bold.ttf', 'Tajawal', 'bold');
        }
        (doc as any).setFont('Tajawal', 'normal');
        if ((doc as any).setR2L) {
          (doc as any).setR2L(true);
        }
      } catch { }

      // Header styling
      const title = getTabName();
      const dateStr = new Date().toLocaleDateString('en-GB');
      doc.setFillColor(41, 128, 185);
      doc.rect(0, 0, doc.internal.pageSize.getWidth(), 20, 'F');
      doc.setTextColor(255);
      doc.setFontSize(14);
      doc.text(`تقرير: ${title}`, 10, 12);
      doc.setFontSize(10);
      doc.text(`التاريخ: ${dateStr}`, doc.internal.pageSize.getWidth() - 10, 12, { align: 'right' });
      doc.setTextColor(0);

      // Try rendering the visible table directly as HTML to preserve Arabic shaping
      const el = document.getElementById('pdf-export');
      if (el && (doc as any).html) {
        await (doc as any).html(el, {
          x: 10,
          y: 24,
          html2canvas: { scale: 2, useCORS: true, backgroundColor: '#ffffff' },
          callback: (d: any) => {
            // Footer summary
            const finalY = 190; // approximate
            d.setFontSize(10);
            d.text(`إجمالي السجلات المصدّرة: ${dataToExport.length}`, 10, finalY + 15);
            d.text(`تم التصدير في: ${new Date().toLocaleString('en-GB')}`, 10, finalY + 22);
            const fileName = `${title}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`;
            d.save(fileName);
          }
        });
        return;
      }

      // Prepare table data (fallback)
      let columns: string[] = [];
      let rows: any[][] = [];

      switch (activeTab) {
        case 0: // Companies Data
          columns = ['#', 'رقم الشركة', 'اسم الشركة', 'المدينة', 'الدولة', 'السجل', 'الفروع المسموحة', 'بداية الاشتراك', 'نهاية الاشتراك'];
          rows = dataToExport.map((item: any, idx: number) => [
            idx + 1,
            safeText(item.id),
            safeText(item.name, 20),
            safeText(item.city, 12),
            safeText(item.country, 12),
            safeText(item.registrationNumber, 20),
            item.branchesAllowed || 0,
            safeText(formatDate(item.subscriptionStart)),
            safeText(formatDate(item.subscriptionEnd))
          ]);
          break;
        case 1: // Company Employees
          columns = ['#', 'المعرف', 'الاسم', 'الوظيفة', 'القسم', 'الهاتف', 'الحالة'];
          rows = dataToExport.map((item: any, idx: number) => [
            idx + 1,
            safeText(item.id),
            safeText(item.userName, 20),
            safeText(item.job, 15),
            safeText(item.jobHOM, 15),
            safeText(item.PhoneNumber),
            safeText(String(item.Activation).toLowerCase() === 'true' ? 'نشط' : 'غير نشط')
          ]);
          break;
      }

      // Add table to PDF
      (doc as any).autoTable({
        head: [columns],
        body: rows,
        startY: 28,
        theme: 'grid',
        styles: {
          font: 'Tajawal',
          fontSize: 10,
          cellPadding: 3,
          halign: 'right',
          overflow: 'linebreak'
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          font: 'Tajawal',
          fontSize: 11,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [248, 248, 248]
        },
        columnStyles: {
          0: { halign: 'center', cellWidth: 10 }
        }
      });

      // Footer summary
      const finalY = (doc as any).lastAutoTable?.finalY || 100;
      doc.setFontSize(10);
      doc.text(`إجمالي السجلات المصدّرة: ${dataToExport.length}`, 10, finalY + 15);
      doc.text(`تم التصدير في: ${new Date().toLocaleString('en-GB')}`, 10, finalY + 22);

      // Save PDF
      const fileName = `${getTabName()}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('خطأ في تصدير PDF:', error);
      alert('حدث خطأ في تصدير ملف PDF');
    }
  };

  // شريط تنقل سفلي محسّن الشكل
  const renderAdvancedPaginationControls = () => {
    if (totalItems === 0) {
      return (
        <Paper elevation={1} sx={{ mt: 3, p: 2, borderRadius: (theme) => theme.shape.borderRadius, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            📭 لا توجد بيانات لعرضها في هذا التبويب
          </Typography>
        </Paper>
      );
    }

    const startIndex = (page - 1) * itemsPerPage + 1;
    const endIndex = Math.min(page * itemsPerPage, totalItems);

    return (
      <Paper elevation={2} sx={{ mt: 3, p: 2, borderRadius: (theme) => theme.shape.borderRadius, boxShadow: '0 6px 20px rgba(0,0,0,0.06)' }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <Box />
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <Pagination
                count={totalPages}
                page={page}
                onChange={(e, value) => setPage(value)}
                color="primary"
                shape="rounded"
                siblingCount={1}
                boundaryCount={0}
                showFirstButton
                showLastButton
              />
            </Box>
          </Grid>
          <Grid item xs={12} md={4}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
              <Chip label={`الصفحة ${page} من ${totalPages}`} color="primary" variant="outlined" />
            </Box>
          </Grid>
        </Grid>
      </Paper>
    );
  };

  // تمت إزالة تبويب بيانات المشاريع

  const renderRequests = () => (
    <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: { xs: 600, md: 960 }, tableLayout: 'fixed', '& th, & td': { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontSize: { xs: '0.85rem', sm: '0.95rem' }, py: { xs: 0.75, sm: 1 } } }}>
        <TableHead>
          <TableRow>
            <TableCell>م</TableCell>
            <TableCell>رقم الشركة</TableCell>
            <TableCell>اسم الشركة</TableCell>
            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>المدينة</TableCell>
            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>البلد</TableCell>
            <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>السجل التجاري</TableCell>
            <TableCell>الفروع</TableCell>
            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>بداية الاشتراك</TableCell>
            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>نهاية الاشتراك</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map((company: any, idx: number) => (
            <TableRow key={company.id}>
              <TableCell>{getRowNumber(idx)}</TableCell>
              <TableCell>{safeText(company.id)}</TableCell>
              <TableCell sx={{ maxWidth: 200 }}>
                <Tooltip title={safeText(company.name)} arrow placement="top">
                  <span style={{ display: 'inline-block', maxWidth: '100%' }}>{safeText(company.name)}</span>
                </Tooltip>
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{safeText(company.city)}</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{safeText(company.country)}</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{safeText(company.registrationNumber)}</TableCell>
              <TableCell>
                <Chip
                  label={company.branchesAllowed || 0}
                  color="primary"
                  size="small"
                />
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{safeText(formatDate(company.subscriptionStart))}</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{safeText(formatDate(company.subscriptionEnd))}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // تمت إزالة نشاطات الدخول

  const renderRevenue = () => (
    <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
      <Table size="small" sx={{ minWidth: { xs: 600, md: 960 }, tableLayout: 'fixed', '& th, & td': { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontSize: { xs: '0.85rem', sm: '0.95rem' }, py: { xs: 0.75, sm: 1 } } }}>
        <TableHead>
          <TableRow>
            <TableCell>م</TableCell>
            <TableCell>رقم الشركة</TableCell>
            <TableCell>اسم الشركة</TableCell>
            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>الباقة</TableCell>
            <TableCell>المبلغ</TableCell>
            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>تاريخ البداية</TableCell>
            <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>تاريخ الانتهاء</TableCell>
            <TableCell>الحالة</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {subscriptions.map((sub: any, idx: number) => (
            <TableRow key={sub.id}>
              <TableCell>{getRowNumber(idx)}</TableCell>
              <TableCell>{safeText(sub.companyId || sub.id)}</TableCell>
              <TableCell sx={{ maxWidth: 200 }}>
                <Tooltip title={safeText(sub.companyName)} arrow placement="top">
                  <span style={{ display: 'inline-block', maxWidth: '100%' }}>{safeText(sub.companyName)}</span>
                </Tooltip>
              </TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{safeText(sub.planName)}</TableCell>
              <TableCell>{formatAmount(sub.amount || 0)}</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{safeText(formatDate(sub.startDate))}</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{safeText(formatDate(sub.endDate))}</TableCell>
              <TableCell>{getStatusChip(sub.status)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  // تم حذف تبويب قوالب المراحل بالكامل

  return (
    <Container maxWidth="xl" sx={{ py: { xs: 2, md: 4 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, gap: 2, flexWrap: 'wrap' }}>
        <Typography variant="h4" component="h1">
          الميزات المتقدمة
        </Typography>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
          <Chip
            label={loading ? 'جاري التحميل...' : `إجمالي السجلات: ${totalItems}`}
            color="primary"
            variant="outlined"
            sx={{ fontSize: '0.95rem', fontWeight: 'bold' }}
            icon={loading ? <CircularProgress size={16} /> : undefined}
          />
          <Tooltip title="تصدير إلى Excel" arrow>
            <span>
              <Button
                onClick={exportToExcel}
                variant="outlined"
                color="success"
                startIcon={isExporting ? <CircularProgress size={16} /> : <ExcelIcon />}
                disabled={isExporting || loading}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                Excel
              </Button>
            </span>
          </Tooltip>
          <Tooltip title="طباعة PDF (موصى بها)" arrow>
            <span>
              <Button
                onClick={printToPDF}
                variant="outlined"
                color="error"
                startIcon={isExporting ? <CircularProgress size={16} /> : <PdfIcon />}
                disabled={isExporting || loading}
                sx={{ borderRadius: 2, textTransform: 'none' }}
              >
                PDF
              </Button>
            </span>
          </Tooltip>
        </Box>
      </Box>

      <Card sx={{ mb: 3, display: 'none' }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={12}>
              <Box sx={{ display: 'flex', gap: 1.5, justifyContent: 'flex-end', flexWrap: 'wrap' }}>
                <Tooltip title="تصدير إلى Excel" arrow>
                  <span>
                    <Button
                      onClick={exportToExcel}
                      variant="outlined"
                      color="success"
                      startIcon={isExporting ? <CircularProgress size={16} /> : <ExcelIcon />}
                      disabled={isExporting || loading}
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      تصدير Excel
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title="تصدير إلى PDF" arrow>
                  <span>
                    <Button
                      onClick={exportToPDF}
                      variant="outlined"
                      color="error"
                      startIcon={isExporting ? <CircularProgress size={16} /> : <PdfIcon />}
                      disabled={isExporting || loading}
                      sx={{ borderRadius: 2, textTransform: 'none' }}
                    >
                      تصدير PDF
                    </Button>
                  </span>
                </Tooltip>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto" allowScrollButtonsMobile>
          <Tab icon={<AssignmentIcon />} label="بيانات الشركات" />
          <Tab icon={<AssignmentIcon />} label="مستخدمين الشركة" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        {loading ? <Skeleton variant="rectangular" height={400} /> : renderRequests()}
      </TabPanel>

      <TabPanel value={activeTab} index={1}>
        <Card sx={{ mb: 2 }}>
          <CardContent>
            <Grid container spacing={3}>
              {/* البحث الأساسي */}
              <Grid item xs={12} md={8}>
                <Box sx={{ position: 'relative' }}>
                  <Autocomplete
                    options={companySearchResults}
                    loading={companySearchLoading}
                    getOptionLabel={(option: any) => `${option.name || ''}${option.city ? ` - ${option.city}` : ''}${option.country ? ` (${option.country})` : ''}`}
                    value={companySearchResults.find((o) => String(o.id) === String(selectedCompanyId)) || null}
                    onChange={(e, value) => {
                      if (value) {
                        handleSelectCompany(value);
                      } else {
                        // إذا تم مسح الشركة، نمسح البيانات المعروضة
                        setSelectedCompanyId('');
                        setSelectedCompanyName('');
                        setEmployees([]);
                        setPage(1);
                      }
                    }}
                    onInputChange={(e, value) => handleSearchTermChange(value)}
                    inputValue={companySearchTerm}
                    clearOnBlur={false}
                    freeSolo={false}
                    renderInput={(params) => (
                      <TextField
                        {...params}
                        label="ابحث واختر الشركة"
                        placeholder="اكتب اسم الشركة أو المدينة أو السجل التجاري..."
                        size="medium"
                        fullWidth
                        InputProps={{
                          ...params.InputProps,
                          endAdornment: (
                            <>
                              {companySearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                              {companySearchTerm && (
                                <Button
                                  size="small"
                                  onClick={clearSearch}
                                  sx={{ minWidth: 'auto', p: 0.5 }}
                                >
                                  ✕
                                </Button>
                              )}
                              {params.InputProps.endAdornment}
                            </>
                          ),
                        }}
                      />
                    )}
                    renderOption={(props, option: any) => {
                      const { key, ...otherProps } = props;
                      return (
                        <Box component="li" key={key} {...otherProps}>
                          <Box sx={{ width: '100%' }}>
                            <Typography variant="subtitle1" fontWeight="bold">
                              {option.name}
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              {option.city && option.country ? `${option.city}, ${option.country}` : option.city || option.country}
                            </Typography>
                            {option.registrationNumber && (
                              <Typography variant="caption" color="text.secondary">
                                السجل: {option.registrationNumber}
                              </Typography>
                            )}
                            {option.subscriptionEnd && (
                              <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                                • ينتهي: {formatDate(option.subscriptionEnd)}
                              </Typography>
                            )}
                          </Box>
                        </Box>
                      );
                    }}
                  />

                </Box>
              </Grid>

              {/* عرض معلومات الشركة المحددة */}
              <Grid item xs={12} md={4}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {selectedCompanyName ? (
                    <Box sx={{ p: 2, backgroundColor: '#e3f2fd', borderRadius: 2, border: '1px solid #2196f3' }}>
                      <Typography variant="subtitle2" color="primary" fontWeight="bold" sx={{ mb: 1 }}>
                        🏢 الشركة المحددة
                      </Typography>
                      <Typography variant="body2" sx={{ mb: 0.5 }}>
                        <strong>الاسم:</strong> {selectedCompanyName}
                      </Typography>
                      {companySearchResults.find(c => String(c.id) === String(selectedCompanyId))?.city && (
                        <Typography variant="body2" sx={{ mb: 0.5 }}>
                          <strong>المدينة:</strong> {companySearchResults.find(c => String(c.id) === String(selectedCompanyId))?.city}
                        </Typography>
                      )}
                      {companySearchResults.find(c => String(c.id) === String(selectedCompanyId))?.country && (
                        <Typography variant="body2">
                          <strong>الدولة:</strong> {companySearchResults.find(c => String(c.id) === String(selectedCompanyId))?.country}
                        </Typography>
                      )}
                    </Box>
                  ) : null}
                </Box>
              </Grid>

              {/* حقل بحث الموظفين بالاسم أو الهاتف */}
              {selectedCompanyId ? (
                <Grid item xs={12} md={8}>
                  <TextField
                    label="ابحث عن مستخدم (اسم أو رقم هاتف)"
                    placeholder="ابحث عن مستخدم (اسم أو رقم هاتف)"
                    size="medium"
                    fullWidth
                    value={employeeSearchTerm}
                    onChange={(e) => setEmployeeSearchTerm(e.target.value)}
                    InputProps={{
                      endAdornment: (
                        <>
                          {employeeSearchLoading ? <CircularProgress color="inherit" size={20} /> : null}
                          {employeeSearchTerm && (
                            <Button
                              size="small"
                              onClick={() => setEmployeeSearchTerm('')}
                              sx={{ minWidth: 'auto', p: 0.5 }}
                            >
                              ✕
                            </Button>
                          )}
                        </>
                      )
                    }}
                  />
                </Grid>
              ) : null}

              {/* تم إزالة قسم "البحثات الأخيرة" */}

              {/* رسائل الحالة */}
              {/* تم إزالة رسالة "لا توجد نتائج" لحل مشكلة ظهورها مع وجود نتائج */}

              {/* إحصائيات البحث */}
              {/* تم إزالة إحصائيات البحث لحل مشكلة ظهورها عند اختيار شركة */}

            </Grid>
          </CardContent>
        </Card>

        {selectedCompanyId ? (
          <TableContainer component={Paper} id="pdf-export" sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: { xs: 600, md: 960 }, tableLayout: 'fixed', '& th, & td': { whiteSpace: 'nowrap', textOverflow: 'ellipsis', overflow: 'hidden', fontSize: { xs: '0.85rem', sm: '0.95rem' }, py: { xs: 0.75, sm: 1 } } }}>
              <TableHead>
                <TableRow>
                  <TableCell>م</TableCell>
                  <TableCell>المعرف</TableCell>
                  <TableCell>الاسم</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>الوظيفة</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>القسم</TableCell>
                  <TableCell>الهاتف</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell>الإجراءات</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {employees.map((emp: any, idx: number) => (
                  <TableRow key={emp.id || idx}>
                    <TableCell>{getRowNumber(idx)}</TableCell>
                    <TableCell>{emp.id}</TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>{emp.userName}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{emp.job}</TableCell>
                    <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{emp.jobHOM}</TableCell>
                    <TableCell>{emp.PhoneNumber}</TableCell>
                    <TableCell>{getStatusChip(String(emp.Activation))}</TableCell>
                    <TableCell>
                      <Tooltip title="تعديل بيانات المستخدم" arrow>
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => handleOpenEditDialog(emp)}
                        >
                          <EditIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">اختر شركة لعرض مستخدمينها</Alert>
        )}
      </TabPanel>

      {renderAdvancedPaginationControls()}

      {/* نافذة تعديل بيانات المستخدم */}
      <Dialog open={editDialogOpen} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth dir="rtl">
        <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6">تعديل بيانات المستخدم</Typography>
          <IconButton onClick={handleCloseEditDialog} size="small">
            <CloseIcon />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers>
          <Grid container spacing={2} sx={{ pt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="اسم المستخدم"
                fullWidth
                required
                value={editFormData.userName}
                onChange={(e) => handleEditFormChange('userName', e.target.value)}
                disabled={editLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="رقم الهاتف"
                fullWidth
                required
                value={editFormData.PhoneNumber}
                onChange={(e) => handleEditFormChange('PhoneNumber', e.target.value)}
                disabled={editLoading}
                placeholder="5XXXXXXXX"
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="رقم الهوية / الإقامة"
                fullWidth
                value={editFormData.IDNumber}
                onChange={(e) => handleEditFormChange('IDNumber', e.target.value)}
                disabled={editLoading}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="المسمى الوظيفي"
                fullWidth
                value={editFormData.job}
                onChange={(e) => handleEditFormChange('job', e.target.value)}
                disabled={editLoading}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="وصف الوظيفة"
                fullWidth
                multiline
                rows={3}
                value={editFormData.jobdiscrption}
                onChange={(e) => handleEditFormChange('jobdiscrption', e.target.value)}
                disabled={editLoading}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: 2, gap: 1 }}>
          <Button onClick={handleCloseEditDialog} disabled={editLoading} variant="outlined" color="inherit">
            إلغاء
          </Button>
          <Button
            onClick={handleSaveEdit}
            disabled={editLoading}
            variant="contained"
            color="primary"
            startIcon={editLoading ? <CircularProgress size={20} color="inherit" /> : null}
          >
            {editLoading ? 'جاري الحفظ...' : 'حفظ التعديلات'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* رسائل الإشعارات */}
      <Snackbar
        open={snackbar.open}
        autoHideDuration={5000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AdvancedFeatures;