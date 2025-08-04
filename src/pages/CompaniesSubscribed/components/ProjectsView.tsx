import React, { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Typography,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  TextField,
  InputAdornment,
  Chip,
  Avatar,
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Skeleton,
  Alert,
  CircularProgress,
  Pagination,
  Tooltip,
  Grid,
  Card,
  CardContent,
  CardActions,
  FormControlLabel,
  Switch,
} from "@mui/material";
import {
  Search as SearchIcon,
  Assignment as ProjectIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  LocationOn as LocationIcon,
  CalendarToday as CalendarIcon,
  Engineering as EngineeringIcon,
  Description as DescriptionIcon,
} from "@mui/icons-material";
import { companiesSubscribedApi, Company, Branch, Project } from "../api";

interface ProjectsViewProps {
  company: Company;
  branch: Branch;
  onProjectSelect: (project: Project) => void;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
  showMessage: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({
  company,
  branch,
  onProjectSelect,
  onLoading,
  onError,
  showMessage,
}) => {
  // State إدارة البيانات
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [showDisabledProjects, setShowDisabledProjects] = useState(false); // افتراضياً نعرض المشاريع النشطة فقط
  const [totalPages, setTotalPages] = useState(1);
  const [pageLastIds, setPageLastIds] = useState<{[key: number]: number}>({1: 0}); // تتبع last_id لكل صفحة
  const [hasNextPage, setHasNextPage] = useState(false); // تتبع وجود صفحة تالية
  const [totalProjectsLoaded, setTotalProjectsLoaded] = useState(0); // عدد المشاريع المحملة
  const [localLoading, setLocalLoading] = useState(false);
  
  // State النوافذ المنبثقة
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<Project | null>(null);
  const [formData, setFormData] = useState({
    Nameproject: "",
    Note: "",
    TypeOFContract: "",
    GuardNumber: 0,
    LocationProject: "",
    ProjectStartdate: "",
    numberBuilding: 0,
    Referencenumber: 0,
  });

  // أنواع العقود المتاحة
  const contractTypes = [
    "عقد مقاولة",
    "عقد توريد",
    "عقد صيانة",
    "عقد استشارات",
    "عقد تشغيل",
    "عقد إدارة",
    "عقد مشاركة",
    "عقد إيجار",
    "عقد بيع",
    "أخرى",
  ];

  // تحميل المشاريع باستخدام نظام الدفعات المحسن
  const loadProjects = async (page = 1, resetPagination = false) => {
    try {
      setLocalLoading(true);
      onLoading(true);
      onError(null);

      // إعادة تعيين البيانات إذا طُلب ذلك
      if (resetPagination) {
        setPageLastIds({1: 0});
        setCurrentPage(1);
        setTotalPages(1);
        setHasNextPage(false);
        setTotalProjectsLoaded(0);
        page = 1;
      }

      // الحصول على last_id للصفحة المطلوبة
      const lastIdForPage = pageLastIds[page] || 0;

        

      const response = await companiesSubscribedApi.getBranchProjects(
        branch.companyId,
        branch.id,
        lastIdForPage,
        10,  // 10 مشاريع لكل صفحة
        showDisabledProjects  // إظهار المشاريع المُعطَّلة حسب الاختيار
      );

      if (response.success) {
        const newProjects = response.data || [];
        

        
        // استبدال المشاريع بمشاريع الصفحة الجديدة
        setProjects(newProjects);
        setCurrentPage(page);

        // تحديث إجمالي المشاريع المحملة
        setTotalProjectsLoaded(prev => {
          if (resetPagination) return newProjects.length;
          return page === 1 ? newProjects.length : prev + newProjects.length;
        });

        // تحديث معلومات الترقيم (نظام ديناميكي مفتوح)
        if (newProjects.length > 0) {
          const lastProjectId = newProjects[newProjects.length - 1].id;
          
          // حفظ last_id للصفحة التالية إذا حصلنا على العدد الكامل (10)
          if (newProjects.length === 10) {
          setPageLastIds(prev => ({
            ...prev,
            [page + 1]: lastProjectId
          }));
            setHasNextPage(true);
            // توسيع إجمالي الصفحات بشكل ديناميكي لدعم عدد غير محدود من المشاريع
            setTotalPages(Math.max(totalPages, page + 1)); // إضافة صفحة واحدة إضافية
          } else {
            // إذا حصلنا على أقل من 10، هذه قد تكون الصفحة الأخيرة
            setHasNextPage(false);
            setTotalPages(Math.max(page, totalPages));
          }
        } else {
          // لا توجد مشاريع
          if (page === 1) {
            setTotalPages(1);
            setHasNextPage(false);
          } else {
            // صفحة فارغة، لكن قد توجد صفحات أخرى
            // في النظام المفتوح، نحافظ على إمكانية الوصول لصفحات أخرى

            setHasNextPage(false);
            // إبقاء إجمالي الصفحات مرناً
            if (page < totalPages) {
              // لا نغير إجمالي الصفحات إذا كنا في صفحة وسطى
            } else {
              // في النظام المفتوح، نبقي إمكانية الوصول لصفحات إضافية
              setTotalPages(Math.max(page - 1, 1));
            }
          }
        }
        

      } else {
        throw new Error(response.error || "حدث خطأ أثناء تحميل المشاريع");
      }
    } catch (error: any) {
      console.error("خطأ في تحميل المشاريع:", error);
      onError(error.message || "حدث خطأ أثناء تحميل المشاريع");
      
      // في حالة الخطأ، إذا لم نكن في الصفحة الأولى، ارجع للصفحة السابقة
      if (page > 1) {
        setCurrentPage(page - 1);
        setTotalPages(Math.max(1, page - 1));
      }
    } finally {
      setLocalLoading(false);
      onLoading(false);
    }
  };



  // التنقل بين الصفحات المحسن للصفحات المتقدمة
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    if (!localLoading && page !== currentPage && page >= 1) {
              console.log('تغيير الصفحة:', {
        fromPage: currentPage,
        toPage: page,
        availablePageLastIds: Object.keys(pageLastIds),
        targetPageLastId: pageLastIds[page]
      });
      
      // للصفحة الأولى أو الصفحات المحفوظة في pageLastIds
      if (page === 1 || pageLastIds[page] !== undefined) {
      loadProjects(page);
      } else {
        // للصفحات المتقدمة، احسب last_id بناءً على الصفحات السابقة
        console.log('🔢 حساب last_id للصفحة المتقدمة:', page);
        
        // ابحث عن أقرب صفحة محفوظة
        let nearestPage = 1;
        let nearestLastId = 0;
        
        for (let i = 1; i < page; i++) {
          if (pageLastIds[i] !== undefined) {
            nearestPage = i;
            nearestLastId = pageLastIds[i];
          }
        }
        


        // احسب last_id تقريبي (كل صفحة = 10 مشاريع)
        const calculatedLastId = nearestLastId + ((page - nearestPage) * 10);
        
        // احفظ القيمة المحسوبة وحمّل الصفحة
        setPageLastIds(prev => ({
          ...prev,
          [page]: calculatedLastId
        }));
        
        loadProjects(page);
      }
    }
  };

