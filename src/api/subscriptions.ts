import React from 'react';
import { apiClient } from './config';

export interface Subscription {
  id: string;
  companyId: string;
  companyName: string;
  planName: string;
  startDate: string;
  endDate: string;
  amount: number;
  status: 'active' | 'expired' | 'expiring';
  autoRenew: boolean;
  paymentMethod: string;
  branchesAllowed: number;
  currentBranches: number;
  remainingBranches: number;
  registrationNumber: string;
  city: string;
  country: string;
  createdAt: string;
  branches?: any[];
}

export interface SubscriptionStats {
  totalCompanies: number;
  activeSubscriptions: number;
  expiredSubscriptions: number;
  expiringSoon: number;
  totalRevenue: number;
  averageCost: number;
}

export interface SubscriptionRequest {
  id: string;
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  planType: string;
  duration: number;
  requestedCost: number;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  processedAt?: string;
  processedBy?: string;
}

export interface RenewSubscriptionData {
  planType: string;
  duration: number;
  cost: number;
  startDate?: string;
  paymentMethod?: string;
}

export interface SubscriptionFilters {
  page?: number;
  limit?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// جلب جميع الاشتراكات
export const fetchSubscriptions = async (filters: SubscriptionFilters = {}) => {
  const queryParams = new URLSearchParams();
  
  if (filters.page) queryParams.append('page', filters.page.toString());
  if (filters.limit) queryParams.append('limit', filters.limit.toString());
  if (filters.search) queryParams.append('search', filters.search);
  if (filters.status) queryParams.append('status', filters.status);
  if (filters.sortBy) queryParams.append('sortBy', filters.sortBy);
  if (filters.sortOrder) queryParams.append('sortOrder', filters.sortOrder);
  
  const url = `/subscriptions${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
  const response = await apiClient.get(url);
  return response.data;
};

// جلب إحصائيات الاشتراكات
export const fetchSubscriptionStats = async (): Promise<{ success: boolean; data: SubscriptionStats }> => {
  try {
    const response = await apiClient.get('/dashboard/stats');
    const { overview } = response.data.data;
    
    // تحويل البيانات من التنسيق الجديد
    return {
      success: true,
      data: {
        totalCompanies: overview.totalCompanies || 0,
        activeSubscriptions: overview.totalCompanies || 0, // نستخدم عدد الشركات النشطة
        expiredSubscriptions: 0, // يمكن تحديثه لاحقاً
        expiringSoon: 0, // يمكن تحديثه لاحقاً
        totalRevenue: 0,
        averageCost: 0
      }
    };
  } catch (error) {
    console.error('خطأ في جلب إحصائيات الاشتراكات:', error);
    throw error;
  }
};

// جلب طلبات تسجيل الشركات المعلقة
export const fetchPendingSubscriptionRequests = async (): Promise<{ success: boolean; data: SubscriptionRequest[] }> => {
  console.log('🔍 جاري جلب طلبات تسجيل الشركات...');
  
  try {
    const response = await apiClient.get('/company/bringCompanyRegitration', {
      params: { LastID: 0 }
    });
    
    // تحويل البيانات من شكل قاعدة البيانات إلى الشكل المطلوب
    const transformedData = Array.isArray(response.data.data) 
      ? response.data.data.map((request: any) => ({
          id: request.id,
          companyName: request.NameCompany,
          contactEmail: request.email || "غير متوفر",
          contactPhone: request.PhoneNumber,
          planType: "أساسي",
          duration: 12, // سنة كاملة
          requestedCost: 0,
          notes: "",
          status: "pending",
          submittedAt: new Date().toISOString(),
          city: request.City,
          country: request.Country,
          registrationNumber: request.CommercialRegistrationNumber
        }))
      : [];

    console.log('📊 طلبات تسجيل الشركات:', transformedData);
    return {
      success: true,
      data: transformedData
    };
  } catch (error) {
    console.error('❌ خطأ في جلب طلبات تسجيل الشركات:', error);
    throw error;
  }
};

// جلب اشتراك محدد
export const fetchSubscription = async (id: string): Promise<{ success: boolean; data: Subscription }> => {
  const response = await apiClient.get(`/subscriptions/${id}`);
  return response.data;
};

// تجديد اشتراك
export const renewSubscription = async (id: string, data: RenewSubscriptionData): Promise<{ success: boolean; data: Subscription; message: string }> => {
  const response = await apiClient.put(`/subscriptions/${id}/renew`, data);
  return response.data;
};

// إيقاف اشتراك
export const suspendSubscription = async (id: string, reason: string): Promise<{ success: boolean; data: Subscription; message: string }> => {
  const response = await apiClient.put(`/subscriptions/${id}/suspend`, { reason });
  return response.data;
};

// إرسال طلب اشتراك جديد
export const submitSubscriptionRequest = async (data: {
  companyName: string;
  contactEmail: string;
  contactPhone: string;
  planType: string;
  duration: number;
  requestedCost: number;
  notes?: string;
}): Promise<{ success: boolean; data: SubscriptionRequest; message: string }> => {
  const response = await apiClient.post('/subscriptions/requests', data);
  return response.data;
};

// الموافقة على طلب اشتراك - تحديث للAPI الجديد
export const approveSubscriptionRequest = async (
  requestId: string
): Promise<{ success: boolean; data: any; message: string }> => {
  console.log(`✅ جاري الموافقة على طلب الاشتراك: ${requestId}`);
  
  try {
    const response = await apiClient.get(`/company/AgreedRegistrationCompany?id=${requestId}`);
    console.log('📊 استجابة الموافقة على الطلب:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في الموافقة على طلب الاشتراك:', error);
    throw error;
  }
};

// رفض طلب اشتراك - تحديث للAPI الجديد
export const rejectSubscriptionRequest = async (
  requestId: string,
  reason: string
): Promise<{ success: boolean; data: any; message: string }> => {
  console.log(`❌ جاري حذف طلب الاشتراك: ${requestId} - السبب: ${reason}`);
  
  try {
    const response = await apiClient.delete(`/company/DeleteCompanyRegistration?id=${requestId}`);
    console.log('📊 استجابة حذف الطلب:', response.data);
    return response.data;
  } catch (error) {
    console.error('❌ خطأ في حذف طلب الاشتراك:', error);
    throw error;
  }
};

// دالة مساعدة لتحديد لون الحالة
export const getSubscriptionStatusColor = (status: string): 'success' | 'error' | 'warning' | 'default' => {
  switch (status) {
    case 'active': return 'success';
    case 'expired': return 'error';
    case 'expiring': return 'warning';
    default: return 'default';
  }
};

// دالة مساعدة لتحديد نص الحالة
export const getSubscriptionStatusText = (status: string): string => {
  switch (status) {
    case 'active': return 'نشط';
    case 'expired': return 'منتهي';
    case 'expiring': return 'ينتهي قريباً';
    default: return 'غير محدد';
  }
};

// دالة تحويل الحالة للعرض
export const formatSubscriptionStatus = (status: string): string => {
  return getSubscriptionStatusText(status);
};

// دالة مساعدة لحساب الأيام المتبقية
export const getDaysRemaining = (endDate: string): number => {
  const today = new Date();
  const end = new Date(endDate);
  const diffTime = end.getTime() - today.getTime();
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
};

// دالة مساعدة لتحديد الباقة بناءً على التكلفة
export const getSubscriptionPlanFromCost = (cost: number): string => {
  if (!cost || cost === 0) return 'تجريبية';
  if (cost <= 1000) return 'الباقة الأساسية';
  if (cost <= 5000) return 'الباقة المتقدمة';
  return 'الباقة الشاملة';
};

// دالة مساعدة لتنسيق المبلغ
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-GB', {
    style: 'currency',
    currency: 'SAR'
  }).format(amount);
};

// دالة مساعدة لتنسيق التاريخ
export const formatDate = (dateString: string): string => {
  if (!dateString) return 'غير محدد';
  return new Date(dateString).toLocaleDateString('en-GB', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
};

// دالة مساعدة لتحديد لون الأولوية بناءً على الأيام المتبقية
export const getExpirationPriority = (endDate: string): 'high' | 'medium' | 'low' => {
  const daysRemaining = getDaysRemaining(endDate);
  if (daysRemaining <= 7) return 'high';
  if (daysRemaining <= 30) return 'medium';
  return 'low';
};

// دالة مساعدة لتصدير الاشتراكات
export const exportSubscriptionsToExcel = async (filters: SubscriptionFilters = {}) => {
  // جلب جميع الاشتراكات للتصدير
  const allSubscriptions = await fetchSubscriptions({ ...filters, limit: 1000 });
  
  const formattedData = allSubscriptions.data.map((subscription: Subscription) => ({
    'اسم الشركة': subscription.companyName,
    'الباقة': subscription.planName,
    'تاريخ البدء': formatDate(subscription.startDate),
    'تاريخ الانتهاء': formatDate(subscription.endDate),
    'المبلغ': formatCurrency(subscription.amount),
    'الحالة': getSubscriptionStatusText(subscription.status),
    'الفروع المسموحة': subscription.branchesAllowed,
    'الفروع الحالية': subscription.currentBranches,
    'الفروع المتبقية': subscription.remainingBranches,
    'المدينة': subscription.city,
    'الدولة': subscription.country,
    'رقم التسجيل': subscription.registrationNumber,
    'التجديد التلقائي': subscription.autoRenew ? 'مفعل' : 'غير مفعل',
    'طريقة الدفع': subscription.paymentMethod
  }));
  
  return formattedData;
};

// Hook مخصص لاستخدام الاشتراكات
export const useSubscriptions = (filters: SubscriptionFilters = {}) => {
  const [subscriptions, setSubscriptions] = React.useState<Subscription[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [pagination, setPagination] = React.useState({
    currentPage: 1,
    totalPages: 1,
    totalItems: 0,
    itemsPerPage: 10
  });

  const loadSubscriptions = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchSubscriptions(filters);
      if (response.success) {
        setSubscriptions(response.data);
        setPagination(response.pagination);
      } else {
        setError(response.error || 'فشل في جلب الاشتراكات');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في جلب الاشتراكات');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  React.useEffect(() => {
    loadSubscriptions();
  }, [loadSubscriptions]);

  return {
    subscriptions,
    loading,
    error,
    pagination,
    refetch: loadSubscriptions
  };
};

// Hook مخصص لإحصائيات الاشتراكات
export const useSubscriptionStats = () => {
  const [stats, setStats] = React.useState<SubscriptionStats>({
    totalCompanies: 0,
    activeSubscriptions: 0,
    expiredSubscriptions: 0,
    expiringSoon: 0,
    totalRevenue: 0,
    averageCost: 0
  });
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const loadStats = React.useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetchSubscriptionStats();
      if (response.success) {
        setStats(response.data);
      } else {
        setError('فشل في جلب الإحصائيات');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'خطأ في جلب الإحصائيات');
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    loadStats();
  }, [loadStats]);

  return {
    stats,
    loading,
    error,
    refetch: loadStats
  };
};

export default {
  fetchSubscriptions,
  fetchSubscriptionStats,
  fetchSubscription,
  renewSubscription,
  suspendSubscription,
  submitSubscriptionRequest,
  approveSubscriptionRequest,
  rejectSubscriptionRequest,
  getSubscriptionStatusColor,
  getSubscriptionStatusText,
  getDaysRemaining,
  getSubscriptionPlanFromCost,
  formatCurrency,
  formatDate,
  getExpirationPriority,
  exportSubscriptionsToExcel,
  useSubscriptions,
  useSubscriptionStats
}; 