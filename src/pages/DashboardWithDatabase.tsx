import React, { useState, useEffect } from 'react';
import { formatGregorianDate, formatGregorianDateTime } from '../utils/dateUtils';
import {
  Box,
  Grid,
  Card,
  CardContent,
  Typography,
  CircularProgress,
  Alert,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Chip,
  Button,
  IconButton,
  Divider,
  useTheme,
  LinearProgress,
  Badge,
  Tooltip
} from '@mui/material';
import {
  Business as BusinessIcon,
  AccountTree as AccountTreeIcon,
  Assignment as AssignmentIcon,
  TrendingUp as TrendingUpIcon,
  Refresh as RefreshIcon,
  ArrowForward as ArrowForwardIcon,
  Timeline as TimelineIcon,
  LocationOn as LocationIcon,
  People as PeopleIcon,
  Analytics as AnalyticsIcon,
  Assessment as AssessmentIcon,
  Speed as SpeedIcon,
  Star as StarIcon,
  CheckCircle as CheckCircleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  MonetizationOn as MonetizationOnIcon
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, Legend, ResponsiveContainer, LineChart, Line, Area, AreaChart } from 'recharts';

// استيراد APIs الحقيقية المفعلة حديثاً
import {
  fetchDashboardStats,
  fetchDashboardReports,
  fetchCompanies,
  formatDashboardCurrency,
  formatDashboardDate,
  formatProjectStatus,
  calculatePercentage
} from '../api';

// CSS للـ animations
const shimmerAnimation = `
  @keyframes shimmer {
    0% { transform: translateX(-100%); }
    100% { transform: translateX(100%); }
  }
  
  @keyframes glow {
    0%, 100% { box-shadow: 0 4px 20px rgba(103, 58, 183, 0.3); }
    50% { box-shadow: 0 8px 40px rgba(103, 58, 183, 0.6); }
  }
  
  @keyframes float {
    0%, 100% { transform: translateY(0px); }
    50% { transform: translateY(-10px); }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 1; }
    50% { opacity: 0.5; }
  }
  
  @keyframes bounce {
    0%, 20%, 53%, 80%, 100% { transform: translate3d(0,0,0); }
    40%, 43% { transform: translate3d(0,-10px,0); }
    70% { transform: translate3d(0,-5px,0); }
    90% { transform: translate3d(0,-2px,0); }
  }
  
  @keyframes slideInUp {
    from { transform: translateY(30px); opacity: 0; }
    to { transform: translateY(0); opacity: 1; }
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }
  
  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
  
  @keyframes pulse {
    0%, 100% { transform: scale(1); opacity: 1; }
    50% { transform: scale(1.2); opacity: 0.7; }
  }
`;

// إضافة الـ CSS للـ head
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = shimmerAnimation;
  document.head.appendChild(style);
}

interface DashboardStats {
  totalCompanies: number;
  totalSubs: number;
  totalProjects: number;
  activeProjects: number;
}

interface RecentCompany {
  id: number;
  name: string;
  subscriptionStart: string;
}

interface RecentProject {
  id: number;
  name: string;
  status: string;
  progress: number;
  companyName: string;
  subName: string;
}

interface DashboardData {
  overview: DashboardStats;
  recentCompanies: RecentCompany[];
  recentProjects: RecentProject[];
}

interface ReportsData {
  companiesByCity: { City: string; count: number }[];
  companies: any[];
  projects: any[];
  monthlyStats: {
    month: string;
    companies: number;
    subs: number;
    projects: number;
    totalRevenue: number;
  }[];
}

