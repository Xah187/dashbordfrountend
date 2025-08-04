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
  TextField,
  Button,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Tab,
  Tabs,
  useTheme
} from '@mui/material';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import DownloadIcon from '@mui/icons-material/Download';
import DateRangeIcon from '@mui/icons-material/DateRange';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import AttachMoneyIcon from '@mui/icons-material/AttachMoney';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import ArrowDownwardIcon from '@mui/icons-material/ArrowDownward';
import FilterListIcon from '@mui/icons-material/FilterList';

// تم إزالة الـ contexts الوهمية
import Chart from 'react-apexcharts';

// بيانات نموذجية لسجلات الوقت
const sampleTimeEntries = [
  { 
    id: 1, 
    projectId: 1, 
    projectName: 'مجمع سكني الواحة', 
    branchId: 1, 
    branchName: 'فرع الرياض',
    companyId: 1,
    companyName: 'شركة البناء المتطورة',
    userId: 1, 
    userName: 'أحمد محمد', 
    date: '2023-09-01', 
    hours: 8, 
    description: 'تنفيذ أعمال الحفر',
    category: 'تنفيذ',
    approved: true
  },
  { 
    id: 2, 
    projectId: 1, 
    projectName: 'مجمع سكني الواحة', 
    branchId: 1, 
    branchName: 'فرع الرياض',
    companyId: 1,
    companyName: 'شركة البناء المتطورة',
    userId: 2, 
    userName: 'سارة علي', 
    date: '2023-09-01', 
    hours: 6, 
    description: 'مراجعة المخططات الهندسية',
    category: 'تصميم',
    approved: true
  },
  { 
    id: 3, 
    projectId: 2, 
    projectName: 'جسر المدينة الجديد', 
    branchId: 1, 
    branchName: 'فرع الرياض',
    companyId: 1,
    companyName: 'شركة البناء المتطورة',
    userId: 3, 
    userName: 'محمد أحمد', 
    date: '2023-09-02', 
    hours: 10, 
    description: 'تركيب الهياكل الحديدية',
    category: 'تنفيذ',
    approved: false
  },
  { 
    id: 4, 
    projectId: 3, 
    projectName: 'مدرسة النموذجية', 
    branchId: 2, 
    branchName: 'فرع جدة',
    companyId: 1,
    companyName: 'شركة البناء المتطورة',
    userId: 4, 
    userName: 'خالد العلي', 
    date: '2023-09-03', 
    hours: 7, 
    description: 'أعمال التشطيبات الداخلية',
    category: 'تشطيب',
    approved: true
  },
  { 
    id: 5, 
    projectId: 4, 
    projectName: 'المركز التجاري', 
    branchId: 3, 
    branchName: 'فرع الدمام',
    companyId: 2,
    companyName: 'شركة التقنية المتقدمة',
    userId: 5, 
    userName: 'نورة محمد', 
    date: '2023-09-03', 
    hours: 5, 
    description: 'إعداد تقرير المتابعة',
    category: 'إدارة',
    approved: true
  }
];

// بيانات نموذجية للنفقات
const sampleExpenses = [
  { 
    id: 1, 
    projectId: 1, 
    projectName: 'مجمع سكني الواحة', 
    branchId: 1, 
    branchName: 'فرع الرياض',
    companyId: 1,
    companyName: 'شركة البناء المتطورة',
    date: '2023-09-01', 
    amount: 15000, 
    description: 'شراء مواد بناء',
    category: 'مواد',
    paymentMethod: 'تحويل بنكي',
    approved: true,
    receiptNumber: 'INV-001'
  },
  { 
    id: 2, 
    projectId: 1, 
    projectName: 'مجمع سكني الواحة', 
    branchId: 1, 
    branchName: 'فرع الرياض',
    companyId: 1,
    companyName: 'شركة البناء المتطورة',
    date: '2023-09-02', 
    amount: 5000, 
    description: 'أجور عمال',
    category: 'أجور',
    paymentMethod: 'نقدي',
    approved: true,
    receiptNumber: 'INV-002'
  },
  { 
    id: 3, 
    projectId: 2, 
    projectName: 'جسر المدينة الجديد', 
    branchId: 1, 
    branchName: 'فرع الرياض',
    companyId: 1,
    companyName: 'شركة البناء المتطورة',
    date: '2023-09-03', 
    amount: 25000, 
    description: 'معدات ثقيلة',
    category: 'معدات',
    paymentMethod: 'تحويل بنكي',
    approved: false,
    receiptNumber: 'INV-003'
  },
  { 
    id: 4, 
    projectId: 3, 
    projectName: 'مدرسة النموذجية', 
    branchId: 2, 
    branchName: 'فرع جدة',
    companyId: 1,
    companyName: 'شركة البناء المتطورة',
    date: '2023-09-04', 
    amount: 8000, 
    description: 'مواد تشطيب',
    category: 'مواد',
    paymentMethod: 'تحويل بنكي',
    approved: true,
    receiptNumber: 'INV-004'
  },
  { 
    id: 5, 
    projectId: 4, 
    projectName: 'المركز التجاري', 
    branchId: 3, 
    branchName: 'فرع الدمام',
    companyId: 2,
    companyName: 'شركة التقنية المتقدمة',
    date: '2023-09-05', 
    amount: 12000, 
    description: 'أجهزة تكييف',
    category: 'معدات',
    paymentMethod: 'شيك',
    approved: true,
    receiptNumber: 'INV-005'
  }
];

