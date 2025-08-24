import React, { useState, useEffect, useCallback } from "react";
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
  Autocomplete,
  ToggleButton,
  ToggleButtonGroup,
  Divider,
  Collapse,
} from "@mui/material";
import {
  Search as SearchIcon,
  Person as PersonIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Work as WorkIcon,
  Phone as PhoneIcon,
  Badge as BadgeIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  ArrowBack as ArrowBackIcon,
} from "@mui/icons-material";
import { companiesSubscribedApi, Company, Employee } from "../api";
import { getSoftStatusChipSx } from "../../../utils/colorUtils";

interface EmployeesViewProps {
  company: Company;
  onBack: () => void;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
  showMessage: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

const EmployeesView: React.FC<EmployeesViewProps> = ({
  company,
  onBack,
  onLoading,
  onError,
  showMessage,
}) => {
  // State إدارة البيانات بنظام الصفحات المحسن
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageLastIds, setPageLastIds] = useState<{[key: number]: number}>({1: 0});
  const [hasNextPage, setHasNextPage] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  
  // State البحث المحسن مع نظام الصفحات
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<Employee[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    job: "",
    jobHOM: "",
    activation: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // حالة صفحات البحث (منفصلة عن الصفحات العادية)
  const [searchCurrentPage, setSearchCurrentPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [searchPageLastIds, setSearchPageLastIds] = useState<{[key: number]: number}>({1: 0});
  const [searchHasNextPage, setSearchHasNextPage] = useState(false);
  
  const [searchSummary, setSearchSummary] = useState<{
    totalFound: number;
    searchedIn: number;
    hasMore: boolean;
  } | null>(null);
  
  // State النوافذ المنبثقة
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    userName: "",
    IDNumber: "", // دائماً string للتوافق مع trim()
    PhoneNumber: "", // دائماً string للتوافق مع trim()
    jobdiscrption: "",
    job: "",
    jobHOM: "",
    Validity: "",
  });

  // أنواع الوظائف المتاحة (من قاعدة البيانات الفعلية)
  const jobTypes = [
    // القيم الموجودة فعلياً في قاعدة البيانات
    "Admin", "إستشاري موقع", "زائر", "عضو", "مالك", "مالية", "محاسب", 
    "مدخل بيانات", "مدير", "مدير الفرع", "مدير عقود", "مراقب موقع", 
    "مسئول طلبيات", "مسئول طلبيات ثقيلة", "مسئول طلبيات خفيفة", 
    "مستشار جودة", "مهندس موقع", "موارد بشرية", "موظف",
    // قيم إضافية متوقعة
    "مهندس", "مشرف", "فني", "عامل", "حارس", "سائق", "سكرتير", "مساعد إداري",
    "مدير مبيعات", "مدير مشروع", "مطور", "محلل", "مصمم", "كاتب",
    "مستشار", "محامي", "طبيب", "ممرض", "معلم", "مدرب", "باحث", "مستخدم"
  ];

  const jobCategories = [
    // القيم الموجودة فعلياً في قاعدة البيانات
    "Admin", "استشاري", "زائر", "مالك", "مالية", "مدخل بيانات", "مدير", 
    "مدير عقود", "مراقب جودة", "مراقب موقع", "مسئول طلبيات", 
    "مسئول طلبيات خفيفة", "مستشار", "مستشار جودة", "مهندس", 
    "مهندس موقع", "موظف",
    // قيم إضافية متوقعة
    "إدارة", "هندسة", "مبيعات", "تشغيل", "صيانة", "أمن", "نقل", 
    "موارد بشرية", "تقنية معلومات", "خدمة عملاء", "جودة", "مشتريات",
    "تسويق", "قانونية", "طبية", "تعليمية", "خدمات عامة", "استشارية",
    "بحث وتطوير", "علاقات عامة", "تدريب", "مشاريع", "عمليات"
  ];

