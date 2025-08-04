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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Alert,
  Skeleton,
  ButtonGroup,
  CircularProgress
} from '@mui/material';
import {
  Assignment as AssignmentIcon,
  Receipt as ReceiptIcon,
  AttachMoney as MoneyIcon,
  AccountBalance as BalanceIcon,
  StickyNote2 as NotesIcon,
  PictureAsPdf as PdfIcon,
  TableView as ExcelIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { apiClient, API_BASE_URL } from '../api/config';
import { authUtils } from '../api/config';
import { 
  fetchCompanies, 
  fetchCompanySubProjects
} from '../api/database-api';
import { fetchSubscriptions } from '../api/subscriptions';

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
  const [error, setError] = useState<string | null>(null);
  
  // Data states
  const [stageNotes, setStageNotes] = useState([]);
  const [requests, setRequests] = useState([]);
  const [returns, setReturns] = useState([]);
  const [revenue, setRevenue] = useState([]);
  const [financialCustody, setFinancialCustody] = useState([]);
  
  // Pagination
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalItems, setTotalItems] = useState(0);
  const itemsPerPage = 10; // ثابت على 10 عناصر لكل صفحة
  
  // Filters
  const [projectFilter, setProjectFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // دوال معالجة تغيير الفلاتر
  const handleProjectFilterChange = (value: string) => {
    setProjectFilter(value);
    setPage(1); // إعادة تعيين الصفحة عند تغيير الفلتر
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    setPage(1); // إعادة تعيين الصفحة عند تغيير الفلتر
  };

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setActiveTab(newValue);
    setPage(1); // إعادة تعيين الصفحة إلى 1 عند تغيير التبويب
    setTotalItems(0);
    setTotalPages(1);
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
        case 'stage-notes':
          // استخدام API جلب المشاريع
          try {
            const result = await fetchCompanySubProjects('1', { limit: itemsPerPage, page: page });
            paginatedData = result.projects || [];
            total = result.pagination?.totalItems || paginatedData.length * 5; // تقدير للعدد الكلي
          } catch {
            paginatedData = [];
            total = 0;
          }
          break;
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
        case 'returns':
          // استخدام API آخر للمشاريع
          try {
            const result = await fetchCompanySubProjects('1', { limit: itemsPerPage, page: page });
            paginatedData = result.projects || [];
            total = result.pagination?.totalItems || paginatedData.length * 3; // تقدير للعدد الكلي
          } catch {
            paginatedData = [];
            total = 0;
          }
          break;
        case 'revenue':
          // استخدام API الشركات للإيرادات
          try {
            const result = await fetchCompanies({ limit: itemsPerPage, page: page });
            paginatedData = result.companies || [];
            pagination = result.pagination;
            total = pagination?.totalItems || 0;
            

          } catch (error) {
            console.error('❌ Error fetching companies for revenue:', error);
            paginatedData = [];
            total = 0;
          }
          break;
        case 'financial-custody':
          // استخدام API الاشتراكات
          try {
            const result = await fetchSubscriptions({ page: page, limit: itemsPerPage });
            paginatedData = result.data || [];
            total = result.totalCount || result.pagination?.totalItems || 0;
            

          } catch (error) {
            console.error('❌ Error fetching subscriptions:', error);
            paginatedData = [];
            total = 0;
          }
          break;
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

  const loadData = async (tabIndex: number) => {
    const filters = {
      ...(projectFilter && { projectId: projectFilter }),
      ...(statusFilter && { status: statusFilter })
    };

    switch (tabIndex) {
      case 0:
        const notes = await fetchData('stage-notes', filters);
        setStageNotes(notes);
        break;
      case 1:
        const reqs = await fetchData('requests', filters);
        setRequests(reqs);
        break;
      case 2:
        const rets = await fetchData('returns', filters);
        setReturns(rets);
        break;
      case 3:
        const revs = await fetchData('revenue', filters);
        setRevenue(revs);
        break;
      case 4:
        const custody = await fetchData('financial-custody', filters);
        setFinancialCustody(custody);
        break;
    }
  };

  // تحميل البيانات عند تغيير التبويب أو الصفحة أو الفلاتر
  useEffect(() => {
    loadData(activeTab);
  }, [activeTab, page, projectFilter, statusFilter]);

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

  const getStatusChip = (status: string) => {
    const statusMap = {
      'completed': { label: 'مكتمل', color: 'success' as const },
      'pending': { label: 'معلق', color: 'warning' as const },
      'approved': { label: 'موافق عليه', color: 'success' as const },
      'rejected': { label: 'مرفوض', color: 'error' as const },
      'true': { label: 'نشط', color: 'success' as const },
      'false': { label: 'غير نشط', color: 'default' as const }
    };
    
    const statusInfo = statusMap[status as keyof typeof statusMap] || { label: status, color: 'default' as const };
    
    return <Chip label={statusInfo.label} color={statusInfo.color} size="small" />;
  };

  // Get current tab data helper
  const getCurrentTabData = () => {
    switch (activeTab) {
      case 0: return stageNotes;
      case 1: return requests;
      case 2: return returns;
      case 3: return revenue;
      case 4: return financialCustody;
      default: return [];
    }
  };

  // Get tab name helper
  const getTabName = () => {
    const tabNames = [
      'بيانات المشاريع',
      'بيانات الشركات',
      'المشاريع الحديثة',
      'الشركات المشتركة',
      'بيانات الاشتراكات'
    ];
    return tabNames[activeTab] || 'البيانات';
  };

  // Export to Excel function
  const exportToExcel = () => {
    try {
      const currentData = getCurrentTabData();
      if (currentData.length === 0) {
        alert('لا توجد بيانات للتصدير');
        return;
      }

      // Prepare data based on active tab
      let worksheetData: any[] = [];
      let headers: string[] = [];

      switch (activeTab) {
        case 0: // Projects Data
          headers = ['رقم المشروع', 'اسم المشروع', 'الشركة', 'الاشتراك', 'الحالة', 'التقدم', 'التكلفة', 'تاريخ البداية'];
          worksheetData = currentData.map((item: any) => [
            item.id,
            item.Nameproject,
            item.NameCompany,
            item.NameSub,
            item.status,
            item.progress || 0,
            item.cost || 0,
            formatDate(item.ProjectStartdate)
          ]);
          break;
        case 1: // Companies Data
          headers = ['رقم الشركة', 'اسم الشركة', 'المدينة', 'البلد', 'السجل التجاري', 'عدد الفروع المسموحة', 'تاريخ بداية الاشتراك', 'تاريخ انتهاء الاشتراك'];
          worksheetData = currentData.map((item: any) => [
            item.id,
            item.NameCompany,
            item.City,
            item.Country,
            item.CommercialRegistrationNumber,
            item.NumberOFbranchesAllowed || 0,
            formatDate(item.SubscriptionStartDate),
            formatDate(item.SubscriptionEndDate)
          ]);
          break;
        case 2: // Recent Projects
          headers = ['رقم المشروع', 'اسم المشروع', 'الحالة', 'التقدم', 'الشركة', 'الاشتراك'];
          worksheetData = currentData.map((item: any) => [
            item.id,
            item.name,
            item.status,
            item.progress || 0,
            item.companyName,
            item.subName
          ]);
          break;
        case 3: // Recent Companies
          headers = ['رقم الشركة', 'اسم الشركة', 'المدينة', 'البلد', 'تاريخ بداية الاشتراك', 'تاريخ انتهاء الاشتراك', 'الحالة'];
          worksheetData = currentData.map((item: any) => [
            item.id,
            item.NameCompany,
            item.City,
            item.Country,
            formatDate(item.SubscriptionStartDate),
            formatDate(item.SubscriptionEndDate),
            'نشطة'
          ]);
          break;
        case 4: // Subscriptions
          headers = ['رقم الاشتراك', 'اسم الشركة', 'نوع الاشتراك', 'التكلفة', 'تاريخ البداية', 'تاريخ الانتهاء', 'الحالة'];
          worksheetData = currentData.map((item: any) => [
            item.id,
            item.companyName || 'غير محدد',
            item.type || 'اشتراك عادي',
            item.price || 0,
            formatDate(item.startDate),
            formatDate(item.endDate),
            item.status || 'active'
          ]);
          break;
      }

      // Create workbook and worksheet
      const ws = XLSX.utils.aoa_to_sheet([headers, ...worksheetData]);
      const wb = XLSX.utils.book_new();
      
      // Set column widths
      ws['!cols'] = headers.map(() => ({ wch: 15 }));
      
      XLSX.utils.book_append_sheet(wb, ws, getTabName());
      
      // Generate filename
      const fileName = `${getTabName()}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.xlsx`;
      
      // Save file
      XLSX.writeFile(wb, fileName);
    } catch (error) {
      console.error('خطأ في تصدير Excel:', error);
      alert('حدث خطأ في تصدير ملف Excel');
    }
  };

  // Export to PDF function with Arabic support
  const exportToPDF = () => {
    try {
      const currentData = getCurrentTabData();
      if (currentData.length === 0) {
        alert('لا توجد بيانات للتصدير');
        return;
      }

      const doc = new jsPDF('l', 'mm', 'a4'); // Landscape orientation
      
      // Add title
      doc.setFontSize(16);
      doc.text(`Report: ${getTabName()}`, 200, 20, { align: 'center' });
      
      // Add date
      doc.setFontSize(12);
      doc.text(`Date: ${new Date().toLocaleDateString('en-GB')}`, 200, 30, { align: 'center' });
      
      // Prepare table data
      let columns: string[] = [];
      let rows: any[][] = [];

      switch (activeTab) {
        case 0: // Projects Data
          columns = ['Project ID', 'Project Name', 'Company', 'Subscription', 'Status', 'Progress', 'Cost', 'Start Date'];
          rows = currentData.map((item: any) => [
            item.id || '',
            (item.Nameproject || '').substring(0, 20),
            (item.NameCompany || '').substring(0, 15),
            (item.NameSub || '').substring(0, 15),
            item.status || '',
            `${item.progress || 0}%`,
            `${item.cost || 0} SAR`,
            formatDate(item.ProjectStartdate)
          ]);
          break;
        case 1: // Companies Data
          columns = ['Company ID', 'Company Name', 'City', 'Country', 'Registration', 'Branches Allowed', 'Start Date', 'End Date'];
          rows = currentData.map((item: any) => [
            item.id || '',
            (item.NameCompany || '').substring(0, 15),
            (item.City || '').substring(0, 10),
            (item.Country || '').substring(0, 10),
            (item.CommercialRegistrationNumber || '').substring(0, 15),
            item.NumberOFbranchesAllowed || 0,
            formatDate(item.SubscriptionStartDate),
            formatDate(item.SubscriptionEndDate)
          ]);
          break;
        case 2: // Recent Projects
          columns = ['Project ID', 'Project Name', 'Status', 'Progress', 'Company', 'Subscription'];
          rows = currentData.map((item: any) => [
            item.id || '',
            (item.name || '').substring(0, 20),
            item.status || '',
            `${item.progress || 0}%`,
            (item.companyName || '').substring(0, 15),
            (item.subName || '').substring(0, 15)
          ]);
          break;
        case 3: // Recent Companies
          columns = ['Company ID', 'Company Name', 'City', 'Country', 'Start Date', 'End Date', 'Status'];
          rows = currentData.map((item: any) => [
            item.id || '',
            (item.NameCompany || '').substring(0, 15),
            (item.City || '').substring(0, 10),
            (item.Country || '').substring(0, 10),
            formatDate(item.SubscriptionStartDate),
            formatDate(item.SubscriptionEndDate),
            'Active'
          ]);
          break;
        case 4: // Subscriptions
          columns = ['Sub ID', 'Company Name', 'Type', 'Price', 'Start Date', 'End Date', 'Status'];
          rows = currentData.map((item: any) => [
            item.id || '',
            (item.companyName || 'Unknown').substring(0, 15),
            (item.type || 'Standard').substring(0, 15),
            `${item.price || 0} SAR`,
            formatDate(item.startDate),
            formatDate(item.endDate),
            item.status || 'active'
          ]);
          break;
      }

      // Add table to PDF
      (doc as any).autoTable({
        head: [columns],
        body: rows,
        startY: 40,
        theme: 'grid',
        styles: {
          fontSize: 8,
          cellPadding: 2,
        },
        headStyles: {
          fillColor: [41, 128, 185],
          textColor: 255,
          fontSize: 9,
          fontStyle: 'bold'
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245]
        }
      });

      // Add statistics
      const finalY = (doc as any).lastAutoTable?.finalY || 100;
      doc.setFontSize(12);
      doc.text('Statistics:', 20, finalY + 20);
      doc.setFontSize(10);
      doc.text(`Total Records: ${currentData.length}`, 20, finalY + 30);
      doc.text(`Export Date: ${new Date().toLocaleString('en-GB')}`, 20, finalY + 40);

      // Save PDF
      const fileName = `${getTabName()}_${new Date().toLocaleDateString('en-GB').replace(/\//g, '-')}.pdf`;
      doc.save(fileName);
    } catch (error) {
      console.error('خطأ في تصدير PDF:', error);
      alert('حدث خطأ في تصدير ملف PDF');
    }
  };

  // مكون pagination محسن للمميزات المتقدمة
  const renderAdvancedPaginationControls = () => {
    if (totalItems === 0) {
      return (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'warning.light', borderRadius: 1, textAlign: 'center' }}>
          <Typography variant="body2" color="warning.contrastText">
            📭 لا توجد بيانات لعرضها في هذا التبويب
          </Typography>
        </Box>
      );
    }

    const startIndex = (page - 1) * itemsPerPage + 1;
    const endIndex = Math.min(page * itemsPerPage, totalItems);

    if (totalPages === 1) {
      return (
        <Box sx={{ mt: 3, p: 2, bgcolor: 'info.light', borderRadius: 1, textAlign: 'center' }}>
          <Typography variant="body2" color="info.contrastText">
            📄 صفحة واحدة فقط - عرض {totalItems} عنصر من أصل {totalItems}
          </Typography>
        </Box>
      );
    }

    return (
      <Box sx={{ mt: 3, p: 2, bgcolor: 'primary.light', borderRadius: 1 }}>
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} sm={6} md={3}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Typography variant="body2" color="primary.contrastText">
                📄 {itemsPerPage} عنصر لكل صفحة
              </Typography>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={6} md={6}>
            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 1 }}>
              <Button
                size="small"
                variant="outlined"
                disabled={page === 1}
                onClick={() => setPage(page - 1)}
                sx={{ color: 'primary.contrastText', borderColor: 'primary.contrastText' }}
              >
                السابق
              </Button>
              
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = i + 1;
                } else if (page <= 3) {
                  pageNum = i + 1;
                } else if (page >= totalPages - 2) {
                  pageNum = totalPages - 4 + i;
                } else {
                  pageNum = page - 2 + i;
                }
                
                return (
                  <Button
                    key={pageNum}
                    size="small"
                    variant={page === pageNum ? 'contained' : 'outlined'}
                    onClick={() => setPage(pageNum)}
                    sx={{ 
                      minWidth: 40,
                      color: page === pageNum ? 'primary.main' : 'primary.contrastText',
                      borderColor: 'primary.contrastText',
                      bgcolor: page === pageNum ? 'white' : 'transparent'
                    }}
                  >
                    {pageNum}
                  </Button>
                );
              })}
              
              <Button
                size="small"
                variant="outlined"
                disabled={page === totalPages}
                onClick={() => setPage(page + 1)}
                sx={{ color: 'primary.contrastText', borderColor: 'primary.contrastText' }}
              >
                التالي
              </Button>
            </Box>
          </Grid>
          
          <Grid item xs={12} sm={12} md={3}>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Typography variant="body2" color="primary.contrastText">
                عرض {startIndex} - {endIndex} من {totalItems} عنصر
              </Typography>
              <Typography variant="body2" color="secondary.main" sx={{ fontWeight: 'bold' }}>
                📋 إجمالي الصفحات: {totalPages}
              </Typography>
            </Box>
          </Grid>
        </Grid>
      </Box>
    );
  };

  const renderStageNotes = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>رقم المشروع</TableCell>
            <TableCell>اسم المشروع</TableCell>
            <TableCell>الشركة</TableCell>
            <TableCell>الاشتراك</TableCell>
            <TableCell>الحالة</TableCell>
            <TableCell>التقدم</TableCell>
            <TableCell>التكلفة</TableCell>
            <TableCell>تاريخ البداية</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {stageNotes.map((project: any) => (
            <TableRow key={project.id}>
              <TableCell>{project.id}</TableCell>
              <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {project.Nameproject}
              </TableCell>
              <TableCell>{project.NameCompany}</TableCell>
              <TableCell>{project.NameSub}</TableCell>
              <TableCell>{getStatusChip(project.status)}</TableCell>
              <TableCell>
                <Chip 
                  label={`${project.progress || 0}%`} 
                  color={project.progress > 50 ? 'success' : 'warning'} 
                  size="small" 
                />
              </TableCell>
              <TableCell>{formatAmount(project.cost || 0)}</TableCell>
              <TableCell>{formatDate(project.ProjectStartdate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderRequests = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>رقم الشركة</TableCell>
            <TableCell>اسم الشركة</TableCell>
            <TableCell>المدينة</TableCell>
            <TableCell>البلد</TableCell>
            <TableCell>السجل التجاري</TableCell>
            <TableCell>عدد الفروع المسموحة</TableCell>
            <TableCell>تاريخ بداية الاشتراك</TableCell>
            <TableCell>تاريخ انتهاء الاشتراك</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {requests.map((company: any) => (
            <TableRow key={company.id}>
              <TableCell>{company.id}</TableCell>
              <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {company.NameCompany}
              </TableCell>
              <TableCell>{company.City}</TableCell>
              <TableCell>{company.Country}</TableCell>
              <TableCell>{company.CommercialRegistrationNumber}</TableCell>
              <TableCell>
                <Chip 
                  label={company.NumberOFbranchesAllowed || 0} 
                  color="primary" 
                  size="small" 
                />
              </TableCell>
              <TableCell>{formatDate(company.SubscriptionStartDate)}</TableCell>
              <TableCell>{formatDate(company.SubscriptionEndDate)}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderReturns = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>رقم المشروع</TableCell>
            <TableCell>اسم المشروع</TableCell>
            <TableCell>الحالة</TableCell>
            <TableCell>التقدم</TableCell>
            <TableCell>الشركة</TableCell>
            <TableCell>الاشتراك</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {returns.map((project: any) => (
            <TableRow key={project.id}>
              <TableCell>{project.id}</TableCell>
              <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {project.name}
              </TableCell>
              <TableCell>{getStatusChip(project.status)}</TableCell>
              <TableCell>
                <Chip 
                  label={`${project.progress || 0}%`} 
                  color={project.progress > 50 ? 'success' : 'warning'} 
                  size="small" 
                />
              </TableCell>
              <TableCell>{project.companyName}</TableCell>
              <TableCell>{project.subName}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  const renderRevenue = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>رقم الشركة</TableCell>
            <TableCell>اسم الشركة</TableCell>
            <TableCell>المدينة</TableCell>
            <TableCell>البلد</TableCell>
            <TableCell>تاريخ بداية الاشتراك</TableCell>
            <TableCell>تاريخ انتهاء الاشتراك</TableCell>
            <TableCell>حالة الشركة</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {revenue.map((company: any) => (
            <TableRow key={company.id}>
              <TableCell>{company.id}</TableCell>
              <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {company.NameCompany}
              </TableCell>
              <TableCell>{company.City}</TableCell>
              <TableCell>{company.Country}</TableCell>
              <TableCell>{formatDate(company.SubscriptionStartDate)}</TableCell>
              <TableCell>{formatDate(company.SubscriptionEndDate)}</TableCell>
              <TableCell>
                <Chip 
                  label="نشطة" 
                  color="success" 
                  size="small" 
                />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );



  const renderFinancialCustody = () => (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>رقم الاشتراك</TableCell>
            <TableCell>اسم الشركة</TableCell>
            <TableCell>نوع الاشتراك</TableCell>
            <TableCell>التكلفة</TableCell>
            <TableCell>تاريخ البداية</TableCell>
            <TableCell>تاريخ الانتهاء</TableCell>
            <TableCell>الحالة</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {financialCustody.map((subscription: any) => (
            <TableRow key={subscription.id}>
              <TableCell>{subscription.id}</TableCell>
              <TableCell sx={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                {subscription.companyName || 'غير محدد'}
              </TableCell>
              <TableCell>{subscription.type || 'اشتراك عادي'}</TableCell>
              <TableCell>{formatAmount(subscription.price || 0)}</TableCell>
              <TableCell>{formatDate(subscription.startDate)}</TableCell>
              <TableCell>{formatDate(subscription.endDate)}</TableCell>
              <TableCell>{getStatusChip(subscription.status || 'active')}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" component="h1">
          الميزات المتقدمة
        </Typography>
        <Chip 
          label={loading ? 'جاري التحميل...' : `إجمالي السجلات: ${totalItems}`}
          color="primary" 
          variant="outlined"
          sx={{ fontSize: '1rem', fontWeight: 'bold' }}
          icon={loading ? <CircularProgress size={16} /> : undefined}
        />
      </Box>
      
      <Card sx={{ mb: 3 }}>
        <CardContent>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} md={4}>
              <TextField
                fullWidth
                label="فلترة حسب رقم المشروع"
                value={projectFilter}
                onChange={(e) => handleProjectFilterChange(e.target.value)}
                size="small"
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <FormControl fullWidth size="small">
                <InputLabel>فلترة حسب الحالة</InputLabel>
                <Select
                  value={statusFilter}
                  onChange={(e) => handleStatusFilterChange(e.target.value)}
                  label="فلترة حسب الحالة"
                >
                  <MenuItem value="">الكل</MenuItem>
                  <MenuItem value="true">مكتمل</MenuItem>
                  <MenuItem value="false">معلق</MenuItem>
                  <MenuItem value="approved">موافق عليه</MenuItem>
                  <MenuItem value="rejected">مرفوض</MenuItem>
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} md={4}>
              <ButtonGroup variant="contained" fullWidth disabled={loading}>
                <Button 
                  onClick={() => loadData(activeTab)}
                  sx={{ flexGrow: 2 }}
                >
                  تحديث البيانات
                </Button>
                <Button 
                  onClick={exportToExcel}
                  startIcon={<ExcelIcon />}
                  disabled={getCurrentTabData().length === 0}
                  color="success"
                  title="تصدير إلى Excel"
                >
                  Excel
                </Button>
                <Button 
                  onClick={exportToPDF}
                  startIcon={<PdfIcon />}
                  disabled={getCurrentTabData().length === 0}
                  color="error"
                  title="تصدير إلى PDF"
                >
                  PDF
                </Button>
              </ButtonGroup>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Alert severity="info" sx={{ mb: 3 }}>
        <Typography variant="body2">
          📅 <strong>ملاحظة:</strong> جميع التواريخ معروضة بالتقويم الميلادي • 📊 يمكنك تصدير البيانات بصيغة Excel أو PDF • 📄 يتم عرض 10 عناصر لكل صفحة 
          {totalPages > 1 && ` • 📑 ${totalPages} صفحة متاحة للتنقل`}
          {totalPages === 1 && totalItems > 0 && ` • 📄 صفحة واحدة فقط (${totalItems} عنصر)`}
        </Typography>
      </Alert>

      <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
        <Tabs value={activeTab} onChange={handleTabChange} variant="scrollable" scrollButtons="auto">
          <Tab icon={<NotesIcon />} label="بيانات المشاريع" />
          <Tab icon={<AssignmentIcon />} label="بيانات الشركات" />
          <Tab icon={<ReceiptIcon />} label="المشاريع الحديثة" />
          <Tab icon={<MoneyIcon />} label="الشركات المشتركة" />
          <Tab icon={<BalanceIcon />} label="بيانات الاشتراكات" />
        </Tabs>
      </Box>

      <TabPanel value={activeTab} index={0}>
        {loading ? <Skeleton variant="rectangular" height={400} /> : renderStageNotes()}
      </TabPanel>
      
      <TabPanel value={activeTab} index={1}>
        {loading ? <Skeleton variant="rectangular" height={400} /> : renderRequests()}
      </TabPanel>
      
      <TabPanel value={activeTab} index={2}>
        {loading ? <Skeleton variant="rectangular" height={400} /> : renderReturns()}
      </TabPanel>
      
      <TabPanel value={activeTab} index={3}>
        {loading ? <Skeleton variant="rectangular" height={400} /> : renderRevenue()}
      </TabPanel>
      
      <TabPanel value={activeTab} index={4}>
        {loading ? <Skeleton variant="rectangular" height={400} /> : renderFinancialCustody()}
      </TabPanel>

      {renderAdvancedPaginationControls()}
    </Container>
  );
};

export default AdvancedFeatures;
 
