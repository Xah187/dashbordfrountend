import React, { useState, useEffect } from 'react';
import { 
  Box, 
  Container, 
  Grid, 
  Paper, 
  Typography, 
  Card, 
  CardContent, 
  CardHeader,
  Divider,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  ButtonGroup,
  Tab,
  Tabs,
  useTheme
} from '@mui/material';
import Chart from 'react-apexcharts';
import DownloadIcon from '@mui/icons-material/Download';
import ShareIcon from '@mui/icons-material/Share';
import RefreshIcon from '@mui/icons-material/Refresh';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';

// مكون KPI الفردي
const KPICard = ({ title, value, change, changeType, subtitle, icon }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h4" sx={{ my: 1, fontWeight: 'bold' }}>
              {value}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <Typography 
                variant="body2" 
                sx={{ 
                  color: changeType === 'up' ? 'success.main' : 
                         changeType === 'down' ? 'error.main' : 'text.secondary',
                  fontWeight: 'medium',
                  ml: 0.5
                }}
              >
                {change}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {subtitle}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            p: 2, 
            bgcolor: 'background.default', 
            borderRadius: '50%', 
            height: 64, 
            width: 64 
          }}>
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

// مكون الرسم البياني للمقارنة
const ComparisonChart = ({ title, type, series, options, height = 350 }) => {
  return (
    <Card sx={{ height: '100%' }}>
      <CardHeader 
        title={title} 
        action={
          <ButtonGroup variant="text" size="small">
            <Button><DownloadIcon fontSize="small" /></Button>
            <Button><ShareIcon fontSize="small" /></Button>
            <Button><RefreshIcon fontSize="small" /></Button>
          </ButtonGroup>
        }
      />
      <Divider />
      <CardContent>
        <Chart 
          options={options} 
          series={series} 
          type={type} 
          height={height} 
        />
      </CardContent>
    </Card>
  );
};