  // البحث الشامل المحسن مع نظام الصفحات (متوافق مع النظام الأساسي)
  const performSearch = useCallback(async (
    term: string, 
    filters: {job?: string; jobHOM?: string; activation?: string}, 
    page: number = 1, 
    resetPagination: boolean = false
  ) => {
    if (!term.trim() && !filters.job && !filters.jobHOM && !filters.activation) {
      setIsSearchMode(false);
      setSearchResults([]);
      setSearchSummary(null);
      resetSearchPagination();
      return;
    }

    setSearchLoading(true);
    setIsSearchMode(true);
    
    if (resetPagination) {
      resetSearchPagination();
      page = 1;
    }
    
    try {
        

      const lastIdForPage = searchPageLastIds[page] || 0;

      const filtersObject = {
        job: filters.job || undefined,
        jobHOM: filters.jobHOM || undefined,
        activation: filters.activation || undefined
      };

      const response = await companiesSubscribedApi.searchCompanyEmployees(
        company.id,
        term,
        filtersObject
      );

      if (response.success) {
        const results = response.data || [];
        setSearchResults(results);
        setSearchCurrentPage(page);
        
        // تحديث معلومات صفحات البحث (مشابه للنظام الأساسي)
        if (results.length > 0) {
          const lastEmployeeId = results[results.length - 1].id;
          
          if (results.length === 10) {
            // حفظ last_id للصفحة التالية
            setSearchPageLastIds(prev => ({
              ...prev,
              [page + 1]: lastEmployeeId
            }));
            setSearchHasNextPage(true);
            // توسيع إجمالي صفحات البحث بشكل ديناميكي
            setSearchTotalPages(Math.max(searchTotalPages, page + 1));
          } else {
            // أقل من 10 نتائج، قد تكون الصفحة الأخيرة
            setSearchHasNextPage(false);
            setSearchTotalPages(Math.max(page, searchTotalPages));
          }
        } else {
          // لا توجد نتائج في هذه الصفحة
          if (page === 1) {
            setSearchTotalPages(1);
            setSearchHasNextPage(false);
          } else {
            // صفحة فارغة، لكن قد توجد صفحات أخرى في البحث
            setSearchHasNextPage(false);
            setSearchTotalPages(Math.max(page, searchTotalPages));
          }
        }

        // حساب إحصائيات البحث
        setSearchSummary({
          totalFound: results.length,
          searchedIn: 0, // سيتم حسابها في الـ console logs
          hasMore: results.length >= 10 // إذا وصلنا للحد الأقصى
        });


      } else {
        throw new Error(response.error || "حدث خطأ أثناء البحث");
      }
    } catch (error: any) {
      console.error("خطأ في البحث:", error);
      onError(error.message || "حدث خطأ أثناء البحث في الموظفين");
      setSearchResults([]);
      setSearchSummary(null);
    } finally {
      setSearchLoading(false);
    }
  }, [company.id, onError, searchPageLastIds, searchTotalPages]);

  // إعادة تعيين صفحات البحث
  const resetSearchPagination = () => {
    setSearchCurrentPage(1);
    setSearchTotalPages(1);
    setSearchPageLastIds({1: 0});
    setSearchHasNextPage(false);
  };

