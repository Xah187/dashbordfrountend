/**
 * صفحة إدارة الاشتراكات
 * 
 * URL: http://localhost:3000/subscriptions
 * 
 * ✅ متصلة بقاعدة البيانات الحقيقية
 * ✅ تستخدم API الاشتراكات الجديد
 * ✅ تعرض اشتراكات الشركات الحقيقية
 * ✅ تدعم البحث والفلترة
 * ✅ تدعم طلبات الاشتراك والموافقة/الرفض
 * 
 * الصفحة تحتوي على:
 * - عرض اشتراكات الشركات من قاعدة البيانات
 * - إدارة طلبات الاشتراك (قبول/رفض)
 * - إحصائيات الاشتراكات
 * - البحث والفلترة حسب الحالة
 * - تجديد وإيقاف الاشتراكات
 * - تصدير إلى Excel
 */
import React, { useState, useEffect } from 'react';
import { fetchCompanies } from '../api/database-api';
import {
  Box,
  Button,
  Card,
  CardContent,
  Grid,
  Typography,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  IconButton,
  Chip,
  MenuItem,
  InputAdornment,
  Divider,
  Alert,
  Snackbar,
  Tabs,
  Tab,
  Select,
  FormControl,
  InputLabel,
  CircularProgress,
  Tooltip,
  Badge,
  Pagination,
  Autocomplete
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  ReceiptLong as ReceiptLongIcon,
  Business as BusinessIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  GetApp as GetAppIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Payment as PaymentIcon,
  Autorenew as AutoRenewIcon,
  Visibility as VisibilityIcon,
  Error as ErrorIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon
} from '@mui/icons-material';

import { getSoftSubscriptionStatusChipSx } from '../utils/colorUtils';

// استيراد APIs الجديدة المفعلة للاشتراكات والطلبات المعلقة
import {
  fetchSubscriptionStats,
  fetchPendingSubscriptionRequests,
  approveSubscriptionRequest,
  rejectSubscriptionRequest,
  fetchSubscriptionReports,
  fetchTransactionTracking,
  fetchInvoiceUrl
} from '../api';

// استيراد API أنواع الاشتراكات (التسعيرات)
import {
  fetchSubscriptionTypes,
  insertSubscriptionType,
  updateSubscriptionType,
  deleteSubscriptionType,
  insertCompanySubscription
} from '../api/subscriptionTypesApi';

