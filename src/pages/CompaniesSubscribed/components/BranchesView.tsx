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
  IconButton,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Skeleton,
  Alert,
  CircularProgress,
  Pagination,
  Tooltip,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Autocomplete,
  Divider,
  Collapse,
  Chip,
} from "@mui/material";
import {
  Search as SearchIcon,
  AccountTree as BranchIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Assignment as ProjectIcon,
  Person as PersonIcon,
  LocationOn as LocationIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
} from "@mui/icons-material";
import { companiesSubscribedApi, Company, Branch } from "../api";

interface BranchesViewProps {
  company: Company;
  onBranchSelect: (branch: Branch) => void;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
  showMessage: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

const BranchesView: React.FC<BranchesViewProps> = ({
  company,
  onBranchSelect,
  onLoading,
  onError,
  showMessage,
}) => {
  // State إدارة البيانات بنظام الصفحات المحسن
  const [branches, setBranches] = useState<Branch[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [pageLastIds, setPageLastIds] = useState<{[key: number]: number}>({1: 0});
  const [hasNextPage, setHasNextPage] = useState(false);
  const [localLoading, setLocalLoading] = useState(false);
  
  // State البحث المحسن مع نظام الصفحات
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<Branch[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    manager: "",
    isActive: "",
    city: ""
  });
  const [showFilters, setShowFilters] = useState(false);
  
  // حالة صفحات البحث (منفصلة عن الصفحات العادية)
  const [searchCurrentPage, setSearchCurrentPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [searchSummary, setSearchSummary] = useState<{
    totalFound: number;
    searchedIn: number;
    hasMore: boolean;
  } | null>(null);
  
  // State النوافذ المنبثقة
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    manager: "",
    address: "",
    email: "",
    phone: "",
  });

  // قائمة المدراء المتاحة (من البيانات الموجودة)
  const availableManagers = React.useMemo(() => {
    const managers = new Set<string>();
    branches.forEach(branch => {
      if (branch.manager && branch.manager.trim()) {
        managers.add(branch.manager.trim());
      }
    });
    return Array.from(managers).sort();
  }, [branches]);

  // قائمة المدن المتاحة (من البيانات الموجودة)
  const availableCities = React.useMemo(() => {
    const cities = new Set<string>();
    branches.forEach(branch => {
      if (branch.address && branch.address.trim()) {
        // استخراج المدينة من العنوان (كلمة أو كلمتان أخيرتان)
        const addressParts = branch.address.trim().split(/[,،\s]+/);
        if (addressParts.length > 0) {
          cities.add(addressParts[addressParts.length - 1]);
          if (addressParts.length > 1) {
            cities.add(addressParts[addressParts.length - 2]);
          }
        }
      }
    });
    return Array.from(cities).filter(city => city && city.length > 2).sort();
  }, [branches]);

  // البحث الشامل المحسن مع نظام الصفحات
  const performSearch = useCallback(async (
    term: string, 
    filters: {manager?: string; isActive?: string; city?: string}
  ) => {
    if (!term.trim() && !filters.manager && !filters.isActive && !filters.city) {
      setIsSearchMode(false);
      setSearchResults([]);
      setSearchSummary(null);
      return;
    }

    setSearchLoading(true);
    setIsSearchMode(true);
    
    try {
      console.log('🔍 تنفيذ البحث الشامل في الفروع:', {
        searchTerm: term,
        filters,
        companyId: company.id
      });

      const filtersObject = {
        manager: filters.manager || undefined,
        isActive: filters.isActive || undefined,
        city: filters.city || undefined
      };

      const response = await companiesSubscribedApi.searchCompanyBranches(
        company.id,
        term,
        filtersObject
      );

      if (response.success) {
        const results = response.data || [];
        setSearchResults(results);
        setSearchCurrentPage(1);
        setSearchTotalPages(Math.max(1, Math.ceil(results.length / 10)));
        
        setSearchSummary({
          totalFound: results.length,
          searchedIn: 0,
          hasMore: false
        });

        console.log('نتائج البحث الشامل للفروع:', {
          searchTerm: term,
          filtersApplied: filters,
          resultsFound: results.length,
          branchNames: results.map(b => b.name)
        });
      } else {
        throw new Error(response.error || "حدث خطأ أثناء البحث");
      }
    } catch (error: any) {
      console.error("خطأ في البحث:", error);
      onError(error.message || "حدث خطأ أثناء البحث في الفروع");
      setSearchResults([]);
      setSearchSummary(null);
    } finally {
      setSearchLoading(false);
    }
  }, [company.id, onError]);

