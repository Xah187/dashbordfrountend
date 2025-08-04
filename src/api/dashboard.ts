/**
 * Dashboard API - تفعيل طلبات لوحة التحكم المغلقة
 * 
 * 📊 APIs المفعلة حديثاً:
 * - GET /api/dashboard/stats - إحصائيات الداشبورد العامة
 * - GET /api/dashboard/reports - تقارير الداشبورد المتقدمة
 */

import { apiClient } from "./config";

// أنواع البيانات للإحصائيات
export interface DashboardStats {
  overview: {
    totalCompanies: number;
    totalSubs: number;
    totalProjects: number;
    activeProjects: number;
  };
  recentCompanies: Array<{
    id: number;
    name: string;
    subscriptionStart: string;
  }>;
  recentProjects: Array<{
    id: number;
    name: string;
    status: string;
    progress: number;
    companyName: string;
    subName: string;
  }>;
}

// أنواع البيانات للتقارير
export interface DashboardReports {
  companies: Array<{
    id: number;
    NameCompany: string;
    totalSubs: number;
    totalProjects: number;
    status: string;
    Cost: number;
    SubscriptionEndDate: string;
  }>;
  projects: Array<{
    id: number;
    Nameproject: string;
    progress: number;
    NameCompany: string;
    NameSub: string;
    status: string;
    cost: number;
    ProjectStartdate: string;
  }>;
  monthlyStats: Array<{
    month: string;
    companies: number;
    subs: number;
    projects: number;
    totalRevenue: number;
  }>;
  companiesByCity: Array<{
    City: string;
    count: number;
  }>;
}

/**
 * جلب إحصائيات الداشبورد العامة
 */
export const fetchDashboardStats = async (): Promise<DashboardStats> => {
  console.log('🔍 جاري جلب إحصائيات الداشبورد...');
  
  try {
    const response = await apiClient.get<{
      success: boolean;
      data: DashboardStats;
      message?: string;
    }>('/dashboard/stats');
    
    console.log('📊 استجابة إحصائيات الداشبورد:', response.data);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'فشل في جلب إحصائيات الداشبورد');
    }
  } catch (error) {
    console.error('❌ خطأ في جلب إحصائيات الداشبورد:', error);
    throw error;
  }
};

/**
 * جلب تقارير الداشبورد المتقدمة
 */
export const fetchDashboardReports = async (): Promise<DashboardReports> => {
  console.log('🔍 جاري جلب تقارير الداشبورد...');
  
  try {
    const response = await apiClient.get<{
      success: boolean;
      data: DashboardReports;
      message?: string;
    }>('/dashboard/reports');
    
    console.log('📊 استجابة تقارير الداشبورد:', response.data);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.message || 'فشل في جلب تقارير الداشبورد');
    }
  } catch (error) {
    console.error('❌ خطأ في جلب تقارير الداشبورد:', error);
    throw error;
  }
};

/**
 * دالة مساعدة لتنسيق الحالة
 */
export const formatProjectStatus = (status: string): { text: string; color: string } => {
  switch (status) {
    case 'جاري_العمل':
      return { text: 'جاري العمل', color: 'success' };
    case 'متوقف':
      return { text: 'متوقف', color: 'error' };
    case 'مكتمل':
      return { text: 'مكتمل', color: 'info' };
    default:
      return { text: status, color: 'default' };
  }
};

/**
 * دالة مساعدة لتنسيق التقدم
 */
export const formatProgress = (progress: number): string => {
  if (progress === null || progress === undefined) return '0.00%';
  return `${progress.toFixed(2)}%`;
};

/**
 * دالة مساعدة لتنسيق العملة في الداشبورد
 */
export const formatDashboardCurrency = (amount: number): string => {
  if (!amount || amount === 0) return '0.00 ريال';
  return new Intl.NumberFormat('ar-SA', {
    style: 'currency',
    currency: 'SAR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount);
};

/**
 * دالة مساعدة لتنسيق التاريخ في الداشبورد
 */
export const formatDashboardDate = (dateString: string): string => {
  if (!dateString) return 'غير محدد';
  try {
    return new Date(dateString).toLocaleDateString('ar-SA', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  } catch {
    return 'تاريخ غير صحيح';
  }
};

/**
 * دالة مساعدة لحساب النسبة المئوية
 */
export const calculatePercentage = (value: number, total: number): string => {
  if (total === 0) return '0.00%';
  return `${((value / total) * 100).toFixed(2)}%`;
};

export default {
  fetchDashboardStats,
  fetchDashboardReports,
  formatProjectStatus,
  formatProgress,
  formatDashboardCurrency,
  formatDashboardDate,
  calculatePercentage
};