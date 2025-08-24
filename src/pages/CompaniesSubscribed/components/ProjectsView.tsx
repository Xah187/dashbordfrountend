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
  ArrowBack as ArrowBackIcon,
  } from "@mui/icons-material";
import { ChevronLeft as ChevronLeftIcon, ChevronRight as ChevronRightIcon } from "@mui/icons-material";
import { companiesSubscribedApi, Company, Branch, Project } from "../api";
import { getSoftStatusChipSx } from "../../../utils/colorUtils";

interface ProjectsViewProps {
  company: Company;
  branch: Branch;
  onProjectSelect: (project: Project) => void;
  onBack: () => void;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
  showMessage: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

const ProjectsView: React.FC<ProjectsViewProps> = ({
  company,
  branch,
  onProjectSelect,
  onBack,
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
  // مرساة للتمرير السلس إلى أعلى القائمة بعد تغيير الصفحة
  const listTopRef = React.useRef<HTMLDivElement | null>(null);
  
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

  // الحصول على 4 أرقام صفحات ثابتة للعرض
  const getVisiblePages = (total: number, current: number): number[] => {
    if (total <= 4) {
      return Array.from({ length: total }, (_, i) => i + 1);
    }
    if (current <= 2) return [1, 2, 3, 4];
    if (current >= total - 1) return [total - 3, total - 2, total - 1, total];
    return [current - 1, current, current + 1, current + 2];
  };

  // تمرير سلس إلى أعلى القائمة بعد اكتمال تحميل الصفحة الجديدة
  useEffect(() => {
    if (!localLoading && listTopRef.current) {
      try {
        listTopRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
      } catch {}
    }
  }, [currentPage, localLoading]);

  // البحث في المشاريع داخل الفرع عبر الباك اند
  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    if (!term.trim()) {
      // إعادة تعيين الترقيم وإعادة تحميل الصفحة الأولى
      setCurrentPage(1);
      setPageLastIds({ 1: 0 });
      setTotalPages(1);
      setHasNextPage(false);
      loadProjects(1, true);
      return;
    }

    try {
      setLocalLoading(true);
      onLoading(true);
      // البحث على دفعات داخل الفرع ثم إعادة النتائج المتطابقة فقط
      const response = await companiesSubscribedApi.searchBranchProjectsBatched(
        branch.companyId,
        branch.id,
        term,
        showDisabledProjects,
        50 // حد أعلى لعدد النتائج لإبقاء الأداء جيداً
      );
      if (response.success) {
        let results: Project[] = (response.data || []) as Project[];
        if (!showDisabledProjects) {
          results = results.filter((project: any) => {
            const disabledVal: any = project.Disabled;
            const isActive =
              disabledVal === true ||
              disabledVal === "true" ||
              Number(disabledVal) === 1 ||
              disabledVal === "1";
            return isActive;
          });
        }
        setProjects(results);
        setCurrentPage(1);
        setTotalPages(1);
        setHasNextPage(false);
        setPageLastIds({ 1: 0 });
      } else {
        onError(response.error || "حدث خطأ أثناء البحث في المشاريع");
      }
    } catch (error: any) {
      onError(error.message || "حدث خطأ أثناء البحث في المشاريع");
    } finally {
      setLocalLoading(false);
      onLoading(false);
    }
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
      {/* معلومات الفرع مع زر العودة */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            🏗️ مشاريع فرع: {branch.name}
          </Typography>
          <Button
            variant="contained"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.15)',
              color: 'white',
              border: '1px solid rgba(255, 255, 255, 0.25)',
              borderRadius: '12px',
              px: 3,
              py: 1,
              fontWeight: 600,
              textTransform: 'none',
              boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
              transition: 'all 0.3s ease',
              '&:hover': {
                backgroundColor: 'rgba(255, 255, 255, 0.25)',
                border: '1px solid rgba(255, 255, 255, 0.4)',
                transform: 'translateY(-2px)',
                boxShadow: '0 6px 20px rgba(0,0,0,0.2)',
              }
            }}
          >
            العودة إلى فروع {company.name}
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2">
            🏢 الشركة: {company.name}
          </Typography>
          <Typography variant="body2">
            📍 العنوان: {branch.address || "غير محدد"}
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



      {/* تم إزالة قسم إحصائيات المشاريع */}