  // Debounce للبحث (تأخير 500ms)
  const debouncedSearch = useCallback(
    (() => {
      let timeoutId: NodeJS.Timeout;
      return (term: string, filters: any) => {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
          performSearch(term, filters);
        }, 500);
      };
    })(),
    [performSearch]
  );

  // التعامل مع تغيير مصطلح البحث
  const handleSearchChange = (term: string) => {
    setSearchTerm(term);
    
    if (!term.trim() && !searchFilters.manager && !searchFilters.isActive && !searchFilters.city) {
      setIsSearchMode(false);
      setSearchResults([]);
      setSearchSummary(null);
      if (branches.length === 0) {
        loadBranches(1, true);
      }
    } else {
      debouncedSearch(term, searchFilters);
    }
  };

  // التعامل مع تغيير الفلاتر
  const handleFiltersChange = (newFilters: any) => {
    setSearchFilters(newFilters);
    
    if (!searchTerm.trim() && !newFilters.manager && !newFilters.isActive && !newFilters.city) {
      setIsSearchMode(false);
      setSearchResults([]);
      setSearchSummary(null);
    } else {
      debouncedSearch(searchTerm, newFilters);
    }
  };

  // مسح جميع الفلاتر والبحث
  const clearAllFilters = () => {
    setSearchTerm("");
    setSearchFilters({
      manager: "",
      isActive: "",
      city: ""
    });
    setIsSearchMode(false);
    setSearchResults([]);
    setSearchSummary(null);
    
    if (branches.length === 0) {
      loadBranches(1, true);
    }
  };

  // تحميل الفروع باستخدام نظام الدفعات المحسن
  const loadBranches = async (page = 1, resetPagination = false) => {
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

      console.log('🚀 تحميل الفروع:', {
        companyId: company.id,
        companyName: company.name,
        requestedPage: page,
        lastIdForPage,
        targetLimit: 10,
        resetPagination
      });

      const response = await companiesSubscribedApi.getCompanyBranches(
        company.id,
        lastIdForPage,
        10
      );

      if (response.success) {
        const newBranches = response.data || [];
        
        console.log('البيانات المستلمة:', {
          page,
          lastIdUsed: lastIdForPage,
          newBranchesCount: newBranches.length,
          branchNames: newBranches.map(b => b.name),
          branchIds: newBranches.map(b => b.id)
        });
        
          setBranches(newBranches);
        setCurrentPage(page);

        // تحديث معلومات الترقيم
        if (newBranches.length > 0) {
          const lastBranchId = newBranches[newBranches.length - 1].id;
          
          if (newBranches.length === 10) {
            setPageLastIds(prev => ({
              ...prev,
              [page + 1]: lastBranchId
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
            setTotalPages(Math.max(page - 1, 1));
          }
        }
        
        console.log('📈 تحديث حالة الفروع:', {
          currentPage: page,
          totalPages: newBranches.length === 10 ? Math.max(totalPages, page + 1) : Math.max(page, totalPages),
          hasNextPage: newBranches.length === 10,
          systemType: 'نظام مفتوح - يدعم عدد غير محدود من الفروع'
        });
      } else {
        throw new Error(response.error || "حدث خطأ أثناء تحميل الفروع");
      }
    } catch (error: any) {
      console.error("خطأ في تحميل الفروع:", error);
      onError(error.message || "حدث خطأ أثناء تحميل الفروع");
      
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
      console.log('📄 تغيير الصفحة:', {
        fromPage: currentPage,
        toPage: page,
        availablePageLastIds: Object.keys(pageLastIds),
        targetPageLastId: pageLastIds[page]
      });
      
      if (page === 1 || pageLastIds[page] !== undefined) {
        loadBranches(page);
    } else {
        console.log('🔢 حساب last_id للصفحة المتقدمة:', page);
        
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
        
        loadBranches(page);
      }
    }
  };

  // فتح نافذة إضافة/تعديل فرع
  const openBranchDialog = (branch?: Branch) => {
    if (branch) {
      console.log('🔧 فتح نموذج التعديل للفرع:', {
        branchId: branch.id,
        branchName: branch.name,
        originalData: branch
      });
      
      setEditingBranch(branch);
      setFormData({
        name: branch.name || "",
        manager: branch.manager || "",
        address: branch.address || "",
        email: branch.email || "",
        phone: branch.phone || "",
      });
    } else {
      console.log('➕ فتح نموذج إضافة فرع جديد');
      setEditingBranch(null);
      setFormData({
        name: "",
        manager: "",
        address: "",
        email: "",
        phone: "",
      });
    }
    setDialogOpen(true);
  };

  // حفظ الفرع
  const handleSaveBranch = async () => {
    try {
      // التحقق من صحة البيانات
      if (!formData.name.trim()) {
        onError("اسم الفرع مطلوب");
        return;
      }

      console.log('💾 بدء عملية حفظ الفرع:', {
        isEditing: !!editingBranch,
        branchId: editingBranch?.id,
        formData: formData
      });

      onLoading(true);
      onError(null);
      
      let response;

      const branchData = {
        name: formData.name.trim(),
        manager: formData.manager.trim(),
        address: formData.address.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
      };

      if (editingBranch) {
        // تحديث فرع موجود
        response = await companiesSubscribedApi.updateBranch(editingBranch.id, branchData);
        console.log('📥 استجابة التحديث:', response);
      } else {
        // إضافة فرع جديد
        response = await companiesSubscribedApi.createBranch(company.id, branchData);
        console.log('📥 استجابة الإضافة:', response);
      }

      if (response && response.success) {
        const successMessage = editingBranch ? "تم تحديث الفرع بنجاح" : "تم إضافة الفرع بنجاح";
        showMessage(successMessage, "success");
        console.log('تمت العملية بنجاح:', successMessage);
        
        setDialogOpen(false);
        
        // إعادة تحميل البيانات
        if (isSearchMode) {
          performSearch(searchTerm, searchFilters);
        } else {
          loadBranches(currentPage);
        }
      } else {
        const errorMessage = response?.error || "حدث خطأ غير معروف أثناء حفظ الفرع";
        console.error('❌ فشل في حفظ الفرع:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("💥 خطأ في حفظ الفرع:", {
        error,
        message: error.message,
        isEditing: !!editingBranch,
        formData
      });
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "حدث خطأ أثناء حفظ الفرع";
      
      onError(`فشل في حفظ الفرع: ${errorMessage}`);
      showMessage(`فشل في حفظ الفرع: ${errorMessage}`, "error");
    } finally {
      onLoading(false);
      console.log('🏁 انتهاء عملية حفظ الفرع');
    }
  };

  // حذف فرع
  const handleDeleteBranch = async (branch: Branch) => {
    console.log('🗑️ محاولة حذف الفرع:', {
      branchId: branch.id,
      branchName: branch.name,
      companyId: company.id
    });

    if (!window.confirm(`هل أنت متأكد من حذف فرع "${branch.name}"؟\n\nسيتم حذف جميع المشاريع المرتبطة به نهائياً.\n\nهذه العملية لا يمكن التراجع عنها.`)) {
      console.log('❌ تم إلغاء عملية الحذف من قبل المستخدم');
      return;
    }

    try {
      onLoading(true);
      onError(null);
      
      console.log('📤 إرسال طلب الحذف للخادم...');
      const response = await companiesSubscribedApi.deleteBranch(branch.id);

      console.log('📥 استجابة الخادم للحذف:', {
        response,
        success: response?.success,
        error: response?.error,
        message: response?.message
      });

      if (response && response.success) {
        showMessage("تم حذف الفرع بنجاح", "success");
        console.log('تم حذف الفرع بنجاح من الخادم');
        
        // تحديث العرض بناءً على النمط الحالي
        if (isSearchMode) {
          console.log('في وضع البحث - إعادة تشغيل البحث');
          performSearch(searchTerm, searchFilters);
        } else {
          console.log('في الوضع العادي - تحديث الصفحة');
          const remainingBranches = branches.filter(b => b.id !== branch.id);
          
          if (remainingBranches.length === 0 && currentPage > 1) {
            console.log('الصفحة فارغة، الانتقال للصفحة السابقة');
            loadBranches(currentPage - 1);
          } else {
            console.log('إعادة تحميل الصفحة الحالية');
            loadBranches(currentPage);
          }
        }
      } else {
        const errorMessage = response?.error || "حدث خطأ غير معروف أثناء حذف الفرع";
        console.error('❌ فشل في حذف الفرع:', errorMessage);
        throw new Error(errorMessage);
      }
    } catch (error: any) {
      console.error("💥 خطأ في عملية حذف الفرع:", {
        error,
        message: error.message,
        response: error.response?.data,
        branchId: branch.id
      });
      
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          "حدث خطأ أثناء حذف الفرع";
      
      onError(`فشل في حذف الفرع: ${errorMessage}`);
      showMessage(`❌ فشل في حذف الفرع: ${errorMessage}`, "error");
    } finally {
      onLoading(false);
      console.log('🏁 انتهاء عملية الحذف');
    }
  };

  // تحديد لون الحالة
  const getBranchStatusColor = (isActive: boolean) => {
    return isActive ? "success" : "error";
  };

  const getBranchStatusText = (isActive: boolean) => {
    return isActive ? "نشط" : "غير نشط";
  };

  // البيانات المعروضة حالياً (للعرض العادي أو نتائج البحث)
  const displayedBranches = isSearchMode ? searchResults.slice((searchCurrentPage - 1) * 10, searchCurrentPage * 10) : branches;

  // تحميل البيانات عند بداية التحميل
  useEffect(() => {
    console.log('🔄 تغيير الشركة - إعادة تحميل البيانات:', {
      companyId: company.id,
      companyName: company.name,
      systemType: 'نظام فروع محسن ومتكامل'
    });
    setTotalPages(20);
    loadBranches(1, true);
  }, [company.id]);

  return (
    <Box>
      {/* معلومات الشركة */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Typography variant="h5" gutterBottom>
          🏢 فروع شركة: {company.name}
        </Typography>
        <Box sx={{ display: 'flex', gap: 3, mt: 2, flexWrap: 'wrap' }}>
          <Typography variant="body2">
            🏭 الفروع: {company.branchesCount}/{company.branchesAllowed}
          </Typography>
          <Typography variant="body2">
            📍 العنوان: {company.address || "غير محدد"}
          </Typography>
          <Typography variant="body2">
            📊 إجمالي الفروع: {branches.length}
          </Typography>
        </Box>
      </Paper>

      {/* شريط البحث والإضافة */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="البحث الشامل في جميع الفروع..."
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
            onClick={() => openBranchDialog()}
            disabled={company.branchesCount >= company.branchesAllowed}
          >
            إضافة فرع
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
              <Autocomplete
                value={searchFilters.manager}
                onChange={(event, newValue) => handleFiltersChange({
                  ...searchFilters,
                  manager: newValue || ""
                })}
                options={availableManagers}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="فلترة حسب المدير"
                    size="small"
                    placeholder="اختر مدير الفرع"
                  />
                )}
                freeSolo
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>فلترة حسب الحالة</InputLabel>
                <Select
                  value={searchFilters.isActive}
                  label="فلترة حسب الحالة"
                  onChange={(e) => handleFiltersChange({
                    ...searchFilters,
                    isActive: e.target.value
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
            
            <Grid item xs={12} sm={4}>
              <Autocomplete
                value={searchFilters.city}
                onChange={(event, newValue) => handleFiltersChange({
                  ...searchFilters,
                  city: newValue || ""
                })}
                options={availableCities}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="فلترة حسب المدينة"
                    size="small"
                    placeholder="اختر المدينة"
                  />
                )}
                freeSolo
              />
            </Grid>
          </Grid>
        </Collapse>
        
        {company.branchesCount >= company.branchesAllowed && (
          <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
            ⚠️ تم الوصول للحد الأقصى من الفروع المسموحة ({company.branchesAllowed} فرع)
          </Typography>
        )}
      </Paper>



      {/* معلومات البحث الشامل */}


      {/* أرقام صفحات البحث الذكية - عرض الصفحات الفعلية فقط */}
      {isSearchMode && searchTotalPages > 1 && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={searchTotalPages}
            page={searchCurrentPage}
            onChange={(event, page) => setSearchCurrentPage(page)}
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
          <Typography variant="caption" color="text.secondary" sx={{ ml: 2, alignSelf: 'center' }}>
            {totalPages} صفحة بها بيانات
          </Typography>
        </Box>
      )}

      {/* قائمة الفروع */}
      <TableContainer component={Paper} sx={{ mt: 2 }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                الفرع
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                المدير
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                العنوان
              </TableCell>
              <TableCell sx={{ fontWeight: 'bold', backgroundColor: 'primary.main', color: 'white' }}>
                الاتصال
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
        {localLoading && branches.length === 0 ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell><Skeleton variant="text" width="80%" /></TableCell>
                  <TableCell><Skeleton variant="text" width="60%" /></TableCell>
                  <TableCell><Skeleton variant="text" width="70%" /></TableCell>
                  <TableCell><Skeleton variant="text" width="50%" /></TableCell>
                  <TableCell><Skeleton variant="rectangular" width={80} height={24} /></TableCell>
                  <TableCell><Skeleton variant="rectangular" width="100%" height={36} /></TableCell>
                </TableRow>
              ))
            ) : displayedBranches.length > 0 ? (
              displayedBranches.map((branch) => (
                <TableRow key={branch.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                      <Box sx={{ 
                        bgcolor: 'secondary.main', 
                        color: 'white', 
                        borderRadius: 1, 
                        p: 1,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        minWidth: 40,
                        height: 40
                      }}>
                        <BranchIcon />
                      </Box>
                      <Box>
                        <Typography variant="body1" fontWeight="medium">
                          {branch.name}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {branch.employeesCount || 0} موظف
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell>{branch.manager || 'غير محدد'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <LocationIcon sx={{ fontSize: 16, color: 'text.secondary' }} />
                      <Typography variant="body2" noWrap sx={{ maxWidth: 200 }}>
                        {branch.address || 'غير محدد'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Box>
                      {branch.email && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                          <EmailIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2" noWrap sx={{ maxWidth: 150 }}>
                            {branch.email}
                          </Typography>
                        </Box>
                      )}
                      {branch.phone && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <PhoneIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                          <Typography variant="body2">
                            {branch.phone}
                          </Typography>
                        </Box>
                      )}
                      {!branch.email && !branch.phone && (
                        <Typography variant="body2" color="text.secondary">
                          غير متاح
                        </Typography>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell align="center">
                    <Chip
                      label={getBranchStatusText(branch.isActive)}
                      color={getBranchStatusColor(branch.isActive)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell align="center">
                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'center' }}>
                      <Tooltip title="عرض المشاريع">
                        <IconButton
                          size="small"
                          color="info"
                          onClick={() => onBranchSelect(branch)}
                        >
                          <ProjectIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="تعديل">
                        <IconButton
                          size="small"
                          color="primary"
                          onClick={() => openBranchDialog(branch)}
                        >
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="حذف">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => handleDeleteBranch(branch)}
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
                <TableCell colSpan={6}>
                  <Box sx={{ p: 4, textAlign: 'center' }}>
              <BranchIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
              <Typography variant="h6" color="text.secondary">
                      {searchTerm ? 
                        `لم يتم العثور على نتائج للبحث "${searchTerm}"` : 
                        "لا توجد فروع في هذه الصفحة"
                      }
                    </Typography>
                    {searchTerm ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        جرب البحث بمصطلحات أخرى أو امسح البحث لعرض جميع الفروع
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                          جرب الانتقال لصفحات أخرى أو إضافة فروع جديدة.
              </Typography>
                <Button
                  variant="outlined"
                  startIcon={<AddIcon />}
                  onClick={() => openBranchDialog()}
                          sx={{ mt: 1 }}
                  disabled={company.branchesCount >= company.branchesAllowed}
                >
                          إضافة فرع جديد
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

        {/* معلومات الصفحة المحسنة */}
        {(branches.length > 0 || displayedBranches.length > 0) && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, flexWrap: 'wrap', gap: 2 }}>
            <Typography variant="body2" color="text.secondary">
              عرض {displayedBranches.length} فرع 
              {isSearchMode ? 
                ` - صفحة البحث ${searchCurrentPage} من ${searchTotalPages}` : 
                ` - الصفحة ${currentPage} من ${totalPages}+`
              }
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {isSearchMode ? 
                "🔍 نظام البحث المتوافق" :
                "📄 النظام العادي (10 فروع/صفحة)"
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



      {/* نافذة إضافة/تعديل فرع */}
      <Dialog 
        open={dialogOpen} 
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          {editingBranch ? "تعديل بيانات الفرع" : "إضافة فرع جديد"}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="اسم الفرع"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                fullWidth
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="مدير الفرع"
                value={formData.manager}
                onChange={(e) => setFormData({ ...formData, manager: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="العنوان"
                value={formData.address}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                fullWidth
                multiline
                rows={2}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="البريد الإلكتروني"
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="رقم الهاتف"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                fullWidth
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>إلغاء</Button>
          <Button 
            onClick={handleSaveBranch} 
            variant="contained"
            disabled={!formData.name.trim()}
          >
            {editingBranch ? "تحديث" : "إضافة"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BranchesView; 