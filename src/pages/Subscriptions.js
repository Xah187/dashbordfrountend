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
  Switch,
  FormControlLabel,
  Alert,
  LinearProgress,
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
  Stack
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  ReceiptLong as ReceiptLongIcon,
  Business as BusinessIcon,
  Cancel as CancelIcon,
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
import { useTheme } from '@mui/material/styles';

import { getSubscriptionTypeColor, getSubscriptionStatusColor, getAutoRenewColor } from '../utils/colorUtils';
import { AutoRenewBadge, SubscriptionStatusBadge } from '../components/common';

// استيراد APIs الجديدة المفعلة للاشتراكات والطلبات المعلقة
import { 
  fetchSubscriptions as fetchSubscriptionsAPI,
  fetchSubscriptionStats,
  fetchPendingSubscriptionRequests,
  approveSubscriptionRequest,
  rejectSubscriptionRequest,
  renewSubscription,
  suspendSubscription
} from '../api';

const Subscriptions = () => {
  const theme = useTheme();
  
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
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  
  // State للحوارات
  const [openRenewDialog, setOpenRenewDialog] = useState(false);
  const [openSuspendDialog, setOpenSuspendDialog] = useState(false);
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openRequestDialog, setOpenRequestDialog] = useState(false);
  
  // State للطلبات
  const [pendingRequests, setPendingRequests] = useState([]);
  const [selectedRequest, setSelectedRequest] = useState(null);
  
  // State للإشعارات
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // State للتبويبات
  const [activeTab, setActiveTab] = useState(0); // 0: الاشتراكات، 1: الطلبات المعلقة، 2: الإحصائيات
  
  // State للتحديث
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // جلب البيانات من API الجديد المفعل
  const fetchSubscriptions = async () => {
    try {
      setLoading(true);
      
      const result = await fetchSubscriptionsAPI({
        page: currentPage,
        limit: itemsPerPage,
        search: searchQuery,
        status: filterStatus,
        sortBy: sortBy,
        sortOrder: sortOrder
      });
      
      setSubscriptions(Array.isArray(result.data) ? result.data : []);
      setTotalItems(result.pagination?.totalItems || 0);
      setTotalPages(result.pagination?.totalPages || 0);
      
    } catch (err) {
      console.error('❌ Error fetching subscriptions with NEW API:', err);
      setError(err.message);
      // التأكد من بقاء المتغيرات كـ arrays فارغة في حالة الخطأ
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

  // قبول طلب الاشتراك
  const handleApproveRequest = async (requestId) => {
    try {
      const result = await approveSubscriptionRequest(requestId);
      
      setNotification({
        open: true,
        message: 'تم قبول الطلب بنجاح وإنشاء الاشتراك',
        severity: 'success'
      });
      
      // تحديث البيانات
      fetchPendingRequests();
      fetchSubscriptions();
      fetchStats();
      
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
      const result = await rejectSubscriptionRequest(requestId, reason);
      
      setNotification({
        open: true,
        message: 'تم رفض الطلب بنجاح',
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

  // تحديث تلقائي كل 30 ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 30000);

    return () => clearInterval(interval);
  }, []);

  // تحميل البيانات عند تحميل الصفحة
  useEffect(() => {
    fetchSubscriptions();
    fetchStats();
    fetchPendingRequests();
  }, [currentPage, itemsPerPage, searchQuery, filterStatus, sortBy, sortOrder]);

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
    const fields = ['companyName', 'planName', 'startDate', 'endDate', 'amount', 'status', 'autoRenew', 'paymentMethod'];
    const headers = ['الشركة', 'الباقة', 'تاريخ البدء', 'تاريخ الانتهاء', 'المبلغ (ر.س)', 'الحالة', 'التجديد التلقائي', 'طريقة الدفع'];
    
    const formattedSubscriptions = subscriptions.map(sub => ({
      ...sub,
      status: getStatusText(sub.status),
      autoRenew: sub.autoRenew ? 'مفعل' : 'غير مفعل',
      amount: sub.amount.toLocaleString('en-GB')
    }));
    
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
      <Grid item xs={12} sm={6} md={3}>
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
      
      <Grid item xs={12} sm={6} md={3}>
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
      
      <Grid item xs={12} sm={6} md={3}>
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
      
      <Grid item xs={12} sm={6} md={3}>
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
            sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}
          >
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <BusinessIcon />
                  <span>الاشتراكات النشطة</span>
                  <Badge badgeContent={stats.activeSubscriptions || stats.totalCompanies || 0} color="primary" />
                </Box>
              } 
            />
            <Tab 
              label={
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <ScheduleIcon />
                  <span>طلبات الاشتراك</span>
                  <Badge badgeContent={pendingRequests?.length || 0} color="warning" />
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
                <TableContainer>
                  <Table>
                    <TableHead>
                      <TableRow>
                        <TableCell>الشركة</TableCell>
                        <TableCell>الباقة</TableCell>
                        <TableCell>تاريخ البدء</TableCell>
                        <TableCell>تاريخ الانتهاء</TableCell>
                        <TableCell>المبلغ (ر.س)</TableCell>
                        <TableCell>الحالة</TableCell>
                        <TableCell>الفروع</TableCell>
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
                        const daysRemaining = getDaysRemaining(subscription.endDate);
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
                            <TableCell>
                              <Chip
                                label={subscription.planName}
                                color="primary"
                                variant="outlined"
                                size="small"
                              />
                            </TableCell>
                            <TableCell>
                              {subscription.startDate || 'غير محدد'}
                            </TableCell>
                            <TableCell>
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
                            <TableCell>
                              <Typography variant="body2" fontWeight="bold">
                                {subscription.amount.toLocaleString('en-GB')} ر.س
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Chip
                                icon={getStatusIcon(subscription.status)}
                                label={getStatusText(subscription.status)}
                                color={getStatusColor(subscription.status)}
                                size="small"
                                sx={{
                                  fontWeight: 'bold',
                                  minWidth: '80px'
                                }}
                              />
                            </TableCell>
                            <TableCell>
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
                                    <VisibilityIcon />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="تجديد">
                                  <IconButton
                                    size="small"
                                    onClick={() => {
                                      setSelectedSubscription(subscription);
                                      setOpenRenewDialog(true);
                                    }}
                                  >
                                    <AutoRenewIcon />
                                  </IconButton>
                                </Tooltip>
                                
                                <Tooltip title="إيقاف">
                                  <IconButton
                                    size="small"
                                    color="error"
                                    onClick={() => {
                                      setSelectedSubscription(subscription);
                                      setOpenSuspendDialog(true);
                                    }}
                                  >
                                    <CancelIcon />
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
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 3, gap: 1 }}>
                    <Typography variant="body2" color="text.secondary">
                      عرض {subscriptions?.length || 0} من {totalItems} اشتراك (صفحة {currentPage} من {totalPages})
                    </Typography>
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
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>الشركة</TableCell>
                      <TableCell>نوع الطلب</TableCell>
                      <TableCell>تاريخ الطلب</TableCell>
                      <TableCell>مدة الاشتراك</TableCell>
                      <TableCell>المبلغ المطلوب</TableCell>
                      <TableCell>معلومات الاتصال</TableCell>
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
                              
                              <Tooltip title="رفض الطلب">
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
                                    setOpenDetailsDialog(true);
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
            <Box sx={{ textAlign: 'center', py: 6 }}>
              <AssessmentIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'text.secondary', mb: 2 }}>
                التقارير قيد التطوير
              </Typography>
              <Typography variant="body2" color="text.secondary">
                سيتم إضافة التقارير التفصيلية قريباً
              </Typography>
            </Box>
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

      {/* حوار تفاصيل الاشتراك */}
      <Dialog open={openDetailsDialog} onClose={() => setOpenDetailsDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>تفاصيل الاشتراك</DialogTitle>
        <DialogContent>
          {selectedSubscription && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>اسم الشركة</Typography>
                <Typography variant="body1">{selectedSubscription.companyName}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>الباقة</Typography>
                <Typography variant="body1">{selectedSubscription.planName}</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>تاريخ البدء</Typography>
                <Typography variant="body1">
                  {selectedSubscription.startDate || 'غير محدد'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>تاريخ الانتهاء</Typography>
                <Typography variant="body1">
                  {selectedSubscription.endDate || 'غير محدد'}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>المبلغ</Typography>
                <Typography variant="body1">{selectedSubscription.amount.toLocaleString('en-GB')} ر.س</Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="subtitle2" gutterBottom>الحالة</Typography>
                <Chip
                  label={getStatusText(selectedSubscription.status)}
                  color={getStatusColor(selectedSubscription.status)}
                  size="small"
                  sx={{
                    fontWeight: 'bold',
                    minWidth: '80px'
                  }}
                />
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>إغلاق</Button>
        </DialogActions>
      </Dialog>

      {/* حوار رفض طلب الاشتراك */}
      <Dialog open={openRequestDialog} onClose={() => setOpenRequestDialog(false)}>
        <DialogTitle>رفض طلب الاشتراك</DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            هل أنت متأكد من رفض طلب اشتراك {selectedRequest?.companyName}؟
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
            رفض الطلب
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
    </Box>
  );
};

export default Subscriptions;