  // البحث في المشاريع - محلي مع إعادة تحميل عند المسح
  const handleSearch = (term: string) => {
    setSearchTerm(term);
        
    
    // إذا تم مسح البحث، إعادة تحميل البيانات من البداية
    if (!term.trim()) {
      loadProjects(1, true);  // إعادة تعيين كامل للترقيم
    }
    // البحث الفعلي يتم عبر فلترة البيانات في العرض
  };

  // فتح نافذة إضافة/تعديل مشروع
  const openProjectDialog = (project?: Project) => {
    if (project) {
      setEditingProject(project);
      setFormData({
        Nameproject: project.Nameproject,
        Note: project.Note || "",
        TypeOFContract: project.TypeOFContract,
        GuardNumber: project.GuardNumber || 0,
        LocationProject: project.LocationProject || "",
        ProjectStartdate: project.ProjectStartdate ? new Date(project.ProjectStartdate).toISOString().split('T')[0] : "",
        numberBuilding: project.numberBuilding || 0,
        Referencenumber: project.Referencenumber || 0,
      });
    } else {
      setEditingProject(null);
      setFormData({
        Nameproject: "",
        Note: "",
        TypeOFContract: "عقد مقاولة",
        GuardNumber: 0,
        LocationProject: "",
        ProjectStartdate: new Date().toISOString().split('T')[0],
        numberBuilding: 0,
        Referencenumber: 0,
      });
    }
    setDialogOpen(true);
  };

