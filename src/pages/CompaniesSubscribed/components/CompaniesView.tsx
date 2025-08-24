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
  Business as BusinessIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  AccountTree as BranchIcon,
  LocationOn as LocationIcon,
  Phone as PhoneIcon,
  Email as EmailIcon,
  FilterList as FilterIcon,
  Clear as ClearIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon,
  Group as GroupIcon,
} from "@mui/icons-material";
import { companiesSubscribedApi, Company } from "../api";
import apiClient from "../../../api/config";
import { getSoftStatusChipSx } from "../../../utils/colorUtils";

interface CompaniesViewProps {
  onCompanySelect: (company: Company) => void;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
  showMessage: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

const CompaniesView: React.FC<CompaniesViewProps> = ({
  onCompanySelect,
  onLoading,
  onError,
  showMessage,
}) => {
  // State إدارة البيانات (نظام مبسط وموثوق)
  const [companies, setCompanies] = useState<Company[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCompanies, setTotalCompanies] = useState(0);
  const [localLoading, setLocalLoading] = useState(false);
  
  // State إضافي للتوافق مع البحث المتقدم
  const [pageLastIds, setPageLastIds] = useState<{[key: number]: number}>({1: 0});
  const [hasNextPage, setHasNextPage] = useState(false);
  
  // State البحث المحسن مع نظام الصفحات (متوافق مع الفروع)
  const [isSearchMode, setIsSearchMode] = useState(false);
  const [searchResults, setSearchResults] = useState<Company[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchFilters, setSearchFilters] = useState({
    city: "",
    country: "",
    isActive: ""
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
  const [editingCompany, setEditingCompany] = useState<Company | null>(null);
  const [isDialogLoading, setIsDialogLoading] = useState(false);

  // إدارة إغلاق النافذة وإعادة تعيين التركيز
  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCompany(null);
    // إعادة تعيين النموذج
    setFormData({
      name: "",
      buildingNumber: "",
      streetName: "",
      neighborhoodName: "",
      postalCode: "",
      city: "",
      country: "",
      commercialRegistrationNumber: "",
      taxNumber: "",
      branchesAllowed: "",
      subscriptionStartDate: "",
      subscriptionEndDate: "",
      cost: "",
    });
  };
  const [formData, setFormData] = useState({
    name: "",
    buildingNumber: "",
    streetName: "",
    neighborhoodName: "",
    postalCode: "",
    city: "",
    country: "",
    commercialRegistrationNumber: "",
    taxNumber: "",
    branchesAllowed: "",
    subscriptionStartDate: "",
    subscriptionEndDate: "",
    cost: "",
  });

  // قائمة المدن المتاحة (من البيانات الموجودة)
  const availableCities = React.useMemo(() => {
    const cities = new Set<string>();
    companies.forEach(company => {
      if (company.city && company.city.trim()) {
        cities.add(company.city.trim());
      }
    });
    return Array.from(cities).sort();
  }, [companies]);

  // قائمة الدول المتاحة (من البيانات الموجودة)
  const availableCountries = React.useMemo(() => {
    const countries = new Set<string>();
    companies.forEach(company => {
      if (company.country && company.country.trim()) {
        countries.add(company.country.trim());
      }
    });
    return Array.from(countries).sort();
  }, [companies]);

  // البحث الشامل المحسن مع نظام الصفحات (متوافق مع الفروع)
  const performSearch = useCallback(async (
    term: string, 
    filters: {city?: string; country?: string; isActive?: string}
  ) => {
    if (!term.trim() && !filters.city && !filters.country && !filters.isActive) {
      setIsSearchMode(false);
      setSearchResults([]);
      setSearchSummary(null);
      return;
    }

    setSearchLoading(true);
    setIsSearchMode(true);
    
    try {
              console.log('تنفيذ البحث الشامل في الشركات:', {
        searchTerm: term,
        filters,
        system: 'متوافق مع نظام الفروع'
      });

      const filtersObject = {
        city: filters.city || undefined,
        country: filters.country || undefined,
        isActive: filters.isActive || undefined
      };

      // استخدام النظام الأصلي للبحث مع فلترة محلية (مثل الفروع)
      const allCompanies: Company[] = [];
      let currentPage = 1;
      let hasMorePages = true;
      const maxPages = 50; // حد أقصى للأمان

      // جلب جميع الشركات صفحة بصفحة
      while (hasMorePages && currentPage <= maxPages) {
        const pageResponse = await companiesSubscribedApi.getCompanies({
          page: currentPage,
          limit: 10,
          search: "",
          number: 0
        });

        if (!pageResponse.success) {
          throw new Error(pageResponse.error);
        }

        const pageCompanies = pageResponse.data || [];
        if (pageCompanies.length === 0) {
          hasMorePages = false;
        } else {
          allCompanies.push(...pageCompanies);
          hasMorePages = pageCompanies.length === 10;
          currentPage++;
        }
      }

              console.log('إجمالي الشركات المجلبة للبحث:', {
        totalCompanies: allCompanies.length,
        pagesChecked: currentPage - 1,
        searchTerm: term
      });

      // تطبيق الفلترة المحلية
      let filteredCompanies = allCompanies;

      if (term.trim()) {
        const searchTerm = term.toLowerCase();
        filteredCompanies = filteredCompanies.filter(company =>
          (company.name || "").toLowerCase().includes(searchTerm) ||
          (company.address || "").toLowerCase().includes(searchTerm) ||
          (company.city || "").toLowerCase().includes(searchTerm) ||
          (company.country || "").toLowerCase().includes(searchTerm) ||
          ((company as any).commercialRegistrationNumber || company.registrationNumber || "").toString().toLowerCase().includes(searchTerm) ||
          ((company as any).taxNumber || "").toString().toLowerCase().includes(searchTerm)
        );
      }

      if (filtersObject.city) {
        filteredCompanies = filteredCompanies.filter(company =>
          (company.city || "").toLowerCase().includes(filtersObject.city!.toLowerCase())
        );
      }

      if (filtersObject.country) {
        filteredCompanies = filteredCompanies.filter(company =>
          (company.country || "").toLowerCase().includes(filtersObject.country!.toLowerCase())
        );
      }

      if (filtersObject.isActive !== undefined && filtersObject.isActive !== '') {
        if (filtersObject.isActive === 'active') {
          filteredCompanies = filteredCompanies.filter(company => {
            const now = new Date();
            const endDate = new Date(company.subscriptionEnd);
            return company.isActive && endDate > now;
          });
        } else if (filtersObject.isActive === 'expired') {
          filteredCompanies = filteredCompanies.filter(company => {
            const now = new Date();
            const endDate = new Date(company.subscriptionEnd);
            return !company.isActive || endDate <= now;
          });
        }
      }

      const response = {
        success: true,
        data: filteredCompanies,
        message: `تم العثور على ${filteredCompanies.length} شركة`
      };

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

        console.log('نتائج البحث الشامل للشركات:', {
          searchTerm: term,
          filtersApplied: filters,
          resultsFound: results.length,
          companyNames: results.map(c => c.name)
        });
      } else {
        throw new Error("حدث خطأ أثناء البحث");
      }
    } catch (error: any) {
      console.error("خطأ في البحث:", error);
      onError(error.message || "حدث خطأ أثناء البحث في الشركات");
      setSearchResults([]);
      setSearchSummary(null);
    } finally {
      setSearchLoading(false);
    }
  }, [onError]);

  // Debounce للبحث (تأخير 500ms) - متوافق مع الفروع
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
    
    if (!term.trim() && !searchFilters.city && !searchFilters.country && !searchFilters.isActive) {
      setIsSearchMode(false);
      setSearchResults([]);
      setSearchSummary(null);
      if (companies.length === 0) {
        loadCompanies(1, true);
      }
    } else {
      debouncedSearch(term, searchFilters);
    }
  };