const AdvancedAnalytics = () => {
  const theme = useTheme();
  
  // بيانات تجريبية مؤقتة
  const projects = [];
  const tasks = [];
  const branches = [];
  const companies = [];
  
  const [timeFrame, setTimeFrame] = useState('yearly');
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedTab, setSelectedTab] = useState(0);
  const [comparisonData, setComparisonData] = useState([]);
  
  // تحميل بيانات المقارنة بناءً على التحديدات
  useEffect(() => {
    // بيانات عينة للعرض
    const sampleData = [
      {
        name: 'بيانات تجريبية',
        data: [10, 20, 15, 8]
      }
    ];
    setComparisonData(sampleData);
  }, [selectedTab, selectedCompany, selectedBranch]);
  
  // خيارات الرسم البياني
  const getChartOptions = () => {
    let categories = [];
    
    // ضبط فئات المحور X بناءً على التبويب المحدد
    if (selectedTab === 0) {
      categories = ['المشاريع', 'المهام', 'المهام المكتملة', 'الموظفين'];
    } else if (selectedTab === 1) {
      categories = selectedCompany === 'all' 
        ? ['الفروع', 'المشاريع', 'المهام', 'المهام المكتملة'] 
        : ['المشاريع', 'المهام', 'المهام المكتملة', 'الموظفين'];
    } else if (selectedTab === 2) {
      categories = ['مكتمل', 'قيد التنفيذ', 'متأخر', 'لم يبدأ'];
    }
    
    return {
      chart: {
        toolbar: {
          show: true,
        },
        fontFamily: 'Tajawal, Arial, sans-serif',
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4,
        },
      },
      dataLabels: {
        enabled: false,
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent'],
      },
      xaxis: {
        categories,
        labels: {
          style: {
            fontFamily: 'Tajawal, Arial, sans-serif',
          },
        },
      },
      yaxis: {
        title: {
          text: 'العدد',
          style: {
            fontFamily: 'Tajawal, Arial, sans-serif',
          },
        },
        labels: {
          style: {
            fontFamily: 'Tajawal, Arial, sans-serif',
          },
        },
      },
      fill: {
        opacity: 1,
      },
      tooltip: {
        y: {
          formatter: function (val) {
            return val;
          },
        },
      },
      legend: {
        position: 'top',
        fontFamily: 'Tajawal, Arial, sans-serif',
      },
      theme: {
        mode: theme.palette.mode,
      },
    };
  };
  
  const handleTimeFrameChange = (event) => {
    setTimeFrame(event.target.value);
  };
  
  const handleCompanyChange = (event) => {
    setSelectedCompany(event.target.value);
    setSelectedBranch('all');
  };
  
  const handleBranchChange = (event) => {
    setSelectedBranch(event.target.value);
  };
  
  const handleTabChange = (event, newValue) => {
    setSelectedTab(newValue);
  };
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 3 }}>
        <Typography variant="h4" gutterBottom>
          لوحة التحليلات المتقدمة
        </Typography>
        <Typography variant="body2">
          تحليلات شاملة للشركات والفروع والمشاريع والمهام
        </Typography>
      </Box>
      
      {/* شريط الفلاتر */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>الإطار الزمني</InputLabel>
              <Select value={timeFrame} onChange={handleTimeFrameChange} label="الإطار الزمني">
                <MenuItem value="daily">يومي</MenuItem>
                <MenuItem value="weekly">أسبوعي</MenuItem>
                <MenuItem value="monthly">شهري</MenuItem>
                <MenuItem value="quarterly">ربع سنوي</MenuItem>
                <MenuItem value="yearly">سنوي</MenuItem>
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>الشركة</InputLabel>
              <Select value={selectedCompany} onChange={handleCompanyChange} label="الشركة">
                <MenuItem value="all">جميع الشركات</MenuItem>
                {companies.map((company) => (
                  <MenuItem key={company.id} value={company.id}>
                    {company.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>الفرع</InputLabel>
              <Select 
                value={selectedBranch} 
                onChange={handleBranchChange} 
                label="الفرع"
                disabled={selectedCompany === 'all'}
              >
                <MenuItem value="all">جميع الفروع</MenuItem>
                {branches
                  .filter(branch => selectedCompany === 'all' || branch.companyId === parseInt(selectedCompany))
                  .map((branch) => (
                    <MenuItem key={branch.id} value={branch.id}>
                      {branch.name}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Button 
              variant="contained" 
              startIcon={<CompareArrowsIcon />} 
              fullWidth
            >
              مقارنة
            </Button>
          </Grid>
        </Grid>
      </Paper>
      
      {/* بطاقات KPI */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard 
            title="إجمالي المشاريع" 
            value={projects.length} 
            change="+12.5%" 
            changeType="up" 
            subtitle="من الشهر السابق" 
            icon={<Box sx={{ color: 'primary.main', fontSize: 32 }}>📊</Box>} 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard 
            title="إجمالي المهام" 
            value={tasks.length} 
            change="+8.2%" 
            changeType="up" 
            subtitle="من الشهر السابق" 
            icon={<Box sx={{ color: 'info.main', fontSize: 32 }}>📋</Box>} 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard 
            title="المهام المكتملة" 
            value={tasks.filter(task => task.status === 'مكتمل').length} 
            change="+15.3%" 
            changeType="up" 
            subtitle="من الشهر السابق" 
            icon={<Box sx={{ color: 'success.main', fontSize: 32 }}>✅</Box>} 
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard 
            title="نسبة الإنجاز" 
            value={`${tasks.length > 0 ? Math.round((tasks.filter(task => task.status === 'مكتمل').length / tasks.length) * 100) : 0}%`} 
            change="+5.7%" 
            changeType="up" 
            subtitle="من الشهر السابق" 
            icon={<Box sx={{ color: 'warning.main', fontSize: 32 }}>📈</Box>} 
          />
        </Grid>
      </Grid>
      
      {/* تبويبات التحليلات */}
      <Box sx={{ mb: 3 }}>
        <Tabs value={selectedTab} onChange={handleTabChange} aria-label="تبويبات التحليلات" variant="fullWidth">
          <Tab label="تحليل المشاريع" />
          <Tab label="تحليل الفروع" />
          <Tab label="تحليل المهام" />
        </Tabs>
      </Box>
      
      {/* الرسوم البيانية */}
      <Grid container spacing={3}>
        <Grid item xs={12}>
          <ComparisonChart 
            title="سيتم تطوير التحليلات المتقدمة قريباً"
            type="bar"
            series={comparisonData}
            options={getChartOptions()}
            height={400}
          />
        </Grid>
      </Grid>
      
      <Box sx={{ mt: 3, p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
        <Typography variant="body2" color="text.secondary" align="center">
          سيتم ربط التحليلات المتقدمة بقاعدة البيانات الحقيقية قريباً...
        </Typography>
      </Box>
    </Container>
  );
};

export default AdvancedAnalytics; 