const Subscriptions = () => {
  // State للبيانات
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSubscription, setSelectedSubscription] = useState(null);

  // State للبحث والفلترة
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('SubscriptionEndDate');
  const [sortOrder, setSortOrder] = useState('ASC');

  // State للـ pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);
  const [, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // State للحوارات
  const [openRenewDialog, setOpenRenewDialog] = useState(false);
  const [openSuspendDialog, setOpenSuspendDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openRequestDialog, setOpenRequestDialog] = useState(false);
  const [openRequestDetailsDialog, setOpenRequestDetailsDialog] = useState(false);

  // State للطلبات
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);

  // State للإشعارات
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });

  // State للتقارير
  const [reportType, setReportType] = useState(1); // 1 = نشطة, 2 = الكل
  const [reportsData, setReportsData] = useState([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [reportsSearchQuery, setReportsSearchQuery] = useState('');
  const [allCompaniesList, setAllCompaniesList] = useState([]);

  // State لتتبع العمليات
  const [tranRefSearch, setTranRefSearch] = useState('');
  const [invoiceCodeSearch, setInvoiceCodeSearch] = useState('');
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [trackingResult, setTrackingResult] = useState(null);
  const [openTrackingDialog, setOpenTrackingDialog] = useState(false);

  // State للتبويبات
  const [activeTab, setActiveTab] = useState(0); // 0: الاشتراكات، 1: الطلبات المعلقة، 2: التقارير، 3: أنواع الاشتراكات

  // State لأنواع الاشتراكات (التسعيرات)
  const [subscriptionTypes, setSubscriptionTypes] = useState([]);
  const [typesLoading, setTypesLoading] = useState(false);
  const [openTypeDialog, setOpenTypeDialog] = useState(false);
  const [editingType, setEditingType] = useState(null);
  const [typeFormData, setTypeFormData] = useState({
    name: '',
    duration_in_months: '',
    price_per_project: '',
    discraption: '',
    product_id: '',
    condition: ''
  });
  const [openDeleteTypeDialog, setOpenDeleteTypeDialog] = useState(false);
  const [deletingType, setDeletingType] = useState(null);
  const [typeSaving, setTypeSaving] = useState(false);

  // State لإضافة اشتراك لشركة
  const [newSubFormData, setNewSubFormData] = useState({
    company_id: '',
    subscription_type_id: '',
    project_count: ''
  });
  const [newSubSaving, setNewSubSaving] = useState(false);
  const [newSubResult, setNewSubResult] = useState(null);

  // State للتحديث
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // جلب البيانات بالآلية الجديدة التدريجية (Progressive Fetching) والفلترة محلياً
  const fetchSubscriptions = async () => {
    try {
      setLoading(true);

      // Ensure companies are loaded for mapping
      let currentCompanies = allCompaniesList;
      if (!currentCompanies || currentCompanies.length === 0) {
        currentCompanies = await loadAllCompaniesForMapping();
      }

      let fetchMore = true;
      let listId = 0;
      let allData = [];
      const type = filterStatus === 'all' ? 2 : 1; 

      while (fetchMore) {
        const result = await fetchSubscriptionReports(type, listId);
        let newRows = [];

        if (result?.data?.rows && Array.isArray(result.data.rows)) {
          newRows = result.data.rows;
        } else if (result?.data && Array.isArray(result.data)) {
          newRows = result.data;
        } else if (result && Array.isArray(result)) {
          newRows = result;
        }

        if (newRows.length > 0) {
          allData = [...allData, ...newRows];
          const lastItemId = newRows[newRows.length - 1]?.id;
          // إيقاف عند: أقل من 20 نتيجة أو لم يتقدم الـ ID
          if (newRows.length < 20 || !lastItemId || lastItemId === listId) {
            fetchMore = false;
          } else {
            listId = lastItemId;
          }
        } else {
          fetchMore = false;
        }
        // حماية قصوى
        if (allData.length >= 1000) fetchMore = false;
      }

      // تجهيز البيانات المطابقة لجدول الاشتراكات النشطة
      const mapped = allData.map(item => {
        const company = currentCompanies.find(c => String(c.id) === String(item.company_id)) || {};
        return {
          id: item.id,
          companyId: item.company_id,
          companyName: company.NameCompany || company.name || 'غير متوفرة',
          planName: item.name_package || 'غير محدد',
          startDate: item.start_date || '',
          endDate: item.end_date || '',
          amount: parseFloat(item.price) || 0,
          status: item.status || 'unknown',
          autoRenew: false,
          paymentMethod: 'تحويل بنكي',
          branchesAllowed: item.project_count || 0,
          currentBranches: item.project_count_used || 0,
          remainingBranches: (item.project_count || 0) - (item.project_count_used || 0),
          city: company.City || company.city || 'غير محدد',
          country: company.Country || company.country || 'غير محدد',
          registrationNumber: company.CommercialRegistrationNumber || 'غير محدد',
          createdAt: item.createdAt || ''
        };
      });

      // تطبيق البحث
      let filtered = mapped;
      if (searchQuery) {
        const q = searchQuery.toLowerCase();
        filtered = filtered.filter(sub => 
          sub.companyName.toLowerCase().includes(q) ||
          sub.planName.toLowerCase().includes(q) ||
          sub.city.toLowerCase().includes(q) ||
          (sub.registrationNumber && sub.registrationNumber.toLowerCase().includes(q))
        );
      }

      if (filterStatus && filterStatus !== 'all') {
        filtered = filtered.filter(sub => sub.status === filterStatus);
      }

      if (sortBy) {
        filtered.sort((a, b) => {
          let valA = a[sortBy];
          let valB = b[sortBy];
          
          if (sortBy === 'endDate' || sortBy === 'startDate') {
            valA = new Date(valA || 0).getTime();
            valB = new Date(valB || 0).getTime();
          }

          if (valA < valB) return sortOrder === 'ASC' ? -1 : 1;
          if (valA > valB) return sortOrder === 'ASC' ? 1 : -1;
          return 0;
        });
      }

      setTotalItems(filtered.length);
      const totalP = Math.ceil(filtered.length / itemsPerPage) || 1;
      setTotalPages(totalP);

      const safePage = currentPage > totalP ? (totalP === 0 ? 1 : totalP) : currentPage;
      const startIndex = (safePage - 1) * itemsPerPage;
      const paginated = filtered.slice(startIndex, startIndex + itemsPerPage);

      setSubscriptions(paginated);

    } catch (err) {
      console.error('❌ Error fetching active subscriptions progressively:', err);
      setError(err.message || 'Error fetching subscriptions');
      setSubscriptions([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // جلب الإحصائيات باستخدام API الجديد المفعل
  const fetchStats = async () => {
    try {
      const result = await fetchSubscriptionStats();

      setStats(result.data || {});

    } catch (err) {
      console.error('❌ Error fetching subscription stats with NEW API:', err);
      // التأكد من بقاء المتغير كـ object فارغ في حالة الخطأ
      setStats({});
    }
  };

  // جلب الطلبات المعلقة باستخدام API الجديد المفعل
  const fetchPendingRequests = async () => {
    try {
      const result = await fetchPendingSubscriptionRequests();

      setPendingRequests(Array.isArray(result.data) ? result.data : []);

    } catch (err) {
      console.error('❌ Error fetching pending requests with NEW API:', err);
      // التأكد من بقاء المتغير كـ array فارغ في حالة الخطأ
      setPendingRequests([]);
    }
  };

  // جلب تقارير الاشتراكات بتدريج لضمان الحصول على كافة النتائج
  const loadReports = async (type) => {
    setReportsLoading(true);
    try {
      let fetchMore = true;
      let listId = 0;
      let allReports = [];

      while (fetchMore) {
        const result = await fetchSubscriptionReports(type, listId);
        let newRows = [];

        // تحليل البيانات المرجعة بناءً على تنسيقات الـ API المحتملة
        if (result?.data?.rows && Array.isArray(result.data.rows)) {
          newRows = result.data.rows;
        } else if (result?.data && Array.isArray(result.data)) {
          newRows = result.data;
        } else if (result && Array.isArray(result)) {
          newRows = result;
        }

        if (newRows.length > 0) {
          allReports = [...allReports, ...newRows];
          const lastItemId = newRows[newRows.length - 1]?.id;
          // إيقاف عند: أقل من 20 نتيجة أو لم يتقدم الـ ID
          if (newRows.length < 20 || !lastItemId || lastItemId === listId) {
            fetchMore = false;
          } else {
            listId = lastItemId;
          }
        } else {
          fetchMore = false;
        }
        // حماية قصوى: 1000 اشتراك كحد أقصى
        if (allReports.length >= 1000) fetchMore = false;
      }

      setReportsData(allReports);
    } catch (err) {
      console.error('❌ Error fetching reports gradually:', err);
      // setNotification({ open: true, message: 'فشل في جلب التقارير', severity: 'error' });
    } finally {
      setReportsLoading(false);
    }
  };

  // جلب كل الشركات لغرض ربط الأسماء في التقارير (Recursive fetching to ensure ALL are loaded)
  const loadAllCompaniesForMapping = async () => {
    try {
      let currentPageNum = 1;
      let allLoadedCompanies = [];
      let fetchMore = true;

      while (fetchMore) {
        const response = await fetchCompanies({ limit: 1000, page: currentPageNum });
        if (response && response.companies && Array.isArray(response.companies)) {
          allLoadedCompanies = [...allLoadedCompanies, ...response.companies];
        }

        if (response && response.hasMore) {
          currentPageNum++;
        } else {
          fetchMore = false;
        }
      }

      setAllCompaniesList(allLoadedCompanies);
      console.log(`Loaded ${allLoadedCompanies.length} companies for report mapping.`);
      return allLoadedCompanies;
    } catch (err) {
      console.error('❌ Error fetching all companies for mapping:', err);
      return [];
    }
  };

  // جلب معلومات تتبع العملية
  const loadTransactionTracking = async () => {
    if (!tranRefSearch.trim()) {
      setNotification({ open: true, message: 'الرجاء إدخال رقم العملية', severity: 'warning' });
      return;
    }
    setTrackingLoading(true);
    try {
      const result = await fetchTransactionTracking(tranRefSearch);
      // التحقق من وجود خطأ (مثل: Transaction not found)
      if (result?.code || result?.message?.includes('not found')) {
        setNotification({ open: true, message: `العملية غير موجودة: ${result.message || 'Transaction not found'}`, severity: 'error' });
        return;
      }
      setTrackingResult(result);
      setOpenTrackingDialog(true);
    } catch (err) {
      console.error('❌ Error fetching transaction tracking:', err);
      setNotification({ open: true, message: 'فشل في جلب بيانات العملية، يرجى التأكد من الرقم', severity: 'error' });
    } finally {
      setTrackingLoading(false);
    }
  };

  // جلب الفاتورة وفتحها في نافذة جديدة
  const loadInvoiceUrl = async () => {
    if (!tranRefSearch.trim()) {
      setNotification({ open: true, message: 'الرجاء إدخال رقم كود الاشتراك (code_subscription)', severity: 'warning' });
      return;
    }
    setInvoiceLoading(true);
    try {
      const result = await fetchInvoiceUrl(tranRefSearch);

      if (result?.success === false) {
        setNotification({ open: true, message: result.massege || 'لم يتم العثور على فاتورة', severity: 'error' });
        return;
      }

      if (result?.url) {
        window.open(result.url, '_blank');
        setNotification({ open: true, message: 'تم فتح الفاتورة في نافذة جديدة', severity: 'success' });
      } else {
        setNotification({ open: true, message: 'رابط الفاتورة غير متوفر الآن', severity: 'warning' });
      }
    } catch (err) {
      console.error('❌ Error fetching invoice url:', err);
      setNotification({ open: true, message: 'فشل جلب الفاتورة، يرجى المحاولة لاحقاً', severity: 'error' });
    } finally {
      setInvoiceLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab === 2) {
      loadReports(reportType);
    }
  }, [activeTab, reportType]);

  // جلب أنواع الاشتراكات عند فتح تبويب إضافة اشتراك
  useEffect(() => {
    if (activeTab === 4 && subscriptionTypes.length === 0) {
      loadSubscriptionTypes();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  // حفظ اشتراك جديد لشركة
  const handleSaveNewSubscription = async () => {
    if (!newSubFormData.company_id || isNaN(Number(newSubFormData.company_id))) {
      setNotification({ open: true, message: 'يرجى إدخال رقم الشركة (Company ID)', severity: 'warning' });
      return;
    }
    if (!newSubFormData.subscription_type_id) {
      setNotification({ open: true, message: 'يرجى اختيار نوع الاشتراك', severity: 'warning' });
      return;
    }
    if (!newSubFormData.project_count || isNaN(Number(newSubFormData.project_count)) || Number(newSubFormData.project_count) <= 0) {
      setNotification({ open: true, message: 'يرجى إدخال عدد مشاريع صحيح', severity: 'warning' });
      return;
    }

    try {
      setNewSubSaving(true);
      const result = await insertCompanySubscription({
        subscription_type_id: Number(newSubFormData.subscription_type_id),
        project_count: Number(newSubFormData.project_count),
        company_id: Number(newSubFormData.company_id)
      });

      if (result.success === false) {
        setNotification({ open: true, message: result.message || result.error || 'فشل في إضافة الاشتراك', severity: 'error' });
        return;
      }

      setNewSubResult(result);
      setNotification({ open: true, message: 'تم إضافة الاشتراك بنجاح ✅', severity: 'success' });
      setNewSubFormData({ company_id: '', subscription_type_id: '', project_count: '' });
    } catch (err) {
      console.error('❌ Error creating company subscription:', err);
      setNotification({ open: true, message: 'خطأ في إضافة الاشتراك: ' + (err.message || ''), severity: 'error' });
    } finally {
      setNewSubSaving(false);
    }
  };

  // قبول طلب الاشتراك
  const handleApproveRequest = async (requestId) => {
    try {
      await approveSubscriptionRequest(requestId);

      // setNotification({
      //   open: true,
      //   message: 'تم قبول الطلب بنجاح وإنشاء الاشتراك',
      //   severity: 'success'
      // });

      // // تحديث البيانات
      // fetchPendingRequests();
      // fetchSubscriptions();
      // fetchStats();

    } catch (err) {
      console.error('❌ Error approving request with NEW API:', err);
      setNotification({
        open: true,
        message: err.message,
        severity: 'error'
      });
    }
  };

  // رفض طلب الاشتراك
  const handleRejectRequest = async (requestId, reason) => {
    try {
      await rejectSubscriptionRequest(requestId, reason);

      setNotification({
        open: true,
        message: 'تم حذف الطلب بنجاح',
        severity: 'info'
      });

      fetchPendingRequests(); // تحديث قائمة الطلبات

    } catch (err) {
      console.error('❌ Error rejecting request with NEW API:', err);
      setNotification({
        open: true,
        message: err.message,
        severity: 'error'
      });
    }
  };

  // === وظائف أنواع الاشتراكات ===

  // جلب أنواع الاشتراكات
  const loadSubscriptionTypes = async () => {
    try {
      setTypesLoading(true);
      const data = await fetchSubscriptionTypes();
      setSubscriptionTypes(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('❌ Error loading subscription types:', err);
      setNotification({ open: true, message: 'خطأ في جلب أنواع الاشتراكات: ' + (err.message || ''), severity: 'error' });
    } finally {
      setTypesLoading(false);
    }
  };

  // فتح نافذة إضافة نوع جديد
  const openAddTypeDialog = () => {
    setEditingType(null);
    setTypeFormData({ name: '', duration_in_months: '', price_per_project: '', discraption: '', product_id: '', condition: '' });
    setOpenTypeDialog(true);
  };

  // فتح نافذة تعديل نوع
  const openEditTypeDialog = (type) => {
    setEditingType(type);
    setTypeFormData({
      name: type.name || '',
      duration_in_months: type.duration_in_months?.toString() || '',
      price_per_project: type.price_per_project?.toString() || '',
      discraption: type.discraption || '',
      product_id: type.product_id?.toString() || '',
      condition: type.condition?.toString() || ''
    });
    setOpenTypeDialog(true);
  };

  // حفظ (إضافة أو تعديل) نوع اشتراك
  const handleSaveType = async () => {
    if (!typeFormData.name.trim()) {
      setNotification({ open: true, message: 'يرجى إدخال اسم الباقة', severity: 'warning' });
      return;
    }
    if (!typeFormData.duration_in_months || isNaN(Number(typeFormData.duration_in_months))) {
      setNotification({ open: true, message: 'يرجى إدخال مدة صحيحة بالأشهر', severity: 'warning' });
      return;
    }
    if (!typeFormData.price_per_project || isNaN(Number(typeFormData.price_per_project))) {
      setNotification({ open: true, message: 'يرجى إدخال سعر صحيح لكل مشروع', severity: 'warning' });
      return;
    }

    if (typeFormData.condition === '' || typeFormData.condition === undefined || typeFormData.condition === null || isNaN(Number(typeFormData.condition))) {
      setNotification({ open: true, message: 'يرجى تحديد رقم الشرط', severity: 'warning' });
      return;
    }

    try {
      setTypeSaving(true);
      const payload = {
        name: typeFormData.name.trim(),
        duration_in_months: Number(typeFormData.duration_in_months),
        price_per_project: Number(typeFormData.price_per_project),
        discraption: typeFormData.discraption?.trim() || '',
        product_id: editingType ? undefined : Number(typeFormData.product_id || 0),
        condition: Number(typeFormData.condition || 0)
      };

      if (editingType) {
        await updateSubscriptionType({ ...payload, id: editingType.id });
        setNotification({ open: true, message: 'تم تعديل نوع الاشتراك بنجاح ✅', severity: 'success' });
      } else {
        await insertSubscriptionType(payload);
        setNotification({ open: true, message: 'تم إضافة نوع الاشتراك بنجاح ✅', severity: 'success' });
      }

      setOpenTypeDialog(false);
      
      // تأخير جلب البيانات لثانيتين حتى يكتمل إقلاع الباك إند بعد نجاح العملية
      setTimeout(() => {
        loadSubscriptionTypes();
      }, 2000);

    } catch (err) {
      console.error('❌ Error saving subscription type:', err);
      setNotification({ open: true, message: 'خطأ في حفظ نوع الاشتراك: ' + (err.message || ''), severity: 'error' });
    } finally {
      setTypeSaving(false);
    }
  };

  // حذف نوع اشتراك
  const handleDeleteType = async () => {
    if (!deletingType) return;
    try {
      setTypeSaving(true);
      await deleteSubscriptionType(deletingType.id);
      setNotification({ open: true, message: 'تم حذف نوع الاشتراك بنجاح ✅', severity: 'success' });
      setOpenDeleteTypeDialog(false);
      setDeletingType(null);
      loadSubscriptionTypes();
    } catch (err) {
      console.error('❌ Error deleting subscription type:', err);
      setNotification({ open: true, message: 'خطأ في حذف نوع الاشتراك: ' + (err.message || ''), severity: 'error' });
    } finally {
      setTypeSaving(false);
    }
  };

  // تحديث البيانات
  const refreshData = async () => {
    setRefreshing(true);
    setIsAutoRefreshing(true);
    try {
      await Promise.all([fetchSubscriptions(), fetchStats(), fetchPendingRequests()]);
      setLastRefreshTime(new Date());
    } finally {
      setRefreshing(false);
      setTimeout(() => setIsAutoRefreshing(false), 1000);
    }
  };



  // تحميل البيانات عند تحميل الصفحة
  useEffect(() => {
    fetchSubscriptions();
    fetchStats();
    fetchPendingRequests();
    loadSubscriptionTypes();
    loadAllCompaniesForMapping();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, itemsPerPage, searchQuery, filterStatus, sortBy, sortOrder]);

  // جلب التقرير بناءً على النوع بمجرد التغيير
  useEffect(() => {
    if (activeTab === 2) {
      loadReports(reportType);
    }
  }, [reportType, activeTab]);

  // دالة تجديد الاشتراك
  const handleRenewSubscription = async (subscriptionData) => {
    try {
      const response = await fetch(`http://localhost:5001/subscriptions/${selectedSubscription.id}/renew`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscriptionData),
      });

      if (!response.ok) {
        throw new Error('فشل في تجديد الاشتراك');
      }

      const data = await response.json();
      if (data.success) {
        setNotification({
          open: true,
          message: 'تم تجديد الاشتراك بنجاح',
          severity: 'success'
        });
        refreshData(); // تحديث فوري
        setOpenRenewDialog(false);
      } else {
        throw new Error(data.error || 'خطأ في تجديد الاشتراك');
      }
    } catch (err) {
      console.error('خطأ في تجديد الاشتراك:', err);
      setNotification({
        open: true,
        message: err.message,
        severity: 'error'
      });
    }
  };

  // دالة إيقاف الاشتراك
  const handleSuspendSubscription = async (reason) => {
    try {
      const response = await fetch(`http://localhost:5001/subscriptions/${selectedSubscription.id}/suspend`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason }),
      });

      if (!response.ok) {
        throw new Error('فشل في إيقاف الاشتراك');
      }

      const data = await response.json();
      if (data.success) {
        setNotification({
          open: true,
          message: 'تم إيقاف الاشتراك بنجاح',
          severity: 'success'
        });
        refreshData(); // تحديث فوري
        setOpenSuspendDialog(false);
      } else {
        throw new Error(data.error || 'خطأ في إيقاف الاشتراك');
      }
    } catch (err) {
      console.error('خطأ في إيقاف الاشتراك:', err);
      setNotification({
        open: true,
        message: err.message,
        severity: 'error'
      });
    }
  };

  // دالة تصدير البيانات
  const handleExportToExcel = () => {
    // تم إزالة تصدير البيانات إلى Excel
  };

  // دالة الحصول على لون الحالة
  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'success';
      case 'expired': return 'error';
      case 'expiring': return 'warning';
      default: return 'default';
    }
  };

  // دالة الحصول على نص الحالة
  const getStatusText = (status) => {
    switch (status) {
      case 'active': return 'نشط';
      case 'expired': return 'منتهي';
      case 'expiring': return 'ينتهي قريباً';
      default: return 'غير محدد';
    }
  };

  // دالة الحصول على أيقونة الحالة
  const getStatusIcon = (status) => {
    switch (status) {
      case 'active': return <CheckCircleIcon />;
      case 'expired': return <ErrorIcon />;
      case 'expiring': return <WarningIcon />;
      default: return <ScheduleIcon />;
    }
  };

  // دالة حساب الأيام المتبقية
  const getDaysRemaining = (endDate) => {
    if (!endDate) return 0;

    const today = new Date();
    let end;

    // التحقق من تنسيق التاريخ
    if (endDate.includes('/')) {
      // تنسيق dd/mm/yyyy
      const parts = endDate.split('/');
      end = new Date(parts[2], parts[1] - 1, parts[0]);
    } else {
      // تنسيق ISO أو تنسيق آخر
      end = new Date(endDate);
    }

    const diffTime = end - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  // مكون عرض الإحصائيات
  const StatsCards = () => (
    <Grid container spacing={3} sx={{ mb: 3 }}>
      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" color="primary">
                  {stats.totalCompanies || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  إجمالي الشركات المسجلة
                </Typography>
              </Box>
              <BusinessIcon color="primary" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" color="success.main">
                  {stats.activeSubscriptions || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  الاشتراكات النشطة
                </Typography>
              </Box>
              <CheckCircleIcon color="success" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" color="error.main">
                  {stats.expiredSubscriptions || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  الاشتراكات المنتهية
                </Typography>
              </Box>
              <ErrorIcon color="error" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" color="warning.main">
                  {stats.expiringSoon || 0}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  تنتهي قريباً
                </Typography>
              </Box>
              <WarningIcon color="warning" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" color="info.main">
                  {(stats.totalRevenue || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  إجمالي الإيرادات
                </Typography>
              </Box>
              <PaymentIcon color="info" />
            </Box>
          </CardContent>
        </Card>
      </Grid>

      <Grid item xs={12} sm={6} md={2}>
        <Card>
          <CardContent>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Box>
                <Typography variant="h6" color="secondary.main">
                  {(stats.averageCost || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ر.س
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  متوسط قيمة الاشتراك
                </Typography>
              </Box>
              <AssessmentIcon color="secondary" />
            </Box>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );

  // مكون البحث والفلترة
  const SearchAndFilter = () => (
    <Card sx={{ mb: 3 }}>
      <CardContent>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
          📄 البحث والفلترة يطبق على جميع البيانات، مع عرض {itemsPerPage} عنصر في كل صفحة
        </Typography>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              placeholder="البحث في الشركات..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>الحالة</InputLabel>
              <Select
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
                label="الحالة"
              >
                <MenuItem value="">الكل</MenuItem>
                <MenuItem value="active">نشط</MenuItem>
                <MenuItem value="expiring">ينتهي قريباً</MenuItem>
                <MenuItem value="expired">منتهي</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <FormControl fullWidth>
              <InputLabel>الترتيب</InputLabel>
              <Select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                label="الترتيب"
              >
                <MenuItem value="NameCompany">اسم الشركة</MenuItem>
                <MenuItem value="SubscriptionEndDate">تاريخ الانتهاء</MenuItem>
                <MenuItem value="Cost">المبلغ</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} md={2}>
            <Button
              variant="outlined"
              startIcon={sortOrder === 'ASC' ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
              onClick={() => setSortOrder(sortOrder === 'ASC' ? 'DESC' : 'ASC')}
              fullWidth
            >
              {sortOrder === 'ASC' ? 'تصاعدي' : 'تنازلي'}
            </Button>
          </Grid>

          <Grid item xs={12} md={2}>
            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '56px' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <CircularProgress
                  size={20}
                  sx={{
                    color: isAutoRefreshing ? 'success.main' : 'action.disabled',
                    animation: isAutoRefreshing ? 'pulse 1s infinite' : 'none',
                    '@keyframes pulse': {
                      '0%': { opacity: 1 },
                      '50%': { opacity: 0.5 },
                      '100%': { opacity: 1 }
                    }
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  تحديث تلقائي
                </Typography>
              </Box>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );

  return (
    <Box sx={{ p: 3 }}>
      {/* العنوان */}
      <Box sx={{ mb: 4 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 'bold', textAlign: 'right' }}
          >
            إدارة الاشتراكات
          </Typography>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <CircularProgress
              size={20}
              sx={{
                color: isAutoRefreshing ? 'success.main' : 'action.disabled',
                animation: isAutoRefreshing ? 'pulse 1s infinite' : 'none',
                '@keyframes pulse': {
                  '0%': { opacity: 1 },
                  '50%': { opacity: 0.5 },
                  '100%': { opacity: 1 }
                }
              }}
            />
            <Typography variant="body2" color="text.secondary">
              تحديث تلقائي (30 ثانية)
            </Typography>
          </Box>
        </Box>
        <Typography
          variant="body1"
          color="text.secondary"
          sx={{ textAlign: 'right', mb: 1 }}
        >
          إدارة اشتراكات الشركات وطلبات الاشتراك الجديدة
        </Typography>
        <Typography
          variant="body2"
          color="text.disabled"
          sx={{ textAlign: 'right' }}
        >
          آخر تحديث: {lastRefreshTime.toLocaleString('en-GB')}
        </Typography>
      </Box>

      {/* الإحصائيات */}
      <StatsCards />

      {/* البحث والفلترة */}
      <SearchAndFilter />

      {/* التبويبات */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Tabs
            value={activeTab}
            onChange={(e, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            allowScrollButtonsMobile
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Badge
                    badgeContent={stats.activeSubscriptions || stats.totalCompanies || 0}
                    color="primary"
                    overlap="circular"
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 18, minWidth: 18 } }}
                  >
                    <BusinessIcon />
                  </Badge>
                  <span>الاشتراكات النشطة</span>
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Badge
                    badgeContent={pendingRequests?.length || 0}
                    color="warning"
                    overlap="circular"
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 18, minWidth: 18 } }}
                  >
                    <ScheduleIcon />
                  </Badge>
                  <span>طلبات الاشتراك</span>
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AssessmentIcon />
                  <span>التقارير</span>
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Badge
                    badgeContent={subscriptionTypes?.length || 0}
                    color="info"
                    overlap="circular"
                    anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
                    sx={{ '& .MuiBadge-badge': { fontSize: 10, height: 18, minWidth: 18 } }}
                  >
                    <PaymentIcon />
                  </Badge>
                  <span>أنواع الاشتراكات</span>
                </Box>
              }
            />
            <Tab
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <AddIcon />
                  <span>إضافة اشتراك لشركة</span>
                </Box>
              }
            />
          </Tabs>

          {/* أزرار الإجراءات */}
          <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
            <Button
              variant="contained"
              startIcon={<GetAppIcon />}
              onClick={handleExportToExcel}
              disabled={activeTab === 0 ? (stats.activeSubscriptions || 0) === 0 : (pendingRequests?.length || 0) === 0}
            >
              تصدير إلى Excel ({activeTab === 0 ? (stats.activeSubscriptions || 0) : (pendingRequests?.length || 0)})
            </Button>

            <Button
              variant="outlined"
              startIcon={<AutoRenewIcon />}
              onClick={refreshData}
              disabled={refreshing}
            >
              {refreshing ? 'جاري التحديث...' : 'تحديث البيانات'}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* المحتوى حسب التبويب */}
      <Card>
        <CardContent>
          {/* التبويب الأول: الاشتراكات النشطة */}
          {activeTab === 0 && (
            loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                <CircularProgress />
              </Box>
            ) : error ? (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            ) : (
              <>
                <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                  الاشتراكات النشطة ({stats.activeSubscriptions || stats.totalCompanies || 0} إجمالي، {subscriptions?.length || 0} في هذه الصفحة)
                </Typography>
                <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                  <Table
                    size="small"
                    sx={{
                      minWidth: { xs: 600, md: 900 },
                      '& th, & td': { whiteSpace: 'nowrap', fontSize: { xs: '0.8rem', sm: '0.9rem' }, py: { xs: 0.75, sm: 1 } }
                    }}
                  >
                    <TableHead>
                      <TableRow>
                        <TableCell>الشركة</TableCell>
                        <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>الباقة</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>تاريخ البدء</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>تاريخ الانتهاء</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>المبلغ (ر.س)</TableCell>
                        <TableCell>الحالة</TableCell>
                        <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>المشاريع المستخدمة</TableCell>
                        <TableCell>الإجراءات</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {(subscriptions?.length || 0) === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} align="center" sx={{ py: 6 }}>
                            <Box sx={{ textAlign: 'center' }}>
                              <BusinessIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.secondary', mb: 2 }}>
                                لا توجد اشتراكات
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                لم يتم العثور على أي اشتراكات بناءً على المعايير المحددة
                              </Typography>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ) : (
                        subscriptions.map((subscription) => {
                          return (
                            <TableRow key={subscription.id}>
                              <TableCell>
                                <Box>
                                  <Typography variant="subtitle2" fontWeight="bold">
                                    {subscription.companyName}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {subscription.city}, {subscription.country}
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                                <Chip
                                  label={subscription.planName}
                                  color="primary"
                                  variant="outlined"
                                  size="small"
                                />
                              </TableCell>
                              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                {subscription.startDate || 'غير محدد'}
                              </TableCell>
                              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                <Box>
                                  <Typography variant="body2">
                                    {subscription.endDate || 'غير محدد'}
                                  </Typography>
                                  {(() => {
                                    const daysRemaining = getDaysRemaining(subscription.endDate);
                                    if (daysRemaining > 0 && daysRemaining <= 30) {
                                      return (
                                        <Typography variant="caption" color="warning.main">
                                          {daysRemaining} يوم متبقي
                                        </Typography>
                                      );
                                    } else if (daysRemaining < 0) {
                                      return (
                                        <Typography variant="caption" color="error.main">
                                          منتهي منذ {Math.abs(daysRemaining)} يوم
                                        </Typography>
                                      );
                                    }
                                    return null;
                                  })()}
                                </Box>
                              </TableCell>
                              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {subscription.amount.toLocaleString('en-GB')} ر.س
                                </Typography>
                              </TableCell>
                              <TableCell>
                                <Chip
                                  icon={getStatusIcon(subscription.status)}
                                  label={getStatusText(subscription.status)}
                                  size="small"
                                  sx={{
                                    ...getSoftSubscriptionStatusChipSx(subscription.status),
                                    fontWeight: 'bold',
                                    minWidth: '80px'
                                  }}
                                />
                              </TableCell>
                              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                                <Box>
                                  <Typography variant="body2">
                                    {subscription.currentBranches} / {subscription.branchesAllowed}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {subscription.remainingBranches} متبقي
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell>
                                <Box sx={{ display: 'flex', gap: 1 }}>
                                  <Tooltip title="عرض التفاصيل">
                                    <IconButton
                                      size="small"
                                      onClick={() => {
                                        setSelectedSubscription(subscription);
                                        setOpenDetailsDialog(true);
                                      }}
                                    >
                                      <VisibilityIcon sx={{ fontSize: { xs: 18, sm: 22 } }} />
                                    </IconButton>
                                  </Tooltip>


                                </Box>
                              </TableCell>
                            </TableRow>
                          );
                        })
                      )}
                    </TableBody>
                  </Table>
                </TableContainer>

                {/* Pagination */}
                {totalPages > 1 && (
                  <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                    <Pagination
                      count={totalPages}
                      page={currentPage}
                      onChange={(event, value) => setCurrentPage(value)}
                      color="primary"
                      size="large"
                    />
                  </Box>
                )}
              </>
            )
          )}

          {/* التبويب الثاني: طلبات الاشتراك المعلقة */}
          {activeTab === 1 && (
            <>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 'bold' }}>
                طلبات الاشتراك المعلقة ({pendingRequests?.length || 0})
              </Typography>
              <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 900 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>الشركة</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>نوع الطلب</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>تاريخ الطلب</TableCell>
                      <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>مدة الاشتراك</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>المبلغ المطلوب</TableCell>
                      <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>معلومات الاتصال</TableCell>
                      <TableCell>الإجراءات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {(pendingRequests?.length || 0) === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                          <Box sx={{ textAlign: 'center' }}>
                            <ScheduleIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                            <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.secondary', mb: 2 }}>
                              لا توجد طلبات معلقة
                            </Typography>
                            <Typography variant="body2" color="text.secondary">
                              جميع طلبات الاشتراك تم معالجتها
                            </Typography>
                          </Box>
                        </TableCell>
                      </TableRow>
                    ) : (
                      pendingRequests.map((request) => (
                        <TableRow key={request.id}>
                          <TableCell>
                            <Box>
                              <Typography variant="subtitle2" fontWeight="bold">
                                {request.companyName}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {request.registrationNumber || 'غير محدد'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={request.planType || 'أساسي'}
                              color="info"
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            {new Date(request.requestDate).toLocaleDateString('en-GB')}
                          </TableCell>
                          <TableCell>
                            {request.duration || '12'} شهر
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold" color="primary.main">
                              {(request.amount || 0).toLocaleString('en-GB')} ر.س
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Box>
                              <Typography variant="body2">
                                {request.contactEmail || 'غير محدد'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary" dir="ltr">
                                {request.contactPhone || 'غير محدد'}
                              </Typography>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', gap: 1 }}>
                              <Tooltip title="قبول الطلب">
                                <IconButton
                                  size="small"
                                  color="success"
                                  onClick={() => handleApproveRequest(request.id)}
                                >
                                  <CheckIcon />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="حذف طلب">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setOpenRequestDialog(true);
                                  }}
                                >
                                  <CloseIcon />
                                </IconButton>
                              </Tooltip>

                              <Tooltip title="عرض التفاصيل">
                                <IconButton
                                  size="small"
                                  onClick={() => {
                                    setSelectedRequest(request);
                                    setOpenRequestDetailsDialog(true);
                                  }}
                                >
                                  <VisibilityIcon />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          )}

          {/* التبويب الثالث: التقارير */}
          {activeTab === 2 && (
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  تقارير الشركات المشتركة
                </Typography>
                <TextField
                  size="small"
                  label="البحث في التقارير (اسم الشركة، رقم الشركة...)"
                  value={reportsSearchQuery}
                  onChange={(e) => setReportsSearchQuery(e.target.value)}
                  sx={{ width: { xs: '100%', sm: 300 } }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon fontSize="small" />
                      </InputAdornment>
                    ),
                  }}
                />
                <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      label="رقم العملية (tran_ref)"
                      value={tranRefSearch}
                      onChange={(e) => setTranRefSearch(e.target.value)}
                      sx={{ minWidth: 200 }}
                    />
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={loadTransactionTracking}
                      disabled={trackingLoading || invoiceLoading || !tranRefSearch.trim()}
                      startIcon={trackingLoading ? <CircularProgress size={20} /> : <SearchIcon />}
                    >
                      التحقق
                    </Button>
                  </Box>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <TextField
                      size="small"
                      label="كود الاشتراك (code_subscription)"
                      value={invoiceCodeSearch || ''}
                      onChange={(e) => setInvoiceCodeSearch(e.target.value)}
                      sx={{ minWidth: 220 }}
                    />
                    <Button
                      variant="outlined"
                      color="secondary"
                      onClick={() => {
                        const code = (invoiceCodeSearch || '').trim();
                        if (!code) {
                          setNotification({ open: true, message: 'الرجاء إدخال كود الاشتراك (code_subscription)', severity: 'warning' });
                          return;
                        }
                        // ابحث أولاً في البيانات المحملة عن partner_id
                        const foundRow = reportsData.find(r => r.code_subscription === code);
                        if (foundRow?.partner_id) {
                          // نبني الرابط مباشرة من partner_id بدون استدعاء الباك إند
                          const odooUrl = `https://shafaq-acc-shafaq-25386523.dev.odoo.com/my/invoices/${foundRow.partner_id}`;
                          window.open(odooUrl, '_blank', 'noopener,noreferrer');
                          setNotification({ open: true, message: 'تم فتح الفاتورة في نافذة جديدة', severity: 'success' });
                        } else if (foundRow && !foundRow.partner_id) {
                          setNotification({ open: true, message: 'هذا الاشتراك لم يتم ربطه بفاتورة في النظام المالي بعد', severity: 'warning' });
                        } else {
                          setNotification({ open: true, message: 'كود الاشتراك غير موجود في التقرير الحالي، يرجى التأكد من الكود', severity: 'error' });
                        }
                      }}
                      disabled={!(invoiceCodeSearch || '').trim()}
                      startIcon={<ReceiptLongIcon />}
                    >
                      عرض الفاتورة
                    </Button>
                  </Box>
                  <FormControl variant="outlined" size="small" sx={{ minWidth: 200 }}>
                    <InputLabel>نوع التقرير</InputLabel>
                    <Select
                      value={reportType}
                      onChange={(e) => setReportType(e.target.value)}
                      label="نوع التقرير"
                    >
                      <MenuItem value={1}>الباقات المفعلة</MenuItem>
                      <MenuItem value={2}>كل الباقات</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>

              {reportsLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : reportsData?.length === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.secondary', mb: 2 }}>
                    لا توجد بيانات
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    لم يتم العثور على تقارير بناءً على النوع المحدد
                  </Typography>
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, overflowX: 'auto' }}>
                  <Table size="small" sx={{ minWidth: 1800 }}>
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>الشركة</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>كود الاشتراك</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>الباقة</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap', textAlign: 'center' }}>الاستخدام</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>السعر (ر.س)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>الضريبة (ر.س)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>الإجمالي (ر.س)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>نوع الدفع</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>الحالة</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>رقم حوالة الدفع</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>البداية / النهاية</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.9rem', whiteSpace: 'nowrap' }}>إجراءات</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {reportsData
                        .filter(row => {
                          if (!reportsSearchQuery) return true;
                          const searchStr = reportsSearchQuery.toLowerCase();

                          // Try to find the company name safely
                          const mappedCompanySearch = allCompaniesList?.find?.(s => String(s.id) === String(row.company_id));
                          const mappedCompanyName = mappedCompanySearch?.NameCompany || mappedCompanySearch?.name || '';

                          return (
                            (row.name && row.name.toLowerCase().includes(searchStr)) ||
                            (row.code_subscription && row.code_subscription.toLowerCase().includes(searchStr)) ||
                            (row.tran_ref && row.tran_ref.toLowerCase().includes(searchStr)) ||
                            (row.name_package && row.name_package.toLowerCase().includes(searchStr)) ||
                            (mappedCompanyName && mappedCompanyName.toLowerCase().includes(searchStr))
                          );
                        })
                        .map((row, index) => {
                          const mappedCompany = allCompaniesList?.find?.(c => String(c.id) === String(row.company_id));
                          const companyNameText = mappedCompany ? (mappedCompany.NameCompany || mappedCompany.name) : 'شركة غير متوفرة';
                          const companyCityText = mappedCompany ? (mappedCompany.City || mappedCompany.city) : '';

                          return (
                            <TableRow key={index} sx={{ '&:hover': { bgcolor: 'action.hover' } }}>
                              <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {companyNameText}
                                </Typography>
                                <Typography variant="caption" color="text.secondary">
                                  {companyCityText ? `مدينة: ${companyCityText}` : `رمز ${row.company_id}`}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                <Typography variant="body2" fontWeight="bold" color="primary">
                                  {row.code_subscription || '—'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                <Chip size="small" color="secondary" label={row.name_package || '—'} />
                              </TableCell>
                              <TableCell align="center" sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                                  <Typography variant="body2">
                                    {row.project_count_used || '0'} / {row.project_count || '0'}
                                  </Typography>
                                  <Typography variant="caption" color="text.secondary">
                                    {(row.project_count || 0) - (row.project_count_used || 0)} متبقي
                                  </Typography>
                                </Box>
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                <Typography variant="body2" fontWeight="bold">
                                  {parseFloat(row.price || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                <Typography variant="body2">
                                  {parseFloat(row.vat || 0).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                <Typography variant="body2" fontWeight="bold" color="primary">
                                  {(parseFloat(row.price || 0) + parseFloat(row.vat || 0)).toLocaleString('en-GB', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                <Chip
                                  label={row.type === 'paid' ? 'مدفوع' : row.type === 'free' ? 'مجاني' : row.type || '—'}
                                  color={row.type === 'paid' ? 'primary' : row.type === 'free' ? 'default' : 'default'}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                <Chip
                                  label={row.status === 'active' ? 'نشط' : row.status === 'inactive' ? 'غير نشط' : row.status || '—'}
                                  color={row.status === 'active' ? 'success' : 'default'}
                                  size="small"
                                  variant="outlined"
                                />
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                {row.tran_ref || '—'}
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                <Typography variant="body2">
                                  من: {row.start_date ? new Date(row.start_date).toLocaleDateString() : '—'}
                                </Typography>
                                <Typography variant="caption">
                                  إلى: {row.end_date ? new Date(row.end_date).toLocaleDateString() : '—'}
                                </Typography>
                              </TableCell>
                              <TableCell sx={{ whiteSpace: 'nowrap', fontSize: '0.85rem' }}>
                                <Tooltip title={row.partner_id ? 'فتح الفاتورة في Odoo' : 'لا توجد فاتورة مرتبطة بهذا الاشتراك'}>
                                  <span>
                                    <IconButton
                                      size="small"
                                      color={row.partner_id ? 'primary' : 'default'}
                                      disabled={!row.partner_id}
                                      onClick={() => {
                                        // نبني الرابط مباشرة من partner_id بدون استدعاء الباك إند
                                        const odooUrl = `https://shafaq-acc-shafaq-25386523.dev.odoo.com/my/invoices/${row.partner_id}`;
                                        window.open(odooUrl, '_blank', 'noopener,noreferrer');
                                        setNotification({ open: true, message: 'تم فتح الفاتورة في نافذة جديدة', severity: 'success' });
                                      }}
                                    >
                                      <ReceiptLongIcon />
                                    </IconButton>
                                  </span>
                                </Tooltip>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </Box>
          )}

          {/* التبويب الرابع: أنواع الاشتراكات (التسعيرات) */}
          {activeTab === 3 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  أنواع الاشتراكات ({subscriptionTypes?.length || 0})
                </Typography>
                <Button
                  variant="contained"
                  startIcon={<AddIcon />}
                  onClick={openAddTypeDialog}
                  sx={{ borderRadius: 2 }}
                >
                  إضافة نوع جديد
                </Button>
              </Box>

              {typesLoading ? (
                <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (subscriptionTypes?.length || 0) === 0 ? (
                <Box sx={{ textAlign: 'center', py: 6 }}>
                  <PaymentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.secondary', mb: 2 }}>
                    لا توجد أنواع اشتراكات
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    ابدأ بإضافة أنواع الاشتراكات والتسعيرات
                  </Typography>
                  <Button variant="outlined" startIcon={<AddIcon />} onClick={openAddTypeDialog}>
                    إضافة نوع جديد
                  </Button>
                </Box>
              ) : (
                <TableContainer component={Paper} elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2 }}>
                  <Table size="small">
                    <TableHead>
                      <TableRow sx={{ bgcolor: 'grey.50' }}>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>#</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>اسم الباقة</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>المدة (أشهر)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>السعر لكل مشروع (ر.س)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold', fontSize: '0.95rem' }}>الوصف</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>معرف المنتج (Product ID)</TableCell>
                        <TableCell sx={{ fontWeight: 'bold' }}>رقم الشرط (Condition)</TableCell>
                        <TableCell align="center" sx={{ fontWeight: 'bold' }}>الإجراءات</TableCell>
                      </TableRow>
                    </TableHead>
                    <TableBody>
                      {subscriptionTypes.map((type, index) => (
                        <TableRow
                          key={type.id || index}
                          sx={{ '&:hover': { bgcolor: 'action.hover' }, transition: 'background-color 0.2s' }}
                        >
                          <TableCell>{index + 1}</TableCell>
                          <TableCell>
                            <Typography variant="subtitle2" fontWeight="bold">
                              {type.name}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${type.duration_in_months} شهر`}
                              color="primary"
                              variant="outlined"
                              size="small"
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" fontWeight="bold" color="success.main">
                              {Number(type.price_per_project).toLocaleString('en-GB')} ر.س
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {type.discraption || '—'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip size="small" label={type.product_id || 'غير محدد'} variant="outlined" />
                          </TableCell>
                          <TableCell>{type.condition || '—'}</TableCell>
                          <TableCell align="center">
                            <Box sx={{ display: 'flex', gap: 0.5 }}>
                              <Tooltip title="تعديل">
                                <IconButton size="small" color="primary" onClick={() => openEditTypeDialog(type)}>
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="حذف">
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => { setDeletingType(type); setOpenDeleteTypeDialog(true); }}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </TableContainer>
              )}
            </>
          )}

          {/* التبويب الخامس: إضافة اشتراك لشركة */}
          {activeTab === 4 && (
            <>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  إضافة اشتراك جديد لشركة
                </Typography>
              </Box>

              <Paper elevation={0} sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 2, p: 3, mb: 3 }}>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={4}>
                    <Autocomplete
                      options={allCompaniesList || []}
                      getOptionLabel={(option) => {
                        if (typeof option === 'string') return option;
                        return `${option.name || option.NameCompany || 'شركة غير معرفة'} (رمز: ${option.id})`;
                      }}
                      value={allCompaniesList?.find(c => String(c.id) === String(newSubFormData.company_id)) || null}
                      onChange={(event, newValue) => {
                        setNewSubFormData({ ...newSubFormData, company_id: newValue ? newValue.id : '' });
                      }}
                      renderInput={(params) => (
                        <TextField
                          {...params}
                          label="البحث عن اسم الشركة أو اختيارها"
                          variant="outlined"
                          fullWidth
                        />
                      )}
                      noOptionsText="لم يتم جلب أسماء الشركات بعد"
                    />
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <FormControl fullWidth variant="outlined">
                      <InputLabel>نوع الاشتراك (الباقة)</InputLabel>
                      <Select
                        value={newSubFormData.subscription_type_id}
                        onChange={(e) => setNewSubFormData({ ...newSubFormData, subscription_type_id: e.target.value })}
                        label="نوع الاشتراك (الباقة)"
                      >
                        {subscriptionTypes.map((type) => (
                          <MenuItem key={type.id} value={type.id}>
                            {type.name} — {type.duration_in_months} شهر — {Number(type.price_per_project).toLocaleString('en-GB')} ر.س/مشروع
                            {type.condition > 0 ? ` (حد أدنى: ${type.condition} مشروع)` : ''}
                          </MenuItem>
                        ))}
                      </Select>
                    </FormControl>
                  </Grid>

                  <Grid item xs={12} md={4}>
                    <TextField
                      fullWidth
                      label="عدد المشاريع"
                      type="number"
                      variant="outlined"
                      value={newSubFormData.project_count}
                      onChange={(e) => setNewSubFormData({ ...newSubFormData, project_count: e.target.value })}
                      inputProps={{ min: 1 }}
                    />
                  </Grid>

                  {/* عرض السعر المتوقع */}
                  {newSubFormData.subscription_type_id && newSubFormData.project_count && (
                    <Grid item xs={12}>
                      <Alert severity="info" sx={{ borderRadius: 2 }}>
                        {(() => {
                          const selectedType = subscriptionTypes.find(t => String(t.id) === String(newSubFormData.subscription_type_id));
                          if (!selectedType) return 'لم يتم العثور على نوع الاشتراك';
                          const count = Number(newSubFormData.project_count);
                          const price = count * selectedType.price_per_project * selectedType.duration_in_months;
                          const vat = price * 15 / 100;
                          const total = price + vat;
                          return (
                            <>
                              <Typography variant="body2">
                                <strong>الباقة:</strong> {selectedType.name} | <strong>المدة:</strong> {selectedType.duration_in_months} شهر | <strong>السعر للمشروع:</strong> {Number(selectedType.price_per_project).toLocaleString('en-GB')} ر.س
                              </Typography>
                              <Typography variant="body2">
                                <strong>السعر قبل الضريبة:</strong> {price.toLocaleString('en-GB')} ر.س | <strong>ضريبة (15%):</strong> {vat.toLocaleString('en-GB')} ر.س | <strong>الإجمالي:</strong> {total.toLocaleString('en-GB')} ر.س
                              </Typography>
                              {selectedType.condition > 0 && count < selectedType.condition && (
                                <Typography variant="body2" color="error" sx={{ mt: 1 }}>
                                  ⚠️ الحد الأدنى لعدد المشاريع: {selectedType.condition}
                                </Typography>
                              )}
                            </>
                          );
                        })()}
                      </Alert>
                    </Grid>
                  )}

                  <Grid item xs={12}>
                    <Button
                      variant="contained"
                      color="primary"
                      size="large"
                      startIcon={newSubSaving ? <CircularProgress size={20} color="inherit" /> : <AddIcon />}
                      onClick={handleSaveNewSubscription}
                      disabled={newSubSaving}
                      sx={{ borderRadius: 2, px: 4 }}
                    >
                      {newSubSaving ? 'جاري الإنشاء...' : 'إنشاء الاشتراك'}
                    </Button>
                  </Grid>
                </Grid>
              </Paper>

              {/* عرض نتيجة آخر عملية إنشاء */}
              {newSubResult && newSubResult.code_subscription && (
                <Alert severity="success" sx={{ borderRadius: 2 }}>
                  <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                    ✅ تم إنشاء الاشتراك بنجاح
                  </Typography>
                  <Typography variant="body2">
                    <strong>كود الاشتراك:</strong> {newSubResult.code_subscription?.code_subscription || newSubResult.code_subscription}
                  </Typography>
                  {newSubResult.code_subscription?.price && (
                    <Typography variant="body2">
                      <strong>الإجمالي:</strong> {Number(newSubResult.code_subscription.price).toLocaleString('en-GB')} ر.س
                    </Typography>
                  )}
                  {newSubResult.code_subscription?.NameCompany && (
                    <Typography variant="body2">
                      <strong>الشركة:</strong> {newSubResult.code_subscription.NameCompany}
                    </Typography>
                  )}
                </Alert>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* حوار تجديد الاشتراك */}
      <Dialog open={openRenewDialog} onClose={() => setOpenRenewDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>تجديد الاشتراك</DialogTitle>
        <DialogContent>
          <DialogContentText>
            تجديد اشتراك {selectedSubscription?.companyName}
          </DialogContentText>
          {/* يمكن إضافة فورم التجديد هنا */}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRenewDialog(false)}>إلغاء</Button>
          <Button onClick={() => handleRenewSubscription({})} variant="contained">
            تجديد
          </Button>
        </DialogActions>
      </Dialog>

      {/* حوار إيقاف الاشتراك */}
      <Dialog open={openSuspendDialog} onClose={() => setOpenSuspendDialog(false)}>
        <DialogTitle>إيقاف الاشتراك</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من إيقاف اشتراك {selectedSubscription?.companyName}؟
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSuspendDialog(false)}>إلغاء</Button>
          <Button onClick={() => handleSuspendSubscription('إيقاف إداري')} color="error">
            إيقاف
          </Button>
        </DialogActions>
      </Dialog>

      {/* حوار تفاصيل طلب الاشتراك */}
      <Dialog open={openRequestDetailsDialog} onClose={() => setOpenRequestDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>تفاصيل طلب الاشتراك</DialogTitle>
        <DialogContent>
          {selectedRequest && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>اسم الشركة</Typography>
                <Typography variant="body1">{selectedRequest.companyName}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>نوع الطلب</Typography>
                <Typography variant="body1">{selectedRequest.planType || 'غير محدد'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>تاريخ الطلب</Typography>
                <Typography variant="body1">{new Date(selectedRequest.requestDate).toLocaleDateString('en-GB')}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>المدة</Typography>
                <Typography variant="body1">{selectedRequest.duration || '12'} شهر</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>المبلغ المطلوب</Typography>
                <Typography variant="body1">{(selectedRequest.amount || 0).toLocaleString('en-GB')} ر.س</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>معلومات الاتصال</Typography>
                <Typography variant="body1">{selectedRequest.contactEmail || 'غير محدد'}</Typography>
                <Typography variant="caption" color="text.secondary" dir="ltr">{selectedRequest.contactPhone || 'غير محدد'}</Typography>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRequestDetailsDialog(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>

      {/* حوار تفاصيل الاشتراك */}
      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          تفاصيل الاشتراك
          {selectedSubscription && (
            <Chip
              label={getStatusText(selectedSubscription.status)}
              color={getStatusColor(selectedSubscription.status)}
              size="medium"
              sx={{ fontWeight: 'bold' }}
            />
          )}
        </DialogTitle>
        <DialogContent dividers>
          {selectedSubscription && (
            <Grid container spacing={2.5}>
              {/* معلومات الشركة */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                  معلومات الشركة
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>اسم الشركة</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedSubscription.companyName}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>رقم السجل التجاري</Typography>
                <Typography variant="body1">{selectedSubscription.registrationNumber || 'غير محدد'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>المدينة</Typography>
                <Typography variant="body1">{selectedSubscription.city || 'غير محدد'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>الدولة</Typography>
                <Typography variant="body1">{selectedSubscription.country || 'غير محدد'}</Typography>
              </Grid>

              <Grid item xs={12}><Divider /></Grid>

              {/* معلومات الاشتراك */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                  معلومات الاشتراك
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>الباقة</Typography>
                <Chip label={selectedSubscription.planName} color="secondary" variant="outlined" />
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>طريقة الدفع</Typography>
                <Typography variant="body1">{selectedSubscription.paymentMethod}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>تاريخ البدء</Typography>
                <Typography variant="body1">{selectedSubscription.startDate || 'غير محدد'}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>تاريخ الانتهاء</Typography>
                <Typography variant="body1">
                  {selectedSubscription.endDate || 'غير محدد'}
                  {selectedSubscription.endDate && (() => {
                    const days = getDaysRemaining(selectedSubscription.endDate);
                    if (days > 0) return ` (${days} يوم متبقي)`;
                    if (days < 0) return ` (منتهي منذ ${Math.abs(days)} يوم)`;
                    return ' (ينتهي اليوم)';
                  })()}
                </Typography>
              </Grid>

              <Grid item xs={12}><Divider /></Grid>

              {/* المعلومات المالية */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                  المعلومات المالية
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>السعر (بدون ضريبة)</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedSubscription.amount.toLocaleString('en-GB', { minimumFractionDigits: 2 })} ر.س</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>ضريبة القيمة المضافة (15%)</Typography>
                <Typography variant="body1">{(selectedSubscription.amount * 0.15).toLocaleString('en-GB', { minimumFractionDigits: 2 })} ر.س</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>الإجمالي شامل الضريبة</Typography>
                <Typography variant="h6" color="primary" fontWeight="bold">{(selectedSubscription.amount * 1.15).toLocaleString('en-GB', { minimumFractionDigits: 2 })} ر.س</Typography>
              </Grid>

              <Grid item xs={12}><Divider /></Grid>

              {/* استخدام المشاريع */}
              <Grid item xs={12}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                  استخدام المشاريع
                </Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>المشاريع المسموح بها</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedSubscription.branchesAllowed}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>المشاريع المستخدمة</Typography>
                <Typography variant="body1" fontWeight="bold">{selectedSubscription.currentBranches}</Typography>
              </Grid>
              <Grid item xs={12} md={4}>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>المتبقي</Typography>
                <Chip
                  label={`${selectedSubscription.remainingBranches} مشروع متبقي`}
                  color={selectedSubscription.remainingBranches > 0 ? 'success' : 'error'}
                  variant="outlined"
                  size="small"
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)} variant="contained">إغلاق</Button>
        </DialogActions>
      </Dialog>

      {/* حوار رفض طلب الاشتراك */}
      <Dialog open={openRequestDialog} onClose={() => setOpenRequestDialog(false)}>
        <DialogTitle>طلب حذف الاشتراك</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            هل أنت متأكد من حذف طلب اشتراك {selectedRequest?.companyName}؟
          </DialogContentText>
          <TextField
            fullWidth
            multiline
            rows={3}
            label="سبب الرفض (اختياري)"
            variant="outlined"
            defaultValue="لم يتم استيفاء المتطلبات المطلوبة"
            id="rejection-reason"
            sx={{ mt: 2 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenRequestDialog(false)}>إلغاء</Button>
          <Button
            onClick={() => {
              const reason = document.getElementById('rejection-reason')?.value || 'لم يتم تحديد السبب';
              handleRejectRequest(selectedRequest?.id, reason);
              setOpenRequestDialog(false);
            }}
            color="error"
            variant="contained"
          >
            حذف الطلب
          </Button>
        </DialogActions>
      </Dialog>

      {/* حوار إضافة/تعديل نوع اشتراك */}
      <Dialog open={openTypeDialog} onClose={() => setOpenTypeDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>
          {editingType ? 'تعديل نوع الاشتراك' : 'إضافة نوع اشتراك جديد'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            <TextField
              fullWidth
              label="اسم الباقة"
              value={typeFormData.name}
              onChange={(e) => setTypeFormData({ ...typeFormData, name: e.target.value })}
              required
              placeholder="مثال: ثلاثة أشهر"
            />
            <TextField
              fullWidth
              label="المدة بالأشهر"
              type="number"
              value={typeFormData.duration_in_months}
              onChange={(e) => setTypeFormData({ ...typeFormData, duration_in_months: e.target.value })}
              required
              placeholder="مثال: 3"
              InputProps={{ inputProps: { min: 1 } }}
            />
            <TextField
              fullWidth
              label="السعر لكل مشروع (ر.س)"
              type="number"
              value={typeFormData.price_per_project}
              onChange={(e) => setTypeFormData({ ...typeFormData, price_per_project: e.target.value })}
              required
              placeholder="مثال: 115"
              InputProps={{ inputProps: { min: 0, step: 0.01 } }}
            />

            <TextField
              fullWidth
              label="رقم الشرط (Condition)"
              type="number"
              value={typeFormData.condition}
              onChange={(e) => setTypeFormData({ ...typeFormData, condition: e.target.value })}
              required
              placeholder="مثال: 0 أو أكثر"
              InputProps={{ inputProps: { min: 0 } }}
            />
            <TextField
              fullWidth
              label="الوصف (اختياري)"
              multiline
              rows={3}
              value={typeFormData.discraption}
              onChange={(e) => setTypeFormData({ ...typeFormData, discraption: e.target.value })}
              placeholder="وصف اختياري لهذه الباقة..."
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setOpenTypeDialog(false)} disabled={typeSaving}>إلغاء</Button>
          <Button
            onClick={handleSaveType}
            variant="contained"
            disabled={typeSaving}
            startIcon={typeSaving ? <CircularProgress size={18} /> : (editingType ? <EditIcon /> : <AddIcon />)}
          >
            {typeSaving ? 'جاري الحفظ...' : (editingType ? 'تعديل' : 'إضافة')}
          </Button>
        </DialogActions>
      </Dialog>

      {/* حوار تأكيد حذف نوع اشتراك */}
      <Dialog open={openDeleteTypeDialog} onClose={() => setOpenDeleteTypeDialog(false)}>
        <DialogTitle sx={{ fontWeight: 'bold', color: 'error.main' }}>تأكيد الحذف</DialogTitle>
        <DialogContent>
          <DialogContentText>
            هل أنت متأكد من حذف نوع الاشتراك "{deletingType?.name}"؟
            <br />
            <strong>لا يمكن التراجع عن هذا الإجراء.</strong>
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenDeleteTypeDialog(false); setDeletingType(null); }} disabled={typeSaving}>
            إلغاء
          </Button>
          <Button
            onClick={handleDeleteType}
            color="error"
            variant="contained"
            disabled={typeSaving}
            startIcon={typeSaving ? <CircularProgress size={18} /> : <DeleteIcon />}
          >
            {typeSaving ? 'جاري الحذف...' : 'حذف'}
          </Button>
        </DialogActions>
      </Dialog>      {/* حوار عرض تفاصيل العملية */}
      <Dialog open={openTrackingDialog} onClose={() => setOpenTrackingDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          تفاصيل تتبع العملية
          {trackingResult?.payment_result?.response_status && (
            <Chip
              label={trackingResult.payment_result.response_status === 'A' ? 'مدفوعة ✅' : 'مرفوضة ❌'}
              color={trackingResult.payment_result.response_status === 'A' ? 'success' : 'error'}
              size="medium"
              sx={{ fontWeight: 'bold' }}
            />
          )}
        </DialogTitle>
        <DialogContent dividers>
          {trackingResult ? (
            <Grid container spacing={3}>
              {/* المعلومات الأساسية */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                  المعلومات الأساسية
                </Typography>
                <Typography variant="body2"><strong>رقم العملية (Ref):</strong> {trackingResult.tran_ref || '—'}</Typography>
                <Typography variant="body2"><strong>نوع العملية:</strong> {trackingResult.tran_type || '—'}</Typography>
                <Typography variant="body2"><strong>رقم السلة:</strong> {trackingResult.cart_id || '—'}</Typography>
                <Typography variant="body2"><strong>الوصف:</strong> {trackingResult.cart_description || '—'}</Typography>
                <Divider sx={{ my: 1 }} />
                <Typography variant="body2"><strong>مبلغ السلة:</strong> {trackingResult.cart_amount || '—'} {trackingResult.cart_currency || ''}</Typography>
                <Typography variant="body2"><strong>المبلغ الإجمالي:</strong> {trackingResult.tran_total || '—'} {trackingResult.tran_currency || ''}</Typography>
              </Grid>

              {/* نتيجة الدفع */}
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                  نتيجة الدفع
                </Typography>
                <Box sx={{ mb: 1 }}>
                  <Chip
                    label={trackingResult.payment_result?.response_message || '—'}
                    color={trackingResult.payment_result?.response_status === 'A' ? 'success' : 'error'}
                    size="small"
                  />
                </Box>
                <Typography variant="body2"><strong>كود الاستجابة:</strong> {trackingResult.payment_result?.response_code || '—'}</Typography>
                <Typography variant="body2"><strong>رسالة البنك:</strong> {trackingResult.payment_result?.acquirer_message || '—'}</Typography>
                <Typography variant="body2"><strong>رقم مرجع البنك (RRN):</strong> {trackingResult.payment_result?.acquirer_rrn || '—'}</Typography>
                <Typography variant="body2"><strong>وقت العملية:</strong> {trackingResult.payment_result?.transaction_time ? new Date(trackingResult.payment_result.transaction_time).toLocaleString('ar-SA') : '—'}</Typography>
              </Grid>

              {/* تفاصيل العميل */}
              {trackingResult.customer_details && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mt: 1 }} gutterBottom>
                    تفاصيل العميل
                  </Typography>
                  <Typography variant="body2"><strong>الاسم:</strong> {trackingResult.customer_details.name || '—'}</Typography>
                  <Typography variant="body2"><strong>البريد الإلكتروني:</strong> {trackingResult.customer_details.email || '—'}</Typography>
                  <Typography variant="body2"><strong>الهاتف:</strong> {trackingResult.customer_details.phone || '—'}</Typography>
                  <Typography variant="body2"><strong>العنوان:</strong> {trackingResult.customer_details.street1 || '—'}</Typography>
                  <Typography variant="body2"><strong>المدينة:</strong> {trackingResult.customer_details.city || '—'}</Typography>
                  <Typography variant="body2"><strong>المنطقة:</strong> {trackingResult.customer_details.state || '—'}</Typography>
                  <Typography variant="body2"><strong>الدولة:</strong> {trackingResult.customer_details.country || '—'}</Typography>
                  <Typography variant="body2"><strong>الرمز البريدي:</strong> {trackingResult.customer_details.zip || '—'}</Typography>
                  <Typography variant="body2"><strong>عنوان IP:</strong> {trackingResult.customer_details.ip || '—'}</Typography>
                </Grid>
              )}

              {/* معلومات الدفع */}
              {trackingResult.payment_info && (
                <Grid item xs={12} md={6}>
                  <Typography variant="subtitle1" fontWeight="bold" color="primary" sx={{ mt: 1 }} gutterBottom>
                    معلومات الدفع
                  </Typography>
                  <Typography variant="body2"><strong>وسيلة الدفع:</strong> {trackingResult.payment_info.payment_method || '—'}</Typography>
                  <Typography variant="body2"><strong>نوع البطاقة:</strong> {trackingResult.payment_info.card_type || '—'} - {trackingResult.payment_info.card_scheme || '—'}</Typography>
                  <Typography variant="body2"><strong>وصف البطاقة:</strong> {trackingResult.payment_info.payment_description || '—'}</Typography>
                  <Typography variant="body2"><strong>تاريخ الانتهاء:</strong> {trackingResult.payment_info.expiryMonth || '—'}/{trackingResult.payment_info.expiryYear || '—'}</Typography>
                  <Typography variant="body2"><strong>دولة المصدر:</strong> {trackingResult.payment_info.issuerCountry || '—'}</Typography>
                  <Typography variant="body2"><strong>البنك المصدر:</strong> {trackingResult.payment_info.issuerName || '—'}</Typography>
                </Grid>
              )}

              {/* معلومات إضافية */}
              <Grid item xs={12}>
                <Divider sx={{ my: 1 }} />
                <Typography variant="subtitle1" fontWeight="bold" color="primary" gutterBottom>
                  معلومات إضافية
                </Typography>
                <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap' }}>
                  <Typography variant="body2"><strong>قناة الدفع:</strong> {trackingResult.paymentChannel || '—'}</Typography>
                  <Typography variant="body2"><strong>رقم الخدمة:</strong> {trackingResult.serviceId || '—'}</Typography>
                  <Typography variant="body2"><strong>رقم الملف التجاري:</strong> {trackingResult.profileId || '—'}</Typography>
                  <Typography variant="body2"><strong>رقم التاجر:</strong> {trackingResult.merchantId || '—'}</Typography>
                  <Typography variant="body2"><strong>Trace:</strong> {trackingResult.trace || '—'}</Typography>
                </Box>
              </Grid>
            </Grid>
          ) : (
            <Typography variant="body1" color="text.secondary" align="center">لا توجد تفاصيل عرض متوفرة لهذه العملية.</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenTrackingDialog(false)} variant="contained" color="primary">
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* إشعار */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={() => setNotification({ ...notification, open: false })}
      >
        <Alert
          onClose={() => setNotification({ ...notification, open: false })}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box >
  );
};

export default Subscriptions;
