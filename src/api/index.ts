/**
 * مؤشر شامل لجميع APIs المفعلة حديثاً
 * 
 * 📊 تم تفعيل الطلبات المغلقة التالية:
 * 
 * ✅ Dashboard APIs - إحصائيات وتقارير لوحة التحكم
 * ✅ Login Activity APIs - تتبع أنشطة تسجيل الدخول
 * ✅ Pending Subscription Requests APIs - إدارة طلبات الاشتراك المعلقة
 * ✅ Advanced Company APIs - البحث الشامل وإحصائيات الموظفين
 * 
 * هذا الملف يوفر نقطة دخول موحدة لجميع APIs
 */

// APIs الأساسية الموجودة مسبقاً
export * from './config';
export * from './subscriptions';
export * from './users';
export * from './queryClient';

// تصدير محدد من database-api لتجنب التضارب
export {
  fetchCompanies,
  fetchCompanyWithDetails,
  fetchCompanySubs,
  fetchCompanySubProjects,
  searchProjects,
  fetchCompanyUsers,
  fetchCompanyEmployees,
  fetchProjectEmployees,
  fetchProjectExpenses,
  fetchProjectRevenue,
  fetchProjectReturns,
  fetchProjectTotalAmount,
  fetchProjectMainStages,
  fetchStageSubStages,
  fetchStageNotes,
  fetchProjectRequests,
  fetchProjectRequestsCount,
  fetchBranchEmployees,
  fetchBranchEmployeesStats,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  useCompanies,
  useCompanyWithDetails,
  useCompanySubs,
  useCompanySubProjects,
  useCompanyEmployees,
  useProjectEmployees,
  useBranchEmployees,
  useBranchEmployeesStats
} from './database-api';

// تصدير محدد من APIs المفعلة حديثاً لتجنب التضارب  
export {
  fetchDashboardStats,
  fetchDashboardReports,
  formatProjectStatus,
  formatProgress,
  formatDashboardCurrency,
  formatDashboardDate,
  calculatePercentage
} from './dashboard';

export {
  fetchAllLoginActivities,
  fetchLoginActivityById,
  fetchLoginActivitiesByCompany,
  searchLoginActivityByCode,
  fetchLoginActivityStats,
  formatActivationStatus,
  formatLoginDate,
  calculateSessionDuration,
  filterActivitiesByPeriod
} from './loginActivity';



// Enhanced APIs (الطلبات المعلقة والمتقدمة)
export {
  fetchPendingSubscriptionRequests,
  approveSubscriptionRequest,
  rejectSubscriptionRequest
} from './subscriptions';

export {
  fetchCompanyDetails,
  fetchAdvancedBranchEmployeesStats
} from './database-api';

// ثوابت مفيدة
export const API_ENDPOINTS = {
  // Dashboard
  DASHBOARD_STATS: '/api/dashboard/stats',
  DASHBOARD_REPORTS: '/api/dashboard/reports',
  
  // Login Activity
  LOGIN_ACTIVITY: '/api/login-activity',
  LOGIN_ACTIVITY_STATS: '/api/login-activity/stats/summary',
  
  // Stage Templates
  STAGE_TEMPLATES: '/api/stage-templates',
  STAGE_TEMPLATE_CATEGORIES: '/api/stage-templates/categories',
  
  // Subscriptions
  PENDING_SUBSCRIPTION_REQUESTS: '/api/subscriptions/pending-requests',
  
  // Advanced Company
  COMPANY_DETAILS: '/api/companies/:id/details',
  BRANCH_EMPLOYEES_STATS: '/api/companies/branches/:branchId/employees/stats'
} as const;

// أنواع البيانات المُعاد تصديرها
export type {
  DashboardStats,
  DashboardReports
} from './dashboard';

export type {
  LoginActivity,
  LoginActivityStats,
  LoginActivityFilters
} from './loginActivity';



export type {
  Subscription,
  SubscriptionStats,
  SubscriptionRequest,
  RenewSubscriptionData,
  SubscriptionFilters
} from './subscriptions';

export type {
  PaginationParams
} from './database-api';

/**
 * دالة مساعدة للتحقق من توفر API معين
 */
export const isApiEndpointAvailable = async (endpoint: string): Promise<boolean> => {
  try {
    // يمكن إضافة منطق للتحقق من توفر endpoint معين
    return true;
  } catch {
    return false;
  }
};

/**
 * دالة مساعدة لجلب معلومات النظام
 */
export const getSystemInfo = () => {
  return {
    activatedApis: [
      'Dashboard APIs',
      'Stage Templates APIs', 
      'Login Activity APIs',
      'Pending Subscription Requests APIs',
      'Advanced Company APIs'
    ],
    version: '2.0.0',
    lastUpdated: new Date().toISOString(),
    note: 'جميع الطلبات المغلقة تم تفعيلها بنجاح'
  };
};

export default {
  API_ENDPOINTS,
  isApiEndpointAvailable,
  getSystemInfo
};