/**
 * Login Activity API - تفعيل طلبات أنشطة تسجيل الدخول المغلقة
 * 
 * 📊 APIs المفعلة حديثاً:
 * - GET /api/login-activity/ - جلب جميع بيانات تسجيل الدخول
 * - GET /api/login-activity/:id - جلب بيانات تسجيل دخول محددة
 * - GET /api/login-activity/company/:companyId - جلب بيانات تسجيل الدخول حسب الشركة
 * - GET /api/login-activity/search/code/:code - البحث بكود التحقق
 * - GET /api/login-activity/stats/summary - إحصائيات تسجيل الدخول
 */

import { apiClient } from "./config";

// أنواع البيانات لتسجيل الدخول
export interface LoginActivity {
  id: number;
  IDCompany: number;
  userName: string;
  IDNumber: string;
  PhoneNumber: string;
  image?: string;
  DateOFlogin: string;
  DateEndLogin?: string;
  Activation: string;
  job: string;
  jobdiscrption?: string;
  codeVerification: string;
}

// أنواع البيانات للإحصائيات
export interface LoginActivityStats {
  totalUsers: number;
  activeUsers: number;
  todayLogins: number;
  weekLogins: number;
}

// معاملات البحث والفلترة
export interface LoginActivityFilters {
  companyId?: number;
  number?: number;
  limit?: number;
  page?: number;
}

/**
 * جلب جميع بيانات تسجيل الدخول مع pagination
 */
export const fetchAllLoginActivities = async (params: LoginActivityFilters = {}): Promise<{
  activities: LoginActivity[];
  count: number;
  hasMore: boolean;
}> => {
  const { number = 0, limit = 10 } = params;
  
  console.log('🔍 جاري جلب أنشطة تسجيل الدخول...', { number, limit });
  
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('number', number.toString());
    if (limit) queryParams.append('limit', limit.toString());
    
    const response = await apiClient.get<{
      success: boolean;
      data: LoginActivity[];
      count: number;
      message?: string;
    }>(`/login-activity?${queryParams.toString()}`);
    
    console.log('📊 استجابة أنشطة تسجيل الدخول:', response.data);
    
    if (response.data.success) {
      const activities = response.data.data || [];
      const hasMore = activities.length === limit;
      
      return {
        activities,
        count: response.data.count,
        hasMore
      };
    } else {
      throw new Error(response.data.message || 'فشل في جلب أنشطة تسجيل الدخول');
    }
  } catch (error) {
    console.error('❌ خطأ في جلب أنشطة تسجيل الدخول:', error);
    throw error;
  }
};

/**
 * جلب نشاط تسجيل دخول محدد
 */
export const fetchLoginActivityById = async (id: number): Promise<LoginActivity> => {
  console.log(`🔍 جاري جلب نشاط تسجيل الدخول للمعرف: ${id}`);
  
  try {
    const response = await apiClient.get<{
      success: boolean;
      data: LoginActivity;
      message?: string;
    }>(`/login-activity/${id}`);
    
    console.log('📊 استجابة نشاط تسجيل الدخول:', response.data);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'فشل في جلب نشاط تسجيل الدخول');
    }
  } catch (error) {
    console.error('❌ خطأ في جلب نشاط تسجيل الدخول:', error);
    throw error;
  }
};

/**
 * جلب أنشطة تسجيل الدخول حسب الشركة
 */
export const fetchLoginActivitiesByCompany = async (
  companyId: number,
  params: LoginActivityFilters = {}
): Promise<{
  activities: LoginActivity[];
  count: number;
  hasMore: boolean;
}> => {
  const { number = 0, limit = 10 } = params;
  
  console.log(`🔍 جاري جلب أنشطة تسجيل الدخول للشركة: ${companyId}`, { number, limit });
  
  try {
    const queryParams = new URLSearchParams();
    queryParams.append('number', number.toString());
    if (limit) queryParams.append('limit', limit.toString());
    
    const response = await apiClient.get<{
      success: boolean;
      data: LoginActivity[];
      count: number;
      message?: string;
    }>(`/login-activity/company/${companyId}?${queryParams.toString()}`);
    
    console.log('📊 استجابة أنشطة تسجيل الدخول للشركة:', response.data);
    
    if (response.data.success) {
      const activities = response.data.data || [];
      const hasMore = activities.length === limit;
      
      return {
        activities,
        count: response.data.count,
        hasMore
      };
    } else {
      throw new Error(response.data.message || 'فشل في جلب أنشطة تسجيل الدخول للشركة');
    }
  } catch (error) {
    console.error('❌ خطأ في جلب أنشطة تسجيل الدخول للشركة:', error);
    throw error;
  }
};

