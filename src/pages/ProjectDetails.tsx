import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

import {
  Box,
  Typography,
  Card,
  CardContent,
  Grid,
  LinearProgress,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Tabs,
  Tab,
  Button,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Collapse,
  useTheme
} from '@mui/material';
import {
  LocationOn,
  CalendarToday,
  AttachMoney,
  Engineering,
  Assessment,
  Archive,
  Business,
  Home,
  Schedule,
  TrendingUp,
  CheckCircle,
  Warning,
  KeyboardArrowDown,
  KeyboardArrowUp,
  Assignment,
  Analytics,
  FilterList
} from '@mui/icons-material';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { API_BASE_URL } from 'api/config';

// CSS للـ shimmer animation
const shimmerAnimation = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
`;

// إضافة الـ CSS للـ head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = shimmerAnimation;
  document.head.appendChild(style);
}

interface ProjectDetailsProps {}

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
      id={`project-tabpanel-${index}`}
      aria-labelledby={`project-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

const ProjectDetails: React.FC<ProjectDetailsProps> = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const theme = useTheme();
  const [tabValue, setTabValue] = useState(0);
  const [projectData, setProjectData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedVisit] = useState<any>(null);
  const [visitDialogOpen, setVisitDialogOpen] = useState(false);

  
  // صفحات للـ UI
  const [stagesPage, setStagesPage] = useState(1);
  const [requestsPage, setRequestsPage] = useState(1);
  
  // إضافة state لنظام طوي المراحل الرئيسية والفرعية
  const [collapsedMainStages, setCollapsedMainStages] = useState<Set<number>>(new Set());
  const [collapsedSubStages, setCollapsedSubStages] = useState<Set<string>>(new Set());
  
  // إضافة state للتحكم في عدد المراحل الفرعية المعروضة لكل مرحلة رئيسية
  const [subStagesLimits, setSubStagesLimits] = useState<Record<number, number>>({});
  
  // state للمراحل والملاحظات المحلية (للتوافق مع الكود الموجود)
    const [stagesNotesData, setStagesNotesData] = useState<any>(null);
  const [stagesNotesLoading, setStagesNotesLoading] = useState(false);
  const [stagesPerPage, setStagesPerPage] = useState(10);
  const [stageTypeFilter, setStageTypeFilter] = useState('all');
  const [requestsPerPage, setRequestsPerPage] = useState(5);

  useEffect(() => {
    fetchProjectDetails();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);





  // دوال pagination للبيانات المالية والطلبات


  // جلب المراحل والملاحظات عند تغيير التبويب
  useEffect(() => {
    if (tabValue === 4) { // إذا كان التبويب المراحل والملاحظات نشطاً
      fetchStagesNotes();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tabValue, stagesPage, stagesPerPage, stageTypeFilter, projectId]);

  // طوي جميع المراحل عند تحميل البيانات لأول مرة
  useEffect(() => {
    if (stagesNotesData?.mainStages && stagesNotesData.mainStages.length > 0) {
      // طوي جميع المراحل الرئيسية افتراضياً لتوفير الأداء
      const allMainStageIndices = stagesNotesData.mainStages.map((_: any, index: number) => index);
      setCollapsedMainStages(new Set(allMainStageIndices));
      
      // أيضاً طوي جميع الملاحظات افتراضياً
      const allSubStageKeys: string[] = [];
      stagesNotesData.mainStages.forEach((mainStage: any, mainIndex: number) => {
        if (mainStage.mainStageNotes && mainStage.mainStageNotes.length > 0) {
          allSubStageKeys.push(`main-${mainIndex}`);
        }
      });
      setCollapsedSubStages(new Set(allSubStageKeys));
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stagesNotesData?.mainStages?.length]); // يتم تشغيلها فقط عند تغيير عدد المراحل

  const fetchProjectDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch(`${API_BASE_URL}/api/brinshCompany/BringProject?IDproject=${projectId}`,{
        method:"GET"
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('❌ خطأ HTTP:', response.status, errorText);
        throw new Error(`فشل في جلب تفاصيل المشروع: ${response.status} - ${response.statusText}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setProjectData(result.data);
      } else {
        console.error('❌ فشل API:', result.message || result.error);
        setError(result.message || result.error || 'حدث خطأ غير متوقع');
      }
    } catch (error: any) {
      console.error('💥 خطأ في جلب تفاصيل المشروع:', error);
      setError(error.message || 'حدث خطأ في الاتصال');
    } finally {
      setLoading(false);
    }
  };

  // دالة جلب المراحل والملاحظات
  const fetchStagesNotes = async () => {
    try {
      setStagesNotesLoading(true);
      
      const params = new URLSearchParams({
        page: stagesPage.toString(),
        limit: stagesPerPage.toString(),
        stageType: stageTypeFilter
      });

      const response = await fetch(`${API_BASE_URL}/api/dashbord/companies/projects/${projectId}/stages-notes?${params}`);
      
      if (!response.ok) {
        throw new Error(`فشل في جلب المراحل والملاحظات: ${response.status}`);
      }
      
      const result = await response.json();
      
      if (result.success) {
        setStagesNotesData(result.data);
      } else {
        console.error('❌ فشل API المراحل:', result.message);
      }
    } catch (error: any) {
      console.error('💥 خطأ في جلب المراحل والملاحظات:', error);
    } finally {
      setStagesNotesLoading(false);
    }
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };



  // دالة للتحكم في طوي وفتح المراحل الرئيسية
  const toggleMainStageCollapse = (stageIndex: number) => {
    setCollapsedMainStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(stageIndex)) {
        newSet.delete(stageIndex);
      } else {
        newSet.add(stageIndex);
      }
      return newSet;
    });
  };

  // دالة لطوي أو فتح جميع المراحل
  const toggleAllMainStages = (collapse: boolean) => {
    if (collapse) {
      // طوي جميع المراحل
      const allIndices = stagesNotesData?.mainStages?.map((_: any, index: number) => index) || [];
      setCollapsedMainStages(new Set(allIndices));
    } else {
      // فتح جميع المراحل
      setCollapsedMainStages(new Set());
    }
  };

  // دالة للتحكم في طوي وفتح المراحل الفرعية (الملاحظات)
  const toggleSubStageCollapse = (subStageKey: string) => {
    setCollapsedSubStages(prev => {
      const newSet = new Set(prev);
      if (newSet.has(subStageKey)) {
        newSet.delete(subStageKey);
      } else {
        newSet.add(subStageKey);
      }
      return newSet;
    });
  };

  // دالة لطوي أو فتح جميع المراحل الفرعية
  const toggleAllSubStages = (collapse: boolean) => {
    if (collapse) {
      // طوي جميع المراحل الفرعية
      const allSubStageKeys: string[] = [];
      stagesNotesData?.mainStages?.forEach((mainStage: any, mainIndex: number) => {
        mainStage.subStages?.forEach((subStage: any, subIndex: number) => {
          if (subStage.stageNotes && subStage.stageNotes.length > 0) {
            allSubStageKeys.push(`${mainIndex}-${subIndex}`);
          }
        });
      });
      setCollapsedSubStages(new Set(allSubStageKeys));
    } else {
      // فتح جميع المراحل الفرعية
      setCollapsedSubStages(new Set());
    }
  };

  // دالة للتحكم في عدد المراحل الفرعية المعروضة لمرحلة رئيسية معينة
  const setSubStagesLimit = (mainStageIndex: number, limit: number) => {
    setSubStagesLimits(prev => ({
      ...prev,
      [mainStageIndex]: limit
    }));
  };

  // دالة للحصول على عدد المراحل الفرعية المعروضة لمرحلة رئيسية
  const getSubStagesLimit = (mainStageIndex: number) => {
    return subStagesLimits[mainStageIndex] || 5; // افتراضياً 5 مراحل
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-GB', {
      style: 'currency',
      currency: 'SAR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-GB').format(num);
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return theme.palette.success.main;
    if (progress >= 60) return theme.palette.warning.main;
    if (progress >= 40) return theme.palette.info.main;
    return theme.palette.error.main;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'مقبول': return 'success';
      case 'مطلوب تحسين': return 'warning';
      case 'مشكلة': return 'error';
      case 'مشكلة موردين': return 'error';
      case 'ملاحظة مقاول': return 'warning';
      case 'ملاحظة مالك': return 'info';
      case 'ملاحظة عامة': return 'info';
      case 'ملاحظة': return 'info';
      default: return 'info';
    }
  };



  const getMainStageColor = (categoryName: string) => {
    // نظام ألوان محدث للمراحل الرئيسية يدعم الوضع المظلم
    if (!categoryName) return theme.palette.grey[600];
    
    // تصنيف ذكي بناءً على كلمات مفتاحية في اسم المرحلة
    const name = categoryName.toLowerCase();
    
    if (name.includes('بناء') || name.includes('خرسان') || name.includes('حديد') || name.includes('صب')) {
      return theme.palette.mode === 'dark' ? '#A1887F' : '#8D6E63'; // بني للبناء
    }
    if (name.includes('سباك') || name.includes('مياه') || name.includes('صرف') || name.includes('أنابيب')) {
      return theme.palette.info.main; // أزرق للسباكة
    }
    if (name.includes('كهرب') || name.includes('إضاءة') || name.includes('كابل') || name.includes('تيار')) {
      return theme.palette.warning.main; // برتقالي للكهرباء
    }
    if (name.includes('تكييف') || name.includes('تهوية') || name.includes('تبريد') || name.includes('مكيف')) {
      return theme.palette.success.main; // أخضر للتكييف
    }
    if (name.includes('تشطيب') || name.includes('دهان') || name.includes('بلاط') || name.includes('تشطيب')) {
      return theme.palette.secondary.main; // بنفسجي للتشطيب
    }
    if (name.includes('مخصص') || name.includes('خاص') || name.includes('إضافي')) {
      return theme.palette.grey[600]; // رمادي للمخصص
    }
    
    // ألوان متوافقة مع الـ theme
    const colors = theme.palette.mode === 'dark' 
      ? [
          theme.palette.error.light, theme.palette.primary.light, theme.palette.secondary.light, 
          theme.palette.success.light, theme.palette.warning.light, theme.palette.info.light,
          '#FF8A65', '#FFAB91', '#FFCC80', '#FFECB3', '#C8E6C9', '#B39DDB'
        ]
      : [
          theme.palette.error.main, theme.palette.primary.main, theme.palette.secondary.main,
          theme.palette.success.main, theme.palette.warning.main, theme.palette.info.main,
          '#FF5722', '#795548', '#9E9E9E', '#607D8B', '#E91E63', '#9C27B0'
        ];
    
    // اختيار لون بناءً على hash الاسم لضمان الثبات
    const hash = categoryName.split('').reduce((a, b) => {
      a = ((a << 5) - a) + b.charCodeAt(0);
      return a & a;
    }, 0);
    
    return colors[Math.abs(hash) % colors.length];
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress size={60} />
        <Typography variant="h6" sx={{ ml: 2 }}>
          جاري تحميل تفاصيل المشروع...
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box p={3}>
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
        <Button variant="contained" onClick={() => navigate(-1)}>
          العودة
        </Button>
      </Box>
    );
  }

  if (!projectData) {
    return (
      <Box p={3}>
        <Alert severity="warning">
          لم يتم العثور على بيانات المشروع
        </Alert>
      </Box>
    );
  }

  const { project, statistics, financialData, requests } = projectData;
  
  // التحقق من هيكل البيانات
  const safeRequests = requests?.list || requests || [];

  // إنشاء بيانات للعرض من API الجديد
  const property = {
    name: project?.name || 'مشروع غير محدد',
    location: project?.location || 'غير محدد',
    contractType: project?.contractType || 'مقاولة عامة',
    totalDays: statistics?.totalDays || 365,
    daysSinceStart: statistics?.daysSinceStart || 0,
    startDate: project?.startDate,
    referenceNumber: project?.referenceNumber || project?.id || 'غير محدد'
  };

  const costSchedule = {
    breakdown: [
      { item: 'التكلفة الإجمالية', value: project?.cost || 0, unit: 'ريال' },
      { item: 'عدد المراحل', value: statistics?.totalStages || 0, unit: 'مرحلة' },
      { item: 'المراحل المكتملة', value: statistics?.completedStages || 0, unit: 'مرحلة' },
      { item: 'الأيام منذ البدء', value: statistics?.daysSinceStart || 0, unit: 'يوم' },
      { item: 'إجمالي الأيام المقدرة', value: statistics?.totalDays || 0, unit: 'يوم' }
    ]
  };

  // إعداد بيانات المخطط الدائري بناءً على المراحل - بالنسب المئوية
  const completedStages = statistics?.completedStages || 0;
  const totalStages = statistics?.totalStages || 0;
  const pendingStages = totalStages - completedStages;
  
  // حساب النسب المئوية الصحيحة
  const completedPercentage = totalStages > 0 ? Math.round((completedStages / totalStages) * 100) : 0;
  const pendingPercentage = totalStages > 0 ? Math.round((pendingStages / totalStages) * 100) : 0;
  const overallProgress = statistics?.overallProgress || 0;
  
  const pieChartData = [
    { name: 'منجز', value: completedPercentage, count: completedStages },
    { name: 'جاري العمل', value: pendingPercentage, count: pendingStages }
  ];

  // استخدام البيانات المالية الحقيقية من API
  const realFinancialData = {
    revenue: financialData?.summary?.totalRevenue || 0,
    expenses: financialData?.summary?.totalExpense || 0,
    returns: financialData?.summary?.totalReturns || 0,
    remainingBalance: financialData?.summary?.remainingBalance || 0,
    netProfit: financialData?.summary?.netProfit || 0,
    revenueCount: financialData?.summary?.revenueCount || 0,
    expenseCount: financialData?.summary?.expenseCount || 0
  };

  const colors = [
    theme.palette.primary.main, 
    theme.palette.success.main, 
    theme.palette.warning.main, 
    theme.palette.error.main, 
    theme.palette.info.main, 
    theme.palette.secondary.main
  ];

  return (
    <Box sx={{ 
      p: 3, 
      backgroundColor: theme.palette.background.default, 
      minHeight: '100vh' 
    }}>
      {/* رأس الصفحة */}
      <Card sx={{ 
        mb: 3, 
        background: theme.palette.mode === 'dark' 
          ? `linear-gradient(135deg, ${theme.palette.primary.dark} 0%, ${theme.palette.secondary.dark} 100%)`
          : `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
        color: theme.palette.primary.contrastText 
      }}>
        <CardContent>
          <Box display="flex" justifyContent="space-between" alignItems="flex-start">
            <Box>
              <Typography variant="h4" component="h1" gutterBottom>
                <Home sx={{ mr: 1, verticalAlign: 'middle' }} />
                {property.name}
              </Typography>
              <Typography variant="h6" sx={{ opacity: 0.9, mb: 2 }}>
                <LocationOn sx={{ mr: 1, verticalAlign: 'middle' }} />
                {property.location}
              </Typography>
              {/* مؤشر الإنجاز الكلي المحسن */}
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 3, 
                mb: 3,
                p: 2.5,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(255,255,255,0.05)' 
                  : 'rgba(255,255,255,0.15)',
                borderRadius: 3,
                backdropFilter: 'blur(10px)',
                border: theme.palette.mode === 'dark' 
                  ? '1px solid rgba(255,255,255,0.1)' 
                  : '1px solid rgba(255,255,255,0.2)'
              }}>
                {/* دائرة تقدم تفاعلية */}
                <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                  <CircularProgress
                    variant="determinate"
                    value={statistics?.overallProgress || 0}
                    size={80}
                    thickness={5}
                    sx={{ 
                      color: getProgressColor(statistics?.overallProgress || 0),
                      filter: `drop-shadow(0 3px 8px ${getProgressColor(statistics?.overallProgress || 0)}40)`
                    }}
                  />
                  <Box sx={{
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0,
                    position: 'absolute',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexDirection: 'column'
                  }}>
                    <Typography variant="h6" sx={{ 
                      fontWeight: 'bold', 
                      color: theme.palette.primary.contrastText 
                    }}>
                      {(statistics?.overallProgress || 0).toFixed(2)}%
                </Typography>
                  </Box>
                </Box>

                {/* معلومات تفصيلية */}
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6" sx={{ 
                    color: theme.palette.primary.contrastText, 
                    fontWeight: 'bold', 
                    mb: 1 
                  }}>
                    🎯 نسبة الإنجاز الكلية للمشروع
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    color: theme.palette.mode === 'dark' 
                      ? 'rgba(255,255,255,0.7)' 
                      : 'rgba(255,255,255,0.9)', 
                    mb: 2 
                  }}>
                    مؤشر شامل لتقدم العمل في جميع المراحل
                  </Typography>
                  
                  {/* شريط تقدم محسن */}
                  <Box sx={{ width: '100%', mb: 1 }}>
                  <LinearProgress
                    variant="determinate"
                    value={statistics?.overallProgress || 0}
                    sx={{
                        height: 12,
                        borderRadius: 6,
                                              backgroundColor: theme.palette.mode === 'dark' 
                          ? 'rgba(255,255,255,0.1)' 
                          : 'rgba(255,255,255,0.3)',
                      '& .MuiLinearProgress-bar': {
                          background: `linear-gradient(90deg, ${getProgressColor(statistics?.overallProgress || 0)} 0%, ${getProgressColor(Math.min((statistics?.overallProgress || 0) + 20, 100))} 100%)`,
                          borderRadius: 6,
                          transition: 'all 0.8s ease-in-out'
                      },
                    }}
                  />
                  </Box>
                  
                  {/* تقييم الأداء */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <Typography variant="body2" sx={{ 
                      color: theme.palette.mode === 'dark' 
                        ? 'rgba(255,255,255,0.7)' 
                        : 'rgba(255,255,255,0.9)' 
                    }}>
                      حالة المشروع:
                    </Typography>
                    <Chip
                      label={
                        (statistics?.overallProgress || 0) >= 80 ? '🌟 ممتاز' :
                        (statistics?.overallProgress || 0) >= 60 ? '👍 جيد جداً' :
                        (statistics?.overallProgress || 0) >= 40 ? '⚡ متوسط' : '⚠️ يحتاج اهتمام'
                      }
                      sx={{
                        backgroundColor: getProgressColor(statistics?.overallProgress || 0),
                        color: 'primary.contrastText',
                        fontWeight: 'bold',
                        '& .MuiChip-label': {
                          fontSize: '0.75rem'
                        }
                      }}
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>
            </Box>
            <Button
              variant="contained"
              color="inherit"
              onClick={() => navigate(-1)}
              sx={{ 
                color: theme.palette.mode === 'dark' 
                  ? theme.palette.primary.light 
                  : theme.palette.primary.main,
                bgcolor: theme.palette.background.paper,
                '&:hover': {
                  bgcolor: theme.palette.action.hover
                }
              }}
            >
              العودة
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* البطاقات الإحصائية */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%', 
            background: `linear-gradient(135deg, ${theme.palette.success.main} 0%, ${theme.palette.success.dark} 100%)`, 
            color: theme.palette.success.contrastText 
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    إجمالي العهد
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(realFinancialData.revenue)}
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                    من {realFinancialData.revenueCount} عنصر
                  </Typography>
                </Box>
                <AttachMoney sx={{ fontSize: 48, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%', 
            background: `linear-gradient(135deg, ${theme.palette.info.main} 0%, ${theme.palette.info.dark} 100%)`, 
            color: theme.palette.info.contrastText 
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    المراحل
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(statistics?.totalStages || 0)} مرحلة
                  </Typography>
                  <Typography variant="body2" sx={{ opacity: 0.8, mt: 1 }}>
                    المكتملة: {formatNumber(statistics?.completedStages || 0)} مرحلة
                  </Typography>
                </Box>
                <Schedule sx={{ fontSize: 48, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ 
            height: '100%', 
            background: `linear-gradient(135deg, ${theme.palette.warning.main} 0%, ${theme.palette.warning.dark} 100%)`, 
            color: theme.palette.warning.contrastText 
          }}>
            <CardContent>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Box>
                  <Typography variant="h6" gutterBottom>
                    ملاحظات فنية
                  </Typography>
                  <Typography variant="h4">
                    {formatNumber(statistics?.qualityVisitsCount || 0)} ملاحظة
                  </Typography>
                </Box>
                <Engineering sx={{ fontSize: 48, opacity: 0.7 }} />
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* معلومات العقار */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom color="primary">
            <Business sx={{ mr: 1, verticalAlign: 'middle' }} />
            معلومات العقار
          </Typography>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <Typography variant="body1" gutterBottom>
                <strong>اسم العقار:</strong> {property.name}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>الموقع:</strong> {property.location}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>نوع العقد:</strong> {property.contractType}
              </Typography>
            </Grid>
            <Grid item xs={12} md={6}>
              <Typography variant="body1" gutterBottom>
                <strong>إجمالي أيام التنفيذ:</strong> {formatNumber(property.totalDays)} يوماً
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>الأيام منذ البدء:</strong> {formatNumber(property.daysSinceStart)} يوماً
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>تاريخ بدء المشروع:</strong> {property.startDate ? new Date(property.startDate).toLocaleDateString('en-GB') : 'غير محدد'}
              </Typography>
              <Typography variant="body1" gutterBottom>
                <strong>رقم المرجع:</strong> {property.referenceNumber || 'غير محدد'}
              </Typography>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {/* التكلفة والجدول الزمني */}
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Typography variant="h5" gutterBottom color="primary">
            <AttachMoney sx={{ mr: 1, verticalAlign: 'middle' }} />
            التكلفة والجدول الزمني
          </Typography>
          <TableContainer component={Paper} sx={{ mt: 2 }}>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell sx={{ fontWeight: 'bold' }}>البند</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>القيمة</TableCell>
                  <TableCell sx={{ fontWeight: 'bold' }}>الوحدة</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {costSchedule.breakdown.map((item: any, index: number) => (
                  <TableRow key={index}>
                    <TableCell>{item.item}</TableCell>
                    <TableCell>{formatNumber(item.value)}</TableCell>
                    <TableCell>{item.unit}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        </CardContent>
      </Card>

      {/* مخططات نسب الإنجاز المحسنة */}
      <Card sx={{ 
        mb: 3, 
        background: theme.palette.mode === 'dark' 
          ? 'linear-gradient(135deg, #1e1e1e 0%, #2c2c2c 50%, #3c3c3c 100%)'
          : 'linear-gradient(135deg, #e3f2fd 0%, #f8f9fa 50%, #fff3e0 100%)',
        border: theme.palette.mode === 'dark' 
          ? '1px solid rgba(255, 255, 255, 0.1)' 
          : '1px solid #e1f5fe',
        boxShadow: theme.palette.mode === 'dark' 
          ? '0 8px 25px rgba(0, 0, 0, 0.3)' 
          : '0 8px 25px rgba(33, 150, 243, 0.15)'
      }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h5" gutterBottom sx={{ 
            color: theme.palette.mode === 'dark' ? '#64b5f6' : '#1976d2', 
            fontWeight: 'bold',
            mb: 3,
            textAlign: 'center',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1
          }}>
            <TrendingUp sx={{ fontSize: '2rem' }} />
            📊 المخططات التحليلية لنسب الإنجاز
          </Typography>
          
          {/* شريط معلوماتي سريع */}
          <Box sx={{ 
            mb: 4, 
            p: 2, 
            backgroundColor: theme.palette.mode === 'dark' 
              ? 'rgba(255, 255, 255, 0.05)' 
              : 'rgba(33, 150, 243, 0.1)', 
            borderRadius: 2,
            border: theme.palette.mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.1)' 
              : '1px solid rgba(33, 150, 243, 0.2)'
          }}>
            <Grid container spacing={2} alignItems="center">
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ 
                    color: theme.palette.mode === 'dark' ? '#64b5f6' : '#1976d2', 
                    fontWeight: 'bold' 
                  }}>
                    {overallProgress.toFixed(2)}%
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    الإنجاز العام للمشروع
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ 
                    color: theme.palette.mode === 'dark' ? '#81c784' : '#4caf50', 
                    fontWeight: 'bold' 
                  }}>
                    {completedStages}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    مراحل مكتملة ({completedPercentage}%)
                  </Typography>
                </Box>
              </Grid>
              <Grid item xs={12} md={4}>
                <Box sx={{ textAlign: 'center' }}>
                  <Typography variant="h4" sx={{ 
                    color: theme.palette.mode === 'dark' ? '#ffb74d' : '#ff9800', 
                    fontWeight: 'bold' 
                  }}>
                    {pendingStages}
                  </Typography>
                  <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
                    مراحل قيد التنفيذ ({pendingPercentage}%)
                  </Typography>
                </Box>
              </Grid>
            </Grid>
          </Box>

          <Grid container spacing={4}>
            {/* مخطط دائري محسن */}
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                height: '100%', 
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 4px 20px rgba(0,0,0,0.4)' 
                  : '0 4px 20px rgba(0,0,0,0.1)',
                borderRadius: 3,
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(135deg, #1976d2 0%, #1565c0 100%)'
                    : 'linear-gradient(135deg, #2196f3 0%, #21cbf3 100%)', 
                  color: 'primary.contrastText', 
                  p: 2, 
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    🥧 التوزيع النسبي للمراحل
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    مخطط دائري تفاعلي
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={pieChartData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                        label={({ name, value }) => `${value}%`}
                        outerRadius={100}
                        innerRadius={40}
                    fill="#8884d8"
                    dataKey="value"
                        animationBegin={0}
                        animationDuration={800}
                  >
                    {pieChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={colors[index % colors.length]}
                            stroke={colors[index % colors.length]}
                            strokeWidth={2}
                          />
                    ))}
                  </Pie>
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value: any, name: any, props: any) => [
                          `${value}% (${props.payload.count} مرحلة)`, 
                          'نسبة الإنجاز'
                        ]}
                      />
                </PieChart>
              </ResponsiveContainer>
                  
                  {/* أسطورة مخصصة */}
                  <Box sx={{ mt: 2 }}>
                    <Grid container spacing={1}>
                      {pieChartData.map((entry, index) => (
                        <Grid item xs={6} key={index}>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, p: 1 }}>
                            <Box sx={{
                              width: 12,
                              height: 12,
                              backgroundColor: colors[index % colors.length],
                              borderRadius: '50%'
                            }} />
                            <Typography variant="caption" sx={{ fontSize: '0.7rem' }}>
                              {entry.name}
                            </Typography>
                          </Box>
            </Grid>
                      ))}
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>

            {/* مخطط أعمدة محسن */}
            <Grid item xs={12} md={6}>
              <Card sx={{ 
                height: '100%', 
                backgroundColor: theme.palette.background.paper,
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 4px 20px rgba(0,0,0,0.4)' 
                  : '0 4px 20px rgba(0,0,0,0.1)',
                borderRadius: 3,
                overflow: 'hidden'
              }}>
                <Box sx={{ 
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(135deg, #388e3c 0%, #4caf50 100%)'
                    : 'linear-gradient(135deg, #4caf50 0%, #8bc34a 100%)', 
                  color: 'success.contrastText', 
                  p: 2, 
                  textAlign: 'center'
                }}>
                  <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                    📊 مقارنة تفصيلية للمراحل
                  </Typography>
                  <Typography variant="caption" sx={{ opacity: 0.9 }}>
                    مخطط أعمدة تفاعلي
                  </Typography>
                </Box>
                <CardContent sx={{ p: 3 }}>
                  <ResponsiveContainer width="100%" height={350}>
                    <BarChart 
                      data={pieChartData}
                      margin={{ top: 20, right: 30, left: 20, bottom: 60 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="name" 
                        angle={-45}
                        textAnchor="end"
                        height={80}
                        interval={0}
                        tick={{ fontSize: 10 }}
                      />
                      <YAxis 
                        domain={[0, 100]}
                        tick={{ fontSize: 12 }}
                        label={{ value: 'نسبة الإنجاز %', angle: -90, position: 'insideLeft' }}
                      />
                      <Tooltip 
                        contentStyle={{
                          backgroundColor: 'rgba(255,255,255,0.95)',
                          border: '1px solid #e0e0e0',
                          borderRadius: '8px',
                          boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                        }}
                        formatter={(value: any, name: any, props: any) => [
                          `${value}% (${props.payload.count} مرحلة)`, 
                          'نسبة الإنجاز'
                        ]}
                      />
                      <Bar 
                        dataKey="value" 
                        name="نسبة الإنجاز %"
                        radius={[4, 4, 0, 0]}
                        animationDuration={800}
                      >
                        {pieChartData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={
                              entry.name === 'مكتمل' ? '#4caf50' : 
                              entry.name === 'قيد التنفيذ' ? '#ff9800' : '#f44336'
                            }
                          />
                        ))}
                      </Bar>
                </BarChart>
              </ResponsiveContainer>
                  
                  {/* مؤشرات الأداء */}
                  <Box sx={{ 
                    mt: 2, 
                    p: 2, 
                    backgroundColor: theme.palette.mode === 'dark' 
                      ? 'rgba(255, 255, 255, 0.05)' 
                      : '#f8f9fa', 
                    borderRadius: 2 
                  }}>
                    <Grid container spacing={2}>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                            {overallProgress >= 80 ? '1' : '0'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            ممتاز ({overallProgress.toFixed(2)}%)
                          </Typography>
                        </Box>
            </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                            {overallProgress >= 50 && overallProgress < 80 ? '1' : '0'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            جيد ({overallProgress.toFixed(2)}%)
                          </Typography>
                        </Box>
          </Grid>
                      <Grid item xs={4}>
                        <Box sx={{ textAlign: 'center' }}>
                          <Typography variant="h6" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                            {overallProgress < 50 ? '1' : '0'}
                          </Typography>
                          <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                            يحتاج تحسين ({overallProgress.toFixed(2)}%)
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* تحليل سريع */}
          <Box sx={{ 
            mt: 4, 
            p: 3, 
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, rgba(255, 255, 255, 0.02) 0%, rgba(255, 255, 255, 0.05) 100%)'
              : 'linear-gradient(135deg, rgba(76, 175, 80, 0.1) 0%, rgba(33, 150, 243, 0.1) 100%)',
            borderRadius: 3,
            border: theme.palette.mode === 'dark' 
              ? '1px solid rgba(255, 255, 255, 0.1)' 
              : '1px solid rgba(76, 175, 80, 0.2)'
          }}>
                                <Typography variant="h6" sx={{ 
                      fontWeight: 'bold', 
                      mb: 2, 
                      color: theme.palette.mode === 'dark' ? '#64b5f6' : '#1976d2' 
                    }}>
                      📈 التحليل السريع للأداء
                    </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                                      <strong>نسبة الإنجاز الكلية:</strong> {overallProgress.toFixed(2)}%
                </Typography>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>المراحل المكتملة:</strong> {completedStages} من أصل {totalStages}
                </Typography>
              </Grid>
              <Grid item xs={12} md={6}>
                <Typography variant="body2" sx={{ mb: 1 }}>
                  <strong>إجمالي المراحل:</strong> {totalStages} مرحلة
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                  <Typography variant="body2" component="span">
                    <strong>التقييم العام:</strong> 
                  </Typography>
                  <Chip 
                    label={
                      overallProgress >= 80 ? '🌟 أداء ممتاز' 
                      : overallProgress >= 60 ? '👍 أداء جيد جداً'
                      : overallProgress >= 40 ? '⚡ أداء متوسط'
                      : '⚠️ يحتاج تحسين'
                    }
                    color={
                      overallProgress >= 80 ? 'success' 
                      : overallProgress >= 60 ? 'info'
                      : overallProgress >= 40 ? 'warning'
                      : 'error'
                    }
                    size="small"
                  />
                </Box>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      {/* التبويبات */}
      <Card>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="project tabs">
            <Tab label="الطلبات" icon={<Assessment />} />
            <Tab label="المالية" icon={<AttachMoney />} />
            <Tab label="الأرشيف" icon={<Archive />} />
            <Tab label="المراحل والملاحظات" icon={<Engineering />} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {/* عنوان القسم المطور */}
          <Box sx={{ 
            background: theme.palette.mode === 'dark' 
              ? 'linear-gradient(135deg, #424242 0%, #616161 100%)'
              : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'primary.contrastText',
            p: 3,
            borderRadius: 2,
            mb: 3,
            boxShadow: '0 8px 32px rgba(102, 126, 234, 0.2)'
          }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Assessment sx={{ fontSize: 40 }} />
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                  🎯 إدارة الطلبات والمتطلبات
                </Typography>
                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                  مراقبة وتتبع جميع طلبات المشروع بكفاءة عالية
                </Typography>
              </Box>
            </Box>
          </Box>
          
          {/* إحصائيات الطلبات المطورة */}
          <Grid container spacing={3} sx={{ mb: 3 }}>
            <Grid item xs={12} md={3}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 3,
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, #1976d2 10%, #1565c0 40%, #0d47a1 90%)'
                  : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 50%, #90caf9 100%)',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 4px 20px rgba(25, 118, 210, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)' 
                  : '0 4px 20px rgba(33, 150, 243, 0.15)',
                border: theme.palette.mode === 'dark' 
                  ? '1px solid rgba(25, 118, 210, 0.3)' 
                  : '1px solid rgba(33, 150, 243, 0.2)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 8px 30px rgba(25, 118, 210, 0.6)' 
                    : '0 8px 25px rgba(33, 150, 243, 0.25)'
                }
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Assignment sx={{ fontSize: 32, color: 'primary.main' }} />
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold',
                    color: theme.palette.mode === 'dark' ? '#ffffff' : 'primary.main'
                  }}>
                    {requests?.total || safeRequests?.length || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'medium',
                    color: theme.palette.mode === 'dark' ? '#e3f2fd' : 'text.primary'
                  }}>إجمالي الطلبات</Typography>
                  <Box sx={{ 
                    width: '100%', 
                    height: 4, 
                    background: 'linear-gradient(90deg, #2196f3, #1976d2)',
                    borderRadius: 2,
                    mt: 1
                  }} />
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 3,
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, #2e7d32 10%, #388e3c 40%, #1b5e20 90%)'
                  : 'linear-gradient(135deg, #e8f5e8 0%, #c8e6c8 50%, #a5d6a7 100%)',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 4px 20px rgba(76, 175, 80, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)' 
                  : '0 4px 20px rgba(76, 175, 80, 0.15)',
                border: theme.palette.mode === 'dark' 
                  ? '1px solid rgba(76, 175, 80, 0.3)' 
                  : '1px solid rgba(76, 175, 80, 0.2)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 8px 30px rgba(76, 175, 80, 0.6)' 
                    : '0 8px 25px rgba(76, 175, 80, 0.25)'
                }
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <CheckCircle sx={{ fontSize: 32, color: 'success.main' }} />
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold', 
                    color: theme.palette.mode === 'dark' ? '#ffffff' : '#4caf50'
                  }}>
                    {requests?.completed || safeRequests?.filter((req: any) => req.isCompleted).length || 0}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'medium',
                    color: theme.palette.mode === 'dark' ? '#e8f5e8' : 'text.primary'
                  }}>الطلبات المكتملة</Typography>
                  <Box sx={{ 
                    width: '100%', 
                    height: 4, 
                    background: 'linear-gradient(90deg, #4caf50, #2e7d32)',
                    borderRadius: 2,
                    mt: 1
                  }} />
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 3,
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, #f57c00 10%, #ef6c00 40%, #e65100 90%)'
                  : 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 50%, #ffcc80 100%)',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 4px 20px rgba(255, 152, 0, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)' 
                  : '0 4px 20px rgba(255, 152, 0, 0.15)',
                border: theme.palette.mode === 'dark' 
                  ? '1px solid rgba(255, 152, 0, 0.3)' 
                  : '1px solid rgba(255, 152, 0, 0.2)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 8px 30px rgba(255, 152, 0, 0.6)' 
                    : '0 8px 25px rgba(255, 152, 0, 0.25)'
                }
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Schedule sx={{ fontSize: 32, color: 'warning.main' }} />
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold', 
                    color: theme.palette.mode === 'dark' ? '#ffffff' : 'warning.main'
                  }}>
                    {(requests?.total || safeRequests?.length || 0) - (requests?.completed || safeRequests?.filter((req: any) => req.isCompleted).length || 0)}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'medium',
                    color: theme.palette.mode === 'dark' ? '#fff3e0' : 'text.primary'
                  }}>الطلبات المعلقة</Typography>
                  <Box sx={{ 
                    width: '100%', 
                    height: 4, 
                    background: 'linear-gradient(90deg, #ff9800, #f57c00)',
                    borderRadius: 2,
                    mt: 1
                  }} />
                </Box>
              </Card>
            </Grid>
            <Grid item xs={12} md={3}>
              <Card sx={{ 
                textAlign: 'center', 
                p: 3,
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, #7b1fa2 10%, #8e24aa 40%, #4a148c 90%)'
                  : 'linear-gradient(135deg, #f3e5f5 0%, #e1bee7 50%, #ce93d8 100%)',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 4px 20px rgba(156, 39, 176, 0.4), inset 0 1px 0 rgba(255,255,255,0.1)' 
                  : '0 4px 20px rgba(156, 39, 176, 0.15)',
                border: theme.palette.mode === 'dark' 
                  ? '1px solid rgba(156, 39, 176, 0.3)' 
                  : '1px solid rgba(156, 39, 176, 0.2)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  transform: 'translateY(-5px)',
                  boxShadow: theme.palette.mode === 'dark' 
                    ? '0 8px 30px rgba(156, 39, 176, 0.6)' 
                    : '0 8px 25px rgba(156, 39, 176, 0.25)'
                }
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                  <Analytics sx={{ fontSize: 32, color: 'secondary.main' }} />
                  <Typography variant="h4" sx={{ 
                    fontWeight: 'bold', 
                    color: theme.palette.mode === 'dark' ? '#ffffff' : '#9c27b0'
                  }}>
                    {Math.ceil((requests?.total || safeRequests?.length || 0) / requestsPerPage)}
                  </Typography>
                  <Typography variant="body2" sx={{ 
                    fontWeight: 'medium',
                    color: theme.palette.mode === 'dark' ? '#f3e5f5' : 'text.primary'
                  }}>معدل الإنجاز</Typography>
                  <Box sx={{ 
                    width: '100%', 
                    height: 4, 
                    background: 'linear-gradient(90deg, #9c27b0, #7b1fa2)',
                    borderRadius: 2,
                    mt: 1
                  }} />
                </Box>
              </Card>
            </Grid>
          </Grid>

          {/* لوحة التحكم المطورة */}
          {Array.isArray(safeRequests) && safeRequests.length > 0 && (
            <Card sx={{ 
              mb: 3, 
              p: 3,
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, rgba(25, 32, 56, 0.9) 0%, rgba(34, 45, 65, 0.9) 100%)'
                : 'linear-gradient(135deg, #f8f9fc 0%, #e8eaf6 100%)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderRadius: 3
            }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <FilterList sx={{ color: 'primary.main', fontSize: 28 }} />
                <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                  🎛️ لوحة التحكم والعرض
                </Typography>
              </Box>
              
              <Grid container spacing={3} alignItems="center">
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark' 
                      ? 'rgba(33, 150, 243, 0.1)' 
                      : 'rgba(33, 150, 243, 0.05)',
                    border: '1px solid rgba(33, 150, 243, 0.2)'
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'primary.main' }}>
                      📊 عدد العناصر في الصفحة
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {[5, 10].map((num) => (
                        <Button
                          key={num}
                          variant={requestsPerPage === num ? "contained" : "outlined"}
                          size="small"
                          onClick={() => {
                            setRequestsPerPage(num);
                            setRequestsPage(1);
                          }}
                          sx={{
                            minWidth: '45px',
                            height: '36px',
                            fontWeight: 'bold',
                            boxShadow: requestsPerPage === num ? '0 4px 12px rgba(33, 150, 243, 0.3)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                        >
                          {num}
                        </Button>
                      ))}
                    </Box>
                  </Box>
                </Grid>
                
                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark' 
                      ? 'rgba(76, 175, 80, 0.1)' 
                      : 'rgba(76, 175, 80, 0.05)',
                    border: '1px solid rgba(76, 175, 80, 0.2)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'success.main' }}>
                      📄 معلومات التصفح
                    </Typography>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      الصفحة {requestsPage} من {Math.ceil(safeRequests.length / requestsPerPage)}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      عرض {((requestsPage - 1) * requestsPerPage) + 1} - {Math.min(requestsPage * requestsPerPage, safeRequests.length)} من {safeRequests.length} طلب
                    </Typography>
                  </Box>
                </Grid>

                <Grid item xs={12} md={4}>
                  <Box sx={{ 
                    p: 2, 
                    borderRadius: 2,
                    background: theme.palette.mode === 'dark' 
                      ? 'rgba(156, 39, 176, 0.1)' 
                      : 'rgba(156, 39, 176, 0.05)',
                    border: '1px solid rgba(156, 39, 176, 0.2)',
                    textAlign: 'center'
                  }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold', mb: 1, color: 'secondary.main' }}>
                      ⚡ نسبة الإنجاز
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>
                      <CircularProgress
                        variant="determinate"
                        value={safeRequests.length > 0 ? (safeRequests.filter((req: any) => req.isCompleted).length / safeRequests.length) * 100 : 0}
                        size={40}
                        thickness={6}
                        sx={{ color: 'secondary.main' }}
                      />
                      <Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'secondary.main' }}>
                          {safeRequests.length > 0 ? Math.round((safeRequests.filter((req: any) => req.isCompleted).length / safeRequests.length) * 100) : 0}%
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          مكتمل
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Card>
          )}

          {/* عرض الطلبات المطور */}
          {Array.isArray(safeRequests) && safeRequests.length > 0 ? (
            <>
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                gap: 2, 
                mb: 3,
                p: 2,
                background: 'linear-gradient(135deg, rgba(33, 150, 243, 0.1) 0%, rgba(156, 39, 176, 0.1) 100%)',
                borderRadius: 2,
                border: '1px solid rgba(33, 150, 243, 0.2)'
              }}>
                <Assignment sx={{ fontSize: 32, color: 'primary.main' }} />
                <Box>
                  <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                    📋 قائمة الطلبات والمتطلبات (الصفحة {requestsPage})
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    عرض {safeRequests.slice((requestsPage - 1) * requestsPerPage, requestsPage * requestsPerPage).length} طلب من إجمالي {safeRequests.length} طلب
                  </Typography>
                </Box>
              </Box>
              
              <TableContainer component={Paper} sx={{ 
                borderRadius: 3,
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                overflow: 'hidden'
              }}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ 
                      background: theme.palette.mode === 'dark' 
                        ? 'linear-gradient(135deg, #1565c0 0%, #1976d2 100%)'
                        : 'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                      boxShadow: theme.palette.mode === 'dark' 
                        ? '0 4px 8px rgba(0,0,0,0.4)'
                        : '0 4px 8px rgba(25, 118, 210, 0.3)',
                      border: theme.palette.mode === 'dark' 
                        ? '1px solid rgba(255,255,255,0.1)' 
                        : '1px solid rgba(13, 71, 161, 0.5)',
                      '& .MuiTableCell-head': {
                        color: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                        fontWeight: 'bold',
                        fontSize: '1rem',
                        padding: '16px',
                        textShadow: theme.palette.mode === 'dark' 
                          ? '0 1px 2px rgba(0,0,0,0.5)' 
                          : '0 1px 2px rgba(255,255,255,0.8)',
                        borderRight: theme.palette.mode === 'dark' 
                          ? `1px solid rgba(255,255,255,0.2)` 
                          : `1px solid rgba(0,0,0,0.2)`,
                        '&:last-child': {
                          borderRight: 'none'
                        }
                      }
                    }}>
                      <TableCell width="50px" sx={{ textAlign: 'center' }}>نوع الطلب</TableCell>
                      <TableCell width="200px">عنوان الطلب</TableCell>
                      <TableCell width="300px">الوصف</TableCell>
                      <TableCell width="120px">التاريخ</TableCell>
                      <TableCell width="80px">الحالة</TableCell>
                      <TableCell width="120px">طالب الطلب</TableCell>
                      <TableCell width="120px">منفذ الطلب</TableCell>
                      <TableCell width="100px" sx={{ textAlign: 'center' }}>التقدم</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                {safeRequests
                  .slice((requestsPage - 1) * requestsPerPage, requestsPage * requestsPerPage)
                  .map((request: any, index: number) => {
                    // تحديد نوع الطلب والأيقونة المناسبة
                    const getRequestIcon = (type: string) => {
                      const typeStr = (type || '').toLowerCase();
                      if (typeStr.includes('مواد') || typeStr.includes('مورد')) return '📦';
                      if (typeStr.includes('تشطيب') || typeStr.includes('دهان')) return '🎨';
                      if (typeStr.includes('كهرب')) return '⚡';
                      if (typeStr.includes('سباك')) return '🔧';
                      if (typeStr.includes('نظاف')) return '🧹';
                      if (typeStr.includes('صيان')) return '🛠️';
                      return '📋';
                    };

                    const getRequestPriority = (request: any) => {
                      // تحديد الأولوية بناءً على عدة عوامل
                      if (request.isCompleted) return 'مكتمل';
                      if (request.title?.includes('عاجل') || request.description?.includes('عاجل')) return 'عاجل';
                      if (request.title?.includes('مهم') || request.description?.includes('مهم')) return 'مهم';
                      return 'عادي';
                    };

                    const priority = getRequestPriority(request);
                    const requestIcon = getRequestIcon(request.title || request.type || '');

                    return (
                          <TableRow 
                            key={index}
                            sx={{ 
                          '&:hover': {
                                backgroundColor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255, 255, 255, 0.05)' 
                                  : 'rgba(33, 150, 243, 0.05)',
                                transform: 'scale(1.01)',
                                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
                              },
                              '&:nth-of-type(odd)': {
                                backgroundColor: theme.palette.mode === 'dark' 
                                  ? 'rgba(255, 255, 255, 0.02)' 
                                  : 'rgba(248, 250, 252, 0.8)'
                              },
                              transition: 'all 0.2s ease-in-out',
                              borderLeft: `4px solid ${
                                request.isCompleted 
                                  ? 'success.main' 
                              : priority === 'عاجل' 
                                    ? 'error.main'
                                : priority === 'مهم'
                                      ? 'warning.main'
                                      : 'info.main'
                              }`
                            }}
                          >
                            <TableCell sx={{ textAlign: 'center', fontSize: '1.5rem' }}>
                                  {requestIcon}
                            </TableCell>
                            <TableCell>
                                <Typography 
                                variant="subtitle2" 
                                  sx={{ 
                                    fontWeight: 'bold',
                                  color: 'primary.main',
                                  mb: 0.5
                                  }}
                                >
                                  {request.title || request.type || 'طلب'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Typography 
                                variant="body2" 
                                sx={{ 
                                  color: 'text.primary',
                                  display: '-webkit-box',
                                  WebkitLineClamp: 2,
                                  WebkitBoxOrient: 'vertical',
                                  overflow: 'hidden',
                                  lineHeight: 1.4
                                }}
                                title={request.description || 'لا يوجد وصف'}
                              >
                                {request.description || 'لا يوجد وصف للطلب'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <CalendarToday sx={{ fontSize: 16, color: 'primary.main' }} />
                                <Typography variant="body2" color="text.secondary">
                                  {request.formattedRequestDate || request.formattedDate || 'غير محدد'}
                                </Typography>
                              </Box>
                            </TableCell>
                            <TableCell>
                              <Chip
                                label={request.isCompleted ? 'مكتمل' : priority}
                                size="small"
                                sx={{
                                  backgroundColor: request.isCompleted 
                                    ? '#4caf50' 
                                    : priority === 'عاجل' 
                                      ? 'error.main'
                                      : priority === 'مهم'
                                        ? 'warning.main'
                                        : 'info.main',
                                  color: 'primary.contrastText',
                                  fontWeight: 'bold',
                                  fontSize: '0.75rem'
                                }}
                              />
                            </TableCell>
                            <TableCell>
                              {request.requestedBy && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ 
                                    width: 24, 
                                    height: 24, 
                                    backgroundColor: theme.palette.info.main,
                                    fontSize: '0.7rem'
                                  }}>
                                    {request.requestedBy.charAt(0)}
                                  </Avatar>
                                  <Typography variant="body2" color="text.secondary">
                                    {request.requestedBy}
                                  </Typography>
                                </Box>
                              )}
                            </TableCell>
                            <TableCell>
                              {request.implementedBy && (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Avatar sx={{ 
                                    width: 24, 
                                    height: 24, 
                                    backgroundColor: theme.palette.success.main,
                                    fontSize: '0.7rem'
                                  }}>
                                    {request.implementedBy.charAt(0)}
                                  </Avatar>
                                  <Typography variant="body2" color="text.secondary">
                                    {request.implementedBy}
                                  </Typography>
                                </Box>
                              )}
                            </TableCell>
                            <TableCell sx={{ textAlign: 'center' }}>
                              {request.isCompleted ? (
                                <CheckCircle sx={{ color: '#4caf50', fontSize: '1.5rem' }} />
                              ) : (
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <CircularProgress 
                                    size={16} 
                                  sx={{
                                      color: priority === 'عاجل' ? '#f44336' : '#2196f3'
                                  }}
                                />
                                  <Typography variant="caption" color="text.secondary">
                                    جاري
                                </Typography>
                              </Box>
                            )}
                            </TableCell>
                          </TableRow>
                    );
                  })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* نظام التصفح المطور */}
              {Math.ceil(safeRequests.length / requestsPerPage) > 1 && (
                <Card sx={{ 
                  mt: 4, 
                  p: 3,
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(135deg, rgba(156, 39, 176, 0.1) 0%, rgba(33, 150, 243, 0.1) 100%)'
                    : 'linear-gradient(135deg, #f8f9fc 0%, #e8eaf6 100%)',
                  boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
                  borderRadius: 3
                }}>
                  <Box sx={{ 
                    display: 'flex', 
                    flexDirection: { xs: 'column', md: 'row' },
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    gap: 3
                  }}>
                    {/* معلومات التصفح */}
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column',
                      alignItems: { xs: 'center', md: 'flex-start' },
                      gap: 1
                    }}>
                      <Typography variant="h6" sx={{ 
                        fontWeight: 'bold', 
                        color: 'primary.main',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}>
                        📄 نظام التصفح الذكي
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Chip 
                          label={`الصفحة ${requestsPage}`}
                          variant="outlined"
                          color="primary"
                          size="small"
                          sx={{ 
                            fontWeight: 'bold',
                            '& .MuiChip-label': {
                              fontSize: '0.875rem'
                            }
                          }}
                        />
                        <Typography variant="body2" color="text.secondary">
                          من أصل {Math.ceil(safeRequests.length / requestsPerPage)} صفحة
                        </Typography>
                      </Box>
                      <Typography variant="caption" color="text.secondary">
                        عرض {((requestsPage - 1) * requestsPerPage) + 1} - {Math.min(requestsPage * requestsPerPage, safeRequests.length)} من {safeRequests.length} طلب
                      </Typography>
                    </Box>

                    {/* أزرار التصفح المطورة */}
                    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button
                          variant="outlined"
                          startIcon={<KeyboardArrowUp />}
                          onClick={() => setRequestsPage(1)}
                          disabled={requestsPage === 1}
                          size="small"
                          sx={{ 
                            minWidth: '100px',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                            }
                          }}
                        >
                          الأولى
                        </Button>
                        
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={requestsPage === 1}
                          onClick={() => setRequestsPage(requestsPage - 1)}
                          sx={{
                            minWidth: '80px',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                            }
                          }}
                        >
                          السابق
                        </Button>
                        
                        <Box sx={{ display: 'flex', gap: 0.5, mx: 1 }}>
                          {Array.from({ length: Math.ceil(safeRequests.length / requestsPerPage) }, (_, i) => i + 1)
                            .filter(page => 
                              page === 1 || 
                              page === Math.ceil(safeRequests.length / requestsPerPage) || 
                              Math.abs(page - requestsPage) <= 1
                            )
                            .map((page, index, array) => (
                              <React.Fragment key={page}>
                                {index > 0 && array[index - 1] !== page - 1 && (
                                  <Typography variant="body2" sx={{ px: 1, alignSelf: 'center', color: 'text.secondary' }}>
                                    ⋯
                                  </Typography>
                                )}
                                <Button
                                  variant={requestsPage === page ? "contained" : "outlined"}
                                  size="small"
                                  onClick={() => setRequestsPage(page)}
                                  sx={{ 
                                    minWidth: '40px',
                                    height: '40px',
                                    fontWeight: 'bold',
                                    transition: 'all 0.2s ease',
                                    ...(requestsPage === page ? {
                                      background: theme.palette.mode === 'dark' 
                                        ? 'linear-gradient(135deg, #424242 0%, #616161 100%)'
                                        : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                      color: 'primary.contrastText',
                                      boxShadow: '0 4px 12px rgba(102, 126, 234, 0.4)',
                                      '&:hover': {
                                        background: theme.palette.mode === 'dark' 
                                          ? 'linear-gradient(135deg, #424242 0%, #616161 100%)'
                                          : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                        transform: 'scale(1.1)'
                                      }
                                    } : {
                                      '&:hover': {
                                        transform: 'scale(1.1)',
                                        boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                                      }
                                    })
                                  }}
                                >
                                  {page}
                                </Button>
                              </React.Fragment>
                            ))
                          }
                        </Box>

                        <Button
                          variant="outlined"
                          size="small"
                          disabled={requestsPage === Math.ceil(safeRequests.length / requestsPerPage)}
                          onClick={() => setRequestsPage(requestsPage + 1)}
                          sx={{
                            minWidth: '80px',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                            }
                          }}
                        >
                          التالي
                        </Button>
                        
                        <Button
                          variant="outlined"
                          endIcon={<KeyboardArrowDown />}
                          onClick={() => setRequestsPage(Math.ceil(safeRequests.length / requestsPerPage))}
                          disabled={requestsPage === Math.ceil(safeRequests.length / requestsPerPage)}
                          size="small"
                          sx={{ 
                            minWidth: '100px',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              transform: 'translateY(-2px)',
                              boxShadow: '0 4px 12px rgba(33, 150, 243, 0.3)'
                            }
                          }}
                        >
                          الأخيرة
                        </Button>
                      </Box>
                      
                      {/* مؤشر التقدم في التصفح */}
                      <Box sx={{ width: '100%', maxWidth: '300px' }}>
                        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
                          <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'text.primary' }}>
                            📊 تقدم العرض
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {Math.round((requestsPage / Math.ceil(safeRequests.length / requestsPerPage)) * 100)}%
                          </Typography>
                        </Box>
                        <LinearProgress 
                          variant="determinate" 
                          value={(requestsPage / Math.ceil(safeRequests.length / requestsPerPage)) * 100}
                          sx={{
                            height: 6,
                            borderRadius: 3,
                            backgroundColor: 'rgba(33, 150, 243, 0.1)',
                            '& .MuiLinearProgress-bar': {
                              background: 'linear-gradient(90deg, #667eea, #764ba2)',
                              borderRadius: 3
                            }
                          }}
                        />
                      </Box>
                    </Box>
                  </Box>
                  
                  {/* إحصائيات العرض */}
                  <Box sx={{ 
                    mt: 3,
                    pt: 2,
                    borderTop: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                  }}>
                    <Box sx={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: 2,
                      p: 1.5,
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(33, 150, 243, 0.1)' 
                        : 'rgba(33, 150, 243, 0.05)',
                      borderRadius: 2,
                      border: '1px solid rgba(33, 150, 243, 0.2)'
                    }}>
                      <Analytics sx={{ color: 'primary.main', fontSize: 20 }} />
                      <Typography variant="body2" color="text.secondary">
                        📈 إجمالي {safeRequests.length} طلب موزعة على {Math.ceil(safeRequests.length / requestsPerPage)} صفحة
                      </Typography>
                    </Box>
                  </Box>
                </Card>
              )}
            </>
          ) : (
            <Card sx={{ 
              textAlign: 'center', 
              py: 6,
              px: 4,
              background: theme.palette.mode === 'dark' 
                ? 'linear-gradient(135deg, rgba(25, 32, 56, 0.9) 0%, rgba(34, 45, 65, 0.9) 100%)'
                : 'linear-gradient(135deg, #f8f9fc 0%, #e8eaf6 100%)',
              boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
              borderRadius: 3,
              border: '2px dashed',
              borderColor: theme.palette.mode === 'dark' ? 'rgba(156, 39, 176, 0.3)' : 'rgba(156, 39, 176, 0.2)'
            }}>
              <Box sx={{ mb: 3 }}>
                <Assessment sx={{ 
                  fontSize: 80, 
                  color: 'text.secondary', 
                  mb: 2,
                  opacity: 0.7,
                  filter: 'drop-shadow(0 4px 8px rgba(0, 0, 0, 0.1))'
                }} />
                <Typography variant="h4" sx={{ 
                  fontWeight: 'bold',
                  background: theme.palette.mode === 'dark' 
                    ? 'linear-gradient(135deg, #90caf9 0%, #ce93d8 100%)'
                    : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  backgroundClip: 'text',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  mb: 2
                }}>
                  📋 لا توجد طلبات مسجلة
                </Typography>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3, lineHeight: 1.6 }}>
                  لم يتم تسجيل أي طلبات أو متطلبات لهذا المشروع حتى الآن
                </Typography>
              </Box>
              
              <Box sx={{ 
                display: 'flex', 
                flexDirection: { xs: 'column', sm: 'row' },
                justifyContent: 'center',
                gap: 2,
                mb: 3
              }}>
                <Chip 
                  icon={<Assignment />}
                  label="الطلبات الفنية"
                  variant="outlined"
                  sx={{ 
                    fontSize: '0.9rem',
                    py: 2,
                    px: 1,
                    '& .MuiChip-icon': { fontSize: '1.2rem' }
                  }}
                />
                <Chip 
                  icon={<Engineering />}
                  label="طلبات المواد"
                  variant="outlined"
                  sx={{ 
                    fontSize: '0.9rem',
                    py: 2,
                    px: 1,
                    '& .MuiChip-icon': { fontSize: '1.2rem' }
                  }}
                />
                <Chip 
                  icon={<Schedule />}
                  label="طلبات الصيانة"
                  variant="outlined"
                  sx={{ 
                    fontSize: '0.9rem',
                    py: 2,
                    px: 1,
                    '& .MuiChip-icon': { fontSize: '1.2rem' }
                  }}
                />
              </Box>
              
              <Typography variant="caption" color="text.secondary" sx={{ 
                display: 'block',
                p: 2,
                backgroundColor: theme.palette.mode === 'dark' 
                  ? 'rgba(156, 39, 176, 0.1)' 
                  : 'rgba(156, 39, 176, 0.05)',
                borderRadius: 2,
                border: '1px solid rgba(156, 39, 176, 0.2)'
              }}>
                💡 ستظهر هنا جميع الطلبات والمتطلبات عند إضافتها للمشروع
              </Typography>
            </Card>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          <Typography variant="h6" gutterBottom>
            البيانات المالية
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="success.main">
                    إجمالي العهد
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(realFinancialData.revenue)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    من {realFinancialData.revenueCount} عنصر
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="error.main">
                    إجمالي المصروفات
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(realFinancialData.expenses)}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    من {realFinancialData.expenseCount} عنصر
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color="warning.main">
                    إجمالي المرتجعات
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(realFinancialData.returns)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color={realFinancialData.remainingBalance >= 0 ? "success.main" : "error.main"}>
                    الرصيد المتبقي
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(realFinancialData.remainingBalance)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12} md={6}>
              <Card>
                <CardContent>
                  <Typography variant="h6" color={realFinancialData.netProfit >= 0 ? "success.main" : "error.main"}>
                    صافي الربح
                  </Typography>
                  <Typography variant="h4">
                    {formatCurrency(realFinancialData.netProfit)}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
          
          {/* تفاصيل العهد والمصروفات */}
          {financialData?.details && (
            <>
              <Typography variant="h6" gutterBottom sx={{ mt: 4 }}>
                أحدث العهد
              </Typography>
              <Grid container spacing={2} sx={{ mb: 3 }}>
                {Array.isArray(financialData.details.revenues) && financialData.details.revenues.slice(0, 3).map((revenue: any, index: number) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" color="success.main">
                          {formatCurrency(revenue.amount)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {revenue.formattedDate}
                        </Typography>
                        <Typography variant="body2">
                          {revenue.description || 'غير محدد'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
              
              <Typography variant="h6" gutterBottom>
                أحدث المصروفات
              </Typography>
              <Grid container spacing={2}>
                {Array.isArray(financialData.details.expenses) && financialData.details.expenses.slice(0, 3).map((expense: any, index: number) => (
                  <Grid item xs={12} md={4} key={index}>
                    <Card>
                      <CardContent>
                        <Typography variant="h6" color="error.main">
                          {formatCurrency(expense.amount)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {expense.formattedDate}
                        </Typography>
                        <Typography variant="body2">
                          {expense.description || 'غير محدد'}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {expense.category || 'غير مصنف'}
                        </Typography>
                      </CardContent>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            </>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={2}>
          <Typography variant="h6" gutterBottom>
            الأرشيف
          </Typography>
          <Typography variant="body1" color="text.secondary">
            هنا يمكن عرض جميع الملفات والوثائق المؤرشفة للمشروع
          </Typography>
        </TabPanel>

        <TabPanel value={tabValue} index={3}>
          <Typography variant="h6" gutterBottom>
            🏗️ المراحل والملاحظات
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            عرض مفصل لجميع مراحل المشروع والملاحظات المرتبطة بها
          </Typography>

          {stagesNotesLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '300px' }}>
              <CircularProgress size={40} />
              <Typography variant="body1" sx={{ ml: 2 }}>
                جاري تحميل المراحل والملاحظات...
              </Typography>
            </Box>
          ) : !stagesNotesData ? (
            <Box sx={{ textAlign: 'center', py: 4 }}>
              <Engineering sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>
                انقر لتحميل المراحل والملاحظات
              </Typography>
              <Button variant="contained" onClick={fetchStagesNotes} startIcon={<Engineering />}>
                تحميل البيانات
              </Button>
            </Box>
          ) : (
            <>
              {/* لوحة إحصائيات التقدم والإنجاز المحسنة */}
              <Card sx={{ 
                mb: 3, 
                background: theme.palette.mode === 'dark' 
                  ? 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)' 
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 50%, #f093fb 100%)', 
                color: 'white',
                boxShadow: theme.palette.mode === 'dark' 
                  ? '0 10px 30px rgba(0, 0, 0, 0.5)' 
                  : '0 10px 30px rgba(102, 126, 234, 0.3)'
              }}>
                <CardContent sx={{ p: 3 }}>
                  <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 3, textAlign: 'center' }}>
                    📊 لوحة نسب الإنجاز الشاملة
                    </Typography>
                  
                  {/* المؤشرات الرئيسية */}
                  <Grid container spacing={3} sx={{ mb: 4 }}>
                    {/* نسبة الإنجاز الكلية */}
                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 3, 
                        backgroundColor: 'rgba(255,255,255,0.15)', 
                        borderRadius: 3,
                        backdropFilter: 'blur(10px)'
                      }}>
                        <Box sx={{ position: 'relative', display: 'inline-flex', mb: 2 }}>
                          <CircularProgress
                            variant="determinate"
                            value={stagesNotesData.statistics?.averageProgress || 0}
                            size={120}
                            thickness={6}
                            sx={{ 
                              color: '#4caf50',
                              filter: 'drop-shadow(0 4px 8px rgba(76, 175, 80, 0.3))'
                            }}
                          />
                          <Box sx={{
                            top: 0,
                            left: 0,
                            bottom: 0,
                            right: 0,
                            position: 'absolute',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexDirection: 'column'
                          }}>
                            <Typography variant="h4" sx={{ fontWeight: 'bold' }}>
                              {(stagesNotesData.statistics?.averageProgress || 0).toFixed(2)}%
                            </Typography>
                            <Typography variant="caption" sx={{ opacity: 0.8 }}>
                              الإنجاز الكلي
                            </Typography>
                          </Box>
                        </Box>
                        <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                          متوسط التقدم العام
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9 }}>
                          حساب متوسط جميع المراحل
                        </Typography>
                      </Box>
                </Grid>

                    {/* إحصائيات المراحل */}
                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 3, 
                        backgroundColor: 'rgba(255,255,255,0.15)', 
                        borderRadius: 3,
                        backdropFilter: 'blur(10px)'
                      }}>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                      {stagesNotesData.statistics?.completedStages || 0}
                    </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                          مرحلة مكتملة
                        </Typography>
                        <Typography variant="body2" sx={{ opacity: 0.9, mb: 2 }}>
                          من أصل {stagesNotesData.statistics?.totalStages || 0} مرحلة
                        </Typography>
                        <Box sx={{ width: '100%', backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 1 }}>
                          <LinearProgress
                            variant="determinate"
                            value={stagesNotesData.statistics?.totalStages ? 
                              (stagesNotesData.statistics.completedStages / stagesNotesData.statistics.totalStages) * 100 : 0}
                            sx={{
                              height: 8,
                              borderRadius: 1,
                              '& .MuiLinearProgress-bar': {
                                backgroundColor: '#4caf50',
                                borderRadius: 1,
                              },
                            }}
                          />
                        </Box>
                        <Typography variant="caption" sx={{ opacity: 0.8, mt: 1, display: 'block' }}>
                          {stagesNotesData.statistics?.totalStages ? 
                            ((stagesNotesData.statistics.completedStages / stagesNotesData.statistics.totalStages) * 100).toFixed(2) : 0}% 
                          من المراحل
                        </Typography>
                      </Box>
                </Grid>

                    {/* ملخص النشاط */}
                    <Grid item xs={12} md={4}>
                      <Box sx={{ 
                        textAlign: 'center', 
                        p: 3, 
                        backgroundColor: 'rgba(255,255,255,0.15)', 
                        borderRadius: 3,
                        backdropFilter: 'blur(10px)'
                      }}>
                        <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 1 }}>
                          {stagesNotesData.statistics?.totalNotes || 0}
                        </Typography>
                        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 1 }}>
                          ملاحظة فنية
                        </Typography>
                        <Grid container spacing={1} sx={{ mt: 1 }}>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                              مراحل بتأخير:
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                              {stagesNotesData.statistics?.stagesWithDelays || 0}
                            </Typography>
                          </Grid>
                          <Grid item xs={6}>
                            <Typography variant="caption" sx={{ opacity: 0.9 }}>
                              مراحل معلقة:
                            </Typography>
                            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                      {stagesNotesData.statistics?.pendingStages || 0}
                    </Typography>
                </Grid>
                        </Grid>
                      </Box>
                    </Grid>
                  </Grid>

                  {/* شريط التقدم التفاعلي المحسن */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                      🎯 تفصيل حالة المراحل
                    </Typography>
                    <Grid container spacing={2}>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(76, 175, 80, 0.2)', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ color: '#4caf50', fontWeight: 'bold' }}>
                            {stagesNotesData.statistics?.completedStages || 0}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>مكتملة</Typography>
                        </Box>
                </Grid>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(255, 152, 0, 0.2)', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ color: '#ff9800', fontWeight: 'bold' }}>
                            {stagesNotesData.statistics?.pendingStages || 0}
                    </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>⏳ معلقة</Typography>
                        </Box>
                </Grid>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(33, 150, 243, 0.2)', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ color: '#2196f3', fontWeight: 'bold' }}>
                            {stagesNotesData.statistics?.inProgressStages || 
                            ((stagesNotesData.statistics?.totalStages || 0) - 
                             (stagesNotesData.statistics?.completedStages || 0) - 
                             (stagesNotesData.statistics?.pendingStages || 0) - 
                             (stagesNotesData.statistics?.stagesWithDelays || 0))}
                    </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>قيد التنفيذ</Typography>
                        </Box>
                </Grid>
                      <Grid item xs={12} md={3}>
                        <Box sx={{ textAlign: 'center', p: 2, backgroundColor: 'rgba(244, 67, 54, 0.2)', borderRadius: 2 }}>
                          <Typography variant="h4" sx={{ color: '#f44336', fontWeight: 'bold' }}>
                            {stagesNotesData.statistics?.stagesWithDelays || 0}
                          </Typography>
                          <Typography variant="body2" sx={{ opacity: 0.9 }}>⚠️ متأخرة</Typography>
                        </Box>
              </Grid>
                    </Grid>
                  </Box>

                  {/* رسم بياني تفاعلي للتقدم */}
                  <Box sx={{ 
                    mt: 3, 
                    p: 3, 
                    backgroundColor: 'rgba(255,255,255,0.1)', 
                    borderRadius: 3,
                    backdropFilter: 'blur(10px)'
                  }}>
                    <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2, textAlign: 'center' }}>
                      📈 خريطة التقدم التفصيلية
                    </Typography>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>0%</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>50%</Typography>
                      <Typography variant="body2" sx={{ opacity: 0.9 }}>100%</Typography>
                    </Box>
                    <Box sx={{ position: 'relative', width: '100%', height: 20, backgroundColor: 'rgba(255,255,255,0.3)', borderRadius: 10, overflow: 'hidden' }}>
                      <Box sx={{
                        width: `${stagesNotesData.statistics?.averageProgress || 0}%`,
                        height: '100%',
                        background: 'linear-gradient(90deg, #4caf50 0%, #8bc34a 50%, #cddc39 100%)',
                        borderRadius: 10,
                        position: 'relative',
                        transition: 'width 1s ease-in-out',
                        '&::after': {
                          content: '""',
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          background: 'linear-gradient(90deg, transparent 0%, rgba(255,255,255,0.3) 50%, transparent 100%)',
                          animation: 'shimmer 2s infinite'
                        }
                      }} />
                    </Box>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', textAlign: 'center', mt: 2 }}>
                      {(stagesNotesData.statistics?.averageProgress || 0).toFixed(2)}% مكتمل
                    </Typography>
                  </Box>
                </CardContent>
              </Card>

              {/* أدوات التحكم والفلترة */}
              <Card sx={{ mb: 3, p: 2 }}>
                <Grid container spacing={2} alignItems="center">
                  <Grid item xs={12} md={2}>
                    <Typography variant="body1" color="primary" sx={{ fontWeight: 'bold' }}>
                      فلترة وعرض المراحل
                    </Typography>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <FormControl fullWidth size="small">
                      <InputLabel>نوع المرحلة</InputLabel>
                      <Select
                        value={stageTypeFilter}
                        label="نوع المرحلة"
                        onChange={(e) => setStageTypeFilter(e.target.value)}
                      >
                        <MenuItem value="all">جميع المراحل</MenuItem>
                        <MenuItem value="regular">المراحل العادية</MenuItem>
                        <MenuItem value="custom">المراحل المخصصة</MenuItem>
                      </Select>
                    </FormControl>
                  </Grid>
                  <Grid item xs={12} md={4}>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      <Typography variant="body2" sx={{ alignSelf: 'center', minWidth: 'auto', mr: 1 }}>
                        عدد المراحل:
                      </Typography>
                      {[5, 10].map((num) => (
                        <Button
                          key={num}
                          variant={stagesPerPage === num ? "contained" : "outlined"}
                          size="small"
                          onClick={() => {
                            setStagesPerPage(num);
                            setStagesPage(1);
                          }}
                        >
                          {num}
                        </Button>
                      ))}
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Box sx={{ 
                      display: 'flex', 
                      flexDirection: 'column', 
                      gap: 1,
                      alignItems: 'flex-start',
                      pl: 2 
                    }}>
                      <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 'bold' }}>
                        🎛️ أدوات التحكم
                      </Typography>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => toggleAllMainStages(true)}
                          sx={{ 
                            minWidth: '65px', 
                            fontSize: '0.65rem',
                            color: '#dc3545',
                            borderColor: '#dc3545',
                            '&:hover': { 
                              backgroundColor: '#dc3545',
                              color: 'white'
                            }
                          }}
                        >
                          📁 طوي
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => toggleAllMainStages(false)}
                          sx={{ 
                            minWidth: '65px', 
                            fontSize: '0.65rem',
                            color: '#28a745',
                            borderColor: '#28a745',
                            '&:hover': { 
                              backgroundColor: '#28a745',
                              color: 'white'
                            }
                          }}
                        >
                          📂 فتح
                      </Button>
                      </Box>
                      <Box sx={{ display: 'flex', gap: 0.5, flexWrap: 'wrap' }}>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => toggleAllSubStages(true)}
                          sx={{ 
                            minWidth: '65px', 
                            fontSize: '0.65rem',
                            color: '#fd7e14',
                            borderColor: '#fd7e14',
                            '&:hover': { 
                              backgroundColor: '#fd7e14',
                              color: 'white'
                            }
                          }}
                        >
                          📝 طوي
                      </Button>
                      <Button
                        variant="outlined"
                        size="small"
                        onClick={() => toggleAllSubStages(false)}
                          sx={{ 
                            minWidth: '65px', 
                            fontSize: '0.65rem',
                            color: '#007bff',
                            borderColor: '#007bff',
                            '&:hover': { 
                              backgroundColor: '#007bff',
                              color: 'white'
                            }
                          }}
                        >
                          📋 فتح
                      </Button>
                      </Box>
                    </Box>
                  </Grid>
                  <Grid item xs={12} md={2}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', height: '100%' }}>
                    <Typography variant="body2" color="text.secondary">
                      الصفحة {stagesNotesData.pagination?.currentPage || 1} من {stagesNotesData.pagination?.totalPages || 1}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      إجمالي {stagesNotesData.pagination?.totalItems || 0} مرحلة
                    </Typography>
                    </Box>
                  </Grid>
                </Grid>
              </Card>

              {/* عرض المراحل الرئيسية والفرعية */}
              {stagesNotesData.mainStages && stagesNotesData.mainStages.length > 0 ? (
                <>
                  <Typography variant="h6" gutterBottom sx={{ mb: 2 }}>
                    🏗️ المراحل الرئيسية (الصفحة {stagesNotesData.pagination?.currentPage || 1})
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    {stagesNotesData.structureInfo?.description} - إجمالي {stagesNotesData.totalSubStages} مرحلة فرعية
                  </Typography>
                  
                  {/* رسالة إرشادية للمستخدم */}
                  <Alert severity="info" sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Typography variant="body2">
                        💡 <strong>تلميح:</strong> جميع المراحل مطوية افتراضياً لتحسين الأداء. 
                        انقر على أي مرحلة لفتحها أو استخدم أزرار التحكم لفتح/طوي جميع المراحل دفعة واحدة.
                      </Typography>
                    </Box>
                  </Alert>

                  {/* فريق العمل الفعلي في المشروع */}
                  {stagesNotesData.projectTeam && stagesNotesData.projectTeam.total > 0 && (
                    <Box sx={{ 
                      mb: 3, 
                      p: 2, 
                      backgroundColor: theme.palette.mode === 'dark' 
                        ? 'rgba(76, 175, 80, 0.1)' 
                        : '#e8f5e8', 
                      borderRadius: 2, 
                      border: `1px solid ${theme.palette.success.main}` 
                    }}>
                      <Typography variant="h6" sx={{ mb: 2, color: 'success.main', display: 'flex', alignItems: 'center', gap: 1 }}>
                        👥 فريق العمل الفعلي في المشروع ({stagesNotesData.projectTeam.total} عضو)
                      </Typography>
                      
                      {/* إحصائيات سريعة */}
                      <Grid container spacing={2} sx={{ mb: 2 }}>
                        <Grid item xs={6} sm={4} md={2}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 1, 
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'white', 
                            borderRadius: 1,
                            border: theme.palette.mode === 'dark' 
                              ? '1px solid rgba(255, 255, 255, 0.1)' 
                              : 'none'
                          }}>
                            <Typography variant="h4" color="success.main">
                              {stagesNotesData.projectTeam.summary.engineers}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              مهندس
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 1, 
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'white', 
                            borderRadius: 1,
                            border: theme.palette.mode === 'dark' 
                              ? '1px solid rgba(255, 255, 255, 0.1)' 
                              : 'none'
                          }}>
                            <Typography variant="h4" color="success.main">
                              {stagesNotesData.projectTeam.summary.supervisors}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              مشرف
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 1, 
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'white', 
                            borderRadius: 1,
                            border: theme.palette.mode === 'dark' 
                              ? '1px solid rgba(255, 255, 255, 0.1)' 
                              : 'none'
                          }}>
                            <Typography variant="h4" color="success.main">
                              {stagesNotesData.projectTeam.summary.contractors}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              مقاول
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 1, 
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'white', 
                            borderRadius: 1,
                            border: theme.palette.mode === 'dark' 
                              ? '1px solid rgba(255, 255, 255, 0.1)' 
                              : 'none'
                          }}>
                            <Typography variant="h4" color="success.main">
                              {stagesNotesData.projectTeam.summary.technicians}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              فني
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 1, 
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'white', 
                            borderRadius: 1,
                            border: theme.palette.mode === 'dark' 
                              ? '1px solid rgba(255, 255, 255, 0.1)' 
                              : 'none'
                          }}>
                            <Typography variant="h4" color="success.main">
                              {stagesNotesData.projectTeam.summary.managers}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              مدير
                            </Typography>
                          </Box>
                        </Grid>
                        <Grid item xs={6} sm={4} md={2}>
                          <Box sx={{ 
                            textAlign: 'center', 
                            p: 1, 
                            backgroundColor: theme.palette.mode === 'dark' 
                              ? 'rgba(255, 255, 255, 0.05)' 
                              : 'white', 
                            borderRadius: 1,
                            border: theme.palette.mode === 'dark' 
                              ? '1px solid rgba(255, 255, 255, 0.1)' 
                              : 'none'
                          }}>
                            <Typography variant="h4" color="success.main">
                              {stagesNotesData.projectTeam.summary.others}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              أخرى
                            </Typography>
                          </Box>
                        </Grid>
                      </Grid>
                      
                      {/* قائمة أعضاء الفريق */}
                      {stagesNotesData.projectTeam.members && stagesNotesData.projectTeam.members.length > 0 && (
                        <Box sx={{ mt: 2 }}>
                          <Typography variant="subtitle2" sx={{ color: 'success.main', mb: 1, fontWeight: 'bold' }}>
                            📋 قائمة أعضاء الفريق:
                          </Typography>
                          <Grid container spacing={1}>
                            {stagesNotesData.projectTeam.members.map((member: any, index: number) => (
                              <Grid item xs={12} md={6} key={index}>
                                <Box sx={{ 
                                  p: 1.5, 
                                  backgroundColor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255, 255, 255, 0.05)' 
                                    : 'white', 
                                  borderRadius: 1,
                                  border: theme.palette.mode === 'dark' 
                                    ? '1px solid rgba(76, 175, 80, 0.3)' 
                                    : '1px solid #c8e6c9',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 1
                                }}>
                                  <Avatar sx={{ width: 24, height: 24, bgcolor: 'success.main', fontSize: '0.7rem' }}>
                                    {member.name?.charAt(0) || '👤'}
                                  </Avatar>
                                  <Box sx={{ flex: 1 }}>
                                    <Typography variant="caption" sx={{ fontWeight: 'bold', display: 'block' }}>
                                      {member.name}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                      {member.userType} • {member.phoneNumber}
                                    </Typography>
                                    <Typography variant="caption" sx={{ color: 'success.main', display: 'block' }}>
                                      🔧 {member.roles}
                                    </Typography>
                                  </Box>
                                  <Chip 
                                    label={member.rolesCount}
                                    color="success"
                                    size="small"
                                    sx={{ height: '18px', fontSize: '0.6rem' }}
                                  />
                                </Box>
                              </Grid>
                            ))}
                          </Grid>
                        </Box>
                      )}
                      
                      <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Chip 
                          label="فريق العمل الفعلي في هذا المشروع فقط"
                          color="success"
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                  )}

                                    <Alert severity="info" sx={{ mb: 3 }}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography variant="body2" sx={{ fontWeight: 'bold' }}>
                        🆕 النظام الهرمي الجديد المحدث:
                      </Typography>
                      <Typography variant="body2">
                        • المراحل الرئيسية: من جدول <strong>StagesCUST</strong> (عمود StageName)
                      </Typography>
                      <Typography variant="body2">
                        • المراحل الفرعية: من جدول <strong>StagesSub</strong> (مرتبطة بـ StagHOMID)
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'primary.main', fontWeight: 'bold' }}>
                        • الملاحظات: من جدول <strong>StageNotes</strong> (مُنسبة للمراحل الرئيسية بـ StagHOMID)
                      </Typography>
                      <Typography variant="body2" sx={{ color: 'success.main', fontWeight: 'bold' }}>
                        • المسؤولين: من جدول <strong>usersCompany</strong> (ربط تلقائي للأسماء والأدوار)
                      </Typography>
                    </Box>
                  </Alert>
                  
                  <Grid container spacing={3}>
                    {stagesNotesData.mainStages.map((mainStage: any, mainIndex: number) => (
                      <Grid item xs={12} key={mainIndex}>
                        <Card sx={{ 
                          border: '2px solid #e0e0e0',
                          borderRadius: 3,
                          boxShadow: 3,
                          overflow: 'hidden'
                        }}>
                          {/* رأس المرحلة الرئيسية */}
                          <Box sx={{ 
                            background: `linear-gradient(135deg, ${getMainStageColor(mainStage.categoryName)} 0%, ${getMainStageColor(mainStage.categoryName)}88 100%)`,
                            color: 'white',
                            p: 3,
                            cursor: 'pointer',
                            transition: 'all 0.2s ease-in-out',
                            '&:hover': {
                              background: `linear-gradient(135deg, ${getMainStageColor(mainStage.categoryName)}dd 0%, ${getMainStageColor(mainStage.categoryName)}aa 100%)`,
                            }
                          }}
                          onClick={() => toggleMainStageCollapse(mainIndex)}
                          >
                            <Grid container spacing={2} alignItems="center">
                              <Grid item xs={12} md={1} sx={{ textAlign: 'center' }}>
                                <IconButton
                                  sx={{ 
                                    color: 'white',
                                    backgroundColor: 'rgba(255,255,255,0.2)',
                                    '&:hover': { backgroundColor: 'rgba(255,255,255,0.3)' }
                                  }}
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    toggleMainStageCollapse(mainIndex);
                                  }}
                                >
                                  {collapsedMainStages.has(mainIndex) ? '📁' : '📂'}
                                </IconButton>
                              </Grid>
                              <Grid item xs={12} md={7}>
                                <Typography variant="h5" sx={{ fontWeight: 'bold', mb: 1 }}>
                                  🏗️ {mainStage.categoryName}
                                </Typography>
                                
                                {/* معلومات المرحلة الرئيسية من StagesCUST */}
                                {mainStage.mainStageInfo && (
                                  <Box sx={{ display: 'flex', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                    <Chip
                                      label={`رمز: ${mainStage.mainStageInfo.stageCode || 'غير محدد'}`}
                                      size="small"
                                      sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'primary.contrastText' }}
                                    />
                                    {mainStage.mainStageInfo.type && (
                                      <Chip
                                        label={`نوع: ${mainStage.mainStageInfo.type}`}
                                        size="small"
                                        sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'primary.contrastText' }}
                                      />
                                    )}
                                    {mainStage.mainStageInfo.estimatedDays && (
                                      <Chip
                                        label={`مدة مقدرة: ${mainStage.mainStageInfo.estimatedDays} يوم`}
                                        size="small"
                                        sx={{ backgroundColor: 'rgba(255,255,255,0.2)', color: 'primary.contrastText' }}
                                      />
                                    )}
                                    <Chip
                                      label={mainStage.mainStageInfo.isCompleted === 'true' ? 'مرحلة رئيسية مكتملة' : 'قيد التنفيذ'}
                                      size="small"
                                      sx={{ 
                                        backgroundColor: mainStage.mainStageInfo.isCompleted === 'true' ? 'success.main' : 'warning.main',
                                        color: mainStage.mainStageInfo.isCompleted === 'true' ? 'success.contrastText' : 'warning.contrastText',
                                        fontWeight: 'bold',
                                        boxShadow: mainStage.mainStageInfo.isCompleted === 'true' 
                                          ? '0 2px 6px rgba(76, 175, 80, 0.5)' 
                                          : '0 2px 6px rgba(255, 152, 0, 0.5)',
                                        '&:hover': {
                                          backgroundColor: mainStage.mainStageInfo.isCompleted === 'true' ? '#45a049' : '#f57c00',
                                          transform: 'translateY(-1px)',
                                          boxShadow: mainStage.mainStageInfo.isCompleted === 'true' 
                                            ? '0 4px 8px rgba(76, 175, 80, 0.6)' 
                                            : '0 4px 8px rgba(255, 152, 0, 0.6)'
                                        }
                                      }}
                                    />
                                  </Box>
                                )}
                                
                                {/* معلومات التواريخ */}
                                {(mainStage.mainStageInfo?.formattedStartDate || mainStage.mainStageInfo?.formattedEndDate) && (
                                  <Box sx={{ display: 'flex', gap: 2, mb: 1, flexWrap: 'wrap', fontSize: '0.85rem' }}>
                                    {mainStage.mainStageInfo.formattedStartDate && (
                                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                        📅 بدء: {mainStage.mainStageInfo.formattedStartDate}
                                      </Typography>
                                    )}
                                    {mainStage.mainStageInfo.formattedEndDate && (
                                      <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.9)' }}>
                                        📅 انتهاء: {mainStage.mainStageInfo.formattedEndDate}
                                      </Typography>
                                    )}
                                    {mainStage.mainStageInfo.formattedCloseDate && (
                                      <Typography variant="caption" sx={{ color: '#4caf50' }}>
                                        ✅ أُغلقت: {mainStage.mainStageInfo.formattedCloseDate}
                                      </Typography>
                                    )}
                                  </Box>
                                )}

                                <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap' }}>
                                  <Typography variant="body1">
                                    📊 {mainStage.statistics.completedSubStages}/{mainStage.statistics.totalSubStages} مكتمل
                                  </Typography>
                                  <Typography variant="body1">
                                    📝 {mainStage.statistics.totalNotes} ملاحظة
                                  </Typography>
                                  {mainStage.statistics.totalDelayDays > 0 && (
                                    <Typography variant="body1" sx={{ color: '#ffeb3b' }}>
                                      ⚠️ تأخير {mainStage.statistics.totalDelayDays} يوم
                                    </Typography>
                                  )}
                                </Box>
                              </Grid>
                              <Grid item xs={12} md={4} sx={{ textAlign: 'center' }}>
                                <CircularProgress
                                  variant="determinate"
                                  value={mainStage.statistics.completionPercentage}
                                  size={80}
                                  thickness={6}
                                  sx={{ color: 'primary.contrastText', mb: 1 }}
                                />
                                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                                  {(mainStage.statistics.completionPercentage || 0).toFixed(2)}% مكتمل
                                </Typography>
                                <Typography variant="body2" sx={{ opacity: 0.9 }}>
                                  متوسط التقدم: {(mainStage.statistics.averageProgress || 0).toFixed(2)}%
                                </Typography>
                              </Grid>
                            </Grid>
                          </Box>

                          {/* المراحل الفرعية */}
                          <Collapse in={!collapsedMainStages.has(mainIndex)} timeout="auto" unmountOnExit>
                            <CardContent sx={{ p: 0 }}>
                              {/* معلومات المسؤول عن المرحلة الرئيسية - من قاعدة البيانات فقط */}
                              {(mainStage.mainStageInfo?.openedByInfo || mainStage.mainStageInfo?.closedByInfo) && (
                                <Box sx={{ 
                                  p: 2, 
                                  backgroundColor: theme.palette.mode === 'dark' 
                                    ? 'rgba(33, 150, 243, 0.1)' 
                                    : '#e3f2fd', 
                                  borderBottom: theme.palette.mode === 'dark' 
                                    ? '1px solid rgba(33, 150, 243, 0.3)' 
                                    : '1px solid #bbdefb'
                                }}>
                                  <Typography variant="body2" sx={{ fontWeight: 'bold', color: 'primary.main', mb: 1 }}>
                                    👨‍💼 معلومات المسؤولين:
                                  </Typography>
                                  {mainStage.mainStageInfo.openedByInfo && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        تم فتحها بواسطة: {mainStage.mainStageInfo.openedByInfo.displayName}
                                      </Typography>
                                      <Chip 
                                        label={mainStage.mainStageInfo.openedByInfo.isRegistered ? "مسجل" : "خارجي"}
                                        color={mainStage.mainStageInfo.openedByInfo.isRegistered ? "success" : "default"}
                                        size="small"
                                      />
                                    </Box>
                                  )}
                                  {mainStage.mainStageInfo.closedByInfo && (
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                        تم إغلاقها بواسطة: {mainStage.mainStageInfo.closedByInfo.displayName}
                                      </Typography>
                                      <Chip 
                                        label={mainStage.mainStageInfo.closedByInfo.isRegistered ? "مسجل" : "خارجي"}
                                        color={mainStage.mainStageInfo.closedByInfo.isRegistered ? "success" : "default"}
                                        size="small"
                                      />
                                    </Box>
                                  )}
                                </Box>
                              )}

                              {/* أزرار التحكم في عدد المراحل الفرعية */}
                              {mainStage.subStages && mainStage.subStages.length > 0 && (
                                <Box sx={{ 
                                  p: 2, 
                                  backgroundColor: theme.palette.mode === 'dark' 
                                    ? 'rgba(255, 255, 255, 0.05)' 
                                    : 'rgba(0, 0, 0, 0.03)', 
                                  borderBottom: theme.palette.mode === 'dark' 
                                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                                    : '1px solid rgba(0, 0, 0, 0.1)',
                                  display: 'flex',
                                  justifyContent: 'space-between',
                                  alignItems: 'center',
                                  border: theme.palette.mode === 'dark' 
                                    ? '1px solid rgba(255, 255, 255, 0.1)' 
                                    : '1px solid rgba(0, 0, 0, 0.1)',
                                  borderRadius: 2,
                                  backdropFilter: 'blur(10px)',
                                  boxShadow: theme.palette.mode === 'dark' 
                                    ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
                                    : '0 2px 8px rgba(0, 0, 0, 0.1)'
                                }}>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                    <Typography variant="subtitle2" sx={{ 
                                      color: theme.palette.mode === 'dark' ? '#e3f2fd' : 'text.primary', 
                                      fontWeight: 'bold',
                                      textShadow: theme.palette.mode === 'dark' 
                                        ? '0 1px 2px rgba(0, 0, 0, 0.5)' 
                                        : 'none'
                                    }}>
                                      🔧 عدد المراحل الفرعية المعروضة:
                                    </Typography>
                                    <Box sx={{ display: 'flex', gap: 1 }}>
                                      <Button
                                        variant={getSubStagesLimit(mainIndex) === 5 ? "contained" : "outlined"}
                                        size="small"
                                        onClick={() => setSubStagesLimit(mainIndex, 5)}
                                        sx={{ 
                                          minWidth: '40px',
                                          fontSize: '0.75rem',
                                          boxShadow: getSubStagesLimit(mainIndex) === 5 
                                            ? '0 2px 4px rgba(33, 150, 243, 0.3)' 
                                            : 'none'
                                        }}
                                      >
                                        5
                                      </Button>
                                      <Button
                                        variant={getSubStagesLimit(mainIndex) === 10 ? "contained" : "outlined"}
                                        size="small"
                                        onClick={() => setSubStagesLimit(mainIndex, 10)}
                                        sx={{ 
                                          minWidth: '40px',
                                          fontSize: '0.75rem',
                                          boxShadow: getSubStagesLimit(mainIndex) === 10 
                                            ? '0 2px 4px rgba(33, 150, 243, 0.3)' 
                                            : 'none'
                                        }}
                                      >
                                        10
                                      </Button>
                                    </Box>
                                  </Box>
                                  <Typography variant="caption" sx={{
                                    color: theme.palette.mode === 'dark' 
                                      ? 'rgba(255, 255, 255, 0.7)' 
                                      : 'text.secondary',
                                    fontWeight: 'medium',
                                    backgroundColor: theme.palette.mode === 'dark' 
                                      ? 'rgba(33, 150, 243, 0.1)' 
                                      : 'rgba(33, 150, 243, 0.05)',
                                    px: 1.5,
                                    py: 0.5,
                                    borderRadius: 1,
                                    border: theme.palette.mode === 'dark' 
                                      ? '1px solid rgba(33, 150, 243, 0.3)' 
                                      : '1px solid rgba(33, 150, 243, 0.2)',
                                    textShadow: theme.palette.mode === 'dark' 
                                      ? '0 1px 2px rgba(0, 0, 0, 0.5)' 
                                      : 'none'
                                  }}>
                                    عرض {Math.min(getSubStagesLimit(mainIndex), mainStage.subStages.length)} من {mainStage.subStages.length} مرحلة فرعية
                                  </Typography>
                                </Box>
                              )}
                              
                              {mainStage.subStages.slice(0, getSubStagesLimit(mainIndex)).map((subStage: any, subIndex: number) => (
                                <Box key={subStage.id} sx={{ 
                                  borderBottom: subIndex < getSubStagesLimit(mainIndex) - 1 
                                    ? theme.palette.mode === 'dark' 
                                      ? '1px solid rgba(255, 255, 255, 0.1)' 
                                      : '1px solid rgba(0, 0, 0, 0.1)' 
                                    : 'none',
                                  p: 3,
                                  '&:hover': { 
                                    backgroundColor: theme.palette.mode === 'dark' 
                                      ? 'rgba(255, 255, 255, 0.05)' 
                                      : 'rgba(0, 0, 0, 0.03)',
                                    transform: 'translateX(4px)',
                                    boxShadow: theme.palette.mode === 'dark' 
                                      ? '0 2px 8px rgba(0, 0, 0, 0.3)' 
                                      : '0 2px 8px rgba(0, 0, 0, 0.1)'
                                  },
                                  transition: 'all 0.2s ease-in-out'
                                }}>
                                <Grid container spacing={2}>
                                  <Grid item xs={12} md={8}>
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                                      <Typography variant="h6" color="primary" sx={{ fontWeight: 'bold' }}>
                                        🔹 {subStage.name || 'مرحلة فرعية غير محددة'}
                                      </Typography>
                                      <Chip
                                        label={subStage.stageType === 'regular' ? 'عادية' : 'مخصصة'}
                                        size="small"
                                        sx={{
                                                                                      backgroundColor: subStage.stageType === 'regular' ? 'grey.300' : 'secondary.main',
                                          color: subStage.stageType === 'regular' ? 'text.secondary' : 'primary.contrastText',
                                          fontWeight: 'bold',
                                          boxShadow: subStage.stageType === 'regular' ? 'none' : '0 2px 4px rgba(156, 39, 176, 0.3)',
                                          border: subStage.stageType === 'regular' ? '1px solid #bdbdbd' : 'none',
                                          '&:hover': {
                                            backgroundColor: subStage.stageType === 'regular' ? '#d5d5d5' : '#7b1fa2'
                                          }
                                        }}
                                      />
                                      <Chip
                                        label={subStage.isCompleted === 'true' ? 'مكتملة' : 'قيد التنفيذ'}
                                        size="small"
                                        sx={{
                                          backgroundColor: subStage.isCompleted === 'true' ? 'success.main' : 'warning.main',
                                          color: subStage.isCompleted === 'true' ? 'success.contrastText' : 'warning.contrastText',
                                          fontWeight: 'bold',
                                          boxShadow: subStage.isCompleted === 'true' 
                                            ? '0 2px 4px rgba(76, 175, 80, 0.4)' 
                                            : '0 2px 4px rgba(255, 152, 0, 0.4)',
                                          '&:hover': {
                                            backgroundColor: subStage.isCompleted === 'true' ? '#45a049' : '#f57c00'
                                          }
                                        }}
                                      />
                                    </Box>

                                    {/* معلومات المسؤول عن المرحلة الفرعية - من قاعدة البيانات الحقيقية */}
                                    {subStage.responsibleInfo && (
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        gap: 1,
                                        mb: 2,
                                        p: 1.5,
                                        backgroundColor: theme.palette.mode === 'dark'
                                          ? (subStage.responsibleInfo.isRegistered ? 'rgba(76, 175, 80, 0.1)' : 'rgba(255, 152, 0, 0.1)')
                                          : (subStage.responsibleInfo.isRegistered ? 'info.light' : 'warning.light'),
                                        borderRadius: 1,
                                        border: `1px solid ${subStage.responsibleInfo.isRegistered ? '#e3f2fd' : '#ffcc02'}`
                                      }}>
                                        <Avatar sx={{ 
                                          width: 28, 
                                          height: 28, 
                                          bgcolor: subStage.responsibleInfo.isRegistered ? 'success.main' : 'warning.main', 
                                          fontSize: '0.7rem' 
                                        }}>
                                          {subStage.responsibleInfo.displayName?.charAt(0) || '👤'}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                          <Typography variant="caption" sx={{ 
                                            fontWeight: 'bold', 
                                            color: subStage.responsibleInfo.isRegistered ? 'success.main' : 'warning.main',
                                            display: 'block'
                                          }}>
                                            👨‍🔧 المسؤول: {subStage.responsibleInfo.displayName}
                                          </Typography>
                                          {subStage.responsibleInfo.userType && (
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                              🔖 {subStage.responsibleInfo.userType}
                                            </Typography>
                                          )}
                                          {subStage.responsibleInfo.phoneNumber && (
                                            <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                              📞 {subStage.responsibleInfo.phoneNumber}
                                            </Typography>
                                          )}
                                        </Box>
                                        <Chip 
                                          label={subStage.responsibleInfo.isRegistered ? "مؤكد" : "خارجي"}
                                          color={subStage.responsibleInfo.isRegistered ? "success" : "warning"}
                                          size="small"
                                          sx={{ height: '20px', fontSize: '0.65rem' }}
                                        />
                                      </Box>
                                    )}
                                    
                                    {/* عرض بديل إذا لم يتم العثور على مسؤول */}
                                    {!subStage.responsibleInfo && subStage.responsibleUser && (
                                      <Box sx={{ 
                                        display: 'flex', 
                                        alignItems: 'center',
                                        gap: 1,
                                        mb: 2,
                                        p: 1.5,
                                        backgroundColor: theme.palette.mode === 'dark' 
                                          ? 'rgba(255, 255, 255, 0.05)' 
                                          : 'rgba(0, 0, 0, 0.03)',
                                        borderRadius: 1,
                                        border: theme.palette.mode === 'dark' 
                                          ? '1px solid rgba(255, 255, 255, 0.1)' 
                                          : '1px solid rgba(0, 0, 0, 0.1)'
                                      }}>
                                        <Avatar sx={{ width: 24, height: 24, bgcolor: 'grey.500', fontSize: '0.7rem' }}>
                                          {subStage.responsibleUser.charAt(0) || '👤'}
                                        </Avatar>
                                        <Box sx={{ flex: 1 }}>
                                          <Typography variant="caption" sx={{ fontWeight: 'bold', color: 'text.secondary' }}>
                                            👨‍🔧 المسؤول: {subStage.responsibleUser}
                                          </Typography>
                                        </Box>
                                        <Chip 
                                          label="غير مؤكد"
                                          color="default"
                                          size="small"
                                          sx={{ height: '18px', fontSize: '0.6rem' }}
                                        />
                                      </Box>
                                    )}
                                    
                                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                      🔢 رمز المرحلة: {subStage.stageCode || 'غير محدد'}
                                    </Typography>
                                    
                                    {subStage.formattedStartDate && (
                                      <Typography variant="body2" color="text.secondary">
                                        📅 من {subStage.formattedStartDate} إلى {subStage.formattedEndDate || 'مفتوح'}
                                      </Typography>
                                    )}
                                    
                                    {subStage.formattedCloseDate && (
                                      <Typography variant="body2" color="success.main" sx={{ fontWeight: 'bold' }}>
                                        تم الإنتهاء في: {subStage.formattedCloseDate}
                                      </Typography>
                                    )}

                                    {subStage.estimatedDuration && (
                                      <Typography variant="body2" color="text.secondary">
                                        ⏱️ المدة المقدرة: {subStage.estimatedDuration} يوم
                                      </Typography>
                                    )}
                                  </Grid>
                                  
                                  <Grid item xs={12} md={4}>
                                    <Box sx={{ textAlign: 'center' }}>
                                      <CircularProgress
                                        variant="determinate"
                                        value={subStage.progress || 0}
                                        size={60}
                                        thickness={4}
                                        sx={{
                                          color: subStage.isCompleted === 'true' ? '#4caf50' : subStage.progress > 50 ? '#ff9800' : '#2196f3'
                                        }}
                                      />
                                      <Typography variant="h6" sx={{ mt: 1 }}>
                                        {(subStage.progress || 0).toFixed(2)}%
                                      </Typography>
                                      
                                      <Box sx={{ mt: 1, display: 'flex', gap: 0.5, justifyContent: 'center', flexWrap: 'wrap' }}>
                                        <Chip
                                          label={subStage.isCompleted === 'true' ? 'مكتملة' : 'قيد التنفيذ'}
                                          size="small"
                                          sx={{
                                            backgroundColor: subStage.isCompleted === 'true' ? 'success.main' : 'warning.main',
                                            color: subStage.isCompleted === 'true' ? 'success.contrastText' : 'warning.contrastText',
                                            fontWeight: 'bold',
                                            boxShadow: subStage.isCompleted === 'true' 
                                              ? '0 2px 4px rgba(76, 175, 80, 0.4)' 
                                              : '0 2px 4px rgba(255, 152, 0, 0.4)',
                                            '&:hover': {
                                              backgroundColor: subStage.isCompleted === 'true' ? '#45a049' : '#f57c00'
                                            }
                                          }}
                                        />
                                      </Box>
                                    </Box>
                                  </Grid>
                                </Grid>


                                </Box>
                              ))}
                              
                              {/* زر عرض المزيد من المراحل الفرعية */}
                              {mainStage.subStages && mainStage.subStages.length > getSubStagesLimit(mainIndex) && (
                                <Box sx={{ 
                                  p: 2, 
                                  textAlign: 'center', 
                                  backgroundColor: theme.palette.mode === 'dark' 
                                    ? 'rgba(33, 150, 243, 0.1)' 
                                    : 'rgba(33, 150, 243, 0.05)',
                                  borderTop: theme.palette.mode === 'dark' 
                                    ? '1px solid rgba(33, 150, 243, 0.3)' 
                                    : '1px solid rgba(33, 150, 243, 0.2)',
                                  border: theme.palette.mode === 'dark' 
                                    ? '1px solid rgba(33, 150, 243, 0.3)' 
                                    : '1px solid rgba(33, 150, 243, 0.2)',
                                  borderRadius: '0 0 8px 8px',
                                  backdropFilter: 'blur(10px)'
                                }}>
                                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                                    يوجد {mainStage.subStages.length - getSubStagesLimit(mainIndex)} مرحلة فرعية إضافية
                                  </Typography>
                                  <Button
                                    variant="outlined"
                                    size="small"
                                    onClick={() => setSubStagesLimit(mainIndex, mainStage.subStages.length)}
                                    sx={{ mr: 1 }}
                                  >
                                    عرض الكل ({mainStage.subStages.length})
                                  </Button>
                                  <Button
                                    variant="text"
                                    size="small"
                                    onClick={() => setSubStagesLimit(mainIndex, 5)}
                                  >
                                    إخفاء الزائد
                                  </Button>
                                </Box>
                              )}
                              
                              {/* ملاحظات المرحلة الرئيسية من StageNotes */}
                              {mainStage.mainStageNotes && mainStage.mainStageNotes.length > 0 && (
                                <Box sx={{ 
                                  mt: 2, 
                                  p: 2, 
                                  backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : '#fff3e0', 
                                  borderRadius: 2,
                                  border: `1px solid ${theme.palette.warning.main}`,
                                  borderTop: `4px solid ${theme.palette.warning.main}`
                                }}>
                                  <Box sx={{ 
                                    display: 'flex', 
                                    justifyContent: 'space-between', 
                                    alignItems: 'center',
                                    cursor: 'pointer',
                                    mb: 2,
                                    p: 1,
                                    borderRadius: 1,
                                                                          '&:hover': { backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : '#fff3e0' }
                                  }}
                                  onClick={() => toggleSubStageCollapse(`main-${mainIndex}`)}
                                  >
                                    <Typography variant="h6" sx={{ color: '#f57c00', display: 'flex', alignItems: 'center', gap: 1 }}>
                                      📝 ملاحظات المرحلة الرئيسية ({mainStage.mainStageNotes.length})
                                      <Chip 
                                        label="من StageNotes" 
                                        size="small" 
                                        color="warning" 
                                        variant="outlined"
                                      />
                                    </Typography>
                                    <IconButton
                                      size="small"
                                      sx={{ 
                                        color: '#f57c00',
                                        backgroundColor: 'rgba(245, 124, 0, 0.1)',
                                        '&:hover': { backgroundColor: 'rgba(245, 124, 0, 0.2)' }
                                      }}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        toggleSubStageCollapse(`main-${mainIndex}`);
                                      }}
                                    >
                                      {collapsedSubStages.has(`main-${mainIndex}`) ? '📝' : '📋'}
                                    </IconButton>
                                  </Box>
                                  
                                  <Collapse in={!collapsedSubStages.has(`main-${mainIndex}`)} timeout="auto" unmountOnExit>
                                    <Grid container spacing={2}>
                                      {mainStage.mainStageNotes.map((note: any, noteIndex: number) => (
                                        <Grid item xs={12} md={6} key={noteIndex}>
                                          <Card variant="outlined" sx={{ 
                                            p: 2,
                                            borderLeft: `4px solid ${note.priority === 'error' ? '#f44336' : note.priority === 'warning' ? '#ff9800' : '#2196f3'}`,
                                            backgroundColor: theme.palette.mode === 'dark' 
                                              ? 'rgba(255, 255, 255, 0.05)' 
                                              : 'white'
                                          }}>
                                            <Box sx={{ mb: 1 }}>
                                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1, flexWrap: 'wrap' }}>
                                                <Chip
                                                  label={note.displayType}
                                                  color={note.priority === 'error' ? 'error' : note.priority === 'warning' ? 'warning' : 'info'}
                                                  size="small"
                                                  sx={{ fontWeight: 'bold' }}
                                                />
                                                {note.hasDelay && (
                                                  <Chip
                                                    label={note.delayText}
                                                    color="error"
                                                    size="small"
                                                    variant="outlined"
                                                    icon={<Warning />}
                                                  />
                                                )}
                                                {note.hasAttachments && (
                                                  <Chip
                                                    label="مرفقات"
                                                    color="info"
                                                    size="small"
                                                    variant="outlined"
                                                  />
                                                )}
                                              </Box>
                                              <Typography variant="body2" sx={{ mb: 1, lineHeight: 1.6 }}>
                                                {note.content || 'لا يوجد محتوى'}
                                              </Typography>

                                              {/* معلومات المسؤول عن الملاحظة - من قاعدة البيانات فقط */}
                                              {note.recordedByInfo && (
                                                <Box sx={{ 
                                                  display: 'flex', 
                                                  alignItems: 'center', 
                                                  gap: 1, 
                                                  mt: 1,
                                                  p: 1,
                                                  backgroundColor: theme.palette.mode === 'dark' 
                                                    ? 'rgba(156, 39, 176, 0.1)' 
                                                    : 'rgba(156, 39, 176, 0.05)',
                                                  borderRadius: 1,
                                                  border: theme.palette.mode === 'dark' 
                                                    ? '1px solid rgba(156, 39, 176, 0.3)' 
                                                    : '1px solid rgba(156, 39, 176, 0.2)',
                                                  boxShadow: theme.palette.mode === 'dark' 
                                                    ? '0 2px 8px rgba(156, 39, 176, 0.2)' 
                                                    : '0 2px 8px rgba(156, 39, 176, 0.1)'
                                                }}>
                                                  <Avatar sx={{ width: 20, height: 20, bgcolor: 'secondary.main', fontSize: '0.6rem' }}>
                                                    {note.recordedByInfo.displayName?.charAt(0) || '👤'}
                                                  </Avatar>
                                                  <Box sx={{ flex: 1 }}>
                                                    <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                                      {note.recordedByInfo.displayName}
                                                    </Typography>
                                                    <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                                      {note.recordedByInfo.userType && `${note.recordedByInfo.userType} • `}📅 {note.formattedDate}
                                              </Typography>
                                                  </Box>
                                                  <Chip 
                                                    label={note.recordedByInfo.isRegistered ? "مسجل" : "خارجي"}
                                                    color={note.recordedByInfo.isRegistered ? "success" : "default"}
                                                    size="small"
                                                    sx={{ height: '18px', fontSize: '0.6rem' }}
                                                  />
                                                </Box>
                                              )}
                                              {!note.recordedByInfo && note.recordedBy && (
                                                <Box sx={{ 
                                                  mt: 1,
                                                  p: 1,
                                                  backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : '#fff3e0',
                                                  borderRadius: 1
                                                }}>
                                                  <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                                    📅 {note.formattedDate} • مسجل بواسطة: {note.recordedBy} (غير مسجل في النظام)
                                                  </Typography>
                                                </Box>
                                              )}
                                            </Box>
                                          </Card>
                                        </Grid>
                                      ))}
                                    </Grid>
                                  </Collapse>
                                </Box>
                              )}
                              
                              {/* ملاحظات المرحلة الرئيسية من StagesCUST */}
                              {mainStage.mainStageInfo && (mainStage.mainStageInfo.hasOpenNotes || mainStage.mainStageInfo.hasCloseNotes) && (
                                <Box sx={{ 
                                  mt: 2, 
                                  p: 2, 
                                  backgroundColor: theme.palette.mode === 'dark' 
                                    ? 'rgba(76, 175, 80, 0.1)' 
                                    : 'rgba(76, 175, 80, 0.08)', 
                                  borderRadius: 2,
                                  border: theme.palette.mode === 'dark' 
                                    ? '1px solid rgba(76, 175, 80, 0.3)' 
                                    : '1px solid #4caf50',
                                  borderTop: theme.palette.mode === 'dark' 
                                    ? '4px solid rgba(76, 175, 80, 0.6)' 
                                    : '4px solid #4caf50',
                                  boxShadow: theme.palette.mode === 'dark' 
                                    ? '0 2px 8px rgba(76, 175, 80, 0.2)' 
                                    : '0 2px 8px rgba(76, 175, 80, 0.1)'
                                }}>
                                  <Typography variant="h6" sx={{ mb: 2, color: '#2e7d32', display: 'flex', alignItems: 'center', gap: 1 }}>
                                    🏗️ ملاحظات المرحلة الرئيسية
                                    <Chip 
                                      label="من StagesCUST" 
                                      size="small" 
                                      color="success" 
                                      variant="outlined"
                                    />
                                  </Typography>
                                  
                                  <Grid container spacing={2}>
                                    {mainStage.mainStageInfo.hasOpenNotes && (
                                      <Grid item xs={12} md={6}>
                                        <Card variant="outlined" sx={{ 
                                          p: 2, 
                                          backgroundColor: theme.palette.mode === 'dark' 
                                            ? 'rgba(255, 255, 255, 0.05)' 
                                            : 'white' 
                                        }}>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#1976d2', mb: 1 }}>
                                            📝 ملاحظات البدء
                                          </Typography>
                                          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                            {mainStage.mainStageInfo.openNotes}
                                          </Typography>
                                        </Card>
                                      </Grid>
                                    )}
                                    
                                    {mainStage.mainStageInfo.hasCloseNotes && (
                                      <Grid item xs={12} md={6}>
                                        <Card variant="outlined" sx={{ 
                                          p: 2, 
                                          backgroundColor: theme.palette.mode === 'dark' 
                                            ? 'rgba(255, 255, 255, 0.05)' 
                                            : 'white' 
                                        }}>
                                          <Typography variant="subtitle2" sx={{ fontWeight: 'bold', color: '#2e7d32', mb: 1 }}>
                                            ✅ ملاحظات الإغلاق
                                          </Typography>
                                          <Typography variant="body2" sx={{ lineHeight: 1.6 }}>
                                            {mainStage.mainStageInfo.closeNotes}
                                          </Typography>
                                        </Card>
                                      </Grid>
                                    )}
                                  </Grid>
                                </Box>
                              )}
                            </CardContent>
                          </Collapse>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>

                  {/* نظام الصفحات للمراحل */}
                  {stagesNotesData.pagination?.totalPages > 1 && (
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
                      <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                        <Button
                          variant="outlined"
                          size="small"
                          disabled={!stagesNotesData.pagination.hasPrevPage}
                          onClick={() => setStagesPage(stagesPage - 1)}
                        >
                          السابق
                        </Button>
                        
                        <Typography variant="body2" sx={{ mx: 2 }}>
                          الصفحة {stagesNotesData.pagination.currentPage} من {stagesNotesData.pagination.totalPages}
                        </Typography>

                        <Button
                          variant="outlined"
                          size="small"
                          disabled={!stagesNotesData.pagination.hasNextPage}
                          onClick={() => setStagesPage(stagesPage + 1)}
                        >
                          التالي
                        </Button>
                      </Box>
                    </Box>
                  )}
                </>
              ) : (
                <Box sx={{ textAlign: 'center', py: 4 }}>
                  <Engineering sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                  <Typography variant="h6" color="text.secondary" gutterBottom>
                    لا توجد مراحل متاحة
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    لم يتم العثور على مراحل لهذا المشروع وفقاً للفلترة المحددة
                  </Typography>
                </Box>
              )}

              {/* الملاحظات العامة */}
              {stagesNotesData.generalNotes && stagesNotesData.generalNotes.length > 0 && (
                <Box sx={{ mt: 4 }}>
                  <Typography variant="h6" gutterBottom>
                    📄 الملاحظات العامة ({stagesNotesData.generalNotes.length})
                  </Typography>
                  <Grid container spacing={2}>
                    {stagesNotesData.generalNotes.map((note: any, index: number) => (
                      <Grid item xs={12} md={6} key={index}>
                        <Card variant="outlined">
                          <CardContent>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
                              <Chip
                                label={note.displayType}
                                color={note.priority === 'error' ? 'error' : note.priority === 'warning' ? 'warning' : 'info'}
                                size="small"
                              />
                              <Typography variant="caption" color="text.secondary">
                                📅 {note.formattedDate}
                              </Typography>
                            </Box>
                            <Typography variant="body2" sx={{ mb: 1 }}>
                              {note.content || 'لا يوجد محتوى'}
                            </Typography>
                            
                            {/* معلومات المسؤول عن الملاحظة العامة - من قاعدة البيانات فقط */}
                            {note.recordedByInfo && (
                              <Box sx={{ 
                                display: 'flex', 
                                alignItems: 'center', 
                                gap: 1, 
                                mt: 1,
                                p: 1,
                                backgroundColor: theme.palette.mode === 'dark' 
                                  ? 'rgba(33, 150, 243, 0.1)' 
                                  : 'rgba(33, 150, 243, 0.05)',
                                borderRadius: 1,
                                border: theme.palette.mode === 'dark' 
                                  ? '1px solid rgba(33, 150, 243, 0.3)' 
                                  : '1px solid rgba(33, 150, 243, 0.2)',
                                boxShadow: theme.palette.mode === 'dark' 
                                  ? '0 2px 8px rgba(33, 150, 243, 0.2)' 
                                  : '0 2px 8px rgba(33, 150, 243, 0.1)'
                              }}>
                                <Avatar sx={{ width: 20, height: 20, bgcolor: 'info.main', fontSize: '0.6rem' }}>
                                  {note.recordedByInfo.displayName?.charAt(0) || '👤'}
                                </Avatar>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="caption" sx={{ fontWeight: 'bold' }}>
                                    {note.recordedByInfo.displayName}
                            </Typography>
                                  <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block' }}>
                                    {note.recordedByInfo.userType || 'غير محدد'}
                                  </Typography>
                                </Box>
                                <Chip 
                                  label={note.recordedByInfo.isRegistered ? "مسجل" : "خارجي"}
                                  color={note.recordedByInfo.isRegistered ? "success" : "default"}
                                  size="small"
                                  sx={{ height: '18px', fontSize: '0.6rem' }}
                                />
                              </Box>
                            )}
                            {!note.recordedByInfo && note.recordedBy && (
                              <Box sx={{ 
                                mt: 1,
                                p: 1,
                                backgroundColor: theme.palette.mode === 'dark' ? 'grey.800' : '#fff3e0',
                                borderRadius: 1
                              }}>
                                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                                  مسجل بواسطة: {note.recordedBy} (غير مسجل في النظام)
                                </Typography>
                              </Box>
                            )}
                            {note.hasDelay && (
                              <Chip
                                label={note.delayText}
                                color="error"
                                size="small"
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            )}
                            {note.hasAttachments && (
                              <Chip
                                label="مرفقات"
                                color="info"
                                size="small"
                                variant="outlined"
                                sx={{ ml: 1 }}
                              />
                            )}
                          </CardContent>
                        </Card>
                      </Grid>
                    ))}
                  </Grid>
                </Box>
              )}
            </>
          )}
        </TabPanel>
      </Card>

      {/* نافذة تفاصيل الزيارة */}
      <Dialog open={visitDialogOpen} onClose={() => setVisitDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Engineering />
            تفاصيل الملاحظة
          </Box>
        </DialogTitle>
        <DialogContent sx={{ mt: 2 }}>
          {selectedVisit && (
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Card sx={{ p: 2, bgcolor: 'grey.50' }}>
                  <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                    <Engineering color="primary" />
                    {selectedVisit.displayTitle || selectedVisit.visitType || 'ملاحظة'}
                    <Chip
                      label={selectedVisit.status || 'ملاحظة'}
                      color={getStatusColor(selectedVisit.status) as any}
                      size="small"
                    />
                    {selectedVisit.isActualQualityVisit && (
                      <Chip
                        label="جودة فعلية"
                        color="success"
                        size="small"
                        variant="outlined"
                      />
                    )}
                  </Typography>
                </Card>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <strong>👤 المسجل:</strong> {selectedVisit.inspector || 'غير محدد'}
                  {selectedVisit.isActualQualityVisit && (
                    <Chip label="فريق الجودة" color="success" size="small" variant="outlined" />
                  )}
                </Typography>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <Typography variant="body1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <strong>📅 التاريخ:</strong> {selectedVisit.formattedDate || (selectedVisit.visitDate ? new Date(selectedVisit.visitDate).toLocaleDateString('en-GB') : 'غير محدد')}
                </Typography>
              </Grid>

              {selectedVisit.stageId && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <strong>🏗️ رقم المرحلة:</strong> {selectedVisit.stageId}
                  </Typography>
                </Grid>
              )}

              {selectedVisit.updatedDate && (
                <Grid item xs={12} md={6}>
                  <Typography variant="body1" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <strong>🔄 آخر تحديث:</strong> {new Date(selectedVisit.updatedDate).toLocaleDateString('en-GB')}
                  </Typography>
                </Grid>
              )}

              {selectedVisit.hasDelay && (
                <Grid item xs={12}>
                  <Alert severity="warning" sx={{ display: 'flex', alignItems: 'center' }}>
                    <Typography>
                      ⚠️ تأخير في التنفيذ: {selectedVisit.delayDaysText}
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {selectedVisit.hasAttachments && (
                <Grid item xs={12}>
                  <Alert severity="info">
                    <Typography>
                      📎 تحتوي هذه الزيارة على مرفقات
                    </Typography>
                  </Alert>
                </Grid>
              )}

              {selectedVisit.notes && selectedVisit.notes !== 'لا توجد ملاحظات' && (
                <Grid item xs={12}>
                  <Card sx={{ p: 2, bgcolor: 'background.default' }}>
                    <Typography variant="body1" gutterBottom sx={{ fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: 1 }}>
                      📝 الملاحظات:
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}>
                      {selectedVisit.notes}
                    </Typography>
                  </Card>
                </Grid>
              )}
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setVisitDialogOpen(false)} variant="contained">
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectDetails; 
