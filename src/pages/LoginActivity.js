/**
 * صفحة أنشطة تسجيل الدخول
 * 
 * URL: http://localhost:3000/login-activity
 * 
 * ✅ متصلة بقاعدة البيانات الحقيقية
 * ✅ تستخدم API أنشطة تسجيل الدخول
 * ✅ تعرض أكواد التحقق للمستخدمين
 * ✅ تدعم البحث والفلترة
 * ✅ تدعم عرض الإحصائيات
 * 
 * الصفحة تحتوي على:
 * - عرض أنشطة تسجيل الدخول من قاعدة البيانات
 * - عرض أكواد التحقق للمستخدمين
 * - إحصائيات تسجيل الدخول
 * - البحث والفلترة حسب الحالة والشركة
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
  Stack,
  Avatar
} from '@mui/material';
import { formatGregorianDate, formatGregorianDateTime } from '../utils/dateUtils';
import {
  Search as SearchIcon,
  CheckCircle as CheckCircleIcon,
  Business as BusinessIcon,
  Cancel as CancelIcon,
  GetApp as GetAppIcon,
  Assessment as AssessmentIcon,
  Warning as WarningIcon,
  Schedule as ScheduleIcon,
  Visibility as VisibilityIcon,
  Error as ErrorIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  KeyboardArrowDown as KeyboardArrowDownIcon,
  Phone as PhoneIcon,
  Work as WorkIcon,
  AccountCircle as AccountCircleIcon,
  Code as CodeIcon,
  Login as LoginIcon,
  Logout as LogoutIcon,
  Today as TodayIcon,
  Person as PersonIcon,
  Group as GroupIcon,
  Timeline as TimelineIcon
} from '@mui/icons-material';
import { useTheme } from '@mui/material/styles';


// استيراد APIs الجديدة المفعلة لأنشطة تسجيل الدخول
import { 
  fetchAllLoginActivities,
  fetchLoginActivityStats,
  searchLoginActivityByCode,
  formatActivationStatus,
  formatLoginDate,
  calculateSessionDuration,
  filterActivitiesByPeriod
} from '../api';

const LoginActivity = () => {
  const theme = useTheme();
  
  // State للبيانات
  const [loginActivities, setLoginActivities] = useState([]);
  const [stats, setStats] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedActivity, setSelectedActivity] = useState(null);
  
  // State للبحث والفلترة
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCompany, setFilterCompany] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [sortBy, setSortBy] = useState('DateOFlogin');
  const [sortOrder, setSortOrder] = useState('DESC');
  
  // State للـ pagination مع فلترة يومية
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10); // ثابت على 10 عناصر
  const [totalItems, setTotalItems] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [allLoginActivities, setAllLoginActivities] = useState([]); // جميع البيانات
  const [dailyFilteredActivities, setDailyFilteredActivities] = useState([]); // البيانات المفلترة يومياً
  
  // State للحوارات
  const [openDetailsDialog, setOpenDetailsDialog] = useState(false);
  const [openCodeSearchDialog, setOpenCodeSearchDialog] = useState(false);
  const [codeSearchQuery, setCodeSearchQuery] = useState('');
  const [codeSearchResult, setCodeSearchResult] = useState(null);
  
  // State للإشعارات
  const [notification, setNotification] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  
  // State للتبويبات
  const [activeTab, setActiveTab] = useState(0); // 0: الأنشطة، 1: الإحصائيات
  
  // State للتحديث
  const [refreshing, setRefreshing] = useState(false);
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // فلترة البيانات بشكل يومي (اليوم الحالي فقط)
  const filterDailyActivities = (activities) => {
    const today = new Date();
    const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const endOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1);
    
    return activities.filter(activity => {
      if (!activity.DateOFlogin) return false;
      const activityDate = new Date(activity.DateOFlogin);
      return activityDate >= startOfDay && activityDate < endOfDay;
    });
  };

  // جلب جميع البيانات ثم فلترتها يومياً
  const fetchAllActivitiesAndFilter = async () => {
    try {
      setLoading(true);
      
      let allActivities = [];
      let hasMoreData = true;
      let currentNumber = 0;
      
      // جلب جميع البيانات من الباك اند
      while (hasMoreData) {
        const result = await fetchAllLoginActivities({
          number: currentNumber
        });
        
        const activities = Array.isArray(result.activities) ? result.activities : [];
        
        if (activities.length === 0) {
          hasMoreData = false;
        } else {
          allActivities = [...allActivities, ...activities];
          currentNumber = Math.max(...activities.map(a => a.id || 0));
          
          // إذا جلبنا أقل من 10 عناصر، فهذا يعني أننا وصلنا للنهاية
          if (activities.length < 10) {
            hasMoreData = false;
          }
        }
      }
      
      // تحديث جميع البيانات
      setAllLoginActivities(allActivities);
      
      // فلترة البيانات للحصول على اليوم الحالي فقط
      const todayActivities = filterDailyActivities(allActivities);
      
      // تحديث البيانات المفلترة وإعادة حساب pagination
      setDailyFilteredActivities(todayActivities);
      applyPagination(todayActivities);
      
    } catch (err) {
      console.error('❌ Error fetching login activities:', err);
      setError(err.message);
      showNotification('خطأ في جلب البيانات: ' + err.message, 'error');
      // التأكد من بقاء المتغيرات آمنة في حالة الخطأ
      setAllLoginActivities([]);
      setDailyFilteredActivities([]);
      setLoginActivities([]);
      setTotalItems(0);
      setTotalPages(0);
    } finally {
      setLoading(false);
    }
  };

  // تطبيق pagination على البيانات المفلترة
  const applyPagination = (filteredData, pageNumber = currentPage) => {
    const totalFiltered = filteredData.length;
    const totalPagesCalculated = Math.ceil(totalFiltered / itemsPerPage);
    const startIndex = (pageNumber - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const pageData = filteredData.slice(startIndex, endIndex);
    
    setLoginActivities(pageData);
    setTotalItems(totalFiltered);
    setTotalPages(totalPagesCalculated);
    setCurrentPage(pageNumber);
    

  };

  // جلب الإحصائيات باستخدام API الجديد المفعل
  const fetchStats = async () => {
    try {
      const statsData = await fetchLoginActivityStats();
      
      setStats(statsData || {});
      
    } catch (err) {
      console.error('❌ Error fetching login activity stats with NEW API:', err);
      showNotification('خطأ في جلب الإحصائيات: ' + err.message, 'error');
      // التأكد من بقاء المتغير آمن في حالة الخطأ
      setStats({});
    }
  };

  // البحث عن كود التحقق باستخدام API الجديد المفعل
  const searchByCode = async () => {
    if (!codeSearchQuery.trim()) {
      showNotification('يرجى إدخال كود التحقق', 'warning');
      return;
    }

    try {
      setLoading(true);
      console.log(`🔍 البحث عن كود التحقق: ${codeSearchQuery} باستخدام API الجديد...`);
      
      const result = await searchLoginActivityByCode(codeSearchQuery);
      
      setCodeSearchResult(result);
      showNotification('تم العثور على المستخدم بنجاح', 'success');
      
    } catch (err) {
      console.error('❌ Error searching by code with NEW API:', err);
      setCodeSearchResult(null);
      showNotification('خطأ: ' + err.message, 'error');
    } finally {
      setLoading(false);
    }
  };

  // عرض الإشعار
  const showNotification = (message, severity = 'success') => {
    setNotification({
      open: true,
      message,
      severity
    });
  };

  // إغلاق الإشعار
  const handleCloseNotification = () => {
    setNotification(prev => ({ ...prev, open: false }));
  };

  // تحديث البيانات
  const refreshData = async () => {
    setRefreshing(true);
    setIsAutoRefreshing(true);
    try {
      await Promise.all([
        fetchAllActivitiesAndFilter(), // جلب وفلترة جميع البيانات
        fetchStats()
      ]);
      setCurrentPage(1); // العودة للصفحة الأولى بعد التحديث
      setLastRefreshTime(new Date());
    } finally {
      setRefreshing(false);
      setTimeout(() => setIsAutoRefreshing(false), 1000);
    }
  };

  // التعامل مع تغيير الصفحة
  const handlePageChange = (event, pageNumber) => {
    if (pageNumber === currentPage) return;
    
    // تطبيق pagination على البيانات المفلترة حالياً
    let currentFilteredData = dailyFilteredActivities;
    
    // تطبيق الفلاتر المحلية إذا وجدت
    if (searchQuery || filterCompany || filterStatus) {
      currentFilteredData = applyLocalFilters(dailyFilteredActivities);
    }
    
    applyPagination(currentFilteredData, pageNumber);
  };

  // تطبيق الفلاتر المحلية (البحث والشركة والحالة)
  const applyLocalFilters = (activities) => {
    return activities.filter(activity => {
      const matchesSearch = !searchQuery || 
        activity.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        activity.IDNumber?.toString().includes(searchQuery) ||
        activity.PhoneNumber?.includes(searchQuery) ||
        activity.job?.toLowerCase().includes(searchQuery.toLowerCase());
      
      const matchesCompany = !filterCompany || activity.IDCompany?.toString() === filterCompany;
      const matchesStatus = !filterStatus || activity.Activation === filterStatus;
      
      return matchesSearch && matchesCompany && matchesStatus;
    });
  };

  // تحديث تلقائي كل 25 ثانية
  useEffect(() => {
    const interval = setInterval(() => {
      refreshData();
    }, 25000);

    return () => clearInterval(interval);
  }, []);

  // البيانات للصفحة الحالية (معروضة من pagination)
  const currentActivities = loginActivities;

  // تصدير البيانات (اليوم الحالي)
  const exportData = () => {
    const fields = ['id', 'userName', 'IDNumber', 'PhoneNumber', 'job', 'jobdiscrption', 'codeVerification', 'DateOFlogin', 'DateEndLogin', 'Activation', 'IDCompany'];
    const headers = ['رقم المستخدم', 'اسم المستخدم', 'رقم الهوية', 'رقم الهاتف', 'الوظيفة', 'وصف الوظيفة', 'كود التحقق', 'تاريخ الدخول', 'تاريخ انتهاء الجلسة', 'الحالة', 'رقم الشركة'];
    
    // استخدام البيانات اليومية المفلترة بالفلاتر المحلية إذا وجدت
    let dataToExport = dailyFilteredActivities;
    if (searchQuery || filterCompany || filterStatus) {
      dataToExport = applyLocalFilters(dailyFilteredActivities);
    }
    
    const formattedActivities = dataToExport.map(activity => ({
      ...activity,
      Activation: activity.Activation === 'true' ? 'نشط' : 'غير نشط',
      DateOFlogin: formatDate(activity.DateOFlogin),
      DateEndLogin: formatDate(activity.DateEndLogin)
    }));
    
    const today = new Date().toLocaleDateString('ar-SA');
    
    // تم إزالة تصدير البيانات إلى Excel
    showNotification('تم إزالة تصدير البيانات إلى Excel');
  };

  // تحديد لون الحالة
  const getStatusColor = (activation) => {
    return activation === 'true' ? 'success' : 'error';
  };

  // تحديد نص الحالة
  const getStatusText = (activation) => {
    return activation === 'true' ? 'نشط' : 'غير نشط';
  };

  // تحديد أيقونة الحالة
  const getStatusIcon = (activation) => {
    return activation === 'true' ? <CheckCircleIcon /> : <ErrorIcon />;
  };

  // تنسيق التاريخ الميلادي
  const formatDate = (dateString) => {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    
    // تحقق من وجود وقت في البيانات
    const hasTime = date.getHours() !== 0 || date.getMinutes() !== 0 || date.getSeconds() !== 0;
    
    if (hasTime) {
      return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }) + ' ' + date.toLocaleTimeString('en-GB', {
        hour: '2-digit',
        minute: '2-digit'
      });
    } else {
      // عرض التاريخ فقط إذا لم يكن هناك وقت
      return date.toLocaleDateString('en-GB', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      });
    }
  };

  // تنسيق التاريخ فقط (بدون وقت)
  const formatDateOnly = (dateString) => {
    if (!dateString) return 'غير محدد';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    });
  };

  // تحميل البيانات عند بدء التشغيل
  useEffect(() => {
    fetchAllActivitiesAndFilter(); // جلب وفلترة جميع البيانات
    fetchStats();
  }, []);

  // إعادة تحميل البيانات عند تغيير الفلاتر
  useEffect(() => {
    if (searchQuery || filterCompany || filterStatus) {
      // تطبيق الفلاتر المحلية على البيانات اليومية
      const filteredData = applyLocalFilters(dailyFilteredActivities);
      
      // العودة للصفحة الأولى وتطبيق pagination
      applyPagination(filteredData, 1);
    } else if (dailyFilteredActivities.length > 0) {
      // إذا تم إلغاء جميع الفلاتر، عرض جميع البيانات اليومية
      applyPagination(dailyFilteredActivities, 1);
    }
  }, [searchQuery, filterCompany, filterStatus, dailyFilteredActivities]);

  return (
    <Box sx={{ width: '100%', typography: 'body1' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" sx={{ fontWeight: 'bold', color: theme.palette.primary.main }}>
            أنشطة تسجيل الدخول
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
              تحديث تلقائي (25 ثانية)
            </Typography>
          </Box>
        </Box>
        <Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
          إدارة ومراقبة أنشطة تسجيل الدخول وأكواد التحقق للمستخدمين
        </Typography>
        <Typography variant="body2" color="text.disabled">
                        آخر تحديث: {lastRefreshTime.toLocaleString('en-GB')}
        </Typography>
      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(event, newValue) => setActiveTab(newValue)}
          variant="fullWidth"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab 
            icon={<LoginIcon />} 
            label="الأنشطة" 
            sx={{ minHeight: 60 }}
          />
          <Tab 
            icon={<AssessmentIcon />} 
            label="الإحصائيات" 
            sx={{ minHeight: 60 }}
          />
        </Tabs>
      </Paper>

      {/* Loading */}
      {loading && (
        <Box sx={{ width: '100%', mb: 2 }}>
          <LinearProgress />
        </Box>
      )}

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
          {error}
        </Alert>
      )}



      {/* Tab Content */}
      {activeTab === 0 && (
        <Box>
          {/* Controls */}
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Grid container spacing={2} alignItems="center">
                <Grid item xs={12} md={4}>
                  <TextField
                    fullWidth
                    label="البحث"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="البحث في الأسماء، الأرقام، الهواتف..."
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <SearchIcon />
                        </InputAdornment>
                      )
                    }}
                  />
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>فلترة الحالة</InputLabel>
                    <Select
                      value={filterStatus}
                      label="فلترة الحالة"
                      onChange={(e) => setFilterStatus(e.target.value)}
                    >
                      <MenuItem value="">جميع الحالات</MenuItem>
                      <MenuItem value="true">نشط</MenuItem>
                      <MenuItem value="false">غير نشط</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <FormControl fullWidth>
                    <InputLabel>الترتيب حسب</InputLabel>
                    <Select
                      value={sortBy}
                      label="الترتيب حسب"
                      onChange={(e) => setSortBy(e.target.value)}
                    >
                      <MenuItem value="DateOFlogin">تاريخ الدخول</MenuItem>
                      <MenuItem value="userName">اسم المستخدم</MenuItem>
                      <MenuItem value="IDNumber">رقم الهوية</MenuItem>
                      <MenuItem value="job">الوظيفة</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12} md={2}>
                  <Button
                    variant="contained"
                    onClick={() => setOpenCodeSearchDialog(true)}
                    startIcon={<CodeIcon />}
                    fullWidth
                  >
                    البحث بالكود
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
              
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  عرض {loginActivities.length} من أصل {totalItems} نشاط • اليوم الحالي فقط • الصفحة {currentPage}/{totalPages}
                </Typography>
                <Button
                  variant="contained"
                  onClick={exportData}
                  startIcon={<GetAppIcon />}
                  color="success"
                >
                  تصدير إلى Excel
                </Button>
              </Box>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow>
                      <TableCell>المستخدم</TableCell>
                      <TableCell>معلومات الاتصال</TableCell>
                      <TableCell>الوظيفة</TableCell>
                      <TableCell>كود التحقق</TableCell>
                      <TableCell>تاريخ الدخول</TableCell>
                      <TableCell>تاريخ انتهاء الجلسة</TableCell>
                      <TableCell>الحالة</TableCell>
                      <TableCell>الإجراءات</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {currentActivities.map((activity) => (
                      <TableRow key={activity.id}>
                        <TableCell>
                          <Box sx={{ display: 'flex', alignItems: 'center' }}>
                            <Avatar 
                              src={activity.image}
                              sx={{ width: 40, height: 40, mr: 2 }}
                            >
                              {activity.userName?.charAt(0)}
                            </Avatar>
                            <Box>
                              <Typography variant="body2" fontWeight="bold">
                                {activity.userName || 'غير محدد'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                هوية: {activity.IDNumber || 'غير محدد'}
                              </Typography>
                            </Box>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center' }}>
                              <PhoneIcon sx={{ fontSize: 16, mr: 1 }} />
                              {activity.PhoneNumber || 'غير محدد'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              شركة: {activity.IDCompany || 'غير محدد'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Box>
                            <Typography variant="body2" fontWeight="bold">
                              {activity.job || 'غير محدد'}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {activity.jobdiscrption || 'لا يوجد وصف'}
                            </Typography>
                          </Box>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={activity.codeVerification || 'غير محدد'}
                            icon={<CodeIcon />}
                            color="primary"
                            variant="outlined"
                          />
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(activity.DateOFlogin)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Typography variant="body2">
                            {formatDate(activity.DateEndLogin)}
                          </Typography>
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={getStatusText(activity.Activation)}
                            icon={getStatusIcon(activity.Activation)}
                            color={getStatusColor(activity.Activation)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <Tooltip title="عرض التفاصيل">
                            <IconButton
                              onClick={() => {
                                setSelectedActivity(activity);
                                setOpenDetailsDialog(true);
                              }}
                            >
                              <VisibilityIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Numbered Pagination */}
              <Box sx={{ mt: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <Typography variant="body2" color="text.secondary">
                  الصفحة {currentPage} من {totalPages} • إجمالي {totalItems} نشاط (اليوم الحالي فقط)
                </Typography>
                
                {totalPages > 1 && (
                  <Pagination
                    count={totalPages}
                    page={currentPage}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                    disabled={loading}
                    sx={{ 
                      '& .MuiPaginationItem-root': {
                        fontSize: '1rem',
                        fontWeight: 'bold'
                      }
                    }}
                  />
                )}
                
                <Typography variant="body2" color="primary" sx={{ fontWeight: 'bold' }}>
                  {itemsPerPage} عناصر/صفحة
                </Typography>
              </Box>
              
              {/* Empty State Message */}
              {loginActivities.length === 0 && !loading && (
                <Box sx={{ mt: 3, textAlign: 'center' }}>
                  <Typography variant="body1" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                    📅 لا توجد أنشطة تسجيل دخول لليوم الحالي
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                    جرب التحقق من الفلاتر أو انتظر أنشطة جديدة
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Box>
      )}

      {/* Statistics Tab */}
      {activeTab === 1 && (
        <Box>
          <Grid container spacing={3}>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <GroupIcon sx={{ fontSize: 40, color: theme.palette.primary.main, mr: 2 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.totalUsers || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        إجمالي المستخدمين
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <CheckCircleIcon sx={{ fontSize: 40, color: theme.palette.success.main, mr: 2 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.activeUsers || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        المستخدمين النشطين
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TodayIcon sx={{ fontSize: 40, color: theme.palette.info.main, mr: 2 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.todayLogins || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        تسجيلات اليوم
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <TimelineIcon sx={{ fontSize: 40, color: theme.palette.warning.main, mr: 2 }} />
                    <Box>
                      <Typography variant="h4" fontWeight="bold">
                        {stats.weekLogins || 0}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        تسجيلات الأسبوع
                      </Typography>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Box>
      )}

      {/* Details Dialog */}
      <Dialog
        open={openDetailsDialog}
        onClose={() => setOpenDetailsDialog(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <PersonIcon sx={{ mr: 2 }} />
            تفاصيل نشاط المستخدم
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedActivity && (
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    اسم المستخدم
                  </Typography>
                  <Typography variant="body1" fontWeight="bold">
                    {selectedActivity.userName || 'غير محدد'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    رقم الهوية
                  </Typography>
                  <Typography variant="body1">
                    {selectedActivity.IDNumber || 'غير محدد'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    رقم الهاتف
                  </Typography>
                  <Typography variant="body1">
                    {selectedActivity.PhoneNumber || 'غير محدد'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    الوظيفة
                  </Typography>
                  <Typography variant="body1">
                    {selectedActivity.job || 'غير محدد'}
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={6}>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    وصف الوظيفة
                  </Typography>
                  <Typography variant="body1">
                    {selectedActivity.jobdiscrption || 'لا يوجد وصف'}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    كود التحقق
                  </Typography>
                  <Chip
                    label={selectedActivity.codeVerification || 'غير محدد'}
                    icon={<CodeIcon />}
                    color="primary"
                    variant="outlined"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    تاريخ الدخول
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedActivity.DateOFlogin)}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    تاريخ انتهاء الجلسة
                  </Typography>
                  <Typography variant="body1">
                    {formatDate(selectedActivity.DateEndLogin)}
                  </Typography>
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    الحالة
                  </Typography>
                  <Chip
                    label={getStatusText(selectedActivity.Activation)}
                    icon={getStatusIcon(selectedActivity.Activation)}
                    color={getStatusColor(selectedActivity.Activation)}
                    size="small"
                  />
                </Box>
                <Box sx={{ mb: 2 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    رقم الشركة
                  </Typography>
                  <Typography variant="body1">
                    {selectedActivity.IDCompany || 'غير محدد'}
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDetailsDialog(false)}>
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* Code Search Dialog */}
      <Dialog
        open={openCodeSearchDialog}
        onClose={() => setOpenCodeSearchDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <CodeIcon sx={{ mr: 2 }} />
            البحث بكود التحقق
          </Box>
        </DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="كود التحقق"
            fullWidth
            variant="outlined"
            value={codeSearchQuery}
            onChange={(e) => setCodeSearchQuery(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && searchByCode()}
          />
          
          {codeSearchResult && (
            <Box sx={{ mt: 2, p: 2, bgcolor: 'background.default', borderRadius: 1 }}>
              <Typography variant="h6" gutterBottom>
                نتيجة البحث:
              </Typography>
              <Grid container spacing={2}>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    اسم المستخدم:
                  </Typography>
                  <Typography variant="body1">
                    {codeSearchResult.userName}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    رقم الهاتف:
                  </Typography>
                  <Typography variant="body1">
                    {codeSearchResult.PhoneNumber}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    الوظيفة:
                  </Typography>
                  <Typography variant="body1">
                    {codeSearchResult.job}
                  </Typography>
                </Grid>
                <Grid item xs={6}>
                  <Typography variant="body2" color="text.secondary">
                    الحالة:
                  </Typography>
                  <Chip
                    label={getStatusText(codeSearchResult.Activation)}
                    icon={getStatusIcon(codeSearchResult.Activation)}
                    color={getStatusColor(codeSearchResult.Activation)}
                    size="small"
                  />
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCodeSearchDialog(false)}>
            إغلاق
          </Button>
          <Button onClick={searchByCode} variant="contained">
            البحث
          </Button>
        </DialogActions>
      </Dialog>

      {/* Notification */}
      <Snackbar
        open={notification.open}
        autoHideDuration={6000}
        onClose={handleCloseNotification}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
      >
        <Alert
          onClose={handleCloseNotification}
          severity={notification.severity}
          sx={{ width: '100%' }}
        >
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default LoginActivity; 