  // التنقل بين صفحات البحث (مشابه للنظام الأساسي)
  const handleSearchPageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    if (!searchLoading && page !== searchCurrentPage && page >= 1) {
        
      
      if (page === 1 || searchPageLastIds[page] !== undefined) {
        performSearch(searchTerm, searchFilters, page);
      } else {
        // للصفحات المتقدمة في البحث، احسب last_id بناءً على الصفحات السابقة
        
        let nearestPage = 1;
        let nearestLastId = 0;
        
        for (let i = 1; i < page; i++) {
          if (searchPageLastIds[i] !== undefined) {
            nearestPage = i;
            nearestLastId = searchPageLastIds[i];
          }
        }
        
        const calculatedLastId = nearestLastId + ((page - nearestPage) * 10);
        
        setSearchPageLastIds(prev => ({
          ...prev,
          [page]: calculatedLastId
        }));
        
        performSearch(searchTerm, searchFilters, page);
      }
    }
  };

  // Debounce للبحث (تأخير 500ms)
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (term: string, filters: any) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          performSearch(term, filters, 1, true); // دائماً ابدأ من الصفحة الأولى للبحث الجديد
        }, 500);
      };
    })(),
    [performSearch]
  );

  // التعامل مع تغيير مصطلح البحث
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim() && !searchFilters.job && !searchFilters.jobHOM && !searchFilters.activation) {
      // إذا تم مسح البحث والفلاتر، العودة للعرض العادي
      setIsSearchMode(false);
      setSearchResults([]);
      setSearchSummary(null);
      resetSearchPagination();
      if (employees.length === 0) {
        loadEmployees(1, true);
      }
    } else {
      debouncedSearch(term, searchFilters);
    }
  };

  // التعامل مع تغيير الفلاتر
  const handleFiltersChange = (newFilters: any) => {
    setSearchFilters(newFilters);
    
    if (!searchTerm.trim() && !newFilters.job && !newFilters.jobHOM && !newFilters.activation) {
      setIsSearchMode(false);
      setSearchResults([]);
      setSearchSummary(null);
      resetSearchPagination();
    } else {
      debouncedSearch(searchTerm, newFilters);
    }
  };

  // مسح جميع الفلاتر والبحث
  const clearAllFilters = () => {
    setSearchTerm("");
    setSearchFilters({
      job: "",
      jobHOM: "",
      activation: ""
    });
    setIsSearchMode(false);
    setSearchResults([]);
    setSearchSummary(null);
    resetSearchPagination();
    
    // إعادة تحميل البيانات العادية إذا لزم الأمر
    if (employees.length === 0) {
      loadEmployees(1, true);
    }
  };

  // تحميل الموظفين باستخدام نظام الدفعات المحسن
  const loadEmployees = async (page = 1, resetPagination = false) => {
    try {
      setLocalLoading(true);
      onLoading(true);
      onError(null);

      if (resetPagination) {
        setPageLastIds({1: 0});
        setCurrentPage(1);
        setTotalPages(1);
        setHasNextPage(false);
        page = 1;
      }

      const lastIdForPage = pageLastIds[page] || 0;

        

      const response = await companiesSubscribedApi.getCompanyEmployees(
        company.id,
        lastIdForPage,
        10
      );

      if (response.success) {
        const newEmployees = response.data || [];
        

        
          setEmployees(newEmployees);
        setCurrentPage(page);

        // تحديث معلومات الترقيم
        if (newEmployees.length > 0) {
          const lastEmployeeId = newEmployees[newEmployees.length - 1].id;
          
          if (newEmployees.length === 10) {
            setPageLastIds(prev => ({
              ...prev,
              [page + 1]: lastEmployeeId
            }));
            setHasNextPage(true);
            setTotalPages(Math.max(totalPages, page + 1));
        } else {
            setHasNextPage(false);
            setTotalPages(Math.max(page, totalPages));
          }
        } else {
          if (page === 1) {
            setTotalPages(1);
            setHasNextPage(false);
          } else {

            setHasNextPage(false);
            if (page < totalPages) {
              // لا نغير إجمالي الصفحات إذا كنا في صفحة وسطى
            } else {
              setTotalPages(Math.max(page - 1, 1));
            }
          }
        }
        

      } else {
        throw new Error(response.error || "حدث خطأ أثناء تحميل الموظفين");
      }
    } catch (error: any) {
      console.error("خطأ في تحميل الموظفين:", error);
      onError(error.message || "حدث خطأ أثناء تحميل الموظفين");
      
      if (page > 1) {
        setCurrentPage(page - 1);
        setTotalPages(Math.max(1, page - 1));
      }
    } finally {
      setLocalLoading(false);
      onLoading(false);
    }
  };

  // التنقل بين الصفحات المحسن
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    if (!localLoading && page !== currentPage && page >= 1) {
        
      
      if (page === 1 || pageLastIds[page] !== undefined) {
        loadEmployees(page);
    } else {

        
        let nearestPage = 1;
        let nearestLastId = 0;
        
        for (let i = 1; i < page; i++) {
          if (pageLastIds[i] !== undefined) {
            nearestPage = i;
            nearestLastId = pageLastIds[i];
    }
        }
        
        const calculatedLastId = nearestLastId + ((page - nearestPage) * 10);
        
        setPageLastIds(prev => ({
          ...prev,
          [page]: calculatedLastId
        }));
        
        loadEmployees(page);
      }
    }
  };

  // فتح نافذة إضافة/تعديل موظف
  const openEmployeeDialog = (employee?: Employee) => {
    if (employee) {

      
      // معالجة ذكية للقيم - اقتراح تحويلات منطقية
      let safeJob = employee.job;
      let safeJobHOM = employee.jobHOM;
      
      // إذا كانت الوظيفة غير متطابقة، تحقق إذا كانت موجودة في الأقسام (خطأ شائع)
      if (employee.job && !jobTypes.includes(employee.job)) {
        if (jobCategories.includes(employee.job)) {
          // تم وضع قسم في مكان الوظيفة - حاول إيجاد وظيفة مناسبة
          if (employee.job === "هندسة") safeJob = "مهندس";
          else if (employee.job === "إدارة") safeJob = "مدير";
          else if (employee.job === "مالية") safeJob = "محاسب";
          else safeJob = jobTypes[0];
        } else {
          safeJob = jobTypes[0];
        }
      }
      
      // إذا كان القسم غير متطابق، تحقق إذا كان موجوداً في الوظائف (خطأ شائع)
      if (employee.jobHOM && !jobCategories.includes(employee.jobHOM)) {
        if (jobTypes.includes(employee.jobHOM)) {
          // تم وضع وظيفة في مكان القسم - حاول إيجاد قسم مناسب
          if (employee.jobHOM === "مهندس") safeJobHOM = "هندسة";
          else if (employee.jobHOM === "مدير") safeJobHOM = "إدارة";
          else if (employee.jobHOM === "محاسب") safeJobHOM = "مالية";
          else if (employee.jobHOM === "مدخل بيانات") safeJobHOM = "تقنية معلومات";
          else if (employee.jobHOM === "مسئول طلبيات") safeJobHOM = "مبيعات";
          else if (employee.jobHOM === "مستشار") safeJobHOM = "استشارية";
          else safeJobHOM = jobCategories[0];
        } else {
          safeJobHOM = jobCategories[0];
        }
      }
      

      
      setEditingEmployee(employee);
      setFormData({
        userName: employee.userName || "",
        IDNumber: String(employee.IDNumber || ""), // تحويل آمن إلى نص
        PhoneNumber: String(employee.PhoneNumber || ""), // تحويل آمن إلى نص
        jobdiscrption: employee.jobdiscrption || "",
        job: safeJob,
        jobHOM: safeJobHOM,
        Validity: employee.Validity || "",
      });
    } else {

      setEditingEmployee(null);
      setFormData({
        userName: "",
        IDNumber: "",
        PhoneNumber: "",
        jobdiscrption: "",
        job: jobTypes[0],
        jobHOM: jobCategories[0],
        Validity: "",
      });
    }
    setDialogOpen(true);
  };

  // حفظ الموظف
  const handleSaveEmployee = async () => {
    try {
      // التحقق من صحة البيانات
      if (!formData.userName.trim()) {
        onError("اسم الموظف مطلوب");
        return;
      }
      if (!formData.IDNumber.trim()) {
        onError("رقم الهوية مطلوب");
        return;
      }
      if (!formData.PhoneNumber.trim()) {
        onError("رقم الهاتف مطلوب");
        return;
      }



      onLoading(true);
      onError(null); // مسح أي أخطاء سابقة
      
      let response;

      // إعداد البيانات مع التأكد من النوع الصحيح
      const employeeData = {
        userName: formData.userName.trim(),
        IDNumber: formData.IDNumber.trim(),
        PhoneNumber: formData.PhoneNumber.trim(),
        jobdiscrption: formData.jobdiscrption.trim(),
        job: jobTypes.includes(formData.job) ? formData.job : jobTypes[0],
        jobHOM: jobCategories.includes(formData.jobHOM) ? formData.jobHOM : jobCategories[0],
        Validity: formData.Validity || "",
      };

      if (editingEmployee) {
        // تحديث موظف موجود
        response = await companiesSubscribedApi.updateEmployee({
          id: editingEmployee.id,
          ...employeeData,
        });
      } else {
        // إضافة موظف جديد
        response = await companiesSubscribedApi.createEmployee({
          IDCompany: company.id,
          ...employeeData,
        });
      }

      if (response && response.success) {
        const successMessage = editingEmployee ? "تم تحديث الموظف بنجاح" : "تم إضافة الموظف بنجاح";
        showMessage(successMessage, "success");
        
        setDialogOpen(false);
        
        // إعادة تحميل البيانات
        if (isSearchMode) {
          // إذا كنا في وضع البحث، أعد تشغيل البحث
          performSearch(searchTerm, searchFilters, searchCurrentPage);
      } else {
          // في الوضع العادي، أعد تحميل الصفحة الحالية
          loadEmployees(currentPage);
        }
      } else {
        const errorMessage = response?.error || "حدث خطأ غير معروف أثناء حفظ الموظف";
        console.error('فشل في حفظ الموظف:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("💥 خطأ في حفظ الموظف:", {
        error,
        message: error.message,
        isEditing: !!editingEmployee,
        formData
      });
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "حدث خطأ أثناء حفظ الموظف";
      
      onError(`فشل في حفظ الموظف: ${errorMessage}`);
      showMessage(`فشل في حفظ الموظف: ${errorMessage}`, "error");
    } finally {
      onLoading(false);
    }
  };

  // حذف موظف
  const handleDeleteEmployee = async (employee: Employee) => {
    if (!employee.PhoneNumber || employee.PhoneNumber.trim() === '') {
              console.error('رقم الهاتف مفقود للموظف:', employee);
      onError("لا يمكن حذف الموظف: رقم الهاتف مفقود");
      return;
    }

         if (!window.confirm(`هل أنت متأكد من حذف الموظف "${employee.userName}"؟\n\nسيتم حذف جميع البيانات المرتبطة به نهائياً.\n\nهذه العملية لا يمكن التراجع عنها.`)) {
      return;
    }

    try {
      onLoading(true);
      onError(null); // مسح أي أخطاء سابقة
      
      const response = await companiesSubscribedApi.deleteEmployee(employee);
      
      if (response && response.success) {
        showMessage("تم حذف الموظف بنجاح", "success");
        
        // تحديث العرض بناءً على النمط الحالي
        if (isSearchMode) {
          // إذا كنا في وضع البحث، أعد تشغيل البحث
          performSearch(searchTerm, searchFilters, searchCurrentPage);
      } else {
          // في الوضع العادي، تحديث الصفحة
          const remainingEmployees = employees.filter(e => e.id !== employee.id);
          
          if (remainingEmployees.length === 0 && currentPage > 1) {
            loadEmployees(currentPage - 1);
          } else {
            loadEmployees(currentPage);
          }
        }
      } else {
        const errorMessage = response?.error || "حدث خطأ غير معروف أثناء حذف الموظف";
        console.error('❌ فشل في حذف الموظف:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("💥 خطأ في عملية حذف الموظف:", {
        error,
        message: error.message,
        response: error.response?.data,
        employeeId: employee.id
      });
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "حدث خطأ أثناء حذف الموظف";
      
      onError(`فشل في حذف الموظف: ${errorMessage}`);
      showMessage(`❌ فشل في حذف الموظف: ${errorMessage}`, "error");
    } finally {
      onLoading(false);
    }
  };

  // تحديد لون الحالة
  const getEmployeeStatusColor = (activation: string) => {
    return activation === "true" ? "success" : "error";
  };

  const getEmployeeStatusText = (activation: string) => {
    return activation === "true" ? "نشط" : "غير نشط";
  };

  // البيانات المعروضة حالياً (للعرض العادي أو نتائج البحث)
  const displayedEmployees = isSearchMode ? searchResults : employees;

  // تتبع القيم غير المتطابقة في قائمة الموظفين
  useEffect(() => {
    if (displayedEmployees.length > 0) {
      const invalidJobs = displayedEmployees.filter(emp => emp.job && !jobTypes.includes(emp.job));
      const invalidJobHOMs = displayedEmployees.filter(emp => emp.jobHOM && !jobCategories.includes(emp.jobHOM));
      
      if (invalidJobs.length > 0 || invalidJobHOMs.length > 0) {
        console.warn('⚠️ موظفين بقيم غير متطابقة:', {
          invalidJobs: invalidJobs.map(emp => ({ id: emp.id, name: emp.userName, job: emp.job })),
          invalidJobHOMs: invalidJobHOMs.map(emp => ({ id: emp.id, name: emp.userName, jobHOM: emp.jobHOM })),
          availableJobTypes: jobTypes,
          availableJobCategories: jobCategories
        });
      }
    }
  }, [displayedEmployees, jobTypes, jobCategories]);

  // تحميل البيانات عند بداية التحميل
  useEffect(() => {
    setTotalPages(20);
    loadEmployees(1, true);
  }, [company.id]);

  return (
    <Box>
      {/* معلومات الشركة مع زر العودة */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
          <Typography variant="h5" gutterBottom>
            👥 موظفي شركة: {company.name}
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
            العودة إلى الشركات المشتركة
          </Button>
        </Box>
        <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2">
            🏢 رقم الشركة: {company.id}
          </Typography>
          <Typography variant="body2">
            📍 العنوان: {company.address || "غير محدد"}
          </Typography>
          <Typography variant="body2">
            📊 إجمالي الموظفين: {employees.length}
          </Typography>
        </Box>
      </Paper>

      {/* شريط البحث والإضافة */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="البحث الشامل في جميع الموظفين..."
            value={searchTerm}
            onChange={(e) => handleSearchChange(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
              endAdornment: searchLoading ? (
                <InputAdornment position="end">
                  <CircularProgress size={20} />
                </InputAdornment>
              ) : searchTerm ? (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => handleSearchChange("")}
                  >
                    <ClearIcon />
                  </IconButton>
                </InputAdornment>
              ) : null
            }}
            sx={{ flex: 1, minWidth: 300 }}
          />
          
          <Button
            variant="outlined"
            startIcon={<FilterIcon />}
            endIcon={showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            onClick={() => setShowFilters(!showFilters)}
            color={Object.values(searchFilters).some(f => f) ? "primary" : "inherit"}
          >
            فلاتر متقدمة
          </Button>
          
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={() => openEmployeeDialog()}
          >
            إضافة موظف
          </Button>

          {(searchTerm || Object.values(searchFilters).some(f => f)) && (
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<ClearIcon />}
              onClick={clearAllFilters}
            >
              مسح الكل
            </Button>
          )}
        </Box>

        {/* الفلاتر المتقدمة */}
        <Collapse in={showFilters}>
          <Divider sx={{ my: 2 }} />
          <Grid container spacing={2}>
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>فلترة حسب الوظيفة</InputLabel>
                <Select
                  value={searchFilters.job}
                  label="فلترة حسب الوظيفة"
                  onChange={(e) => handleFiltersChange({
                    ...searchFilters,
                    job: e.target.value
                  })}
                >
                  <MenuItem value="">
                    <em>جميع الوظائف</em>
                  </MenuItem>
                  {jobTypes.map((job) => (
                    <MenuItem key={job} value={job}>
                      {job}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>فلترة حسب القسم</InputLabel>
                <Select
                  value={searchFilters.jobHOM}
                  label="فلترة حسب القسم"
                  onChange={(e) => handleFiltersChange({
                    ...searchFilters,
                    jobHOM: e.target.value
                  })}
                >
                  <MenuItem value="">
                    <em>جميع الأقسام</em>
                  </MenuItem>
                  {jobCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>فلترة حسب الحالة</InputLabel>
                <Select
                  value={searchFilters.activation}
                  label="فلترة حسب الحالة"
                  onChange={(e) => handleFiltersChange({
                    ...searchFilters,
                    activation: e.target.value
                  })}
                >
                  <MenuItem value="">
                    <em>جميع الحالات</em>
                  </MenuItem>
                  <MenuItem value="true">نشط</MenuItem>
                  <MenuItem value="false">غير نشط</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>







      {/* أرقام صفحات البحث الذكية - عرض الصفحات الفعلية فقط */}
      {isSearchMode && (searchTotalPages > 1 || searchHasNextPage) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={searchTotalPages}
            page={searchCurrentPage}
            onChange={handleSearchPageChange}
            color="secondary"
            size="large"
            showFirstButton={false}
            showLastButton={false}
            disabled={searchLoading}
            siblingCount={1}
            boundaryCount={1}
            sx={{
              '& .MuiPaginationItem-root': {
                fontSize: '1rem',
                minWidth: '40px',
                height: '40px'
              }
            }}
          />
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2, alignSelf: 'center' }}>
            {searchTotalPages} صفحة بحث بها بيانات
          </Typography>
        </Box>
      )}

      {/* أزرار القفز السريع لصفحات البحث */}
      {/* تم إزالة أزرار القفز +5، +10، +20 صفحات البحث */}



      {/* أرقام الصفحات الذكية - عرض البيانات الفعلية فقط */}
      {(totalPages > 1 || hasNextPage) && !isSearchMode && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={Math.min(currentPage, totalPages)}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton={false}
            showLastButton={false}
            disabled={localLoading}
            siblingCount={1}
            boundaryCount={1}
            sx={{
              '& .MuiPaginationItem-root': {
                fontSize: '1rem',
                minWidth: '40px',
                height: '40px'
              }
            }}
          />

        </Box>
      )}

      {/* تم إزالة أزرار القفز +5، +10، +20 صفحات */}

      {/* قائمة الموظفين */}
      <TableContainer component={Paper} sx={{ mt: 2, width: '100%', overflowX: 'auto' }}>
          <Table stickyHeader size="small" sx={{ minWidth: 700 }}>
            <TableHead>
              <TableRow>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                الموظف
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white', display: { xs: 'none', sm: 'table-cell' } }}>
                الوظيفة
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white', display: { xs: 'none', sm: 'table-cell' } }}>
                القسم
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white', display: { xs: 'none', md: 'table-cell' } }}>
                رقم الهوية
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white', display: { xs: 'none', md: 'table-cell' } }}>
                رقم الهاتف
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }} align="center">
                الحالة
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }} align="center">
                الإجراءات
              </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {localLoading && employees.length === 0 ? (
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
            ) : displayedEmployees.length > 0 ? (
              displayedEmployees.map((employee) => (
                    <TableRow key={employee.id} hover>
                      <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Avatar sx={{ bgcolor: 'secondary.main', width: { xs: 28, sm: 40 }, height: { xs: 28, sm: 40 } }}>
                            <PersonIcon sx={{ fontSize: { xs: 16, sm: 24 } }} />
                          </Avatar>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                            {employee.userName}
                          </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {employee.jobdiscrption || 'لا يوجد وصف'}
                          </Typography>
                      </Box>
                        </Box>
                      </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{employee.job}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>{employee.jobHOM || 'غير محدد'}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{employee.IDNumber}</TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>{employee.PhoneNumber}</TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getEmployeeStatusText(employee.Activation)}
                      size="small"
                      sx={getSoftStatusChipSx(employee.Activation === 'true')}
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                          <Tooltip title="تعديل">
                            <IconButton
                              size="small"
                          color="primary"
                              onClick={() => openEmployeeDialog(employee)}
                            >
                          <EditIcon />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title="حذف">
                            <IconButton
                              size="small"
                              color="error"
                          onClick={() => handleDeleteEmployee(employee)}
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
                    <PersonIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      {searchTerm ? 
                        `لم يتم العثور على نتائج للبحث "${searchTerm}" في الصفحة الحالية` : 
                        "لا توجد موظفين في هذه الصفحة"
                      }
                    </Typography>
                    {searchTerm ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        جرب البحث في صفحات أخرى أو امسح البحث لعرض جميع الموظفين
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                          جرب الانتقال لصفحات أخرى أو إضافة موظفين جدد.
                        </Typography>
                      <Button
                        variant="outlined"
                        startIcon={<AddIcon />}
                        onClick={() => openEmployeeDialog()}
                          sx={{ mt: 1 }}
                      >
                          إضافة موظف جديد
                      </Button>
                      </>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      الصفحة {currentPage} - الشركة: {company.name}
                    </Typography>
                  </Box>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        
      {/* تحذير البحث المحلي */}
      {isSearchMode && displayedEmployees.length === 0 && (
        <Alert severity="info" sx={{ mt: 2, mb: 2 }}>
          🔍 لا توجد نتائج للبحث "{searchTerm}". 
          جرب تغيير كلمات البحث أو الفلاتر للعثور على النتائج المطلوبة.
        </Alert>
      )}

      {isSearchMode && displayedEmployees.length > 0 && (
        <Alert severity="success" sx={{ mt: 2, mb: 2 }}>
          🎯 عُثر على {displayedEmployees.length} موظف في البحث الشامل.
          {searchSummary?.hasMore && " (قد توجد نتائج إضافية)"}
        </Alert>
      )}

      {/* معلومات الصفحة المحسنة */}
      {(employees.length > 0 || displayedEmployees.length > 0) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, flexWrap: 'wrap', gap: 2 }}>
          <Typography variant="body2" color="text.secondary">
            عرض {displayedEmployees.length} موظف 
            {isSearchMode ? 
              ` - صفحة البحث ${searchCurrentPage} من ${searchTotalPages}+` : 
              ` - الصفحة ${currentPage} من ${totalPages}+`
            }
          </Typography>
          <Typography variant="body2" color="text.secondary">
            {isSearchMode ? 
              "🔍 نظام البحث المتوافق (10 نتائج/صفحة)" :
              "📄 النظام العادي (10 موظفين/صفحة)"
            }
          </Typography>
          {(localLoading || searchLoading) && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <CircularProgress size={16} />
              <Typography variant="body2" color="text.secondary">
                جاري التحميل...
              </Typography>
            </Box>
          )}
        </Box>
      )}



      {/* معلومات التحسينات الجديدة */}




      {/* نافذة إضافة/تعديل موظف */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingEmployee ? "تعديل بيانات الموظف" : "إضافة موظف جديد"}
        </DialogTitle>
        <DialogContent>
          {/* تحذير إذا تم تصحيح القيم تلقائياً */}
          {editingEmployee && (
            (editingEmployee.job && !jobTypes.includes(editingEmployee.job)) ||
            (editingEmployee.jobHOM && !jobCategories.includes(editingEmployee.jobHOM))
          ) && (
            <Alert severity="warning" sx={{ mb: 2 }}>
              ⚠️ <strong>تم تصحيح القيم تلقائياً بمعالجة ذكية:</strong>
              <br />
              {editingEmployee.job && !jobTypes.includes(editingEmployee.job) && (
                <>
                  🔧 <strong>الوظيفة:</strong> "{editingEmployee.job}" ← "{formData.job}"
                  {jobCategories.includes(editingEmployee.job) && (
                    <> (تم اكتشاف خلط - قسم في مكان وظيفة)</>
                  )}
                  <br />
                </>
              )}
              {editingEmployee.jobHOM && !jobCategories.includes(editingEmployee.jobHOM) && (
                <>
                  🔧 <strong>القسم:</strong> "{editingEmployee.jobHOM}" ← "{formData.jobHOM}"
                  {jobTypes.includes(editingEmployee.jobHOM) && (
                    <> (تم اكتشاف خلط - وظيفة في مكان قسم)</>
                  )}
                  <br />
                </>
              )}
              تم اقتراح قيم مناسبة تلقائياً. يمكنك تعديلها حسب الحاجة من القوائم أدناه.
              <br />
              ملاحظة: سيتم حفظ القيم المحدثة وحل المشكلة نهائياً.
            </Alert>
          )}

          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                label="اسم الموظف"
                value={formData.userName}
                onChange={(e) => setFormData({ ...formData, userName: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="رقم الهوية"
                value={formData.IDNumber}
                onChange={(e) => setFormData({ ...formData, IDNumber: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="رقم الهاتف"
                value={formData.PhoneNumber}
                onChange={(e) => setFormData({ ...formData, PhoneNumber: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>الوظيفة</InputLabel>
                <Select
                  value={formData.job}
                  onChange={(e) => setFormData({ ...formData, job: e.target.value })}
                  label="الوظيفة"
                >
                  {jobTypes.map((type) => (
                    <MenuItem key={type} value={type}>
                      {type}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>القسم</InputLabel>
                <Select
                  value={formData.jobHOM}
                  onChange={(e) => setFormData({ ...formData, jobHOM: e.target.value })}
                  label="القسم"
                >
                  {jobCategories.map((category) => (
                    <MenuItem key={category} value={category}>
                      {category}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="وصف الوظيفة"
                value={formData.jobdiscrption}
                onChange={(e) => setFormData({ ...formData, jobdiscrption: e.target.value })}
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
            onClick={handleSaveEmployee} 
            variant="contained"
            disabled={!formData.userName.trim() || !formData.IDNumber.trim() || !formData.PhoneNumber.trim()}
          >
            {editingEmployee ? "تحديث" : "إضافة"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default EmployeesView; 