  // حفظ المشروع مع إعادة تحميل محسنة
  const handleSaveProject = async () => {
    try {
      onLoading(true);
      let response;

      if (editingProject) {
        // تعديل مشروع موجود
        response = await companiesSubscribedApi.updateProject({
          id: editingProject.id,
          ...formData,
        });
      } else {
        // إضافة مشروع جديد
        response = await companiesSubscribedApi.createProject({
          IDcompanySub: branch.id,
          ...formData,
        });
      }

      if (response.success) {
        showMessage(
          editingProject ? "تم تحديث المشروع بنجاح" : "تم إضافة المشروع بنجاح",
          "success"
        );
        setDialogOpen(false);
        
        // إعادة تحميل البيانات من البداية للحصول على أحدث البيانات
        loadProjects(1, true);
      } else {
        throw new Error(response.error || "حدث خطأ أثناء حفظ المشروع");
      }
    } catch (error: any) {
      console.error("خطأ في حفظ المشروع:", error);
      onError(error.message || "حدث خطأ أثناء حفظ المشروع");
    } finally {
      onLoading(false);
    }
  };

  // حذف مشروع مع إعادة تحميل محسنة
  const handleDeleteProject = async (project: Project) => {
    if (!window.confirm(`هل أنت متأكد من حذف مشروع "${project.Nameproject}"؟\nسيتم حذف جميع البيانات المرتبطة به.`)) {
      return;
    }

    try {
      onLoading(true);
      const response = await companiesSubscribedApi.deleteProject(project.id);

      if (response.success) {
        showMessage("تم حذف المشروع بنجاح", "success");
        
        // إعادة تحميل الصفحة الحالية أو الصفحة السابقة إذا كانت الحالية فارغة
        const remainingProjects = projects.filter(p => p.id !== project.id);
        if (remainingProjects.length === 0 && currentPage > 1) {
          // إذا لم تعد هناك مشاريع في الصفحة الحالية، انتقل للصفحة السابقة
          loadProjects(currentPage - 1);
        } else {
          // أعد تحميل الصفحة الحالية
          loadProjects(currentPage);
        }
      } else {
        throw new Error(response.error || "حدث خطأ أثناء حذف المشروع");
      }
    } catch (error: any) {
      console.error("خطأ في حذف المشروع:", error);
      onError(error.message || "حدث خطأ أثناء حذف المشروع");
    } finally {
      onLoading(false);
    }
  };

  // تحديد لون الحالة بناءً على حالة المشروع (تصحيح حسب البيانات الفعلية)
  const getProjectStatusColor = (disabled: any) => {
    // تحقق من جميع الاحتمالات الممكنة
    const isActive = disabled === true || disabled === 'true' || Number(disabled) === 1 || disabled === '1';
    return isActive ? "success" : "error";
  };

  // تحديد نص الحالة (تصحيح حسب البيانات الفعلية)
  const getProjectStatusText = (disabled: any) => {
    // تحقق من جميع الاحتمالات الممكنة
    const isActive = disabled === true || disabled === 'true' || Number(disabled) === 1 || disabled === '1';
    return isActive ? "نشط" : "متوقف";
  };

  // تحميل البيانات عند تغيير الفرع مع إعادة تعيين كامل للنظام المفتوح
  useEffect(() => {
    // في النظام المفتوح، نبدأ بتقدير أولي مرن للصفحات
    setTotalPages(20); // تقدير أولي مرن يمكن توسيعه
    loadProjects(1, true);
  }, [branch.id]);

  // إعادة تحميل المشاريع عند تغيير إعداد إظهار المشاريع المُعطَّلة
  useEffect(() => {
    if (branch.id) {
      setCurrentPage(1);
      setPageLastIds({1: 0});
      loadProjects(1, true);
    }
  }, [showDisabledProjects]);

  // فلترة المشاريع للبحث المحلي
  const filteredProjects = projects.filter(project => {
    if (!searchTerm.trim()) return true;
    const term = searchTerm.toLowerCase();
    return (
      project.Nameproject.toLowerCase().includes(term) ||
      project.TypeOFContract.toLowerCase().includes(term) ||
      (project.LocationProject && project.LocationProject.toLowerCase().includes(term)) ||
      (project.Note && project.Note.toLowerCase().includes(term)) ||
      (project.Referencenumber && project.Referencenumber.toString().includes(term))
    );
  });