/**
 * البحث عن نشاط تسجيل الدخول بكود التحقق
 */
export const searchLoginActivityByCode = async (code: string): Promise<LoginActivity> => {
  console.log(`🔍 جاري البحث عن نشاط تسجيل الدخول بالكود: ${code}`);
  
  try {
    const response = await apiClient.get<{
      success: boolean;
      data: LoginActivity;
      message?: string;
    }>(`/login-activity/search/code/${code}`);
    
    console.log('📊 استجابة البحث بالكود:', response.data);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'فشل في البحث عن نشاط تسجيل الدخول');
    }
  } catch (error) {
    console.error('❌ خطأ في البحث عن نشاط تسجيل الدخول:', error);
    throw error;
  }
};

/**
 * جلب إحصائيات تسجيل الدخول
 */
export const fetchLoginActivityStats = async (): Promise<LoginActivityStats> => {
  console.log('🔍 جاري جلب إحصائيات تسجيل الدخول...');
  
  try {
    const response = await apiClient.get<{
      success: boolean;
      data: LoginActivityStats;
      message?: string;
    }>('/login-activity/stats/summary');
    
    console.log('📊 استجابة إحصائيات تسجيل الدخول:', response.data);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'فشل في جلب إحصائيات تسجيل الدخول');
    }
  } catch (error) {
    console.error('❌ خطأ في جلب إحصائيات تسجيل الدخول:', error);
    throw error;
  }
};

/**
 * دالة مساعدة لتنسيق حالة التفعيل
 */
export const formatActivationStatus = (activation: string): { text: string; color: string } => {
  switch (activation.toLowerCase()) {
    case 'true':
      return { text: 'نشط', color: 'success' };
    case 'false':
      return { text: 'غير نشط', color: 'error' };
    default:
      return { text: 'غير محدد', color: 'default' };
  }
};

/**
 * دالة مساعدة لتنسيق تاريخ تسجيل الدخول
 */
export const formatLoginDate = (dateString: string): string => {
  if (!dateString) return 'غير محدد';
  try {
    return new Date(dateString).toLocaleString('ar-SA', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch {
    return 'تاريخ غير صحيح';
  }
};

/**
 * دالة مساعدة لحساب مدة الجلسة
 */
export const calculateSessionDuration = (startDate: string, endDate?: string): string => {
  if (!startDate) return 'غير محدد';
  
  const start = new Date(startDate);
  const end = endDate ? new Date(endDate) : new Date();
  
  const diffMs = end.getTime() - start.getTime();
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
  const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
  
  if (diffHours > 0) {
    return `${diffHours} ساعة و ${diffMinutes} دقيقة`;
  } else {
    return `${diffMinutes} دقيقة`;
  }
};

/**
 * دالة مساعدة لفلترة الأنشطة حسب الفترة الزمنية
 */
export const filterActivitiesByPeriod = (
  activities: LoginActivity[],
  period: 'today' | 'week' | 'month' | 'all'
): LoginActivity[] => {
  if (period === 'all') return activities;
  
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  
  return activities.filter(activity => {
    const activityDate = new Date(activity.DateOFlogin);
    
    switch (period) {
      case 'today':
        return activityDate >= today;
      case 'week':
        const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
        return activityDate >= weekAgo;
      case 'month':
        const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
        return activityDate >= monthAgo;
      default:
        return true;
    }
  });
};

export default {
  fetchAllLoginActivities,
  fetchLoginActivityById,
  fetchLoginActivitiesByCompany,
  searchLoginActivityByCode,
  fetchLoginActivityStats,
  formatActivationStatus,
  formatLoginDate,
  calculateSessionDuration,
  filterActivitiesByPeriod
};