      {/* أرقام الصفحات الذكية - عرض البيانات الفعلية فقط */}
      <div ref={listTopRef} />
      {(totalPages > 1 || hasNextPage) && !searchTerm.trim() && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <IconButton
              size="small"
              onClick={() => handlePageChange({} as any, Math.max(1, currentPage - 1))}
              disabled={localLoading || currentPage <= 1}
            >
              <ChevronRightIcon />
            </IconButton>
            {getVisiblePages(totalPages, Math.min(currentPage, totalPages)).map((p) => (
              <Button
                key={p}
                variant={p === Math.min(currentPage, totalPages) ? 'contained' : 'outlined'}
                color="primary"
                size="small"
                onClick={() => handlePageChange({} as any, p)}
                disabled={localLoading}
                sx={{
                  minWidth: 40,
                  height: 36,
                  px: 1.25,
                  borderRadius: (theme) => theme.shape.borderRadius,
                  fontWeight: p === Math.min(currentPage, totalPages) ? 700 : 500
                }}
              >
                {p}
              </Button>
            ))}
            <IconButton
              size="small"
              onClick={() => handlePageChange({} as any, Math.min(totalPages, currentPage + 1))}
              disabled={localLoading || currentPage >= totalPages}
            >
              <ChevronLeftIcon />
            </IconButton>
          </Box>
        </Box>
      )}

      {/* تم إزالة أزرار القفز +5، +10، +20 صفحات */}

      {/* إحصائيات مفصلة لنظام last_id */}




      {/* قائمة المشاريع */}
      <TableContainer component={Paper} sx={{ mt: 2, width: '100%', overflowX: 'auto' }}>
        <Table stickyHeader size="small" sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                اسم المشروع
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white', display: { xs: 'none', sm: 'table-cell' } }}>
                نوع العقد
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white', display: { xs: 'none', md: 'table-cell' } }}>
                الموقع
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white', display: { xs: 'none', sm: 'table-cell' } }}>
                تاريخ البداية
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white', display: { xs: 'none', md: 'table-cell' } }} align="center">
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
          <TableBody
            sx={{
              '@keyframes fadeInSlide': {
                from: { opacity: 0, transform: 'translateY(6px)' },
                to: { opacity: 1, transform: 'translateY(0)' }
              }
            }}
          >
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
              filteredProjects.map((project, idx) => (
                <TableRow
                  key={project.id}
                  hover
                  sx={{
                    animation: 'fadeInSlide 320ms ease both',
                    animationDelay: `${Math.min(idx, 8) * 35}ms`
                  }}
                >
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
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{project.TypeOFContract}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    {project.LocationProject ? (
                      <Tooltip title="افتح في خرائط قوقل">
                        <Button
                          component="a"
                          href={/^(https?:\/\/)/.test(String(project.LocationProject))
                            ? String(project.LocationProject)
                            : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(String(project.LocationProject || '').trim())}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          size="small"
                          variant="contained"
                          startIcon={<LocationIcon />}
                          sx={{
                            borderRadius: 999,
                            minWidth: 0,
                            height: 28,
                            px: 1,
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            color: '#fff',
                            background: 'linear-gradient(90deg, #90caf9 0%, #80cbc4 100%)',
                            boxShadow: '0 3px 10px rgba(144,202,249,0.25)',
                            '& .MuiButton-startIcon': {
                              mr: 0.5,
                              '& > *:nth-of-type(1)': { fontSize: 16 }
                            },
                            '&:hover': {
                              background: 'linear-gradient(90deg, #64b5f6 0%, #4db6ac 100%)',
                              boxShadow: '0 4px 12px rgba(100,181,246,0.3)'
                            }
                          }}
                        >
                          الموقع
                        </Button>
                      </Tooltip>
                    ) : (
                      'غير محدد'
                    )}
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    {project.ProjectStartdate 
                      ? new Date(project.ProjectStartdate).toLocaleDateString('en-GB')
                      : 'غير محدد'
                    }
                  </TableCell>
                  <TableCell align="center" sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    {(project as any).cost 
                      ? `${((project as any).cost).toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})} ريال`
                      : 'غير محدد'
                    }
                  </TableCell>
                  <TableCell align="center">
                    {(() => {
                      const disabledVal: any = (project as any).Disabled;
                      const isActive = disabledVal === true || disabledVal === 'true' || Number(disabledVal) === 1;
                      return (
                        <Chip
                          label={getProjectStatusText(project.Disabled)}
                          size="small"
                          sx={getSoftStatusChipSx(Boolean(isActive))}
                        />
                      );
                    })()}
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