// مكون بطاقة إحصائية محسنة
const EnhancedStatCard = ({
  title,
  value,
  icon,
  color,
  bgColor,
  trend,
  subtitle,
  delay = 0
}: {
  title: string;
  value: number;
  icon: React.ReactNode;
  color: string;
  bgColor: string;
  trend?: number;
  subtitle?: string;
  delay?: number;
}) => {
  const theme = useTheme();

  return (
    <Card
      sx={{
        height: '100%',
        background: theme.palette.mode === 'dark'
          ? `linear-gradient(135deg, ${bgColor}15 0%, ${bgColor}25 100%)`
          : `linear-gradient(135deg, ${bgColor}08 0%, ${bgColor}20 100%)`,
        border: `1px solid ${color}30`,
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        position: 'relative',
        overflow: 'hidden',
        animation: `slideInUp 0.6s ease-out ${delay}s both`,
        '&:hover': {
          transform: 'translateY(-8px) scale(1.02)',
          boxShadow: theme.palette.mode === 'dark'
            ? `0 20px 40px ${color}40`
            : `0 20px 40px ${color}25`,
          '& .stat-icon': {
            animation: 'bounce 2s infinite'
          }
        },
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '2px',
          background: `linear-gradient(90deg, transparent, ${color}, transparent)`,
          animation: 'shimmer 2s infinite',
        }
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar
            className="stat-icon"
            sx={{
              bgcolor: color,
              mr: 2,
              width: 60,
              height: 60,
              boxShadow: `0 8px 25px ${color}40`,
              background: `linear-gradient(135deg, ${color} 0%, ${color}CC 100%)`
            }}
          >
            {icon}
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography
              variant="h3"
              component="div"
              sx={{
                fontWeight: 'bold',
                background: theme.palette.mode === 'dark'
                  ? `linear-gradient(135deg, ${theme.palette.text.primary} 0%, ${color} 100%)`
                  : `linear-gradient(135deg, ${color} 0%, ${theme.palette.text.primary} 100%)`,
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 0.5
              }}
            >
              {value.toLocaleString('en-GB')}
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 600,
                mb: 1
              }}
            >
              {title}
            </Typography>
            {subtitle && (
              <Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
                {subtitle}
              </Typography>
            )}
            {trend !== undefined && (
              <Box sx={{ display: 'flex', alignItems: 'center', mt: 1 }}>
                <TrendingUpIcon
                  sx={{
                    fontSize: 16,
                    color: trend > 0 ? '#4caf50' : '#f44336',
                    mr: 0.5
                  }}
                />
                <Typography
                  variant="caption"
                  sx={{
                    color: trend > 0 ? '#4caf50' : '#f44336',
                    fontWeight: 'bold'
                  }}
                >
                  {trend > 0 ? '+' : ''}{trend}%
                </Typography>
              </Box>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// مكون مخطط دائري محسن
const EnhancedPieChart = ({ data, title }: { data: any[], title: string }) => {
  const theme = useTheme();
  const modernColors = [
    '#FF6B6B', // أحمر حديث
    '#4ECDC4', // أخضر مائي
    '#45B7D1', // أزرق فاتح
    '#FFA07A', // برتقالي فاتح
    '#98D8C8', // أخضر نعناعي
    '#F7DC6F'  // أصفر ذهبي
  ];

  console.log('EnhancedPieChart data:', data);

  return (
    <Card sx={{
      height: '100%',
      background: theme.palette.mode === 'dark'
        ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)'
        : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)',
      border: theme.palette.mode === 'dark'
        ? '1px solid rgba(255,255,255,0.1)'
        : '1px solid rgba(0,0,0,0.05)',
      borderRadius: (theme) => theme.shape.borderRadius,
      boxShadow: theme.palette.mode === 'dark'
        ? '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
        : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      overflow: 'hidden',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #FF6B6B 0%, #4ECDC4 50%, #45B7D1 100%)',
      }
    }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{
            p: 1.5,
            borderRadius: (theme) => theme.shape.borderRadius,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            mr: 2
          }}>
            <AnalyticsIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)'
                : 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.1rem'
            }}
          >
            {title}
          </Typography>
        </Box>

        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <PieChart>
              <defs>
                {data.map((entry, index) => (
                  <linearGradient key={`gradient-${index}`} id={`gradient-${index}`} x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor={entry.color || modernColors[index % modernColors.length]} stopOpacity={1} />
                    <stop offset="100%" stopColor={entry.color || modernColors[index % modernColors.length]} stopOpacity={0.8} />
                  </linearGradient>
                ))}
              </defs>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={70}
                outerRadius={110}
                paddingAngle={3}
                dataKey="value"
                nameKey="name"
                stroke="none"
              >
                {data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={`url(#gradient-${index})`}
                  />
                ))}
              </Pie>
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
                  border: 'none',
                  borderRadius: theme.shape.borderRadius,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  color: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.text.primary,
                  padding: '12px 16px'
                }}
                formatter={(value, name) => [
                  <span style={{ color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit' }}>{`${value} ${value === 1 ? 'شركة' : 'شركات'}`}</span>,
                  <span style={{ color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit' }}>{name}</span>
                ]}
                labelFormatter={(label) => (
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit' }}>
                    {label}
                  </span>
                )}
              />
              <Legend
                wrapperStyle={{
                  paddingTop: '20px',
                  fontSize: '14px',
                  fontWeight: '500'
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{
            height: 320,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
            opacity: 0.7
          }}>
            <AnalyticsIcon sx={{ fontSize: 64, color: theme.palette.text.disabled }} />
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
              لا توجد بيانات للعرض
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

// مكون مخطط أعمدة محسن
const EnhancedBarChart = ({ data, title }: { data: any[], title: string }) => {
  const theme = useTheme();

  console.log('EnhancedBarChart data:', data);

  return (
    <Card sx={{
      height: '100%',
      background: theme.palette.mode === 'dark'
        ? 'linear-gradient(145deg, #1a1a1a 0%, #2d2d2d 50%, #1a1a1a 100%)'
        : 'linear-gradient(145deg, #ffffff 0%, #f8fafc 50%, #ffffff 100%)',
      border: theme.palette.mode === 'dark'
        ? '1px solid rgba(255,255,255,0.1)'
        : '1px solid rgba(0,0,0,0.05)',
      borderRadius: 3,
      boxShadow: theme.palette.mode === 'dark'
        ? '0 20px 25px -5px rgba(0, 0, 0, 0.4), 0 10px 10px -5px rgba(0, 0, 0, 0.2)'
        : '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      overflow: 'hidden',
      position: 'relative',
      '&::before': {
        content: '""',
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        height: '4px',
        background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #667eea 100%)',
      }
    }}>
      <CardContent sx={{ p: 4 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 3 }}>
          <Box sx={{
            p: 1.5,
            borderRadius: 2,
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            mr: 2
          }}>
            <AssessmentIcon sx={{ color: 'white', fontSize: 24 }} />
          </Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 100%)'
                : 'linear-gradient(135deg, #1a202c 0%, #2d3748 100%)',
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              fontSize: '1.1rem'
            }}
          >
            {title}
          </Typography>
        </Box>

        {data && data.length > 0 ? (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={data}
              margin={{ top: 20, right: 30, left: 20, bottom: 80 }}
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#667eea" stopOpacity={1} />
                  <stop offset="100%" stopColor="#764ba2" stopOpacity={0.8} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'}
                vertical={false}
              />
              <XAxis
                dataKey="name"
                tick={{
                  fontSize: 13,
                  fill: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                  fontWeight: 600
                }}
                axisLine={false}
                tickLine={false}
                angle={-45}
                textAnchor="end"
                height={100}
                interval={0}
              />
              <YAxis
                tick={{
                  fontSize: 14,
                  fill: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                  fontWeight: 600
                }}
                axisLine={false}
                tickLine={false}
                domain={[0, 'dataMax + 5']}
                label={{
                  value: 'عدد المشاريع',
                  angle: -90,
                  position: 'insideLeft',
                  style: {
                    textAnchor: 'middle',
                    fill: theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                    fontSize: 14,
                    fontWeight: 600
                  }
                }}
              />
              <RechartsTooltip
                contentStyle={{
                  backgroundColor: theme.palette.mode === 'dark' ? '#1a1a1a' : '#ffffff',
                  border: 'none',
                  borderRadius: 12,
                  boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
                  color: theme.palette.mode === 'dark' ? '#ffffff' : theme.palette.text.primary,
                  padding: '12px 16px'
                }}
                formatter={(value, name) => [
                  <span style={{ color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit' }}>{`${value} ${value === 1 ? 'مشروع' : 'مشاريع'}`}</span>,
                  <span style={{ color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit' }}>{name}</span>
                ]}
                labelFormatter={(label) => (
                  <span style={{ fontWeight: 'bold', fontSize: '14px', color: theme.palette.mode === 'dark' ? '#ffffff' : 'inherit' }}>
                    {label}
                  </span>
                )}
                cursor={{ fill: 'rgba(102, 126, 234, 0.1)' }}
              />
              <Bar
                dataKey="value"
                fill="url(#barGradient)"
                radius={[8, 8, 0, 0]}
                stroke="none"
                maxBarSize={60}
              />
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <Box sx={{
            height: 320,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
            gap: 2,
            opacity: 0.7
          }}>
            <AssessmentIcon sx={{ fontSize: 64, color: theme.palette.text.disabled }} />
            <Typography variant="h6" color="text.secondary" sx={{ fontWeight: 500 }}>
              لا توجد بيانات للعرض
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
};

const DashboardWithDatabase = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [reportsData, setReportsData] = useState<ReportsData | null>(null);
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 🔄 التحديث التلقائي الدائم
  const [lastRefreshTime, setLastRefreshTime] = useState(new Date());
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(false);

  // جلب البيانات من قاعدة البيانات
  const fetchDashboardData = async () => {
    setLoading(true);
    setError(null);

    try {
      console.log('🚀 جاري جلب بيانات الداشبورد باستخدام APIs الجديدة...');

      // جلب إحصائيات الداشبورد باستخدام APIs الجديدة
      const [dashboardStats, companiesData, reportsData] = await Promise.all([
        fetchDashboardStats(),
        fetchCompanies({ page: 1, limit: 10 }),
        fetchDashboardReports()
      ]);

      console.log('✅ Dashboard stats (NEW API):', dashboardStats);
      console.log('✅ Companies data (NEW API):', companiesData);
      console.log('✅ Reports data (NEW API):', reportsData);

      // تحديث حالة البيانات
      setDashboardData(dashboardStats);
      setCompanies(companiesData.companies || []);

      // تحويل بيانات التقارير لتتوافق مع التوقعات
      const transformedReportsData: ReportsData = {
        companies: reportsData.companies || [],
        projects: reportsData.projects || [],
        monthlyStats: reportsData.monthlyStats || [],
        companiesByCity: reportsData.companiesByCity || []
      };

      console.log('📊 Transformed reports data:', transformedReportsData);

      setReportsData(transformedReportsData);

    } catch (err: any) {
      console.error('❌ Error fetching dashboard data with NEW APIs:', err);
      setError('فشل في جلب بيانات الداشبورد: ' + (err.message || 'خطأ غير معروف'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  // 🔄 التحديث التلقائي الدائم
  useEffect(() => {
    const interval = setInterval(async () => {
      console.log('🔄 تحديث تلقائي للداشبورد...', new Date().toLocaleTimeString());
      setIsAutoRefreshing(true);

      try {
        await fetchDashboardData();
        setLastRefreshTime(new Date());
      } catch (error) {
        console.error('خطأ في التحديث التلقائي:', error);
      } finally {
        setIsAutoRefreshing(false);
      }
    }, 180000); // 3 دقائق للداشبورد الرئيسي

    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsAutoRefreshing(true);
    try {
      await fetchDashboardData();
      setLastRefreshTime(new Date());
    } catch (error) {
      console.error('خطأ في التحديث:', error);
    } finally {
      setIsAutoRefreshing(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status?.toLowerCase()) {
      case 'active':
      case 'نشط':
        return 'success';
      case 'pending':
      case 'معلق':
        return 'warning';
      case 'completed':
      case 'مكتمل':
        return 'info';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '60vh',
          gap: 3
        }}
      >
        <CircularProgress
          size={80}
          sx={{
            color: theme.palette.primary.main,
            animation: 'glow 2s ease-in-out infinite'
          }}
        />
        <Typography
          variant="h6"
          sx={{
            color: theme.palette.text.secondary,
            fontWeight: 'bold',
            textAlign: 'center'
          }}
        >
          🚀 جاري تحميل لوحة التحكم الذكية...
        </Typography>
        <Typography variant="body2" sx={{ color: theme.palette.text.secondary }}>
          يتم جلب البيانات من قاعدة البيانات
        </Typography>
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="error"
          sx={{
            borderRadius: 3,
            boxShadow: '0 8px 25px rgba(244, 67, 54, 0.15)'
          }}
          action={
            <Button
              color="inherit"
              size="small"
              onClick={handleRefresh}
              sx={{ fontWeight: 'bold' }}
            >
              إعادة المحاولة
            </Button>
          }
        >
          <Typography variant="h6" sx={{ mb: 1 }}>⚠️ خطأ في الاتصال</Typography>
          {error}
        </Alert>
      </Box>
    );
  }

  if (!dashboardData) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert
          severity="warning"
          sx={{
            borderRadius: 3,
            boxShadow: '0 8px 25px rgba(255, 152, 0, 0.15)'
          }}
        >
          <Typography variant="h6">لا توجد بيانات</Typography>
          لا توجد بيانات متاحة في قاعدة البيانات
        </Alert>
      </Box>
    );
  }

  return (
    <Box sx={{
      p: { xs: 2, md: 3 },
      backgroundColor: theme.palette.background.default,
      minHeight: '100vh'
    }}>
      {/* رأس الصفحة المحسن */}
      <Box sx={{
        mb: 4,
        p: { xs: 2.5, md: 4 },
        background: theme.palette.mode === 'dark'
          ? 'linear-gradient(145deg, #0f1419 0%, #1a1a2e 25%, #16213e 50%, #0f3460 75%, #001122 100%)'
          : 'linear-gradient(145deg, #667eea 0%, #764ba2 25%, #f093fb 50%, #667eea 75%, #764ba2 100%)',
        borderRadius: 5,
        color: 'white',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 25px 50px -12px rgba(0,0,0,0.6), inset 0 1px 0 rgba(255,255,255,0.1)'
          : '0 25px 50px -12px rgba(102, 126, 234, 0.4), inset 0 1px 0 rgba(255,255,255,0.2)',
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: 0,
          left: '-100%',
          width: '100%',
          height: '100%',
          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.1), transparent)',
          animation: 'shimmer 3s infinite',
        }
      }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'relative', zIndex: 1 }}>
          <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
              <Box sx={{
                p: 1.5,
                borderRadius: 3,
                background: 'rgba(255,255,255,0.15)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.2)',
                mr: 3,
                animation: 'float 3s ease-in-out infinite'
              }}>
                <SpeedIcon sx={{ fontSize: 32, color: 'white' }} />
              </Box>
              <Box>
                <Typography
                  variant="h3"
                  component="h1"
                  sx={{
                    fontWeight: 800,
                    mb: 0.5,
                    fontSize: { xs: '1.8rem', sm: '2.5rem', md: '3rem' },
                    background: 'linear-gradient(90deg, #ffffff 0%, #e2e8f0 50%, #ffffff 100%)',
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    textShadow: '0 0 30px rgba(255,255,255,0.3)'
                  }}
                >
                  لوحة التحكم الذكية
                </Typography>
                <Typography
                  variant="h6"
                  sx={{
                    opacity: 0.95,
                    fontWeight: 500,
                    fontSize: { xs: '0.9rem', sm: '1.1rem' }
                  }}
                >
                  📊 مراقبة شاملة للأعمال والمشاريع في الوقت الفعلي
                </Typography>
              </Box>
            </Box>
          </Box>
          {/* مؤشر التحديث التلقائي وزر التحديث اليدوي */}
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end',
            gap: 1.5
          }}>
            {/* زر التحديث اليدوي */}
            <Button
              onClick={handleRefresh}
              disabled={isAutoRefreshing}
              variant="contained"
              startIcon={
                <RefreshIcon
                  sx={{
                    animation: isAutoRefreshing ? 'spin 1s linear infinite' : 'none',
                    transform: isAutoRefreshing ? 'rotate(360deg)' : 'rotate(0deg)'
                  }}
                />
              }
              sx={{
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(10px)',
                border: '1px solid rgba(255,255,255,0.3)',
                color: 'white',
                fontWeight: 600,
                px: 3,
                py: 1.5,
                borderRadius: 3,
                textTransform: 'none',
                fontSize: '0.9rem',
                transition: 'all 0.3s ease',
                boxShadow: '0 4px 15px rgba(0,0,0,0.2)',
                '&:hover': {
                  background: 'rgba(255,255,255,0.3)',
                  transform: 'translateY(-2px)',
                  boxShadow: '0 8px 25px rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.5)'
                },
                '&:active': {
                  transform: 'translateY(0px)',
                  boxShadow: '0 4px 15px rgba(0,0,0,0.2)'
                },
                '&:disabled': {
                  background: 'rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.5)',
                  transform: 'none',
                  boxShadow: 'none'
                }
              }}
            >
              {isAutoRefreshing ? 'جاري التحديث...' : 'تحديث البيانات'}
            </Button>

            {/* مؤشر التحديث التلقائي */}
            <Box sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1.5,
              bgcolor: 'rgba(255,255,255,0.15)',
              px: 3,
              py: 1.5,
              borderRadius: 3,
              border: '1px solid rgba(255,255,255,0.2)',
              backdropFilter: 'blur(10px)',
              boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.2)'
            }}>
              <Box sx={{
                width: 10,
                height: 10,
                borderRadius: '50%',
                bgcolor: isAutoRefreshing ? '#ff9800' : '#4caf50',
                boxShadow: `0 0 20px ${isAutoRefreshing ? '#ff9800' : '#4caf50'}`,
                animation: isAutoRefreshing ? 'pulse 1s infinite' : 'glow 2s infinite'
              }} />
              <Box>
                <Typography variant="body2" sx={{ fontWeight: 700, color: 'white', lineHeight: 1.2 }}>
                  {isAutoRefreshing ? '🔄 جاري التحديث...' : '✅ نظام نشط'}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.75rem' }}>
                  آخر تحديث: {lastRefreshTime.toLocaleTimeString('en-GB')}
                </Typography>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>

      {/* بطاقات الإحصائيات المحسنة */}
      <Grid container spacing={2} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard
            title="إجمالي الشركات"
            value={dashboardData.overview.totalCompanies}
            icon={<BusinessIcon />}
            color={theme.palette.primary.main}
            bgColor={theme.palette.primary.main}
            subtitle="شركات مسجلة في النظام"
            delay={0}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard
            title="إجمالي الفروع"
            value={dashboardData.overview.totalSubs}
            icon={<AccountTreeIcon />}
            color={theme.palette.success.main}
            bgColor={theme.palette.success.main}
            subtitle="فروع مسجلة في النظام"
            delay={0.1}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard
            title="إجمالي المشاريع"
            value={dashboardData.overview.totalProjects}
            icon={<AssignmentIcon />}
            color={theme.palette.info.main}
            bgColor={theme.palette.info.main}
            subtitle="مشاريع في جميع المراحل"
            delay={0.2}
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <EnhancedStatCard
            title="المشاريع النشطة"
            value={dashboardData.overview.activeProjects}
            icon={<TrendingUpIcon />}
            color={theme.palette.warning.main}
            bgColor={theme.palette.warning.main}
            subtitle="مشاريع قيد التنفيذ"
            delay={0.3}
          />
        </Grid>
      </Grid>

      {/* قسم الرسوم البيانية */}
      {reportsData && (
        <Box sx={{ mb: 5 }}>
          {/* عنوان قسم الرسوم البيانية */}
          <Box sx={{
            mb: 4,
            textAlign: 'center',
            position: 'relative'
          }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                background: theme.palette.mode === 'dark'
                  ? 'linear-gradient(135deg, #ffffff 0%, #e2e8f0 50%, #94a3b8 100%)'
                  : 'linear-gradient(135deg, #1a202c 0%, #2d3748 50%, #4a5568 100%)',
                backgroundClip: 'text',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                mb: 1,
                position: 'relative',
                '&::after': {
                  content: '""',
                  position: 'absolute',
                  bottom: '-8px',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  width: '80px',
                  height: '4px',
                  background: 'linear-gradient(90deg, #667eea 0%, #764ba2 50%, #f093fb 100%)',
                  borderRadius: '2px'
                }
              }}
            >
              📊 تحليلات البيانات
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: theme.palette.text.secondary,
                fontWeight: 500,
                fontSize: '1.1rem'
              }}
            >
              رؤية شاملة لأداء المشاريع والشركات
            </Typography>
          </Box>

          <Grid container spacing={{ xs: 2, md: 4 }}>
            <Grid item xs={12} md={6}>
              <EnhancedPieChart
                data={reportsData.companiesByCity.map((city, index) => ({
                  name: city.City,
                  value: city.count,
                  color: [
                    '#FF6B6B', // أحمر حديث
                    '#4ECDC4', // أخضر مائي
                    '#45B7D1', // أزرق فاتح
                    '#FFA07A', // برتقالي فاتح
                    '#98D8C8', // أخضر نعناعي
                    '#F7DC6F', // أصفر ذهبي
                    '#DDA0DD', // بنفسجي فاتح
                    '#87CEEB'  // أزرق سماوي
                  ][index % 8]
                }))}
                title="توزيع الشركات حسب المدن"
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <EnhancedBarChart
                data={reportsData && reportsData.companies ?
                  reportsData.companies
                    .filter(company => company.totalProjects && company.totalProjects > 0)
                    .slice(0, 8)
                    .map(company => ({
                      name: company.NameCompany && company.NameCompany.length > 20 ?
                        company.NameCompany.substring(0, 20) + '...' :
                        company.NameCompany || 'غير محدد',
                      value: parseInt(company.totalProjects) || 0,
                      fullName: company.NameCompany || 'غير محدد'
                    })) :
                  [
                    { name: 'لا توجد بيانات', value: 0, fullName: 'لا توجد بيانات' }
                  ]
                }
                title="أكثر الشركات نشاطاً (عدد المشاريع)"
              />
            </Grid>
          </Grid>
        </Box>
      )}

      {/* جدول أداء الفروع */}
      {reportsData && reportsData.companies && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
            🏪 أداء الفروع والمشاريع
          </Typography>

          <Card sx={{ overflow: 'hidden' }}>
            <Box sx={{
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              color: 'white',
              p: 2
            }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                📊 ترتيب الشركات حسب الأداء
              </Typography>
            </Box>

            <Box sx={{ maxHeight: { xs: 300, md: 400 }, overflow: 'auto' }}>
              {reportsData.companies
                .filter(company => company.totalProjects > 0)
                .slice(0, 6)
                .map((company, index) => (
                  <Box
                    key={company.id}
                    sx={{
                      p: 2,
                      borderBottom: '1px solid',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      '&:hover': {
                        bgcolor: 'action.hover'
                      }
                    }}
                  >
                    <Box sx={{ display: 'flex', alignItems: 'center', flex: 1 }}>
                      <Box sx={{
                        width: 40,
                        height: 40,
                        borderRadius: '50%',
                        background: index === 0 ? 'linear-gradient(135deg, #ffd700 0%, #ffa500 100%)' :
                          index === 1 ? 'linear-gradient(135deg, #c0c0c0 0%, #a0a0a0 100%)' :
                            index === 2 ? 'linear-gradient(135deg, #cd7f32 0%, #b8860b 100%)' :
                              'linear-gradient(135deg, #e3f2fd 0%, #bbdefb 100%)',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: index < 3 ? 'white' : 'primary.main',
                        fontWeight: 'bold',
                        mr: 2
                      }}>
                        {index + 1}
                      </Box>

                      <Box sx={{ flex: 1 }}>
                        <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                          {company.NameCompany}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {company.totalSubs} فرع • {company.totalProjects} مشروع
                        </Typography>
                      </Box>
                    </Box>

                    <Box sx={{ textAlign: 'right', mr: 2 }}>
                      <Typography variant="h6" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                        {company.totalProjects}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        إجمالي المشاريع
                      </Typography>
                    </Box>

                    <Box sx={{
                      bgcolor: index === 0 ? 'gold' : index === 1 ? 'silver' : index === 2 ? '#cd7f32' : 'primary.light',
                      color: index < 3 ? 'white' : 'primary.dark',
                      px: 1.5,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: 12,
                      fontWeight: 'bold',
                      minWidth: 60,
                      textAlign: 'center'
                    }}>
                      {index === 0 ? '🥇 الأول' : index === 1 ? '🥈 الثاني' : index === 2 ? '🥉 الثالث' : `#${index + 1}`}
                    </Box>
                  </Box>
                ))
              }
            </Box>
          </Card>
        </Box>
      )}

      {/* المشاريع عالية الأداء */}
      {reportsData && reportsData.projects && (
        <Box sx={{ mb: 4 }}>
          <Typography variant="h5" sx={{ mb: 3, fontWeight: 'bold', color: 'primary.main' }}>
            🚀 المشاريع عالية الأداء
          </Typography>

          <Grid container spacing={2}>
            {reportsData.projects.slice(0, 4).map((project, index) => (
              <Grid item xs={12} sm={6} md={3} key={project.id}>
                <Card sx={{
                  p: { xs: 1.5, md: 2 },
                  height: '100%',
                  border: '2px solid transparent',
                  borderColor: index === 0 ? 'primary.main' : 'transparent',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 3,
                    borderColor: 'primary.main'
                  },
                  transition: 'all 0.3s ease'
                }}>
                  {index === 0 && (
                    <Box sx={{
                      bgcolor: 'primary.main',
                      color: 'white',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: 10,
                      fontWeight: 'bold',
                      mb: 1,
                      display: 'inline-block'
                    }}>
                      🏆 الأفضل
                    </Box>
                  )}

                  <Typography variant="h6" sx={{
                    fontWeight: 'bold',
                    fontSize: { xs: 13, md: 14 },
                    mb: 1,
                    height: { xs: 36, md: 40 },
                    overflow: 'hidden',
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical'
                  }}>
                    {project.Nameproject}
                  </Typography>

                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 12 }}>
                      {project.NameCompany}
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ fontSize: 11 }}>
                      {project.NameSub}
                    </Typography>
                  </Box>

                  <Box sx={{ mb: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                      <Typography variant="body2" sx={{ fontSize: 12 }}>نسبة الإنجاز</Typography>
                      <Typography variant="body2" sx={{ fontSize: 12, fontWeight: 'bold' }}>
                        {Math.round(project.progress)}%
                      </Typography>
                    </Box>

                    <Box sx={{
                      height: 6,
                      bgcolor: 'grey.200',
                      borderRadius: 3,
                      overflow: 'hidden'
                    }}>
                      <Box sx={{
                        height: '100%',
                        width: `${Math.min(project.progress, 100)}%`,
                        background: project.progress >= 90 ?
                          'linear-gradient(90deg, #4caf50 0%, #8bc34a 100%)' :
                          project.progress >= 70 ?
                            'linear-gradient(90deg, #2196f3 0%, #03a9f4 100%)' :
                            'linear-gradient(90deg, #ff9800 0%, #ffc107 100%)',
                        borderRadius: 3,
                        transition: 'width 0.3s ease'
                      }} />
                    </Box>
                  </Box>

                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Box sx={{
                      bgcolor: project.status === 'جاري العمل' ? 'success.light' : 'warning.light',
                      color: project.status === 'جاري العمل' ? 'success.dark' : 'warning.dark',
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      fontSize: 10,
                      fontWeight: 'bold'
                    }}>
                      {project.status}
                    </Box>

                    {project.cost > 0 && (
                      <Typography variant="body2" sx={{ fontSize: 10, color: 'text.secondary' }}>
                        {Math.round(project.cost).toLocaleString()} ريال
                      </Typography>
                    )}
                  </Box>
                </Card>
              </Grid>
            ))}
          </Grid>
        </Box>
      )}

      <Grid container spacing={3}>
        {/* أحدث الشركات */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1e1e1e 0%, #2c2c2c 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0,0,0,0.3)'
              : '0 8px 32px rgba(0,0,0,0.1)',
            animation: 'slideInUp 0.8s ease-out 0.6s both'
          }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <StarIcon sx={{ color: theme.palette.primary.main }} />
                  أحدث الشركات
                </Typography>
                <Tooltip title="عرض جميع الشركات">
                  <IconButton
                    onClick={() => navigate('/companies-subscribed')}
                    sx={{
                      bgcolor: theme.palette.primary.main + '15',
                      '&:hover': {
                        bgcolor: theme.palette.primary.main + '25',
                        transform: 'scale(1.1)'
                      }
                    }}
                  >
                    <ArrowForwardIcon sx={{ color: theme.palette.primary.main }} />
                  </IconButton>
                </Tooltip>
              </Box>
              <List>
                {dashboardData.recentCompanies.map((company, index) => (
                  <React.Fragment key={company.id}>
                    <ListItem
                      sx={{
                        borderRadius: 2,
                        mb: 1,
                        '&:hover': {
                          bgcolor: theme.palette.action.hover,
                          transform: 'translateX(5px)'
                        },
                        transition: 'all 0.3s ease'
                      }}
                    >
                      <ListItemAvatar>
                        <Badge badgeContent={index + 1} color="primary">
                          <Avatar sx={{
                            bgcolor: theme.palette.primary.main,
                            boxShadow: `0 4px 15px ${theme.palette.primary.main}40`
                          }}>
                            <BusinessIcon />
                          </Avatar>
                        </Badge>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                            {company.name}
                          </Typography>
                        }
                        secondary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <ScheduleIcon sx={{ fontSize: 16, color: theme.palette.text.secondary }} />
                            <Typography variant="caption">
                              تاريخ الاشتراك: {company.subscriptionStart || 'غير محدد'}
                            </Typography>
                          </Box>
                        }
                        secondaryTypographyProps={{ component: 'div' }}
                      />
                    </ListItem>
                    {index < (dashboardData.recentCompanies?.length || 0) - 1 &&
                      <Divider sx={{ opacity: 0.3 }} />}
                  </React.Fragment>
                ))}
                {(dashboardData.recentCompanies?.length || 0) === 0 && (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography sx={{ textAlign: 'center', color: theme.palette.text.secondary }}>
                          📝 لا توجد شركات جديدة
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ textAlign: 'center', display: 'block' }}>
                          لم يتم إضافة أي شركات مؤخراً
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* جميع الشركات */}
        <Grid item xs={12} md={6}>
          <Card sx={{
            background: theme.palette.mode === 'dark'
              ? 'linear-gradient(135deg, #1e1e1e 0%, #2c2c2c 100%)'
              : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
            boxShadow: theme.palette.mode === 'dark'
              ? '0 8px 32px rgba(0,0,0,0.3)'
              : '0 8px 32px rgba(0,0,0,0.1)',
            animation: 'slideInUp 0.8s ease-out 0.8s both'
          }}>
            <CardContent sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <PeopleIcon sx={{ color: theme.palette.secondary.main }} />
                  جميع الشركات
                </Typography>
                <Button
                  size="small"
                  onClick={() => navigate('/companies-subscribed')}
                  endIcon={<ArrowForwardIcon />}
                  sx={{
                    borderRadius: 3,
                    fontWeight: 'bold',
                    textTransform: 'none'
                  }}
                >
                  عرض الكل
                </Button>
              </Box>
              <List>
                {companies && [...companies]
                  .sort((a, b) => {
                    // ترتيب الشركات حسب معرف الشركة (الأقدم أولاً)
                    return a.id - b.id;
                  })
                  .slice(0, 5)
                  .map((company, index) => (
                    <React.Fragment key={company.id}>
                      <ListItem
                        sx={{
                          borderRadius: 2,
                          mb: 1,
                          '&:hover': {
                            bgcolor: theme.palette.action.hover,
                            transform: 'translateX(5px)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{
                            bgcolor: theme.palette.secondary.main,
                            boxShadow: `0 4px 15px ${theme.palette.secondary.main}40`,
                            fontSize: '1.2rem',
                            fontWeight: 'bold'
                          }}>
                            {company.name.charAt(0)}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                              {company.name}
                            </Typography>
                          }
                          secondary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                              <LocationIcon sx={{ fontSize: 14, color: theme.palette.text.secondary }} />
                              <Typography variant="caption">
                                {company.city}, {company.country}
                              </Typography>
                              <Chip
                                label={company.isActive ? 'نشط' : 'غير نشط'}
                                size="small"
                                icon={company.isActive ? <CheckCircleIcon /> : <WarningIcon />}
                                sx={{
                                  backgroundColor: company.isActive ? '#4caf50' : '#9e9e9e',
                                  color: 'white',
                                  fontWeight: 'bold',
                                  '& .MuiChip-label': {
                                    color: 'white',
                                    fontWeight: 'bold'
                                  },
                                  '& .MuiChip-icon': {
                                    color: 'white'
                                  },
                                  boxShadow: company.isActive ? '0 2px 4px rgba(76, 175, 80, 0.3)' : '0 2px 4px rgba(158, 158, 158, 0.3)',
                                  border: 'none'
                                }}
                              />
                            </Box>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItem>
                      {index < Math.min(companies?.length || 0, 5) - 1 &&
                        <Divider sx={{ opacity: 0.3 }} />}
                    </React.Fragment>
                  ))}
                {(companies?.length || 0) === 0 && (
                  <ListItem>
                    <ListItemText
                      primary={
                        <Typography sx={{ textAlign: 'center', color: theme.palette.text.secondary }}>
                          🏢 لا توجد شركات في قاعدة البيانات
                        </Typography>
                      }
                      secondary={
                        <Typography variant="caption" sx={{ textAlign: 'center', display: 'block' }}>
                          قم بإضافة شركات جديدة للبدء
                        </Typography>
                      }
                    />
                  </ListItem>
                )}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* أحدث المشاريع */}
        {dashboardData.recentProjects && dashboardData.recentProjects.length > 0 && (
          <Grid item xs={12}>
            <Card sx={{
              background: theme.palette.mode === 'dark'
                ? 'linear-gradient(135deg, #1e1e1e 0%, #2c2c2c 100%)'
                : 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
              boxShadow: theme.palette.mode === 'dark'
                ? '0 8px 32px rgba(0,0,0,0.3)'
                : '0 8px 32px rgba(0,0,0,0.1)',
              animation: 'slideInUp 0.8s ease-out 1s both'
            }}>
              <CardContent sx={{ p: { xs: 2, md: 3 } }}>
                <Typography
                  variant="h6"
                  component="h2"
                  sx={{
                    mb: 3,
                    fontWeight: 'bold',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1
                  }}
                >
                  <TimelineIcon sx={{ color: theme.palette.info.main }} />
                  أحدث المشاريع
                </Typography>
                <List>
                  {dashboardData.recentProjects.map((project, index) => (
                    <React.Fragment key={project.id}>
                      <ListItem
                        sx={{
                          borderRadius: 2,
                          mb: 2,
                          p: 2,
                          '&:hover': {
                            bgcolor: theme.palette.action.hover,
                            transform: 'translateX(5px)'
                          },
                          transition: 'all 0.3s ease'
                        }}
                      >
                        <ListItemAvatar>
                          <Avatar sx={{
                            bgcolor: theme.palette.info.main,
                            boxShadow: `0 4px 15px ${theme.palette.info.main}40`
                          }}>
                            <AssignmentIcon />
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 1 }}>
                              {project.name}
                            </Typography>
                          }
                          secondary={
                            <Box>
                              <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                                🏢 الشركة: {project.companyName} • 🏪 الفرع: {project.subName}
                              </Typography>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                                <Chip
                                  label={project.status}
                                  size="small"
                                  icon={project.status === 'نشط' ? <CheckCircleIcon /> : <ScheduleIcon />}
                                  sx={{
                                    backgroundColor: project.status === 'نشط' ? '#4caf50' :
                                      project.status === 'منجز' ? '#2196f3' :
                                        project.status === 'متوقف' ? '#f44336' : '#ff9800',
                                    color: 'white',
                                    fontWeight: 'bold',
                                    '& .MuiChip-label': {
                                      color: 'white',
                                      fontWeight: 'bold'
                                    },
                                    '& .MuiChip-icon': {
                                      color: 'white'
                                    },
                                    boxShadow: project.status === 'نشط' ? '0 2px 4px rgba(76, 175, 80, 0.3)' :
                                      project.status === 'منجز' ? '0 2px 4px rgba(33, 150, 243, 0.3)' :
                                        project.status === 'متوقف' ? '0 2px 4px rgba(244, 67, 54, 0.3)' : '0 2px 4px rgba(255, 152, 0, 0.3)',
                                    border: 'none'
                                  }}
                                />
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                  <Typography variant="caption">
                                    التقدم: {(project.progress || 0).toFixed(2)}%
                                  </Typography>
                                  <LinearProgress
                                    variant="determinate"
                                    value={project.progress}
                                    sx={{
                                      width: 60,
                                      height: 6,
                                      borderRadius: 3,
                                      bgcolor: theme.palette.action.hover,
                                      '& .MuiLinearProgress-bar': {
                                        borderRadius: 3,
                                        bgcolor: project.progress > 70 ? '#4caf50' :
                                          project.progress > 40 ? '#ff9800' : '#f44336'
                                      }
                                    }}
                                  />
                                </Box>
                              </Box>
                            </Box>
                          }
                          secondaryTypographyProps={{ component: 'div' }}
                        />
                      </ListItem>
                      {index < (dashboardData.recentProjects?.length || 0) - 1 &&
                        <Divider sx={{ opacity: 0.3 }} />}
                    </React.Fragment>
                  ))}
                </List>
              </CardContent>
            </Card>
          </Grid>
        )}
      </Grid>
    </Box>
  );
};

export default DashboardWithDatabase; 
