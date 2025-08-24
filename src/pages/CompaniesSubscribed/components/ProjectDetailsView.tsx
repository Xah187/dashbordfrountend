import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Paper,
  Typography,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Grid,
  Chip,
  Button,
  IconButton,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Divider,
  Alert,
  Skeleton,
  Pagination,
  Tooltip,
  Avatar,
  LinearProgress,
  CircularProgress,
  AlertTitle,
  Collapse,
  Badge,
  useTheme,
} from "@mui/material";
import {
  ArrowBack as ArrowBackIcon,
  ExpandMore as ExpandMoreIcon,
  Timeline as TimelineIcon,
  AccountBalance as MoneyIcon,
  Assignment as RequestIcon,
  Group as GroupIcon,
  TrendingUp as RevenueIcon,
  TrendingDown as ExpenseIcon,
  Assignment as TaskIcon,
  Warning as WarningIcon,
  CheckCircle as CheckIcon,
  Schedule as DelayIcon,
  Info as InfoIcon,
  Receipt as ReceiptIcon,
  Assessment as AssessmentIcon,
  LocationOn as LocationIcon,
} from "@mui/icons-material";
import { getSoftStageStatusChipSx, getSoftStatusChipSx } from "../../../utils/colorUtils";
import { companiesSubscribedApi } from "../api";