  // التعامل مع تغيير الفلاتر
  const handleFiltersChange = (newFilters: any) => {
    setSearchFilters(newFilters);
    
    if (!searchTerm.trim() && !newFilters.city && !newFilters.country && !newFilters.isActive) {
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
      city: "",
      country: "",
      isActive: ""
    });
    setIsSearchMode(false);
    setSearchResults([]);
    setSearchSummary(null);
    
    if (companies.length === 0) {
      loadCompanies(1, true);
    }
  };

  // تحميل الشركات بنظام مختلط (أصلي + محسن)
  const loadCompanies = async (page = 1, resetPagination = false) => {
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

              console.log('تحميل الشركات (نظام مختلط محسن):', {
        requestedPage: page,
        resetPagination,
        system: 'نظام أصلي مع تحسينات'
      });

      // استخدام النظام الأصلي الموثوق مع التحسينات
      const response = await companiesSubscribedApi.getCompanies({
        page: page,
        limit: 10,
        search: "",
        number: 0
      });

      if (response.success) {
        const newCompanies = response.data || [];
        const totalCount = response.countcompany || 0;
        
        // console.log('البيانات المستلمة (نظام مختلط):', {
        //   page,
        //   newCompaniesCount: newCompanies.length,
        //   totalCount,
        //   companyNames: newCompanies.map(c => c.name),
        //   companyIds: newCompanies.map(c => c.id)
        // });
        
        setCompanies(newCompanies);
        setCurrentPage(page);
        
        // حساب الصفحات بناء على العدد الإجمالي (النظام الأصلي)
        const calculatedTotalPages = Math.ceil(totalCount / 10);
        setTotalPages(calculatedTotalPages);
        setTotalCompanies(totalCount);
        setHasNextPage(page < calculatedTotalPages);

        // تحديث pageLastIds للتوافق مع نظام البحث المتقدم
        if (newCompanies.length > 0) {
          const lastCompanyId = newCompanies[newCompanies.length - 1].id;
          setPageLastIds(prev => ({
            ...prev,
            [page]: page === 1 ? 0 : prev[page] || 0,
            [page + 1]: lastCompanyId
          }));
        }
        
        // console.log('📈 تحديث حالة الشركات (نظام مختلط):', {
        //   currentPage: page,
        //   totalPages: calculatedTotalPages,
        //   totalCompanies: totalCount,
        //   hasNextPage: page < calculatedTotalPages,
        //   systemType: 'نظام مختلط موثوق - يجلب جميع الشركات'
        // });
      } else {
        throw new Error(response.error || "حدث خطأ أثناء تحميل الشركات");
      }
    } catch (error: any) {
      console.error("خطأ في تحميل الشركات:", error);
      onError(error.message || "حدث خطأ أثناء تحميل الشركات");
      
      if (page > 1) {
        setCurrentPage(page - 1);
        setTotalPages(Math.max(1, page - 1));
      }
    } finally {
      setLocalLoading(false);
      onLoading(false);
    }
  };

  // التنقل بين الصفحات (نظام مبسط وموثوق)
  const handlePageChange = (event: React.ChangeEvent<unknown>, page: number) => {
    if (!localLoading && page !== currentPage && page >= 1 && page <= totalPages) {
              console.log('تغيير الصفحة (نظام مبسط):', {
        fromPage: currentPage,
        toPage: page,
        totalPages,
        system: 'نظام أصلي موثوق'
      });
      
      loadCompanies(page);
    }
  };

  // فتح نافذة إضافة/تعديل شركة
  const openCompanyDialog = (company?: Company) => {
    if (company) {
      console.log('🔧 فتح نموذج التعديل للشركة:', {
        companyId: company.id,
        companyName: company.name,
        originalData: company
      });
      
      setEditingCompany(company);
      setFormData({
        name: company.name || "",
        buildingNumber: "",
        streetName: "",
        neighborhoodName: "",
        postalCode: "",
        city: company.city || "",
        country: company.country || "",
        commercialRegistrationNumber: (company as any).commercialRegistrationNumber || company.registrationNumber || "",
        taxNumber: "",
        branchesAllowed: company.branchesAllowed?.toString() || "",
        subscriptionStartDate: company.subscriptionStart || "",
        subscriptionEndDate: company.subscriptionEnd || "",
        cost: "",
      });
    } else {
      console.log('➕ فتح نموذج إضافة شركة جديدة');
      setEditingCompany(null);
      setFormData({
        name: "",
        buildingNumber: "",
        streetName: "",
        neighborhoodName: "",
        postalCode: "",
        city: "",
        country: "",
        commercialRegistrationNumber: "",
        taxNumber: "",
        branchesAllowed: "",
        subscriptionStartDate: "",
        subscriptionEndDate: "",
        cost: "",
      });
    }
    setDialogOpen(true);
  };

  // عند فتح نافذة تعديل شركة: اجلب كل الحقول الناقصة من المسار الكامل
  useEffect(() => {
    const fetchFullCompanyDetails = async () => {
      if (!dialogOpen || !editingCompany) return;
      try {
        setIsDialogLoading(true);
        const resp = await apiClient.get('/company', { params: { idCompany: editingCompany.id } });
        const raw = resp?.data?.data || {};
        const details: any = Array.isArray(raw) ? (raw[0] || {}) : raw;

        // تطبيع الحقول من الباك الكامل
        const buildingNumber = String(details.BuildingNumber || details.buildingNumber || "");
        const streetName = String(details.StreetName || details.streetName || "");
        const neighborhoodName = String(details.NeighborhoodName || details.neighborhoodName || "");
        const postalCode = String(details.PostalCode || details.postalCode || "");
        const city = String(details.City || details.city || "");
        const country = String(details.Country || details.country || "");
        const registrationNumber = String(details.CommercialRegistrationNumber || details.registrationNumber || "");
        const taxNumber = String(details.TaxNumber || details.taxNumber || "");
        const branchesAllowed = String(details.NumberOFbranchesAllowed || details.branchesAllowed || "");
        const subscriptionStartDate = String(details.SubscriptionStartDate || details.subscriptionStartDate || "");
        const subscriptionEndDate = String(details.SubscriptionEndDate || details.subscriptionEndDate || "");
        const cost = String(details.Cost || details.cost || "");

        // دمج القيم في النموذج دون فقد ما تم تعبئته مسبقاً
        setFormData(prev => ({
          ...prev,
          name: prev.name || editingCompany.name || "",
          city: prev.city || city,
          country: prev.country || country,
          commercialRegistrationNumber: prev.commercialRegistrationNumber || registrationNumber,
          buildingNumber: prev.buildingNumber || buildingNumber,
          streetName: prev.streetName || streetName,
          neighborhoodName: prev.neighborhoodName || neighborhoodName,
          postalCode: prev.postalCode || postalCode,
          taxNumber: prev.taxNumber || taxNumber,
          branchesAllowed: prev.branchesAllowed || branchesAllowed,
          subscriptionStartDate: prev.subscriptionStartDate || subscriptionStartDate,
          subscriptionEndDate: prev.subscriptionEndDate || subscriptionEndDate,
          cost: prev.cost || cost,
        }));
      } catch (e: any) {
        console.error('فشل جلب تفاصيل الشركة:', e);
        onError(e?.response?.data?.error || e?.message || 'تعذر جلب تفاصيل الشركة');
      } finally {
        setIsDialogLoading(false);
      }
    };
    fetchFullCompanyDetails();
  }, [dialogOpen, editingCompany]);

  // حفظ الشركة
  const handleSaveCompany = async () => {
    try {
      // التحقق من صحة البيانات المطلوبة
      if (!(formData.name || "").trim()) {
        onError("اسم الشركة مطلوب");
        return;
      }
      
      if (!formData.commercialRegistrationNumber || formData.commercialRegistrationNumber.toString().trim() === "") {
        onError("رقم التسجيل التجاري مطلوب");
        return;
      }
      
      if (!formData.taxNumber || formData.taxNumber.toString().trim() === "") {
        onError("الرقم الضريبي مطلوب");
        return;
      }
      
      if (!formData.buildingNumber || formData.buildingNumber.toString().trim() === "") {
        onError("رقم المبنى مطلوب");
        return;
      }
      
      if (!(formData.streetName || "").trim()) {
        onError("اسم الشارع مطلوب");
        return;
      }
      
      if (!(formData.neighborhoodName || "").trim()) {
        onError("اسم الحي مطلوب");
        return;
      }
      
      if (!(formData.postalCode || "").trim()) {
        onError("الرمز البريدي مطلوب");
        return;
      }
      
      if (!(formData.city || "").trim()) {
        onError("المدينة مطلوبة");
        return;
      }
      
      if (!(formData.country || "").trim()) {
        onError("الدولة مطلوبة");
        return;
      }
      
      if (!formData.branchesAllowed || formData.branchesAllowed.toString().trim() === "") {
        onError("عدد الفروع المسموحة مطلوب");
        return;
      }

      console.log('💾 بدء عملية حفظ الشركة:', {
        isEditing: !!editingCompany,
        companyId: editingCompany?.id,
        formData: formData
      });

      // فحص صحة البيانات قبل المعالجة
              console.log('فحص أنواع البيانات:', {
        nameType: typeof formData.name,
        buildingNumberType: typeof formData.buildingNumber,
        streetNameType: typeof formData.streetName,
        cityType: typeof formData.city,
        countryType: typeof formData.country,
        commercialRegistrationNumberType: typeof formData.commercialRegistrationNumber,
        commercialRegistrationNumberValue: formData.commercialRegistrationNumber
      });

      onLoading(true);
      onError(null);
      
      let response;

      // البيانات للـ API الحالي (متوافق مع الـ frontend الحالي)
      const companyData = {
        name: (formData.name || "").trim(),
        address: `${formData.buildingNumber || ""} ${formData.streetName || ""} ${formData.neighborhoodName || ""}`.trim(),
        city: (formData.city || "").trim(),
        country: (formData.country || "").trim(),
        registrationNumber: (formData.commercialRegistrationNumber || "").toString(),
        buildingNumber: (formData.buildingNumber || "").toString(),
        streetName: (formData.streetName || "").trim(),
        neighborhoodName: (formData.neighborhoodName || "").trim(),
        postalCode: (formData.postalCode || "").trim(),
        taxNumber: (formData.taxNumber || "").toString(),
        branchesAllowed: formData.branchesAllowed ? parseInt(formData.branchesAllowed) : 0,
        subscriptionStartDate: formData.subscriptionStartDate || "",
        subscriptionEndDate: formData.subscriptionEndDate || "",
        cost: formData.cost ? parseFloat(formData.cost) : 0,
      };

      // البيانات المُستقبلية لـ database schema الكامل (جاهز للـ backend المُحدث)
      const futureCompanyData = {
        NameCompany: (formData.name || "").trim(),
        BuildingNumber: formData.buildingNumber ? parseInt(formData.buildingNumber) : null,
        StreetName: (formData.streetName || "").trim(),
        NeighborhoodName: (formData.neighborhoodName || "").trim(),
        PostalCode: (formData.postalCode || "").trim(),
        City: (formData.city || "").trim(),
        Country: (formData.country || "").trim(),
        CommercialRegistrationNumber: formData.commercialRegistrationNumber ? parseInt(formData.commercialRegistrationNumber) : null,
        TaxNumber: formData.taxNumber ? parseInt(formData.taxNumber) : null,
        NumberOFbranchesAllowed: formData.branchesAllowed ? parseInt(formData.branchesAllowed) : null,
        SubscriptionStartDate: formData.subscriptionStartDate || null,
        SubscriptionEndDate: formData.subscriptionEndDate || null,
        Cost: formData.cost ? parseFloat(formData.cost) : null,
      };

              console.log('البيانات المُحضرة للإرسال:', {
        companyData,
        futureCompanyData,
        isValid: companyData.name.length > 0,
        operation: editingCompany ? 'تحديث' : 'إضافة'
      });

      if (editingCompany) {
        console.log('✏️ تحديث شركة موجودة:', companyData);
        response = await companiesSubscribedApi.updateCompany(editingCompany.id, companyData);
      } else {
        console.log('➕ إضافة شركة جديدة:', companyData);
        response = await companiesSubscribedApi.createCompany(companyData);
      }

      if (response.success) {
        console.log('تم حفظ الشركة بنجاح:', response);
        showMessage(
          editingCompany ? "تم تحديث الشركة بنجاح" : "تم إضافة الشركة بنجاح",
          "success"
        );
        handleCloseDialog();
        
        // إعادة تحميل البيانات
        if (isSearchMode) {
          performSearch(searchTerm, searchFilters);
        } else {
          loadCompanies(currentPage);
        }
      } else {
        throw new Error(response.error || "حدث خطأ أثناء حفظ الشركة");
      }
    } catch (error: any) {
      console.error("خطأ في حفظ الشركة:", error);
      onError(error.message || "حدث خطأ أثناء حفظ الشركة");
    } finally {
      onLoading(false);
    }
  };

  // حذف شركة
  const handleDeleteCompany = async (company: Company) => {
    try {
      console.log('🗑️ بدء عملية حذف الشركة:', {
        companyId: company.id,
        companyName: company.name
      });

      if (!window.confirm(`هل أنت متأكد من حذف الشركة "${company.name}"؟`)) {
      return;
    }

      onLoading(true);
      onError(null);

      const response = await companiesSubscribedApi.deleteCompany(company.id);

      if (response.success) {
        console.log('تم حذف الشركة بنجاح');
        showMessage("تم حذف الشركة بنجاح", "success");
        
        // تحديث العرض بناءً على النمط الحالي
        if (isSearchMode) {
          console.log('في وضع البحث - إعادة تشغيل البحث');
          performSearch(searchTerm, searchFilters);
        } else {
          console.log('في الوضع العادي - تحديث الصفحة');
          const remainingCompanies = companies.filter(c => c.id !== company.id);
          
          if (remainingCompanies.length === 0 && currentPage > 1) {
            console.log('الصفحة فارغة، الانتقال للصفحة السابقة');
            loadCompanies(currentPage - 1);
          } else {
            console.log('إعادة تحميل الصفحة الحالية');
            loadCompanies(currentPage);
          }
        }
      } else {
        throw new Error(response.error || "حدث خطأ أثناء حذف الشركة");
      }
    } catch (error: any) {
      console.error("خطأ في حذف الشركة:", error);
      onError(error.message || "حدث خطأ أثناء حذف الشركة");
    } finally {
      onLoading(false);
    }
  };

  // البيانات المعروضة حالياً (للعرض العادي أو نتائج البحث)
  const displayedCompanies = isSearchMode ? searchResults.slice((searchCurrentPage - 1) * 10, searchCurrentPage * 10) : companies;

  // تحميل البيانات عند بداية التحميل
  useEffect(() => {
    console.log('بدء تحميل الشركات - النظام المختلط الموثوق');
    console.log('النظام: أصلي موثوق + ميزات متقدمة + متوافق مع الفروع');
    loadCompanies(1, true);
  }, []);

  return (
    <Box>
      {/* شريط البحث والإضافة المحسن */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            placeholder="البحث الشامل في جميع الشركات..."
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
            onClick={() => openCompanyDialog()}
          >
            إضافة شركة جديدة
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
            
            <Grid item xs={12} sm={4}>
              <Autocomplete
                value={searchFilters.country}
                onChange={(event, newValue) => handleFiltersChange({
                  ...searchFilters,
                  country: newValue || ""
                })}
                options={availableCountries}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="فلترة حسب الدولة"
                    size="small"
                    placeholder="اختر الدولة"
                  />
                )}
                freeSolo
              />
            </Grid>
            
            <Grid item xs={12} sm={4}>
              <FormControl fullWidth size="small">
                <InputLabel>فلترة حسب حالة الاشتراك</InputLabel>
                <Select
                  value={searchFilters.isActive}
                  label="فلترة حسب حالة الاشتراك"
                  onChange={(e) => handleFiltersChange({
                    ...searchFilters,
                    isActive: e.target.value
                  })}
                >
                  <MenuItem value="">
                    <em>جميع الحالات</em>
                  </MenuItem>
                  <MenuItem value="active">نشط</MenuItem>
                  <MenuItem value="expired">منتهي</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </Collapse>
      </Paper>





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

      {/* أرقام الصفحات الموثوقة - يعرض جميع الصفحات */}
      {totalPages > 1 && !isSearchMode && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
            showFirstButton={true}
            showLastButton={true}
            disabled={localLoading}
            siblingCount={2}
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

      {/* قائمة الشركات */}
      <TableContainer component={Paper} sx={{ width: '100%', overflowX: 'auto' }}>
        <Table size="small" sx={{ minWidth: 700 }}>
          <TableHead>
            <TableRow>
              <TableCell>الشركة</TableCell>
              <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>العنوان والموقع</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>تفاصيل الاشتراك (ميلادي)</TableCell>
              <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>الفروع</TableCell>
              <TableCell>الحالة</TableCell>
              <TableCell>الإجراءات</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {localLoading || searchLoading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton variant="text" width="60%" />
                    <Skeleton variant="text" width="80%" />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Skeleton variant="text" width="70%" />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Skeleton variant="text" width="50%" />
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Skeleton variant="text" width="40%" />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="rectangular" width={60} height={24} />
                  </TableCell>
                  <TableCell>
                    <Skeleton variant="text" width="80%" />
                  </TableCell>
                </TableRow>
              ))
            ) : displayedCompanies.length > 0 ? (
              displayedCompanies.map((company) => (
                <TableRow key={company.id} hover>
                  <TableCell>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon color="primary" sx={{ fontSize: { xs: 20, sm: 24 } }} />
                      <Box>
                        <Typography variant="subtitle2" fontWeight="bold">
                          {company.name}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          رقم التسجيل: {(company as any).commercialRegistrationNumber || company.registrationNumber || 'غير محدد'}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', sm: 'table-cell' } }}>
                    <Box>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <LocationIcon fontSize="small" color="action" />
                        <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 200 }}>{company.address || 'غير محدد'}</span>
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        {company.city}{company.country && `, ${company.country}`}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Typography variant="body2">
                      من: {new Date(company.subscriptionStart).toLocaleDateString('en-GB')}
                    </Typography>
                    <Typography variant="body2">
                      إلى: {new Date(company.subscriptionEnd).toLocaleDateString('en-GB')}
                    </Typography>
                  </TableCell>
                  <TableCell sx={{ display: { xs: 'none', md: 'table-cell' } }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                      <BranchIcon fontSize="small" color="action" />
                      <Typography variant="body2">
                        {company.branchesCount || 0} / {company.branchesAllowed || '∞'}
                      </Typography>
                    </Box>
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={company.isActive ? 'نشط' : 'غير نشط'}
                      size="small"
                      sx={getSoftStatusChipSx(!!company.isActive)}
                    />
                  </TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1 }}>
                      <Tooltip title="عرض التفاصيل">
                        <Button
                          size="small"
                          variant="outlined"
                          startIcon={<GroupIcon />}
                          onClick={() => onCompanySelect(company)}
                        >
                          التفاصيل
                        </Button>
                      </Tooltip>
                      <Tooltip title="تعديل">
                        <IconButton size="small" onClick={() => openCompanyDialog(company)}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="حذف">
                        <IconButton size="small" color="error" onClick={() => handleDeleteCompany(company)}>
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
                  <Box sx={{ textAlign: 'center', py: 4 }}>
                    <BusinessIcon sx={{ fontSize: { xs: 40, sm: 64 }, color: 'text.secondary', mb: 2 }} />
                    <Typography variant="h6" color="text.secondary">
                      {searchTerm ? `لم يتم العثور على نتائج للبحث "${searchTerm}"` : 'لا توجد شركات في هذه الصفحة'}
                    </Typography>
                    {searchTerm ? (
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                        جرب البحث بمصطلحات أخرى أو امسح البحث لعرض جميع الشركات
                      </Typography>
                    ) : (
                      <>
                        <Typography variant="body2" color="text.secondary" sx={{ mt: 1, mb: 2 }}>
                          جرب الانتقال لصفحات أخرى أو إضافة شركات جديدة.
                        </Typography>
                        <Button variant="outlined" startIcon={<AddIcon />} onClick={() => openCompanyDialog()} sx={{ mt: 1 }}>
                          إضافة شركة جديدة
                        </Button>
                      </>
                    )}
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
                      الصفحة {currentPage} من {totalPages} - النظام المختلط الموثوق ({totalCompanies} شركة إجمالي)
                    </Typography>
                  </Box>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>

      {/* معلومات الصفحة المحسنة */}
      {(companies.length > 0 || displayedCompanies.length > 0) && (
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2, flexWrap: 'wrap', gap: 2 }}>
        <Typography variant="body2" color="text.secondary">
            عرض {displayedCompanies.length} شركة 
            {isSearchMode ? 
              ` - صفحة البحث ${searchCurrentPage} من ${searchTotalPages}` : 
              ` من أصل ${totalCompanies} شركة - الصفحة ${currentPage} من ${totalPages}`
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



      {/* نافذة إضافة/تعديل شركة */}
      <Dialog 
        open={dialogOpen} 
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        disableRestoreFocus
        disableEnforceFocus={false}
        aria-labelledby="company-dialog-title"
        aria-describedby="company-dialog-description"
        keepMounted={false}
        PaperProps={{
          role: 'dialog',
          'aria-modal': true,
        }}
      >
        <DialogTitle id="company-dialog-title">
          {editingCompany ? "تعديل الشركة" : "إضافة شركة جديدة"}
        </DialogTitle>
        <DialogContent>
          {isDialogLoading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
              <CircularProgress size={20} />
              <Typography variant="body2" color="text.secondary">جاري جلب تفاصيل الشركة...</Typography>
            </Box>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            {/* معلومات أساسية */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" sx={{ mb: 1 }}>
                المعلومات الأساسية
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="اسم الشركة *"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
                autoFocus
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="رقم التسجيل التجاري *"
                type="number"
                value={formData.commercialRegistrationNumber}
                onChange={(e) => setFormData({ ...formData, commercialRegistrationNumber: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الرقم الضريبي *"
                type="number"
                value={formData.taxNumber}
                onChange={(e) => setFormData({ ...formData, taxNumber: e.target.value })}
                required
              />
            </Grid>

            {/* معلومات العنوان */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" sx={{ mt: 2, mb: 1 }}>
                معلومات العنوان
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="رقم المبنى *"
                type="number"
                value={formData.buildingNumber}
                onChange={(e) => setFormData({ ...formData, buildingNumber: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="اسم الشارع *"
                value={formData.streetName}
                onChange={(e) => setFormData({ ...formData, streetName: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="اسم الحي *"
                value={formData.neighborhoodName}
                onChange={(e) => setFormData({ ...formData, neighborhoodName: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الرمز البريدي *"
                value={formData.postalCode}
                onChange={(e) => setFormData({ ...formData, postalCode: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="المدينة *"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="الدولة *"
                value={formData.country}
                onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                required
              />
            </Grid>

            {/* معلومات الاشتراك */}
            <Grid item xs={12}>
              <Typography variant="h6" color="primary" sx={{ mt: 2, mb: 1 }}>
                معلومات الاشتراك
              </Typography>
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="عدد الفروع المسموحة *"
                type="number"
                value={formData.branchesAllowed}
                onChange={(e) => setFormData({ ...formData, branchesAllowed: e.target.value })}
                required
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="التكلفة"
                type="number"
                value={formData.cost}
                onChange={(e) => setFormData({ ...formData, cost: e.target.value })}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="تاريخ بداية الاشتراك (ميلادي)"
                type="date"
                value={formData.subscriptionStartDate}
                onChange={(e) => setFormData({ ...formData, subscriptionStartDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="تاريخ نهاية الاشتراك (ميلادي)"
                type="date"
                value={formData.subscriptionEndDate}
                onChange={(e) => setFormData({ ...formData, subscriptionEndDate: e.target.value })}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            
            
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>إلغاء</Button>
          <Button variant="contained" onClick={handleSaveCompany} autoFocus>
            {editingCompany ? "تحديث" : "إضافة"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompaniesView; 