  // مكون عرض المشروع
  const ProjectCard: React.FC<{ project: Project }> = ({ project }) => (
    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <CardContent sx={{ flex: 1 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
          <Avatar sx={{ bgcolor: 'info.main', mr: 2 }}>
            <ProjectIcon />
          </Avatar>
          <Box sx={{ flex: 1 }}>
            <Typography variant="h6" component="h3" noWrap title={project.Nameproject}>
              {project.Nameproject}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {project.TypeOFContract}
            </Typography>
          </Box>
        </Box>

        {project.LocationProject && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <LocationIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" noWrap>
              {project.LocationProject}
            </Typography>
          </Box>
        )}

        {project.ProjectStartdate && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <CalendarIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              {new Date(project.ProjectStartdate).toLocaleDateString('en-GB')}
            </Typography>
          </Box>
        )}

        {project.GuardNumber > 0 && (
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
            <EngineeringIcon sx={{ fontSize: 16, mr: 1, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary">
              رقم الحارس: {project.GuardNumber}
            </Typography>
          </Box>
        )}

        {project.Note && (
          <Box sx={{ display: 'flex', alignItems: 'flex-start', mb: 2 }}>
            <DescriptionIcon sx={{ fontSize: 16, mr: 1, mt: 0.5, color: 'text.secondary' }} />
            <Typography variant="body2" color="text.secondary" sx={{ 
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}>
              {project.Note}
            </Typography>
          </Box>
        )}

        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip 
            label={getProjectStatusText(project.Disabled)}
            color={getProjectStatusColor(project.Disabled)}
            size="small"
          />
          {project.Referencenumber > 0 && (
            <Chip 
              label={`مرجع: ${project.Referencenumber}`}
              variant="outlined"
              size="small"
            />
          )}
          {project.numberBuilding > 0 && (
            <Chip 
              label={`مبنى: ${project.numberBuilding}`}
              variant="outlined"
              size="small"
            />
          )}
        </Box>
      </CardContent>

      <CardActions sx={{ justifyContent: 'space-between', p: 2 }}>
        <Button
          startIcon={<ViewIcon />}
          onClick={() => onProjectSelect(project)}
          size="small"
          variant="contained"
        >
          عرض التفاصيل
        </Button>
        
        <Box>
          <IconButton 
            size="small" 
            onClick={() => openProjectDialog(project)}
            title="تعديل"
          >
            <EditIcon fontSize="small" />
          </IconButton>
          <IconButton 
            size="small" 
            onClick={() => handleDeleteProject(project)}
            title="حذف"
            color="error"
          >
            <DeleteIcon fontSize="small" />
          </IconButton>
        </Box>
      </CardActions>
    </Card>
  );

  return (
    <Box>
      {/* معلومات الفرع */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
        <Typography variant="h5" gutterBottom>
          🏗️ مشاريع فرع: {branch.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2">
            🏢 الشركة: {company.name}
          </Typography>
          <Typography variant="body2">
            📍 العنوان: {branch.address || "غير محدد"}
          </Typography>
          <Typography variant="body2">
            إجمالي المشاريع: {projects.length}
          </Typography>
          <Typography variant="body2">
            👨‍💼 المدير: {branch.manager || "غير محدد"}
          </Typography>
        </Box>
      </Paper>

      {/* شريط البحث والإضافة */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="البحث في المشاريع..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            sx={{ flex: 1, minWidth: 300 }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={showDisabledProjects}
                onChange={(e) => setShowDisabledProjects(e.target.checked)}
                color="warning"
              />
            }
            label="إظهار المشاريع المتوقفة أيضاً"
            sx={{ whiteSpace: 'nowrap' }}
          />
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openProjectDialog()}
          >
            إضافة مشروع جديد
          </Button>
        </Box>
      </Paper>



      {/* إحصائيات المشاريع المحسنة */}
      {projects.length > 0 && (
        <Paper sx={{ p: 2, mb: 2, backgroundColor: 'primary.light', color: 'white' }}>
          <Grid container spacing={2} alignItems="center">
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                إحصائيات المشاريع
              </Typography>
              <Typography variant="body1">
                المشاريع في الصفحة: {filteredProjects.length} من {projects.length}
              </Typography>
              <Typography variant="body2">
                {searchTerm ? `نتائج البحث عن: "${searchTerm}"` : 'جميع المشاريع'}
              </Typography>
              <Typography variant="body2">
                👁️ حالة العرض: {showDisabledProjects ? 'جميع المشاريع (النشطة + المتوقفة)' : 'المشاريع النشطة فقط'}
              </Typography>
              <Typography variant="body2">
                الصفحة التالية: {hasNextPage ? 'متوفرة' : 'غير متوفرة'}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ textAlign: { xs: 'left', sm: 'right' } }}>
              <Typography variant="body2">
                🏢 الفرع: {branch.name}
              </Typography>
              <Typography variant="body2">
                🏭 الشركة: {company.name}
              </Typography>
              <Typography variant="body2">
                الصفحة الحالية: {projects.length} مشروع
              </Typography>
              <Typography variant="body2">
                الصفحة {currentPage} من {totalPages} {hasNextPage && '(+)'}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
      )}





      {/* أرقام الصفحات الذكية - عرض البيانات الفعلية فقط */}
      {(totalPages > 1 || hasNextPage) && !searchTerm.trim() && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages} // عدد ذكي يعرض الصفحات التي تحتوي على بيانات فقط
            page={Math.min(currentPage, totalPages)}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton={false}
            showLastButton={false}
            disabled={localLoading}
            siblingCount={1} // عرض صفحة واحدة على كل جانب
            boundaryCount={1} // عرض صفحة واحدة في البداية والنهاية
            sx={{
              '& .MuiPaginationItem-root': {
                fontSize: '1rem',
                minWidth: '40px',
                height: '40px'
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2, alignSelf: 'center' }}>
            {totalPages} صفحة بها بيانات
          </Typography>
        </Box>
      )}

      {/* أزرار للقفز للصفحات المتقدمة (ديناميكي) */}
      {!searchTerm.trim() && currentPage <= 5 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2, mt: 2, mb: 2, flexWrap: 'wrap' }}>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => handlePageChange({} as any, currentPage + 5)}
            disabled={localLoading}
          >
            القفز +5 صفحات
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => handlePageChange({} as any, currentPage + 10)}
            disabled={localLoading}
          >
            القفز +10 صفحات
          </Button>
          <Button 
            variant="outlined" 
            size="small"
            onClick={() => handlePageChange({} as any, currentPage + 20)}
            disabled={localLoading}
          >
            القفز +20 صفحة
          </Button>
        </Box>
      )}

      {/* إحصائيات مفصلة لنظام last_id */}




      {/* قائمة المشاريع */}
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                اسم المشروع
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                نوع العقد
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                الموقع
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                تاريخ البداية
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }} align="center">
                الرصيد
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }} align="center">
                حالة المشروع
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }} align="center">
                الإجراءات
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {localLoading && projects.length === 0 ? (
              // مؤشرات التحميل
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                  <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                  <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                  <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                  <TableCell><Skeleton variant="text" width="40%" /></TableCell>
                  <TableCell><Skeleton variant="rectangular" width={80} height={24} /></TableCell>
                  <TableCell><Skeleton variant="rectangular" width="100%" height={36} /></TableCell>
                </TableRow>
              ))
            ) : filteredProjects.length > 0 ? (
              filteredProjects.map((project) => (
                <TableRow key={project.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'primary.main' }}>
                        <ProjectIcon />
                      </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {project.Nameproject}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          الرقم المرجعي: {project.Referencenumber || 'غير محدد'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{project.TypeOFContract}</TableCell>
                  <TableCell>{project.LocationProject || 'غير محدد'}</TableCell>
                  <TableCell>
                    {project.ProjectStartdate 
                      ? new Date(project.ProjectStartdate).toLocaleDateString('en-GB')
                      : 'غير محدد'
                    }
                  </TableCell>
                  <TableCell align="center">
                    {(project as any).cost 
                      ? `${((project as any).cost).toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})} ريال`
                      : 'غير محدد'
                    }
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getProjectStatusText(project.Disabled)}
                      color={getProjectStatusColor(project.Disabled)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="عرض التفاصيل">
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          onClick={() => onProjectSelect(project)}
                          sx={{ color: 'white' }}
                        >
                          التفاصيل
                        </Button>
                      </Tooltip>
                      <Tooltip title="تعديل">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => openProjectDialog(project)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                                             <Tooltip title="حذف">
                         <IconButton
                           size="small"
                           color="error"
                           onClick={() => handleDeleteProject(project)}
                         >
                           <DeleteIcon />
                         </IconButton>
                       </Tooltip>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={7}>
                  <Box sx={{ p: 4, textAlign: 'center' }}>
                    <ProjectIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      {searchTerm ? 
                        `لم يتم العثور على نتائج للبحث "${searchTerm}" في الصفحة الحالية` : 
                        "لا توجد مشاريع في هذه الصفحة"
                      }
                    </Typography>
                    {searchTerm ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        جرب البحث في صفحات أخرى أو امسح البحث لعرض جميع المشاريع
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                          جرب الانتقال لصفحات أخرى أو إضافة مشاريع جديدة.
                        </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => openProjectDialog()}
                          sx={{ mt: 1 }}
                      >
                          إضافة مشروع جديد
                      </Button>
                      </>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      الصفحة {currentPage} - الفرع: {branch.name}
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* تحذير البحث المحلي */}
      {searchTerm.trim() && filteredProjects.length === 0 && projects.length > 0 && (
        <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
                      لا توجد نتائج للبحث "{searchTerm}" في الصفحة الحالية ({projects.length} مشروع). 
          جرب تصفح الصفحات الأخرى أو امسح البحث لعرض جميع المشاريع.
        </Alert>
      )}

      {searchTerm.trim() && filteredProjects.length > 0 && (
        <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
                      عُثر على {filteredProjects.length} مشروع من أصل {projects.length} في الصفحة الحالية.
        </Alert>
      )}

      {/* معلومات الصفحة المحسنة للنظام المفتوح */}
      {projects.length > 0 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            عرض {searchTerm ? filteredProjects.length : projects.length} مشروع 
            {searchTerm && ` (من أصل ${projects.length})`}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            الصفحة {currentPage} من {totalPages}+ (نظام مفتوح)
          </Typography>
          {localLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                جاري التحميل...
          </Typography>
            </Box>
          )}
        </Box>
      )}



      {/* نافذة إضافة/تعديل مشروع */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingProject ? "تعديل بيانات المشروع" : "إضافة مشروع جديد"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="اسم المشروع"
                value={formData.Nameproject}
                onChange={(e) => setFormData({ ...formData, Nameproject: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>نوع العقد</InputLabel>
                <Select
                  value={formData.TypeOFContract}
                  onChange={(e) => setFormData({ ...formData, TypeOFContract: e.target.value })}
                  label="نوع العقد"
                >
                  {contractTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="موقع المشروع"
                value={formData.LocationProject}
                onChange={(e) => setFormData({ ...formData, LocationProject: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="تاريخ بداية المشروع"
                type="date"
                value={formData.ProjectStartdate}
                onChange={(e) => setFormData({ ...formData, ProjectStartdate: e.target.value })}
                fullWidth
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="رقم الحارس"
                type="number"
                value={formData.GuardNumber}
                onChange={(e) => setFormData({ ...formData, GuardNumber: parseInt(e.target.value) || 0 })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="رقم المبنى"
                type="number"
                value={formData.numberBuilding}
                onChange={(e) => setFormData({ ...formData, numberBuilding: parseInt(e.target.value) || 0 })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="الرقم المرجعي"
                type="number"
                value={formData.Referencenumber}
                onChange={(e) => setFormData({ ...formData, Referencenumber: parseInt(e.target.value) || 0 })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="ملاحظات"
                value={formData.Note}
                onChange={(e) => setFormData({ ...formData, Note: e.target.value })}
                fullWidth
                multiline
                rows={3}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>إلغاء</Button>
          <Button 
            onClick={handleSaveProject} 
            variant="contained"
            disabled={!formData.Nameproject.trim() || !formData.TypeOFContract}
          >
            {editingProject ? "تحديث" : "إضافة"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProjectsView; 