interface ProjectDetailsViewProps {
  project: any;
  onBack: () => void;
  onLoading: (loading: boolean) => void;
  onError: (error: string | null) => void;
  showMessage: (message: string, severity?: 'success' | 'error' | 'warning' | 'info') => void;
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div role="tabpanel" hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ProjectDetailsView: React.FC<ProjectDetailsViewProps> = ({
  project,
  onBack,
  onLoading,
  onError,
  showMessage,
}) => {
  const theme = useTheme();
  // ألوان شرائح هادئة (soft) للاستخدام داخل تبويب الطلبات
  const getSoftChipSx = (tone: 'primary' | 'info' | 'success' | 'warning' | 'error' | 'default') => {
    const map: Record<string, { bg: string; text: string; border: string }> = {
      primary: { bg: 'rgba(33,150,243,0.10)', text: '#1565c0', border: 'rgba(33,150,243,0.30)' },
      info: { bg: 'rgba(33,150,243,0.10)', text: '#1565c0', border: 'rgba(33,150,243,0.30)' },
      success: { bg: 'rgba(76,175,80,0.12)', text: '#2e7d32', border: 'rgba(76,175,80,0.30)' },
      warning: { bg: 'rgba(255,152,0,0.12)', text: '#ef6c00', border: 'rgba(255,152,0,0.30)' },
      error: { bg: 'rgba(244,67,54,0.12)', text: '#c62828', border: 'rgba(244,67,54,0.30)' },
      default: { bg: 'rgba(158,158,158,0.12)', text: '#455a64', border: 'rgba(158,158,158,0.30)' },
    };
    const v = map[tone] || map.default;
    return { bgcolor: v.bg, color: v.text, border: '1px solid', borderColor: v.border };
  };
  // تمييز نوع الطلب: ثقيل / خفيف / غير ذلك
  const getRequestTypeTone = (typeValue: any): 'warning' | 'success' | 'info' => {
    const t = (typeValue || '').toString().toLowerCase();
    if (t.includes('ثقيل') || t.includes('ثقيلة') || t.includes('heavy')) return 'warning';
    if (t.includes('خفيف') || t.includes('خفيفة') || t.includes('light')) return 'success';
    return 'info';
  };
  
  // State إدارة التابات
  const [activeTab, setActiveTab] = useState(0);
  
  // State البيانات الأساسية
  const [projectDetails, setProjectDetails] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  // State المراحل
  const [mainStages, setMainStages] = useState<any[]>([]);
  const [allMainStages, setAllMainStages] = useState<any[]>([]); // جميع المراحل للإحصائيات
  const [stagesPage, setStagesPage] = useState(1);
  const [stagesTotalPages, setStagesTotalPages] = useState(1);
  const [stagesLastId, setStagesLastId] = useState(0);
  const [stagesHasMore, setStagesHasMore] = useState(false);
  const [stagesTotalCount, setStagesTotalCount] = useState(0);
  const [stagesLoading, setStagesLoading] = useState(false);
  const [expandedStage, setExpandedStage] = useState<number | null>(null);
  const [subStages, setSubStages] = useState<{ [key: number]: any[] }>({});
  const [stageNotes, setStageNotes] = useState<{ [key: number]: any[] }>({});

  // إدارة pagination للمراحل الفرعية
  const [subStagesPage, setSubStagesPage] = useState<{ [key: number]: number }>({});
  const [subStagesTotalPages, setSubStagesTotalPages] = useState<{ [key: number]: number }>({});
  const [subStagesPageLastIds, setSubStagesPageLastIds] = useState<{ [key: number]: { [page: number]: number } }>({});
  const [subStagesHasMore, setSubStagesHasMore] = useState<{ [key: number]: boolean }>({});
  const [subStagesLoading, setSubStagesLoading] = useState<{ [key: number]: boolean }>({});

  // State المالية مع نظام مطوي لتوفير الضغط على السيرفر
  const [expenses, setExpenses] = useState<any[]>([]);
  const [revenues, setRevenues] = useState<any[]>([]);
  const [returns, setReturns] = useState<any[]>([]);
  const [expensesPage, setExpensesPage] = useState(1);
  const [expensesLastId, setExpensesLastId] = useState(0);
  const [expensesHasMore, setExpensesHasMore] = useState(true);
  const [expensesTotalPages, setExpensesTotalPages] = useState(1);
  const [expensesLoading, setExpensesLoading] = useState(false);
  const [revenuesPage, setRevenuesPage] = useState(1);
  const [revenuesLastId, setRevenuesLastId] = useState(0);
  const [revenuesHasMore, setRevenuesHasMore] = useState(true);
  const [revenuesTotalPages, setRevenuesTotalPages] = useState(1);
  const [revenuesLoading, setRevenuesLoading] = useState(false);
  const [returnsPage, setReturnsPage] = useState(1);
  const [returnsLastId, setReturnsLastId] = useState(0);
  const [returnsHasMore, setReturnsHasMore] = useState(true);
  const [returnsTotalPages, setReturnsTotalPages] = useState(1);
  const [returnsLoading, setReturnsLoading] = useState(false);

  // State للتحكم في فتح/إغلاق الأقسام المالية
  const [expensesExpanded, setExpensesExpanded] = useState(false);
  const [revenuesExpanded, setRevenuesExpanded] = useState(false);
  const [returnsExpanded, setReturnsExpanded] = useState(false);

  // State الطلبات مع pagination ذكي وعداد شامل
  const [requests, setRequests] = useState<any[]>([]);
  const [requestsPage, setRequestsPage] = useState(1);
  const [requestsTotalPages, setRequestsTotalPages] = useState(1);
  const [requestsLoading, setRequestsLoading] = useState(false);
  const [requestsTotalCount, setRequestsTotalCount] = useState<number>(0);

  // State فريق العمل
  const [projectTeam, setProjectTeam] = useState<any[]>([]);
  // فريق العمل الفعلي المستخرج من المراحل والملاحظات والطلبات
  const [actualProjectTeam, setActualProjectTeam] = useState<Array<{
    name: string;
    openedStages: number;
    closedStages: number;
    notesRecorded: number;
    requestsInserted: number;
    requestsImplemented: number;
    totalContributions: number;
  }>>([]);
  const [teamLoading, setTeamLoading] = useState(false);

  // State التقارير المالية
  const [financialReports, setFinancialReports] = useState<any>(null);
  const [financialReportsLoading, setFinancialReportsLoading] = useState(false);

  // تحميل تفاصيل المشروع الكاملة
  const loadProjectFullDetails = async () => {
    try {
      setLoading(true);
      onLoading(true);
      
      const response = await companiesSubscribedApi.getProjectFullDetails(project.id);
      if (response.success) {
        setProjectDetails(response.data);
        console.log('📋 تفاصيل المشروع الكاملة:', response.data);
      } else {
        onError(response.error || "حدث خطأ أثناء تحميل تفاصيل المشروع");
      }
    } catch (error: any) {
      console.error("خطأ في تحميل تفاصيل المشروع:", error);
      onError(error.message || "حدث خطأ أثناء تحميل تفاصيل المشروع");
    } finally {
      setLoading(false);
      onLoading(false);
    }
  };

  // تحميل المراحل الرئيسية مع تصحيح مشاكل العرض والتنقل
  const loadMainStages = async (page = 1, resetPagination = false) => {
    try {
      setStagesLoading(true);
      
      // تم تقليل logging لتحسين الأداء
      if (process.env.NODE_ENV === 'development') {
        console.log(`📊 [Frontend] طلب تحميل المراحل:`, { page, resetPagination, projectId: project.id });
      }
      
      const response = await companiesSubscribedApi.getProjectMainStages(project.id, 0);
      
      if (process.env.NODE_ENV === 'development') {
        console.log(`📥 [Frontend] استجابة API:`, {
          success: response.success,
          dataLength: response.data?.length,
          totalCount: response.totalCount,
          hasMore: response.hasMore,
          error: response.error
        });
      }
      
      if (response.success && response.data) {
        const allStagesData = response.data || [];
        
        if (allStagesData.length === 0) {
          if (process.env.NODE_ENV === 'development') {
            console.warn('⚠️ [Frontend] لا توجد مراحل في البيانات');
          }
          setAllMainStages([]);
          setMainStages([]);
          setStagesPage(1);
          setStagesTotalPages(1);
          setStagesTotalCount(0);
          setStagesHasMore(false);
          return;
        }
        
        // تطبيق pagination في الفرونت اند (10 مراحل في الصفحة)
        const itemsPerPage = 10;
        const startIndex = (page - 1) * itemsPerPage;
        const endIndex = startIndex + itemsPerPage;
        const pageStages = allStagesData.slice(startIndex, endIndex);
        const totalPages = Math.ceil(allStagesData.length / itemsPerPage);
        
        // تحديث الحالات
        setAllMainStages(allStagesData); // حفظ جميع المراحل للإحصائيات
        setMainStages(pageStages); // المراحل المعروضة في الصفحة الحالية
        setStagesPage(page);
        setStagesTotalPages(totalPages);
        setStagesTotalCount(allStagesData.length);
        setStagesHasMore(endIndex < allStagesData.length);
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ [Frontend] تم تحديث حالات المراحل:', {
            allStagesCount: allStagesData.length,
            displayedStages: pageStages.length,
            currentPage: page,
            totalPages: totalPages,
            startIndex: startIndex,
            endIndex: endIndex
          });
        }
        
      } else {
        console.error('❌ [Frontend] فشل في تحميل المراحل:', response.error);
        setAllMainStages([]);
        setMainStages([]);
        setStagesPage(1);
        setStagesTotalPages(1);
        setStagesTotalCount(0);
        setStagesHasMore(false);
        onError(response.error || "فشل في تحميل المراحل الرئيسية");
      }
    } catch (error: any) {
      console.error("❌ [Frontend] خطأ في تحميل المراحل:", {
        error: error.message,
        projectId: project.id,
        page
      });
      setAllMainStages([]);
      setMainStages([]);
      setStagesPage(1);
      setStagesTotalPages(1);
      setStagesTotalCount(0);
      setStagesHasMore(false);
      onError(error.message || "حدث خطأ أثناء تحميل المراحل");
    } finally {
      setStagesLoading(false);
    }
  };

  // تحميل المراحل الفرعية لمرحلة محددة مع نظام last_id pagination
  const loadSubStages = async (stageId: number, page = 1, resetPagination = false) => {
    try {
      setSubStagesLoading(prev => ({ ...prev, [stageId]: true }));
      
      if (resetPagination) {
        setSubStagesPageLastIds(prev => ({ ...prev, [stageId]: { 1: 0 } }));
        setSubStagesPage(prev => ({ ...prev, [stageId]: 1 }));
        setSubStagesTotalPages(prev => ({ ...prev, [stageId]: 1 }));
        setSubStagesHasMore(prev => ({ ...prev, [stageId]: false }));
        page = 1;
      }

      const currentPageLastIds = subStagesPageLastIds[stageId] || { 1: 0 };
      let lastIdForPage = currentPageLastIds[page];

      // إذا لم نجد lastId للصفحة المطلوبة، نحسبه بناءً على الصفحات السابقة
      if (lastIdForPage === undefined && page > 1) {
        // البحث عن أقرب صفحة سابقة لها lastId محفوظ
        let nearestPage = 1;
        let nearestLastId = 0;
        
        for (let i = 1; i < page; i++) {
          if (currentPageLastIds[i] !== undefined) {
            nearestPage = i;
            nearestLastId = currentPageLastIds[i];
          }
        }
        
        // حساب lastId المقدر للصفحة المطلوبة (أكثر دقة)
        // نفترض أن كل صفحة تحتوي على 10 عناصر متتالية
        const pagesGap = page - nearestPage;
        const estimatedLastId = nearestLastId + (pagesGap * 10);
        lastIdForPage = Math.max(0, estimatedLastId);
        
        console.log(`🔢 حساب lastId للصفحة ${page}:`, {
          nearestPage,
          nearestLastId,
          pagesGap: page - nearestPage,
          estimatedLastId,
          note: "تقدير بناءً على 10 عناصر لكل صفحة"
        });
        
        // حفظ القيمة المحسوبة
        setSubStagesPageLastIds(prev => ({
          ...prev,
          [stageId]: {
            ...prev[stageId],
            [page]: lastIdForPage
          }
        }));
      } else if (lastIdForPage === undefined) {
        lastIdForPage = 0;
      }

      console.log(`🚀 تحميل المراحل الفرعية للمرحلة ${stageId} مع نظام Batching:`, {
        page,
        lastIdForPage,
        resetPagination,
        targetLimit: 10,
        backendLimit: 7,
        systemType: "Batching 7→10"
      });

      const response = await companiesSubscribedApi.getStageSubStages(stageId, project.id, lastIdForPage, 10);
      console.log(`📨 استجابة API للمراحل الفرعية:`, response);
      
      if (response.success) {
        const subStagesData = response.data || [];
        setSubStages(prev => ({ ...prev, [stageId]: subStagesData }));
        setSubStagesPage(prev => ({ ...prev, [stageId]: page }));

        // تحديث معلومات الترقيم مع نظام Batching المحسن
        if (subStagesData.length > 0) {
          const lastSubStageId = subStagesData[subStagesData.length - 1].StageSubID;
          const firstSubStageId = subStagesData[0].StageSubID;
          
          // تحديث pageLastIds للصفحة الحالية (للتنقل الخلفي)
          setSubStagesPageLastIds(prev => ({
            ...prev,
            [stageId]: {
              ...prev[stageId],
              [page]: page === 1 ? 0 : firstSubStageId - 1
            }
          }));
          
          // إذا حصلنا على 10 عناصر بالضبط، فهناك احتمال وجود المزيد
          if (subStagesData.length === 10) {
            // تحديث lastId للصفحة التالية
            setSubStagesPageLastIds(prev => ({
              ...prev,
              [stageId]: {
                ...prev[stageId],
                [page + 1]: lastSubStageId
              }
            }));
            setSubStagesHasMore(prev => ({ ...prev, [stageId]: true }));
            
            // عرض الصفحة الحالية + صفحة واحدة إضافية فقط (وليس +10)
            setSubStagesTotalPages(prev => ({ 
              ...prev, 
              [stageId]: Math.max(prev[stageId] || page, page + 1)
            }));
            
            console.log(`📄 صفحة مكتملة (10 عناصر):`, {
              page,
              firstId: firstSubStageId,
              lastId: lastSubStageId,
              nextPageLastId: lastSubStageId,
              totalPagesNow: page + 1,
              hasMore: true
            });
          } else {
            // إذا حصلنا على أقل من 10، فهذا يعني أننا وصلنا للنهاية
            setSubStagesHasMore(prev => ({ ...prev, [stageId]: false }));
            setSubStagesTotalPages(prev => ({ ...prev, [stageId]: page }));
            
            console.log(`📄 آخر صفحة (${subStagesData.length} عناصر):`, {
              page,
              firstId: firstSubStageId,
              lastId: lastSubStageId,
              finalTotalPages: page,
              isLastPage: true
            });
          }
        } else {
          // لا توجد بيانات في هذه الصفحة
          if (page === 1) {
            // الصفحة الأولى فارغة = لا توجد مراحل فرعية على الإطلاق
            setSubStagesTotalPages(prev => ({ ...prev, [stageId]: 1 }));
            setSubStagesHasMore(prev => ({ ...prev, [stageId]: false }));
            console.log(`📄 لا توجد مراحل فرعية للمرحلة ${stageId}`);
          } else {
            // صفحة متقدمة فارغة = نهاية البيانات, تصحيح عدد الصفحات
            setSubStagesTotalPages(prev => ({ ...prev, [stageId]: Math.max(page - 1, 1) }));
            setSubStagesHasMore(prev => ({ ...prev, [stageId]: false }));
            console.log(`📄 صفحة فارغة ${page} - تصحيح عدد الصفحات إلى ${Math.max(page - 1, 1)}`);
            
            // العودة للصفحة السابقة التي تحتوي على بيانات
            if (page > 1) {
              setSubStagesPage(prev => ({ ...prev, [stageId]: page - 1 }));
              console.log(`🔄 العودة للصفحة ${page - 1} التي تحتوي على بيانات`);
            }
          }
        }

        console.log(`✅ تم تحميل ${subStagesData.length} مرحلة فرعية للمرحلة ${stageId} - الصفحة ${page}:`, subStagesData);
      } else {
        console.log(`❌ فشل تحميل المراحل الفرعية للمرحلة ${stageId}:`, response.error);
        setSubStages(prev => ({ ...prev, [stageId]: [] }));
      }
    } catch (error: any) {
      console.error("❌ خطأ في تحميل المراحل الفرعية:", error);
      setSubStages(prev => ({ ...prev, [stageId]: [] }));
    } finally {
      setSubStagesLoading(prev => ({ ...prev, [stageId]: false }));
    }
  };

  // التنقل بين صفحات المراحل الرئيسية (10 بيانات في كل صفحة)
  const handleStagesPageChange = (page: number) => {
    const currentPage = stagesPage;
    const maxPages = stagesTotalPages;
    
    if (!stagesLoading && page !== currentPage && page >= 1 && page <= maxPages) {
      // تم تقليل logging لتحسين الأداء - فقط في development mode
      if (process.env.NODE_ENV === 'development') {
        console.log(`✅ [Navigation] بدء تغيير الصفحة: ${currentPage} → ${page}`);
      }
      loadMainStages(page);
    } else {
      // تم تقليل warning logging لتحسين الأداء
      if (process.env.NODE_ENV === 'development') {
        console.warn(`⚠️ [Navigation] لا يمكن تغيير الصفحة:`, {
          requestedPage: page,
          currentPage,
          maxPages,
          isLoading: stagesLoading,
          totalCount: stagesTotalCount
        });
      }
    }
  };

  // التنقل بين صفحات المراحل الفرعية المحسن
  const handleSubStagesPageChange = (stageId: number, page: number) => {
    const currentPage = subStagesPage[stageId] || 1;
    const maxPages = subStagesTotalPages[stageId] || 1;
    
    if (!subStagesLoading[stageId] && page !== currentPage && page >= 1 && page <= maxPages) {
      console.log(`📄 تغيير صفحة المراحل الفرعية للمرحلة ${stageId}:`, {
        fromPage: currentPage,
        toPage: page,
        maxPages,
        availablePageLastIds: Object.keys(subStagesPageLastIds[stageId] || {}),
        isValidTransition: true
      });
      
      // إعادة تعيين حالة التحميل
      setSubStagesLoading(prev => ({ ...prev, [stageId]: true }));
      
      loadSubStages(stageId, page);
    } else {
      console.warn(`⚠️ تنقل غير صالح للمراحل الفرعية:`, {
        stageId,
        requestedPage: page,
        currentPage,
        maxPages,
        isLoading: subStagesLoading[stageId],
        reason: page === currentPage ? "نفس الصفحة الحالية" :
                page < 1 ? "رقم صفحة غير صالح" :
                page > maxPages ? "تجاوز الحد الأقصى للصفحات" :
                subStagesLoading[stageId] ? "جاري التحميل حالياً" : "سبب غير معروف"
      });
    }
  };

  // تحميل ملاحظات وتأخيرات المرحلة
  const loadStageNotes = async (stageId: number) => {
    try {
      console.log(`🚀 محاولة تحميل الملاحظات للمرحلة ${stageId} في المشروع ${project.id}`);
      const response = await companiesSubscribedApi.getStageNotes(stageId, project.id);
      console.log(`📨 استجابة API للملاحظات:`, response);
      
      if (response.success) {
        const notesData = response.data || [];
        setStageNotes(prev => ({ ...prev, [stageId]: notesData }));
        console.log(`✅ تم تحميل ${notesData.length} ملاحظة للمرحلة ${stageId}:`, notesData);
      } else {
        console.log(`❌ فشل تحميل الملاحظات للمرحلة ${stageId}:`, response.error);
        setStageNotes(prev => ({ ...prev, [stageId]: [] }));
      }
    } catch (error: any) {
      console.error("❌ خطأ في تحميل ملاحظات المرحلة:", error);
      setStageNotes(prev => ({ ...prev, [stageId]: [] }));
    }
  };

  // توسيع/طي المرحلة الرئيسية
  const handleStageExpand = async (stageId: number) => {
    console.log(`🔧 handleStageExpand تم استدعاؤه للمرحلة ${stageId}`);
    console.log(`📊 الحالة الحالية: expandedStage=${expandedStage}, subStages لهذه المرحلة:`, subStages[stageId]);
    
    if (expandedStage === stageId) {
      console.log(`🔹 إغلاق المرحلة ${stageId}`);
      setExpandedStage(null);
    } else {
      console.log(`🔹 فتح المرحلة ${stageId}`);
      setExpandedStage(stageId);
      
      // تحميل المراحل الفرعية والملاحظات إذا لم تكن محملة
      if (!subStages[stageId]) {
        console.log(`🔄 تحميل المراحل الفرعية للمرحلة ${stageId} (لأول مرة)`);
        await loadSubStages(stageId, 1, true);
      } else {
        console.log(`✅ المراحل الفرعية للمرحلة ${stageId} محملة مسبقاً`);
      }
      
      if (!stageNotes[stageId]) {
        console.log(`🔄 تحميل الملاحظات للمرحلة ${stageId} (لأول مرة)`);
        await loadStageNotes(stageId);
      } else {
        console.log(`✅ الملاحظات للمرحلة ${stageId} محملة مسبقاً`);
      }
    }
  };

  // تحميل المصاريف مع last_id pagination صحيح
  const loadExpenses = async (page = 1, reset = false) => {
    try {
      setExpensesLoading(true);
      
      // تم تقليل logging لتحسين الأداء
      if (process.env.NODE_ENV === 'development') {
        console.log('🔄 بدء تحميل المصاريف للمشروع:', project.id, { page, reset });
      }
      
      // تحديد lastId بناءً على الصفحة
      const currentLastId = reset || page === 1 ? 0 : expensesLastId;
      
      const response = await companiesSubscribedApi.getProjectExpenses(project.id, currentLastId, 10);
      
      // تم تقليل logging لتحسين الأداء
      if (process.env.NODE_ENV === 'development') {
        console.log('📊 نتيجة تحميل المصاريف في Component:', { 
          success: response.success, 
          dataLength: response.data?.length,
          hasMore: (response as any).hasMore,
          lastId: (response as any).lastId,
          projectId: project.id,
          currentPage: page
        });
      }
      
      if (response.success) {
        setExpenses(response.data || []);
        setExpensesHasMore((response as any).hasMore || false);
        setExpensesLastId((response as any).lastId || 0);
        
        // حساب pagination ذكي
        const hasData = response.data && response.data.length > 0;
        const hasMoreData = (response as any).hasMore;
        
        if (hasData) {
          setExpensesTotalPages(hasMoreData ? page + 1 : page);
        } else if (page === 1) {
          setExpensesTotalPages(1);
        } else {
          setExpensesPage(Math.max(1, page - 1));
          setExpensesTotalPages(Math.max(1, page - 1));
        }
        
        if (process.env.NODE_ENV === 'development') {
          console.log('✅ تم تحديث حالة المصاريف:', {
            dataLength: response.data?.length
          });
        }
      } else {
        console.error('❌ فشل في تحميل المصاريف:', response.error);
      }
    } catch (error: any) {
      console.error("خطأ في تحميل المصاريف:", error);
    } finally {
      setExpensesLoading(false);
    }
  };

  // تحميل العهد مع last_id pagination صحيح
  const loadRevenues = async (page = 1, reset = false) => {
    try {
      setRevenuesLoading(true);
      console.log('🔄 بدء تحميل العهد للمشروع:', project.id, { page, reset });
      
      // تحديد lastId بناءً على الصفحة
      const currentLastId = reset || page === 1 ? 0 : revenuesLastId;
      
      const response = await companiesSubscribedApi.getProjectRevenues(project.id, currentLastId, 10);
      console.log('📈 نتيجة تحميل العهد في Component:', { 
        response, 
        success: response.success, 
        dataLength: response.data?.length,
        hasMore: (response as any).hasMore,
        lastId: (response as any).lastId,
        projectId: project.id,
        currentPage: page,
        currentLastId: currentLastId
      });
      
      if (response.success) {
        setRevenues(response.data || []);
        setRevenuesHasMore((response as any).hasMore || false);
        setRevenuesLastId((response as any).lastId || 0);
        
        // حساب pagination ذكي
        const hasData = response.data && response.data.length > 0;
        const hasMoreData = (response as any).hasMore;
        
        if (hasData) {
          setRevenuesTotalPages(hasMoreData ? page + 1 : page);
        } else if (page === 1) {
          setRevenuesTotalPages(1);
        } else {
          setRevenuesPage(Math.max(1, page - 1));
          setRevenuesTotalPages(Math.max(1, page - 1));
        }
        
        console.log('✅ تم تحديث حالة العهد بنجاح مع last_id pagination');
      } else {
        console.log('❌ فشل في تحميل العهد:', response.error);
      }
    } catch (error: any) {
      console.error("خطأ في تحميل العهد:", error);
    } finally {
      setRevenuesLoading(false);
    }
  };

  // تحميل المرتجعات مع last_id pagination صحيح
  const loadReturns = async (page = 1, reset = false) => {
    try {
      setReturnsLoading(true);
      console.log('🔄 بدء تحميل المرتجعات للمشروع:', project.id, { page, reset });
      
      // تحديد lastId بناءً على الصفحة
      const currentLastId = reset || page === 1 ? 0 : returnsLastId;
      
      const response = await companiesSubscribedApi.getProjectReturns(project.id, currentLastId, 10);
      console.log('📈 نتيجة تحميل المرتجعات في Component:', { 
        response, 
        success: response.success, 
        dataLength: response.data?.length,
        hasMore: (response as any).hasMore,
        lastId: (response as any).lastId,
        projectId: project.id,
        currentPage: page,
        currentLastId: currentLastId
      });
      
      if (response.success) {
        setReturns(response.data || []);
        setReturnsHasMore((response as any).hasMore || false);
        setReturnsLastId((response as any).lastId || 0);
        
        // حساب pagination ذكي
        const hasData = response.data && response.data.length > 0;
        const hasMoreData = (response as any).hasMore;
        
        if (hasData) {
          setReturnsTotalPages(hasMoreData ? page + 1 : page);
        } else if (page === 1) {
          setReturnsTotalPages(1);
        } else {
          setReturnsPage(Math.max(1, page - 1));
          setReturnsTotalPages(Math.max(1, page - 1));
        }
        
        console.log('✅ تم تحديث حالة المرتجعات بنجاح مع last_id pagination');
      } else {
        console.log('❌ فشل في تحميل المرتجعات:', response.error);
      }
    } catch (error: any) {
      console.error("خطأ في تحميل المرتجعات:", error);
    } finally {
      setReturnsLoading(false);
    }
  };

  // 🎛️ Functions للتحكم في فتح/إغلاق الأقسام المالية لتوفير الضغط على السيرفر
  const handleExpensesToggle = () => {
    const newExpanded = !expensesExpanded;
    setExpensesExpanded(newExpanded);
    
    console.log('🔽 تبديل قسم المصروفات:', { 
      newExpanded, 
      willLoadData: newExpanded && activeTab === 1,
      currentExpenses: expenses.length 
    });
    
    // تحميل البيانات عند الفتح إذا لم تكن محملة
    if (newExpanded && activeTab === 1 && expenses.length === 0) {
      console.log('⚡ تحميل المصروفات للمرة الأولى...');
      loadExpenses(1, true);
    }
  };

  const handleRevenuesToggle = () => {
    const newExpanded = !revenuesExpanded;
    setRevenuesExpanded(newExpanded);
    
    console.log('🔽 تبديل قسم العهد:', { 
      newExpanded, 
      willLoadData: newExpanded && activeTab === 1,
      currentRevenues: revenues.length 
    });
    
    // تحميل البيانات عند الفتح إذا لم تكن محملة
    if (newExpanded && activeTab === 1 && revenues.length === 0) {
      console.log('⚡ تحميل العهد للمرة الأولى...');
      loadRevenues(1, true);
    }
  };

  const handleReturnsToggle = () => {
    const newExpanded = !returnsExpanded;
    setReturnsExpanded(newExpanded);
    
    console.log('🔽 تبديل قسم المرتجعات:', { 
      newExpanded, 
      willLoadData: newExpanded && activeTab === 1,
      currentReturns: returns.length 
    });
    
    // تحميل البيانات عند الفتح إذا لم تكن محملة
    if (newExpanded && activeTab === 1 && returns.length === 0) {
      console.log('⚡ تحميل المرتجعات للمرة الأولى...');
      loadReturns(1, true);
    }
  };



  // تحميل جميع أنواع الطلبات مع تجميع شامل
  const loadRequests = async (page = 1) => {
    try {
      setRequestsLoading(true);
      console.log('🚀 تجميع جميع أنواع الطلبات:', {
        projectId: project.id,
        page
      });
      
      const response = await companiesSubscribedApi.getProjectDetailedRequests(project.id, page, 10);
      
      console.log('📊 نتيجة تجميع جميع أنواع الطلبات:', { 
        success: response.success, 
        pageDataLength: response.data?.length,
        totalRequestsCount: (response as any).totalCount,
        totalPages: (response as any).totalPages,
        currentPage: page,
        allTypesIncluded: (response as any).allTypesIncluded,
        foundTypes: (response as any).foundTypes,
        firstRequestID: response.data?.[0]?.RequestsID,
        lastRequestID: response.data?.[response.data?.length - 1]?.RequestsID
      });
      
      if (response.success) {
        setRequests(response.data || []);
        setRequestsTotalPages((response as any).totalPages || 1);
        
        // تحديث العداد الإجمالي
        const totalCount = (response as any).totalCount || 0;
        setRequestsTotalCount(totalCount);
        
        // تحليل النتائج
        const totalRequestsCount = (response as any).totalCount || 0;
        const foundTypes = (response as any).foundTypes || [];
        const allTypesMethod = (response as any).allTypesIncluded;
        
        console.log('✅ تم تجميع الطلبات:', {
          pageRequests: response.data?.length || 0,
          totalRequests: totalRequestsCount,
          totalPages: (response as any).totalPages || 1,
          method: allTypesMethod ? 'استعلام شامل' : 'تجميع متعدد',
          typesFound: foundTypes
        });
        
        if (totalRequestsCount === 0) {
          console.warn('⚠️ لا توجد طلبات مسجلة لهذا المشروع في قاعدة البيانات');
        } else if (totalRequestsCount > 20) {
          console.log(`🎉 تم العثور على أكثر من 20 طلب (${totalRequestsCount}) - يتم العرض في صفحات متعددة!`);
        } else if (response.data?.length === 0 && page > 1) {
          console.warn('⚠️ الصفحة المطلوبة فارغة - قد تحتاج للعودة للصفحة السابقة');
        }
      } else {
        console.error('❌ فشل في جلب جميع الطلبات:', response.error);
        setRequests([]);
        setRequestsTotalPages(1);
        setRequestsTotalCount(0);
      }
    } catch (error: any) {
      console.error("💥 خطأ في تحميل جميع الطلبات:", error);
      setRequests([]);
      setRequestsTotalPages(1);
      setRequestsTotalCount(0);
    } finally {
      setRequestsLoading(false);
    }
  };

  // تحميل فريق العمل (الموظفين المرتبطين بالمشروع)
  const loadProjectTeam = async () => {
    try {
      setTeamLoading(true);
      const response = await companiesSubscribedApi.getCompanyEmployees(project.IDcompanySub, 0);
      if (response.success) {
        setProjectTeam(response.data || []);
      }
    } catch (error: any) {
      console.error("خطأ في تحميل فريق العمل:", error);
    } finally {
      setTeamLoading(false);
    }
  };

  // بناء فريق العمل الفعلي من المراحل والملاحظات والطلبات
  const buildActualProjectTeam = () => {
    const nameToStats = new Map<string, {
      name: string;
      openedStages: number;
      closedStages: number;
      notesRecorded: number;
      requestsInserted: number;
      requestsImplemented: number;
    }>();

    // من المراحل الرئيسية
    for (const stage of allMainStages || []) {
      const openedBy = (stage.OpenBy || '').toString().trim();
      const closedBy = (stage.ClosedBy || '').toString().trim();
      if (openedBy) {
        if (!nameToStats.has(openedBy)) nameToStats.set(openedBy, { name: openedBy, openedStages: 0, closedStages: 0, notesRecorded: 0, requestsInserted: 0, requestsImplemented: 0 });
        nameToStats.get(openedBy)!.openedStages += 1;
      }
      if (closedBy) {
        if (!nameToStats.has(closedBy)) nameToStats.set(closedBy, { name: closedBy, openedStages: 0, closedStages: 0, notesRecorded: 0, requestsInserted: 0, requestsImplemented: 0 });
        nameToStats.get(closedBy)!.closedStages += 1;
      }
    }

    // من الملاحظات لكل مرحلة
    Object.keys(stageNotes || {}).forEach((key) => {
      const notes = stageNotes[Number(key)] || [];
      for (const note of notes) {
        const recordedBy = (note.RecordedBy || '').toString().trim();
        if (recordedBy) {
          if (!nameToStats.has(recordedBy)) nameToStats.set(recordedBy, { name: recordedBy, openedStages: 0, closedStages: 0, notesRecorded: 0, requestsInserted: 0, requestsImplemented: 0 });
          nameToStats.get(recordedBy)!.notesRecorded += 1;
        }
      }
    });

    // من الطلبات
    for (const req of requests || []) {
      const insertBy = (req.InsertBy || '').toString().trim();
      const implementedBy = (req.Implementedby || '').toString().trim();
      if (insertBy) {
        if (!nameToStats.has(insertBy)) nameToStats.set(insertBy, { name: insertBy, openedStages: 0, closedStages: 0, notesRecorded: 0, requestsInserted: 0, requestsImplemented: 0 });
        nameToStats.get(insertBy)!.requestsInserted += 1;
      }
      if (implementedBy) {
        if (!nameToStats.has(implementedBy)) nameToStats.set(implementedBy, { name: implementedBy, openedStages: 0, closedStages: 0, notesRecorded: 0, requestsInserted: 0, requestsImplemented: 0 });
        nameToStats.get(implementedBy)!.requestsImplemented += 1;
      }
    }

    const members = Array.from(nameToStats.values()).map(m => ({
      ...m,
      totalContributions: m.openedStages + m.closedStages + m.notesRecorded + m.requestsInserted + m.requestsImplemented,
    }))
    .filter(m => m.totalContributions > 0)
    .sort((a, b) => b.totalContributions - a.totalContributions || a.name.localeCompare(b.name));

    setActualProjectTeam(members);
  };

  useEffect(() => {
    buildActualProjectTeam();
  }, [allMainStages, stageNotes, requests]);

  // تم إزالة تبويب الأرشيف والملفات ووظائفه

  // تحميل التقارير المالية
  const loadFinancialReports = async () => {
    try {
      setFinancialReportsLoading(true);
      console.log('🔄 بدء تحميل التقارير المالية للمشروع:', project.id);
      const response = await companiesSubscribedApi.getProjectFinancialReports(project.id);
      console.log('📈 نتيجة تحميل التقارير المالية:', { response, success: response.success });
      
      if (response.success) {
        // البيانات تأتي كـ object واحد وليس array
        setFinancialReports(response.data || null);
        console.log('✅ تم تحديث حالة التقارير المالية بنجاح');
      } else {
        console.log('❌ فشل في تحميل التقارير المالية:', response.error);
        setFinancialReports(null);
      }
    } catch (error: any) {
      console.error("خطأ في تحميل التقارير المالية:", error);
      setFinancialReports(null);
    } finally {
      setFinancialReportsLoading(false);
    }
  };

  // تحميل البيانات عند التحميل الأولي
  useEffect(() => {
    console.log(`🔄 تحميل بيانات المشروع الجديد: ${project.Nameproject} (ID: ${project.id})`);
    console.log('🎯 معلومات المشروع الكاملة:', project);
    
    // إعادة تعيين حالة المراحل الرئيسية
    setAllMainStages([]); // إعادة تعيين جميع المراحل
    setMainStages([]); // إعادة تعيين المراحل المعروضة
    setStagesPage(1);
    setStagesTotalPages(1);
    setStagesLastId(0);
    setStagesHasMore(false);
    setStagesTotalCount(0);
    setStagesLoading(false);
    
    // إعادة تعيين حالة المراحل الفرعية
    setExpandedStage(null);
    setSubStages({});
    setStageNotes({});
    
    // إعادة تعيين pagination المراحل الفرعية
    setSubStagesPage({});
    setSubStagesTotalPages({});
    setSubStagesPageLastIds({});
    setSubStagesHasMore({});
    setSubStagesLoading({});
    
    // إعادة تعيين states المالية والطلبات والأرشيف
    setExpenses([]);
    setRevenues([]);
    setReturns([]);
    setRequests([]);
    setFinancialReports(null);
    setProjectTeam([]);
    
    // إعادة تعيين pagination states للمالية
    setExpensesPage(1);
    setExpensesLastId(0);
    setExpensesHasMore(true);
    setExpensesTotalPages(1);
    setRevenuesPage(1);
    setRevenuesLastId(0);
    setRevenuesHasMore(true);
    setRevenuesTotalPages(1);
    setReturnsPage(1);
    setReturnsLastId(0);
    setReturnsHasMore(true);
    setReturnsTotalPages(1);
    
    // إعادة تعيين pagination states للطلبات
    setRequestsPage(1);
    setRequestsTotalPages(1);
    setRequestsTotalCount(0);
    
    loadProjectFullDetails();
    loadMainStages(1, true); // إعادة تعيين pagination عند تحميل مشروع جديد
  }, [project.id]);

  // تحميل البيانات عند تغيير التاب أو الصفحة (مع تجنب إعادة render المراحل)
  useEffect(() => {
    // تجنب logging مفرط لتحسين الأداء
    if (process.env.NODE_ENV === 'development') {
      console.log('🔄 useEffect triggered - تغيير التاب أو الصفحة:', {
        activeTab,
        expensesPage,
        revenuesPage,
        returnsPage,
        projectId: project.id
      });
    }
    
    switch (activeTab) {
      case 1: // المالية
        if (process.env.NODE_ENV === 'development') {
          console.log('💰 التاب المالي مفتوح - البيانات تُحمل عند فتح كل قسم');
        }
        // تحميل البيانات فقط للأقسام المفتوحة
        if (expensesExpanded) {
          loadExpenses(expensesPage, expensesPage === 1);
        }
        if (revenuesExpanded) {
          loadRevenues(revenuesPage, revenuesPage === 1);
        }
        if (returnsExpanded) {
          loadReturns(returnsPage, returnsPage === 1);
        }
        break;
      case 2: // الطلبات
        loadRequests(requestsPage);
        break;
      case 3: // فريق العمل
        loadProjectTeam();
        break;
      case 4: // التقارير المالية
        loadFinancialReports();
        break;
      default:
        // تبويب المراحل والتطوير - لا حاجة لإعادة تحميل شيء
        break;
    }
  }, [activeTab, expensesPage, revenuesPage, returnsPage, requestsPage, expensesExpanded, revenuesExpanded, returnsExpanded]);

  // عرض معلومات المشروع الأساسية
  const renderProjectInfo = () => (
    <Card elevation={3} sx={{ mb: 3 }}>
      <CardContent>
        <Grid container spacing={3}>
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom color="primary" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <TaskIcon />
              {project.Nameproject}
            </Typography>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 1, display: 'flex', alignItems: 'center', gap: 1 }}>
                <strong>📍 الموقع:</strong>
                {(() => {
                  const value = project.LocationProject as string | undefined;
                  if (!value || !String(value).trim()) return 'غير محدد';
                  const match = String(value).match(/https?:\/\/[^\s]+/);
                  if (match) {
                    const url = match[0];
                    return (
                      <Button
                        component="a"
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        variant="outlined"
                        size="small"
                        startIcon={<LocationIcon />}
                      >
                        فتح في خرائط Google
                      </Button>
                    );
                  }
                  return value;
                })()}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>نوع العقد:</strong> {project.TypeOFContract || 'غير محدد'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>🏗️ رقم المبنى:</strong> {project.numberBuilding || 'غير محدد'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>🆔 الرقم المرجعي:</strong> {project.Referencenumber || 'غير محدد'}
              </Typography>
            </Box>
          </Grid>
          <Grid item xs={12} md={6}>
            <Box sx={{ mt: 2 }}>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>تاريخ البداية:</strong> {project.ProjectStartdate ? new Date(project.ProjectStartdate).toLocaleDateString('en-GB') : 'غير محدد'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>✍️ تاريخ توقيع العقد:</strong> {project.Contractsigningdate ? new Date(project.Contractsigningdate).toLocaleDateString('en-GB') : 'غير محدد'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>التكلفة:</strong> {project.cost ? `${project.cost.toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})} ريال` : 'غير محدد'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>نسبة الإنجاز:</strong> {project.rate ? `${parseFloat(project.rate).toFixed(2)}%` : 'غير مقيم'}
              </Typography>
              <Typography variant="body1" sx={{ mb: 1 }}>
                <strong>👥 عدد المستخدمين:</strong> {project.countuser || 0}
              </Typography>
            </Box>
          </Grid>
          {project.Note && (
            <Grid item xs={12}>
              <Divider sx={{ my: 2 }} />
              <Typography variant="h6" gutterBottom>📝 ملاحظات:</Typography>
              <Typography variant="body2" color="text.secondary" sx={{ 
                backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.05)' : 'grey.50', 
                p: 2, 
                borderRadius: 1,
                border: '1px solid',
                borderColor: theme.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'grey.200'
              }}>
                {project.Note}
              </Typography>
            </Grid>
          )}
        </Grid>
      </CardContent>
    </Card>
  );

  // عرض المراحل الرئيسية مع المراحل الفرعية (محسن بـ useMemo)
  const renderStages = useMemo(() => (
    <Box>
      {/* إحصائيات المراحل */}
      <Grid container spacing={2} sx={{ mb: 3 }}>
        <Grid item xs={12} sm={3}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            backgroundColor: theme.palette.mode === 'dark' ? 'success.dark' : 'success.light', 
            color: theme.palette.mode === 'dark' ? 'success.contrastText' : 'white' 
          }}>
            <CheckIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">
              {allMainStages.filter(stage => stage.Done === 'true').length}
            </Typography>
            <Typography variant="body2">مراحل مكتملة</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            backgroundColor: theme.palette.mode === 'dark' ? 'warning.dark' : 'warning.light', 
            color: theme.palette.mode === 'dark' ? 'warning.contrastText' : 'white' 
          }}>
            <WarningIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">
              {allMainStages.filter(stage => stage.Difference && stage.Difference > 0).length}
            </Typography>
            <Typography variant="body2">مراحل متأخرة</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            backgroundColor: theme.palette.mode === 'dark' ? 'info.dark' : 'info.light', 
            color: theme.palette.mode === 'dark' ? 'info.contrastText' : 'white' 
          }}>
            <DelayIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">
              {allMainStages.filter(stage => stage.Done === 'false').length}
            </Typography>
            <Typography variant="body2">مراحل قيد التنفيذ</Typography>
          </Card>
        </Grid>
        <Grid item xs={12} sm={3}>
          <Card sx={{ 
            textAlign: 'center', 
            p: 2, 
            backgroundColor: theme.palette.mode === 'dark' ? 'primary.dark' : 'primary.light', 
            color: theme.palette.mode === 'dark' ? 'primary.contrastText' : 'white' 
          }}>
            <TimelineIcon sx={{ fontSize: 40, mb: 1 }} />
            <Typography variant="h6">{allMainStages.length}</Typography>
            <Typography variant="body2">إجمالي المراحل</Typography>
          </Card>
        </Grid>
      </Grid>

      {/* حالة التحميل للمراحل الرئيسية */}
      {stagesLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', py: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>جاري تحميل المراحل الرئيسية...</Typography>
        </Box>
      )}

      {/* قائمة المراحل الرئيسية */}
      {!stagesLoading && mainStages.length > 0 ? (
        mainStages.map((stage) => {
          // تحديد الـ ID الصحيح للمرحلة
          const stageUniqueId = stage.StageID || stage.StageCustID;
          // تم تقليل logging لتحسين الأداء
          
          return (
          <Accordion 
              key={stageUniqueId} 
              expanded={expandedStage === stageUniqueId}
              onChange={() => {
                console.log(`🖱️ تم النقر على المرحلة: ${stage.StageName} (ID: ${stageUniqueId})`);
                handleStageExpand(stageUniqueId);
              }}
            sx={{ mb: 2 }}
          >
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
                <Avatar sx={{ 
                  bgcolor: stage.Done === 'true' ? 'success.main' : 
                          stage.Difference && stage.Difference > 0 ? 'warning.main' : 
                          'info.main' 
                }}>
                  {stage.Done === 'true' ? <CheckIcon /> : 
                   stage.Difference && stage.Difference > 0 ? <WarningIcon /> : 
                   <DelayIcon />}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <Typography variant="h6">{stage.StageName}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    من {stage.StartDate ? new Date(stage.StartDate).toLocaleDateString('en-GB') : 'غير محدد'} 
                    إلى {stage.EndDate ? new Date(stage.EndDate).toLocaleDateString('en-GB') : 'غير محدد'}
                    {stage.Days && ` (${stage.Days} يوم)`}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Chip 
                    label={stage.Done === 'true' ? 'مكتملة' : 'قيد التنفيذ'}
                    size="small"
                    sx={getSoftStageStatusChipSx(stage.Done === 'true', Boolean(stage.Difference && stage.Difference > 0))}
                  />
                  {stage.Difference && stage.Difference > 0 && (
                    <Chip 
                      label={`تأخير ${stage.Difference} يوم`}
                      color="error"
                      size="small"
                    />
                  )}
                </Box>
              </Box>
            </AccordionSummary>
            <AccordionDetails>
              <Grid container spacing={3}>
                {/* معلومات المرحلة */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>📋 معلومات المرحلة</Typography>
                    <List dense>
                      <ListItem>
                        <ListItemText 
                          primary="نوع المرحلة" 
                          secondary={stage.Type || 'غير محدد'} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="ترتيب المرحلة" 
                          secondary={stage.OrderBy || 'غير محدد'} 
                        />
                      </ListItem>
                      <ListItem>
                        <ListItemText 
                          primary="فتحت بواسطة" 
                          secondary={stage.OpenBy || 'غير محدد'} 
                        />
                      </ListItem>
                      {stage.ClosedBy && (
                        <ListItem>
                          <ListItemText 
                            primary="أغلقت بواسطة" 
                            secondary={stage.ClosedBy} 
                          />
                        </ListItem>
                      )}
                    </List>
                  </Paper>
                </Grid>

                {/* المراحل الفرعية */}
                <Grid item xs={12} md={6}>
                  <Paper sx={{ p: 2 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="h6">🔹 المراحل الفرعية</Typography>
                      <Chip 
                        label={`الصفحة ${subStagesPage[stageUniqueId] || 1} من ${subStagesTotalPages[stageUniqueId] || 1}`}
                        size="small"
                        variant="outlined"
                        color="primary"
                      />
                    </Box>

                    {/* مؤشر التحميل */}
                    {subStagesLoading[stageUniqueId] && (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                        <Typography variant="body2" sx={{ ml: 1 }}>جاري تحميل المراحل الفرعية...</Typography>
                      </Box>
                    )}

                    {/* عرض المراحل الفرعية */}
                    {!subStagesLoading[stageUniqueId] && (
                      <>
                        {subStages[stageUniqueId] ? (
                          subStages[stageUniqueId].length > 0 ? (
                            <>
                        <List dense>
                                {subStages[stageUniqueId].map((subStage, index) => (
                            <ListItem key={subStage.StageSubID}>
                              <ListItemIcon>
                                <Chip 
                                        label={((subStagesPage[stageUniqueId] || 1) - 1) * 10 + index + 1} 
                                  size="small" 
                                  color="primary" 
                                />
                              </ListItemIcon>
                              <ListItemText 
                                primary={subStage.StageSubName}
                                      secondary={subStage.CloseDate ? 
                                        `أغلقت: ${new Date(subStage.CloseDate).toLocaleDateString('en-GB')}` : 
                                        'قيد التنفيذ'
                                      }
                                    />
                                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip 
                                      label={subStage.Done === 'true' ? 'مكتملة' : 'قيد التنفيذ'}
                                      size="small"
                                      sx={getSoftStageStatusChipSx(subStage.Done === 'true', false)}
                                    />
                                    </Box>
                                  </ListItem>
                                ))}
                              </List>

                              {/* معلومات الصفحة المحسنة */}
                              {/* تمت إزالة عرض عدد المراحل الفرعية بناءً على طلب المستخدم */}

                              {/* أزرار التنقل الذكية - عرض الصفحات الفعلية فقط */}
                              {(subStagesTotalPages[stageUniqueId] || 1) > 1 && (
                                <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                                  <Pagination
                                    count={subStagesTotalPages[stageUniqueId] || 1}
                                    page={Math.min(subStagesPage[stageUniqueId] || 1, subStagesTotalPages[stageUniqueId] || 1)}
                                    onChange={(e, page) => {
                                      if (!subStagesLoading[stageUniqueId] && page <= (subStagesTotalPages[stageUniqueId] || 1)) {
                                        handleSubStagesPageChange(stageUniqueId, page);
                                      }
                                    }}
                                    size="small"
                                    color="primary"
                                    disabled={subStagesLoading[stageUniqueId]}
                                    showFirstButton={false}
                                    showLastButton={false}
                                    boundaryCount={1}
                                    siblingCount={1}
                                    sx={{
                                      '& .MuiPaginationItem-root': {
                                        opacity: subStagesLoading[stageUniqueId] ? 0.5 : 1,
                                        transition: 'opacity 0.3s ease'
                                      },
                                      '& .MuiPaginationItem-page': {
                                        fontWeight: 'bold'
                                      }
                                    }}
                                  />

                                </Box>
                              )}
                            </>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          لا توجد مراحل فرعية
                        </Typography>
                      )
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                        )}
                      </>
                    )}
                  </Paper>
                </Grid>

                {/* ملاحظات وتأخيرات */}
                <Grid item xs={12}>
                  <Paper sx={{ p: 2 }}>
                    <Typography variant="h6" gutterBottom>📝 الملاحظات والتأخيرات</Typography>
                    {stageNotes[stageUniqueId] ? (
                      stageNotes[stageUniqueId].length > 0 ? (
                        <TableContainer>
                          <Table size="small">
                            <TableHead>
                              <TableRow>
                                <TableCell>التاريخ</TableCell>
                                <TableCell>النوع</TableCell>
                                <TableCell>الملاحظة</TableCell>
                                <TableCell>أيام التأخير</TableCell>
                                <TableCell>المسجل بواسطة</TableCell>
                              </TableRow>
                            </TableHead>
                            <TableBody>
                              {stageNotes[stageUniqueId].map((note) => (
                                <TableRow key={note.StageNoteID}>
                                  <TableCell>
                                    {note.DateNote ? new Date(note.DateNote).toLocaleDateString('en-GB') : 'غير محدد'}
                                  </TableCell>
                                  <TableCell>
                                    <Chip 
                                      label={note.Type || 'عام'} 
                                      size="small" 
                                      variant="outlined"
                                    />
                                  </TableCell>
                                  <TableCell sx={{ maxWidth: 200 }}>
                                    <Typography variant="body2" noWrap>
                                      {note.Note || 'لا توجد ملاحظة'}
                                    </Typography>
                                  </TableCell>
                                  <TableCell>
                                    {note.countdayDelay ? (
                                      <Chip 
                                        label={`${note.countdayDelay} يوم`}
                                        size="small"
                                        sx={getSoftStageStatusChipSx(false, true)}
                                      />
                                    ) : (
                                      <Chip 
                                        label="لا يوجد تأخير"
                                        size="small"
                                        sx={getSoftStageStatusChipSx(true, false)}
                                      />
                                    )}
                                  </TableCell>
                                  <TableCell>{note.RecordedBy || 'غير محدد'}</TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </TableContainer>
                      ) : (
                        <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                          لا توجد ملاحظات أو تأخيرات
                        </Typography>
                      )
                    ) : (
                      <Box sx={{ display: 'flex', justifyContent: 'center', py: 2 }}>
                        <CircularProgress size={24} />
                      </Box>
                    )}
                  </Paper>
                </Grid>
              </Grid>
            </AccordionDetails>
          </Accordion>
          );
        })
      ) : !stagesLoading ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <TimelineIcon sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            لا توجد مراحل مسجلة لهذا المشروع
          </Typography>
        </Paper>
      ) : null}

      {/* pagination للمراحل الرئيسية (10 بيانات في كل صفحة) */}
        <Box sx={{ display: 'flex', justifyContent: 'center', mt: 3 }}>
          <Pagination
            count={stagesTotalPages}
            page={stagesPage}
            onChange={(e, page) => {
            // تم تقليل logging لتحسين الأداء
            if (process.env.NODE_ENV === 'development') {
              console.log('🖱️ [UI] تم النقر على الصفحة:', page);
            }
            handleStagesPageChange(page);
            }}
            color="primary"
          disabled={stagesLoading}
          />
        {stagesTotalPages <= 1 && (
          <Typography variant="caption" color="text.secondary" sx={{ mt: 1 }}>
            {stagesTotalCount === 0 ? "لا توجد مراحل" : "صفحة واحدة فقط"}
          </Typography>
        )}
        </Box>
      
      {/* معلومات المراحل الرئيسية - مع إحصائيات شاملة */}
      {/* تم إزالة رسالة المعلومات بناءً على طلب المستخدم */}
    </Box>
  ), [allMainStages, mainStages, stagesPage, stagesTotalPages, stagesTotalCount, stagesLoading, stagesHasMore, expandedStage, subStages, subStagesPage, subStagesTotalPages, subStagesLoading]);

  // عرض تبويب المالية
  const renderFinancialTab = () => (
    <Box>

      {/* المصروفات - نظام مطوي */}
      <Accordion 
        expanded={expensesExpanded} 
        onChange={handleExpensesToggle}
        sx={{ mb: 3 }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="expenses-content"
          id="expenses-header"
          sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.1)' : 'rgba(76, 175, 80, 0.04)',
            '&:hover': { 
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(76, 175, 80, 0.15)' : 'rgba(76, 175, 80, 0.08)' 
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ExpenseIcon color="error" />
            <Box>
              <Typography variant="h6">
                💰 المصروفات
              </Typography>
              
            </Box>
            {expenses.length > 0 && (
              <Chip 
                label={`${expenses.length} عنصر`}
                size="small" 
                color="primary" 
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
        {expensesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>جاري تحميل المصروفات...</Typography>
          </Box>
        ) : expenses.length > 0 ? (
          <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell><strong>📋 رقم الفاتورة ↓</strong></TableCell>
                  <TableCell>المبلغ</TableCell>
                  <TableCell>التاريخ</TableCell>
                  <TableCell>البيان</TableCell>
                  <TableCell>التصنيف</TableCell>
                  <TableCell>خاضع للضريبة</TableCell>
                  <TableCell>المرجع المالي</TableCell>
                  <TableCell>تاريخ الإنشاء</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {expenses.map((expense, index) => (
                  <TableRow key={expense.Expenseid || index}>
                    <TableCell>{expense.InvoiceNo || 'غير محدد'}</TableCell>
                    <TableCell>{expense.Amount || 0} ريال</TableCell>
                    <TableCell>{expense.Date || 'غير محدد'}</TableCell>
                    <TableCell>{expense.Data || 'لا يوجد بيان'}</TableCell>
                    <TableCell>{expense.ClassificationName || 'غير مصنف'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={expense.Taxable === 'true' ? 'نعم' : 'لا'} 
                        color={expense.Taxable === 'true' ? 'warning' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>{expense.Referencenumberfinanc || 'غير محدد'}</TableCell>
                    <TableCell>{expense.CreatedDate || expense.Date || 'غير محدد'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">لا توجد مصروفات مسجلة</Alert>
        )}
        
        {expensesTotalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={expensesTotalPages}
              page={expensesPage}
              onChange={(e, page) => setExpensesPage(page)}
              color="primary"
            />
          </Box>
        )}
        </AccordionDetails>
      </Accordion>

      {/* العهد - نظام مطوي */}
      <Accordion 
        expanded={revenuesExpanded} 
        onChange={handleRevenuesToggle}
        sx={{ mb: 3 }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="revenues-content"
          id="revenues-header"
          sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.1)' : 'rgba(33, 150, 243, 0.04)',
            '&:hover': { 
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(33, 150, 243, 0.15)' : 'rgba(33, 150, 243, 0.08)' 
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <RevenueIcon color="success" />
            <Typography variant="h6">
              📈 العهد
            </Typography>
            {revenues.length > 0 && (
              <Chip 
                label={`${revenues.length} عنصر`}
                size="small" 
                color="success" 
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
        {revenuesLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>جاري تحميل العهد...</Typography>
          </Box>
        ) : revenues.length > 0 ? (
          <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>المبلغ</TableCell>
                  <TableCell>التاريخ</TableCell>
                  <TableCell>البيان</TableCell>
                  <TableCell>البنك</TableCell>
                  <TableCell>المرجع المالي</TableCell>
                  <TableCell>رقم العهدة</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {revenues.map((revenue, index) => (
                  <TableRow key={revenue.RevenueId || index}>
                    <TableCell>{revenue.Amount || 0} ريال</TableCell>
                    <TableCell>{revenue.Date || 'غير محدد'}</TableCell>
                    <TableCell>{revenue.Data || 'لا يوجد بيان'}</TableCell>
                    <TableCell>{revenue.Bank || 'غير محدد'}</TableCell>
                    <TableCell>{revenue.Referencenumberfinanc || 'غير محدد'}</TableCell>
                    <TableCell>#{revenue.RevenueId || 'غير محدد'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">لا توجد عهد مسجلة</Alert>
        )}
        
        {revenuesTotalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={revenuesTotalPages}
              page={revenuesPage}
              onChange={(e, page) => setRevenuesPage(page)}
              color="primary"
            />
          </Box>
        )}
        </AccordionDetails>
      </Accordion>

      {/* المرتجعات */}
      <Accordion 
        expanded={returnsExpanded} 
        onChange={handleReturnsToggle}
        sx={{ mb: 3 }}
      >
        <AccordionSummary
          expandIcon={<ExpandMoreIcon />}
          aria-controls="returns-content"
          id="returns-header"
          sx={{ 
            backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.1)' : 'rgba(255, 152, 0, 0.04)',
            '&:hover': { 
              backgroundColor: theme.palette.mode === 'dark' ? 'rgba(255, 152, 0, 0.15)' : 'rgba(255, 152, 0, 0.08)' 
            }
          }}
        >
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <ReceiptIcon color="warning" />
            <Typography variant="h6">
              🔄 المرتجعات
            </Typography>
            {returns.length > 0 && (
              <Chip 
                label={`${returns.length} عنصر`}
                size="small" 
                color="warning" 
              />
            )}
          </Box>
        </AccordionSummary>
        <AccordionDetails sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>المرتجعات</Typography>
        {returnsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>جاري تحميل المرتجعات...</Typography>
          </Box>
        ) : returns.length > 0 ? (
          <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>رقم المرتجع</TableCell>
                  <TableCell>المبلغ</TableCell>
                  <TableCell>التاريخ</TableCell>
                  <TableCell>البيان</TableCell>
                  <TableCell>المرجع المالي</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {returns.map((returnItem, index) => (
                  <TableRow key={returnItem.ReturnsId || index}>
                    <TableCell>#{returnItem.ReturnsId || 'غير محدد'}</TableCell>
                    <TableCell>{returnItem.Amount || 0} ريال</TableCell>
                    <TableCell>{returnItem.Date || 'غير محدد'}</TableCell>
                    <TableCell>{returnItem.Data || 'لا يوجد بيان'}</TableCell>
                    <TableCell>{returnItem.Referencenumberfinanc || 'غير محدد'}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">لا توجد مرتجعات مسجلة</Alert>
        )}
        
        {returnsTotalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={returnsTotalPages}
              page={returnsPage}
              onChange={(e, page) => setReturnsPage(page)}
              color="primary"
            />
          </Box>
        )}
        </AccordionDetails>
      </Accordion>


    </Box>
  );

  // عرض تبويب الطلبات
  const renderRequestsTab = () => (
    <Box>

      
      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Box>
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              📋 جميع الطلبات والتحديثات
            </Typography>
            
          </Box>
          {requests.length > 0 && (
            <Box sx={{ display: 'flex', gap: 1 }}>
              <Chip 
                label={`صفحة ${requestsPage} من ${requestsTotalPages}`}
                size="small"
                variant="outlined"
                sx={getSoftChipSx('primary')}
              />
              <Chip 
                label={(requestsTotalCount && requestsTotalCount > 0) ? 
                  `${((requestsPage - 1) * 10) + 1}-${Math.min(requestsPage * 10, requestsTotalCount)} من ${requestsTotalCount} طلب` : 
                  requests.length > 0 ? `${requests.length} طلب في هذه الصفحة` : 'لا توجد طلبات'
                }
                size="small"
                variant="outlined"
                sx={getSoftChipSx('success')}
              />
            </Box>
          )}
        </Box>
        {requestsLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
            <CircularProgress />
            <Typography sx={{ ml: 2 }}>جاري تحميل الطلبات...</Typography>
          </Box>
        ) : requests.length > 0 ? (
          <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
            <Table size="small" sx={{ minWidth: 700 }}>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <strong>🔢 رقم الطلب ↓</strong>
                  </TableCell>
                  <TableCell>نوع الطلب</TableCell>
                  <TableCell>البيانات</TableCell>
                  <TableCell>الحالة</TableCell>
                  <TableCell>مُدخل الطلب</TableCell>
                  <TableCell>المُنفذ</TableCell>
                  <TableCell>
                    <strong>📅 تاريخ الإدخال ↓</strong>
                  </TableCell>
                  <TableCell>تاريخ التنفيذ</TableCell>
                  <TableCell>حالة الفحص</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {requests.map((request, index) => (
                  <TableRow key={request.RequestsID || index}>
                    <TableCell>#{request.RequestsID || 'غير محدد'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={request.Type || 'طلب عام'} 
                        size="small"
                        variant="outlined"
                        sx={getSoftChipSx(getRequestTypeTone(request.Type))}
                      />
                    </TableCell>
                    <TableCell sx={{ maxWidth: 200 }}>
                      <Typography variant="body2" noWrap>
                        {request.Data || 'لا توجد بيانات'}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={request.Done === 'true' ? 'منجز' : request.Done === 'false' ? 'قيد التنفيذ' : 'معلق'} 
                        size="small"
                        variant="outlined"
                        sx={request.Done === 'true' 
                              ? getSoftChipSx('success') 
                              : request.Done === 'false' 
                                ? getSoftChipSx('warning') 
                                : getSoftChipSx('default')}
                      />
                    </TableCell>
                    <TableCell>{request.InsertBy || 'غير محدد'}</TableCell>
                    <TableCell>{request.Implementedby || 'لم يُنفذ بعد'}</TableCell>
                    <TableCell>{request.Date || 'غير محدد'}</TableCell>
                    <TableCell>{request.DateTime || 'لم يُنفذ بعد'}</TableCell>
                    <TableCell>
                      <Chip 
                        label={request.checkorderout === 'true' ? 'تم الفحص' : 'لم يُفحص'} 
                        size="small"
                        variant="outlined"
                        sx={request.checkorderout === 'true' ? getSoftChipSx('success') : getSoftChipSx('warning')}
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        ) : (
          <Alert severity="info">لا توجد طلبات مسجلة</Alert>
        )}
        
        {requestsTotalPages > 1 && (
          <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Pagination
              count={requestsTotalPages}
              page={requestsPage}
              onChange={(e, page) => setRequestsPage(page)}
              color="primary"
            />
          </Box>
        )}
      </Paper>
    </Box>
  );

  return (
    <Box>
      {/* رأس الصفحة */}
      <Paper sx={{ p: 3, mb: 3, background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white' }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h4" component="h1">
            📋 تفاصيل المشروع
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
            العودة إلى المشاريع
          </Button>
        </Box>
        
        {loading && (
          <Box sx={{ width: '100%', mb: 2 }}>
            <LinearProgress />
          </Box>
        )}
      </Paper>

      {/* معلومات المشروع الأساسية */}
      {renderProjectInfo()}

      {/* التابات */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={(e, newValue) => setActiveTab(newValue)}
          variant="scrollable"
          scrollButtons="auto"
          allowScrollButtonsMobile
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab icon={<TimelineIcon />} label="المراحل والتطور" />
          <Tab icon={<MoneyIcon />} label="المالية" />
          <Tab icon={<RequestIcon />} label="الطلبات" />
          <Tab icon={<GroupIcon />} label="فريق العمل" />
          <Tab icon={<AssessmentIcon />} label="التقارير المالية" />
        </Tabs>

        {/* محتوى التابات */}
        <TabPanel value={activeTab} index={0}>
          {renderStages}
        </TabPanel>

        <TabPanel value={activeTab} index={1}>
          {renderFinancialTab()}
        </TabPanel>

        <TabPanel value={activeTab} index={2}>
          {renderRequestsTab()}
        </TabPanel>

        

        <TabPanel value={activeTab} index={3}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h6" gutterBottom>👥 فريق العمل الفعلي (من المراحل والملاحظات والطلبات)</Typography>
            {actualProjectTeam.length > 0 ? (
              <TableContainer sx={{ width: '100%', overflowX: 'auto' }}>
                <Table size="small" sx={{ minWidth: 700 }}>
                  <TableHead>
                    <TableRow>
                      <TableCell>الاسم</TableCell>
                      <TableCell align="center">الإجمالي</TableCell>
                      <TableCell align="center">مراحل فُتحت</TableCell>
                      <TableCell align="center">مراحل أُغلقت</TableCell>
                      <TableCell align="center">ملاحظات</TableCell>
                      <TableCell align="center">طلبات مدخلة</TableCell>
                      <TableCell align="center">طلبات منفذة</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {actualProjectTeam.map((m) => (
                      <TableRow key={m.name}>
                        <TableCell>{m.name}</TableCell>
                        <TableCell align="center"><Chip label={m.totalContributions} color="primary" size="small" /></TableCell>
                        <TableCell align="center">{m.openedStages}</TableCell>
                        <TableCell align="center">{m.closedStages}</TableCell>
                        <TableCell align="center">{m.notesRecorded}</TableCell>
                        <TableCell align="center">{m.requestsInserted}</TableCell>
                        <TableCell align="center">{m.requestsImplemented}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            ) : (
              <Alert severity="info">لم يتم العثور على مساهمين فعليين من بيانات المراحل/الطلبات حتى الآن.</Alert>
            )}
          </Paper>
        </TabPanel>

        <TabPanel value={activeTab} index={4}>
          <Typography variant="h4" gutterBottom sx={{ mb: 3 }}>
            التقارير المالية الشاملة
          </Typography>



          {financialReportsLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
              <CircularProgress />
            </Box>
          ) : financialReports ? (
            <Grid container spacing={3}>
              {/* معلومات المشروع */}
              <Grid item xs={12}>
                <Paper sx={{ p: 2 }}>
                  <Typography variant="h6" color="primary.main" gutterBottom>
                    معلومات المشروع
                  </Typography>
                  <Grid container spacing={2}>
                    <Grid item xs={12} md={6}>
                      <Typography><strong>اسم المشروع:</strong> {financialReports.Nameproject || 'غير محدد'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography><strong>نوع العقد:</strong> {financialReports.TypeOFContract || 'غير محدد'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography><strong>اسم الشركة:</strong> {financialReports.NameCompany || 'غير محدد'}</Typography>
                    </Grid>
                    <Grid item xs={12} md={6}>
                      <Typography><strong>مدير الفرع:</strong> {financialReports.boss || 'غير محدد'}</Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>

              {/* المعلومات المالية */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="success.main">
                      الملخص المالي
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography><strong>إجمالي العهد:</strong></Typography>
                        <Chip label={`${(financialReports.TotalRevenue || 0).toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})} ريال`} color="success" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography><strong>إجمالي المصروفات:</strong></Typography>
                        <Chip label={`${(financialReports.TotalExpense || 0).toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})} ريال`} color="error" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography><strong>إجمالي المرتجعات:</strong></Typography>
                        <Chip label={`${(financialReports.TotalReturns || 0).toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})} ريال`} color="warning" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Tooltip title="الرصيد المتبقي = إجمالي العهد - إجمالي المصروفات + إجمالي المرتجعات" arrow>
                          <Typography><strong>🏦 الرصيد المتبقي:</strong></Typography>
                        </Tooltip>
                        <Chip 
                          label={`${((financialReports.TotalRevenue || 0) - (financialReports.TotalExpense || 0) + (financialReports.TotalReturns || 0)).toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})} ريال`} 
                          color={((financialReports.TotalRevenue || 0) - (financialReports.TotalExpense || 0) + (financialReports.TotalReturns || 0)) >= 0 ? "primary" : "error"} 
                          size="small" 
                          variant="filled"
                        />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography><strong>إجمالي التكلفة:</strong></Typography>
                        <Chip label={`${(financialReports.TotalcosttothCompany || 0).toLocaleString('en-US', {maximumFractionDigits: 2, minimumFractionDigits: 2})} ريال`} color="info" size="small" />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* تقدم المراحل */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="primary.main">
                      تقدم المراحل
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography><strong>المراحل المنجزة:</strong></Typography>
                        <Chip label={`${financialReports.countSTageTrue || 0}`} color="success" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography><strong>إجمالي المراحل:</strong></Typography>
                        <Chip label={`${financialReports.countStageall || 0}`} color="info" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography><strong>المراحل المعلقة:</strong></Typography>
                        <Chip label={`${financialReports.StagesPending || 0}`} color="warning" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography><strong>المراحل المتأخرة:</strong></Typography>
                        <Chip label={`${financialReports.LateStages || 0}`} color="error" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography><strong>نسبة الإنجاز:</strong></Typography>
                        <Chip label={`${(financialReports.rateProject || 0).toFixed(2)}%`} color="primary" size="small" />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* الطلبات */}
              <Grid item xs={12} md={4}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="secondary.main">
                      إحصائيات الطلبات
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography><strong>إجمالي الطلبات:</strong></Typography>
                        <Chip label={`${financialReports.countallRequests || 0}`} color="info" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography><strong>الطلبات المغلقة:</strong></Typography>
                        <Chip label={`${financialReports.countCLOSE || 0}`} color="success" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography><strong>الطلبات المفتوحة:</strong></Typography>
                        <Chip label={`${financialReports.countOPEN || 0}`} color="warning" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography><strong>نسبة إنجاز الطلبات:</strong></Typography>
                        <Chip label={`${(financialReports.RateRequests || 0).toFixed(2)}%`} color="primary" size="small" />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* الجدولة الزمنية */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="info.main">
                      ⏰ الجدولة الزمنية
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      <Typography>
                        <strong>تاريخ البداية:</strong> 
                        {financialReports.startDateProject ? new Date(financialReports.startDateProject).toLocaleDateString('en-GB') : 'غير محدد'}
                      </Typography>
                      <Typography>
                        <strong>تاريخ النهاية:</strong> 
                        {financialReports.EndDateProject ? new Date(financialReports.EndDateProject).toLocaleDateString('en-GB') : 'غير محدد'}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography><strong>الأيام المتبقية:</strong></Typography>
                        <Chip label={`${financialReports.Daysremaining || 0} يوم`} color="info" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography><strong>الأيام المنقضية:</strong></Typography>
                        <Chip label={`${financialReports.DaysUntiltoday || 0} يوم`} color="secondary" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography><strong>إجمالي أيام التأخير:</strong></Typography>
                        <Chip label={`${financialReports.TotalDelayDay || 0} يوم`} color="error" size="small" />
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography><strong>نسبة الالتزام بالوقت:</strong></Typography>
                        <Chip label={`${(financialReports.ratematchtime || 0).toFixed(2)}%`} color="primary" size="small" />
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>

              {/* أكثر الموظفين إنجازاً */}
              <Grid item xs={12} md={6}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" gutterBottom color="success.main">
                      🏆 أكثر الموظفين إنجازاً
                    </Typography>
                    {financialReports.MostAccomplished ? (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                        <Typography>
                          <strong>الاسم:</strong> {financialReports.MostAccomplished.userName || 'غير محدد'}
                        </Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography><strong>عدد المهام المنجزة:</strong></Typography>
                          <Chip label={`${financialReports.MostAccomplished.count || 0} مهمة`} color="success" size="small" />
                        </Box>
                      </Box>
                    ) : (
                      <Typography color="text.secondary">لا توجد بيانات متاحة</Typography>
                    )}
                  </CardContent>
                </Card>
              </Grid>
            </Grid>
          ) : (
            <Alert severity="info">لا توجد تقارير متاحة</Alert>
          )}
        </TabPanel>
      </Paper>
    </Box>
  );
};

export default ProjectDetailsView; 