// مكون إحصائيات KPI
const KPICard = ({ title, value, icon, color, growth, trend }) => {
  const theme = useTheme();
  return (
    <Card sx={{ height: '100%' }}>
      <CardContent>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="body2" color="text.secondary">
              {title}
            </Typography>
            <Typography variant="h5" sx={{ mt: 1, mb: 1, fontWeight: 'bold' }}>
              {value}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              {trend === 'up' ? (
                <ArrowUpwardIcon sx={{ fontSize: 16, color: 'success.main', mr: 0.5 }} />
              ) : (
                <ArrowDownwardIcon sx={{ fontSize: 16, color: 'error.main', mr: 0.5 }} />
              )}
              <Typography 
                variant="body2" 
                color={trend === 'up' ? 'success.main' : 'error.main'}
              >
                {growth}
              </Typography>
            </Box>
          </Box>
          <Box 
            sx={{ 
              bgcolor: color, 
              color: theme.palette.primary.contrastText, 
              borderRadius: '50%', 
              width: 48, 
              height: 48, 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center' 
            }}
          >
            {icon}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

const TimeAndCostTracking = () => {
  const theme = useTheme();
  
  // بيانات تجريبية مؤقتة
  const projects = [];
  const branches = [];
  const companies = [];
  
  const [tabValue, setTabValue] = useState(0);
  const [timeEntries, setTimeEntries] = useState(sampleTimeEntries);
  const [expenses, setExpenses] = useState(sampleExpenses);
  const [selectedCompany, setSelectedCompany] = useState('all');
  const [selectedBranch, setSelectedBranch] = useState('all');
  const [selectedProject, setSelectedProject] = useState('all');
  const [filterDateFrom, setFilterDateFrom] = useState(null);
  const [filterDateTo, setFilterDateTo] = useState(null);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  
  // مجموع ساعات العمل حسب المرشحات الحالية
  const filteredTimeEntries = timeEntries.filter(entry => 
    (selectedCompany === 'all' || entry.companyId === parseInt(selectedCompany)) &&
    (selectedBranch === 'all' || entry.branchId === parseInt(selectedBranch)) &&
    (selectedProject === 'all' || entry.projectId === parseInt(selectedProject)) &&
    (!filterDateFrom || new Date(entry.date) >= new Date(filterDateFrom)) &&
    (!filterDateTo || new Date(entry.date) <= new Date(filterDateTo))
  );
  
  // مجموع النفقات حسب المرشحات الحالية
  const filteredExpenses = expenses.filter(expense => 
    (selectedCompany === 'all' || expense.companyId === parseInt(selectedCompany)) &&
    (selectedBranch === 'all' || expense.branchId === parseInt(selectedBranch)) &&
    (selectedProject === 'all' || expense.projectId === parseInt(selectedProject)) &&
    (!filterDateFrom || new Date(expense.date) >= new Date(filterDateFrom)) &&
    (!filterDateTo || new Date(expense.date) <= new Date(filterDateTo))
  );
  
  // حساب إجماليات KPI
  const totalHours = filteredTimeEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const totalExpenses = filteredExpenses.reduce((sum, expense) => sum + expense.amount, 0);
  const averageHoursPerDay = filteredTimeEntries.length > 0 
    ? (totalHours / [...new Set(filteredTimeEntries.map(e => e.date))].length).toFixed(1) 
    : 0;
  const averageExpensePerProject = filteredExpenses.length > 0 
    ? (totalExpenses / [...new Set(filteredExpenses.map(e => e.projectId))].length).toFixed(0) 
    : 0;
  
  // تغيير التبويب
  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };
  
  // تغيير الشركة
  const handleCompanyChange = (event) => {
    setSelectedCompany(event.target.value);
    // إعادة ضبط الفرع والمشروع إذا تم تغيير الشركة
    setSelectedBranch('all');
    setSelectedProject('all');
  };
  
  // تغيير الفرع
  const handleBranchChange = (event) => {
    setSelectedBranch(event.target.value);
    // إعادة ضبط المشروع إذا تم تغيير الفرع
    setSelectedProject('all');
  };
  
  // تغيير المشروع
  const handleProjectChange = (event) => {
    setSelectedProject(event.target.value);
  };
  
  // تغيير الصفحة
  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };
  
  // تغيير عدد الصفوف في الصفحة
  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };
  
  // تنسيق التاريخ
  const formatDate = (dateString) => {
    const options = { year: 'numeric', month: 'numeric', day: 'numeric' };
    return new Date(dateString).toLocaleDateString('en-GB', options);
  };
  
  // تنسيق المبلغ
  const formatAmount = (amount) => {
    return amount.toLocaleString('en-GB') + ' ريال';
  };
  
  // خيارات الرسم البياني لتوزيع الوقت
  const timeChartOptions = {
    chart: {
      type: 'pie',
      fontFamily: 'Tajawal, Arial, sans-serif',
    },
    labels: [...new Set(filteredTimeEntries.map(entry => entry.projectName))],
    colors: [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
    ],
    legend: {
      position: 'bottom',
      fontFamily: 'Tajawal, Arial, sans-serif',
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };
  
  // بيانات الرسم البياني لتوزيع الوقت
  const timeChartSeries = (() => {
    const projectHours = {};
    filteredTimeEntries.forEach(entry => {
      if (!projectHours[entry.projectName]) {
        projectHours[entry.projectName] = 0;
      }
      projectHours[entry.projectName] += entry.hours;
    });
    return Object.values(projectHours);
  })();
  
  // خيارات الرسم البياني لتوزيع النفقات
  const expenseChartOptions = {
    chart: {
      type: 'pie',
      fontFamily: 'Tajawal, Arial, sans-serif',
    },
    labels: [...new Set(filteredExpenses.map(expense => expense.category))],
    colors: [
      theme.palette.primary.main,
      theme.palette.secondary.main,
      theme.palette.success.main,
      theme.palette.warning.main,
      theme.palette.error.main,
    ],
    legend: {
      position: 'bottom',
      fontFamily: 'Tajawal, Arial, sans-serif',
    },
    responsive: [{
      breakpoint: 480,
      options: {
        chart: {
          width: 200
        },
        legend: {
          position: 'bottom'
        }
      }
    }]
  };
  
  // بيانات الرسم البياني لتوزيع النفقات
  const expenseChartSeries = (() => {
    const categoryExpenses = {};
    filteredExpenses.forEach(expense => {
      if (!categoryExpenses[expense.category]) {
        categoryExpenses[expense.category] = 0;
      }
      categoryExpenses[expense.category] += expense.amount;
    });
    return Object.values(categoryExpenses);
  })();
  
  return (
    <Container maxWidth="xl">
      <Box sx={{ pb: 5, pt: 3 }}>
        <Typography variant="h4" gutterBottom>
          نظام تتبع الوقت والتكاليف
        </Typography>
        <Typography variant="body2">
          تتبع ساعات العمل والمصروفات على المشاريع
        </Typography>
      </Box>
      
      {/* شريط الفلاتر */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={2.4}>
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
          <Grid item xs={12} md={2.4}>
            <FormControl 
              fullWidth 
              size="small" 
              disabled={selectedCompany === 'all'}
            >
              <InputLabel>الفرع</InputLabel>
              <Select value={selectedBranch} onChange={handleBranchChange} label="الفرع">
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
          <Grid item xs={12} md={2.4}>
            <FormControl 
              fullWidth 
              size="small" 
              disabled={selectedBranch === 'all'}
            >
              <InputLabel>المشروع</InputLabel>
              <Select value={selectedProject} onChange={handleProjectChange} label="المشروع">
                <MenuItem value="all">جميع المشاريع</MenuItem>
                {projects
                  .filter(project => 
                    (selectedBranch === 'all' || project.branchId === parseInt(selectedBranch)) &&
                    (selectedCompany === 'all' || project.companyId === parseInt(selectedCompany))
                  )
                  .map((project) => (
                    <MenuItem key={project.id} value={project.id}>
                      {project.name}
                    </MenuItem>
                  ))
                }
              </Select>
            </FormControl>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="من تاريخ"
                value={filterDateFrom}
                onChange={(newValue) => setFilterDateFrom(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </LocalizationProvider>
          </Grid>
          <Grid item xs={12} md={2.4}>
            <LocalizationProvider dateAdapter={AdapterDateFns}>
              <DatePicker
                label="إلى تاريخ"
                value={filterDateTo}
                onChange={(newValue) => setFilterDateTo(newValue)}
                renderInput={(params) => <TextField {...params} fullWidth size="small" />}
              />
            </LocalizationProvider>
          </Grid>
        </Grid>
      </Paper>
      
      {/* بطاقات KPI */}
      <Grid container spacing={3} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="إجمالي ساعات العمل"
            value={`${totalHours} ساعة`}
            icon={<AccessTimeIcon />}
            color={theme.palette.primary.main}
            growth="+12.5%"
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="إجمالي المصروفات"
            value={formatAmount(totalExpenses)}
            icon={<AttachMoneyIcon />}
            color={theme.palette.secondary.main}
            growth="+8.2%"
            trend="up"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="متوسط الساعات اليومي"
            value={`${averageHoursPerDay} ساعة`}
            icon={<DateRangeIcon />}
            color={theme.palette.success.main}
            growth="-5.3%"
            trend="down"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <KPICard
            title="متوسط تكلفة المشروع"
            value={formatAmount(averageExpensePerProject)}
            icon={<AttachMoneyIcon />}
            color={theme.palette.error.main}
            growth="+3.7%"
            trend="up"
          />
        </Grid>
      </Grid>
      
      {/* تبويبات الوقت والتكاليف */}
      <Box sx={{ mb: 3 }}>
        <Tabs 
          value={tabValue} 
          onChange={handleTabChange} 
          aria-label="تبويبات تتبع الوقت والتكاليف"
          variant="fullWidth"
          indicatorColor="primary"
          textColor="primary"
        >
          <Tab label="تسجيل الوقت" />
          <Tab label="تسجيل المصروفات" />
        </Tabs>
      </Box>
      
      {/* محتوى التبويبات */}
      <Grid container spacing={3}>
        {/* جدول البيانات */}
        <Grid item xs={12} md={8}>
          <Card>
            <CardContent sx={{ p: 0 }}>
              {/* تبويب تسجيل الوقت */}
              {tabValue === 0 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                    <Typography variant="h6">سجلات تسجيل الوقت</Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      size="small"
                    >
                      تسجيل وقت جديد
                    </Button>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>التاريخ</TableCell>
                          <TableCell>المشروع</TableCell>
                          <TableCell>الموظف</TableCell>
                          <TableCell>الساعات</TableCell>
                          <TableCell>الوصف</TableCell>
                          <TableCell>الحالة</TableCell>
                          <TableCell>الإجراءات</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(rowsPerPage > 0
                          ? filteredTimeEntries.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          : filteredTimeEntries
                        ).map((entry) => (
                          <TableRow key={entry.id} hover>
                            <TableCell>{formatDate(entry.date)}</TableCell>
                            <TableCell>{entry.projectName}</TableCell>
                            <TableCell>{entry.userName}</TableCell>
                            <TableCell>{entry.hours}</TableCell>
                            <TableCell>{entry.description}</TableCell>
                            <TableCell>
                              <Box
                                sx={{
                                  bgcolor: entry.approved ? 'success.main' : 'warning.main',
                                  color: 'white',
                                  py: 0.5,
                                  px: 1,
                                  borderRadius: 1,
                                  display: 'inline-block',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {entry.approved ? 'معتمد' : 'قيد المراجعة'}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <IconButton size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredTimeEntries.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="عدد الصفوف:"
                  />
                </>
              )}
              
              {/* تبويب تسجيل المصروفات */}
              {tabValue === 1 && (
                <>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', p: 2 }}>
                    <Typography variant="h6">سجلات المصروفات</Typography>
                    <Button
                      variant="contained"
                      startIcon={<AddIcon />}
                      size="small"
                    >
                      تسجيل مصروفات جديدة
                    </Button>
                  </Box>
                  <TableContainer>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell>التاريخ</TableCell>
                          <TableCell>المشروع</TableCell>
                          <TableCell>الفئة</TableCell>
                          <TableCell>المبلغ</TableCell>
                          <TableCell>الوصف</TableCell>
                          <TableCell>رقم الإيصال</TableCell>
                          <TableCell>الحالة</TableCell>
                          <TableCell>الإجراءات</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {(rowsPerPage > 0
                          ? filteredExpenses.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          : filteredExpenses
                        ).map((expense) => (
                          <TableRow key={expense.id} hover>
                            <TableCell>{formatDate(expense.date)}</TableCell>
                            <TableCell>{expense.projectName}</TableCell>
                            <TableCell>{expense.category}</TableCell>
                            <TableCell>{formatAmount(expense.amount)}</TableCell>
                            <TableCell>{expense.description}</TableCell>
                            <TableCell>{expense.receiptNumber}</TableCell>
                            <TableCell>
                              <Box
                                sx={{
                                  bgcolor: expense.approved ? 'success.main' : 'warning.main',
                                  color: 'white',
                                  py: 0.5,
                                  px: 1,
                                  borderRadius: 1,
                                  display: 'inline-block',
                                  fontSize: '0.75rem',
                                }}
                              >
                                {expense.approved ? 'معتمد' : 'قيد المراجعة'}
                              </Box>
                            </TableCell>
                            <TableCell>
                              <IconButton size="small">
                                <EditIcon fontSize="small" />
                              </IconButton>
                              <IconButton size="small">
                                <DeleteIcon fontSize="small" />
                              </IconButton>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                  <TablePagination
                    rowsPerPageOptions={[5, 10, 25]}
                    component="div"
                    count={filteredExpenses.length}
                    rowsPerPage={rowsPerPage}
                    page={page}
                    onPageChange={handleChangePage}
                    onRowsPerPageChange={handleChangeRowsPerPage}
                    labelRowsPerPage="عدد الصفوف:"
                  />
                </>
              )}
            </CardContent>
          </Card>
        </Grid>
        
        {/* الرسوم البيانية */}
        <Grid item xs={12} md={4}>
          <Grid container spacing={3} direction="column">
            <Grid item xs={12}>
              <Card>
                <CardHeader 
                  title={tabValue === 0 ? "توزيع الوقت حسب المشروع" : "توزيع المصروفات حسب الفئة"} 
                  titleTypographyProps={{ variant: 'h6' }}
                  action={
                    <IconButton>
                      <DownloadIcon />
                    </IconButton>
                  }
                />
                <Divider />
                <CardContent>
                  {tabValue === 0 ? (
                    timeChartSeries.length > 0 ? (
                      <Chart 
                        options={timeChartOptions} 
                        series={timeChartSeries} 
                        type="pie" 
                        height={300} 
                      />
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                        <Typography variant="body1" color="text.secondary">
                          لا توجد بيانات لعرضها
                        </Typography>
                      </Box>
                    )
                  ) : (
                    expenseChartSeries.length > 0 ? (
                      <Chart 
                        options={expenseChartOptions} 
                        series={expenseChartSeries} 
                        type="pie" 
                        height={300} 
                      />
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: 300 }}>
                        <Typography variant="body1" color="text.secondary">
                          لا توجد بيانات لعرضها
                        </Typography>
                      </Box>
                    )
                  )}
                </CardContent>
              </Card>
            </Grid>
            <Grid item xs={12}>
              <Card>
                <CardHeader 
                  title={tabValue === 0 ? "ملخص تسجيل الوقت" : "ملخص المصروفات"} 
                  titleTypographyProps={{ variant: 'h6' }}
                />
                <Divider />
                <CardContent>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {tabValue === 0 ? "إجمالي عدد السجلات:" : "إجمالي عدد المصروفات:"}
                    </Typography>
                    <Typography variant="h6">
                      {tabValue === 0 ? filteredTimeEntries.length : filteredExpenses.length}
                    </Typography>
                  </Box>
                  <Box sx={{ mb: 2 }}>
                    <Typography variant="body2" color="text.secondary">
                      {tabValue === 0 ? "متوسط الساعات لكل سجل:" : "متوسط المبلغ لكل مصروف:"}
                    </Typography>
                    <Typography variant="h6">
                      {tabValue === 0 
                        ? `${(totalHours / (filteredTimeEntries.length || 1)).toFixed(1)} ساعة` 
                        : formatAmount(totalExpenses / (filteredExpenses.length || 1))
                      }
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      {tabValue === 0 ? "الحالة:" : "الحالة:"}
                    </Typography>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1 }}>
                      <Box>
                        <Typography variant="body2">معتمد</Typography>
                        <Typography variant="h6">
                          {tabValue === 0 
                            ? filteredTimeEntries.filter(e => e.approved).length 
                            : filteredExpenses.filter(e => e.approved).length
                          }
                        </Typography>
                      </Box>
                      <Box>
                        <Typography variant="body2">قيد المراجعة</Typography>
                        <Typography variant="h6">
                          {tabValue === 0 
                            ? filteredTimeEntries.filter(e => !e.approved).length 
                            : filteredExpenses.filter(e => !e.approved).length
                          }
                        </Typography>
                      </Box>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          </Grid>
        </Grid>
      </Grid>
    </Container>
  );
};

export default TimeAndCostTracking; 
