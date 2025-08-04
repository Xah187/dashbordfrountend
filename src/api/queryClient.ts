import axios from 'axios';
import SecureStorage from '../utils/secureStorage';
import Logger from '../utils/logger';

// تعريف واجهة محلية لـ QueryClient بدلاً من استيراد المكتبة

// إعادة تعريف الأنواع الضرورية من React Query
type QueryKey = string | readonly unknown[];

interface InvalidateQueryFilters {
  queryKey?: QueryKey;
  exact?: boolean;
  refetchType?: 'active' | 'inactive' | 'all';
  type?: 'all' | 'active' | 'inactive';
  stale?: boolean;
  [key: string]: any;
}

interface QueryClientConfig {
  defaultOptions?: {
    queries?: {
      refetchOnWindowFocus?: boolean;
      retry?: number;
      staleTime?: number;
      cacheTime?: number;
      [key: string]: any;
    };
    mutations?: {
      retry?: number;
      [key: string]: any;
    };
  };
}

// إنشاء نموذج محسن لـ QueryClient للتوافق مع QueryClientProvider
class QueryClient {
  // الخصائص الرئيسية المطلوبة
  public queryCache: any = {};
  public mutationCache: any = {};
  public logger: any = console;
  public defaultOptions: QueryClientConfig['defaultOptions'];
  public queryDefaults: any = {};
  public mutationDefaults: any = {};
  public mountCount: number = 0;
  public unsubscribeCount: number = 0;
  public focusManager: any = { subscribe: () => () => {} };
  public onlineManager: any = { subscribe: () => () => {} };
  public broadcastChannel: any = { postMessage: () => {}, close: () => {} };
  public devTools: any = { disconnect: () => {} };
  public uids: number[] = [];
  
  constructor(config: QueryClientConfig = {}) {
    this.defaultOptions = config.defaultOptions || {};
  }

  // طرق مطلوبة للتوافق مع QueryClientProvider
  public mount(): void {
    this.mountCount++;
  }
  
  public unmount(): void {
    this.mountCount--;
  }
  
  public isFetching(): number {
    return 0;
  }
  
  public isMutating(): number {
    return 0;
  }
  
  public clear(): void {
    Logger.info('تم مسح ذاكرة التخزين المؤقت');
    this.queryCache = {};
    this.mutationCache = {};
  }

  // طرق للاستعلامات والبيانات
  public invalidateQueries(filters?: InvalidateQueryFilters): Promise<void> {
    Logger.info('تم إبطال الاستعلامات', filters?.queryKey);
    return Promise.resolve();
  }
  
  public ensureQueryData(options: any): Promise<any> {
    return Promise.resolve(null);
  }
  
  public getQueryState(queryKey: any): any {
    return null;
  }
  
  public resumePausedMutations(): Promise<any> {
    return Promise.resolve();
  }
  
  public getLogger(): any {
    return this.logger;
  }
  
  public getQueryData(queryKey?: any): any {
    return null;
  }
  
  public setQueryData(queryKey: any, updater: any): any {
    return null;
  }
  
  public getQueriesData(): any[] {
    return [];
  }
  
  public setQueriesData(): any {
    return null;
  }
  
  public getDefaultOptions(): QueryClientConfig['defaultOptions'] {
    return this.defaultOptions;
  }
  
  public resetQueries(): Promise<void> {
    return Promise.resolve();
  }
  
  public refetchQueries(): Promise<void> {
    return Promise.resolve();
  }
  
  public removeQueries(): void {
    // No-op
  }
  
  public cancelQueries(): Promise<void> {
    return Promise.resolve();
  }
  
  public fetchQuery(): Promise<any> {
    return Promise.resolve(null);
  }
  
  public prefetchQuery(): Promise<any> {
    return Promise.resolve(null);
  }
  
  public fetchInfiniteQuery(): Promise<any> {
    return Promise.resolve(null);
  }
  
  public prefetchInfiniteQuery(): Promise<any> {
    return Promise.resolve(null);
  }
  
  // طرق إدارة الطلبات التعديلية
  public executeMutation(): Promise<any> {
    return Promise.resolve(null);
  }
  
  public getMutationCache(): any {
    return this.mutationCache;
  }
  
  public getQueryCache(): any {
    return this.queryCache;
  }
  
  public getMutationDefaults(): any {
    return null;
  }
  
  public getQueryDefaults(): any {
    return null;
  }
  
  public setMutationDefaults(): void {
    // No-op
  }
  
  public setQueryDefaults(): void {
    // No-op
  }
  
  // طرق الاشتراك والانتظار
  public suspense = false;
  
  public fetchStatus = 'idle';
  
  public get fetch() {
    return {
      loading: false,
      error: null,
      data: null,
    };
  }
  
  // معلومات إضافية مطلوبة
  public isRestoring = false;
  
  public setTimeout = (callback: () => void, ms: number) => window.setTimeout(callback, ms);
  public clearTimeout = (timeout: number) => window.clearTimeout(timeout);
  
  // طرق المقارنة والتجميع
  public hashQueryKey(queryKey: any): string {
    return JSON.stringify(queryKey);
  }
  
  public getResolvedQueryDefaults(queryKey: any): any {
    return {};
  }
}

// إعداد axios للتعامل مع تكوين معياري
axios.defaults.baseURL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000';

// إضافة اعتراض للطلبات لإضافة رمز المصادقة
axios.interceptors.request.use(
  (config) => {
    const token = SecureStorage.getItem<string>('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// إعداد اعتراض للاستجابات للتعامل مع أخطاء المصادقة
axios.interceptors.response.use(
  (response) => response,
  (error) => {
    // التحقق مما إذا كان الخطأ مرتبطًا بانتهاء صلاحية رمز المصادقة
    if (error.response && error.response.status === 401) {
      // حذف الرمز وإعادة توجيه المستخدم إلى صفحة تسجيل الدخول
      SecureStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// إنشاء عميل React Query مع تكوين مخصص
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false, // تعطيل إعادة الجلب عند التركيز على النافذة
      retry: 1, // عدد محاولات إعادة المحاولة في حالة فشل الاستعلام
      staleTime: 5 * 60 * 1000, // 5 دقائق قبل اعتبار البيانات قديمة
      cacheTime: 10 * 60 * 1000, // 10 دقائق للاحتفاظ بالبيانات في ذاكرة التخزين المؤقت
    },
    mutations: {
      retry: 0, // لا تحاول مرة أخرى للطلبات التعديلية
    },
  },
});

// استبدال رمز الخطأ العام لتوفير رسائل أكثر فائدة
export const getErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError(error)) {
    // استخراج رسالة الخطأ من خطأ Axios
    return error.response?.data?.message || error.message || 'حدث خطأ في الاتصال بالخادم';
  }
  
  // خطأ غير متوقع
  return error instanceof Error ? error.message : 'حدث خطأ غير متوقع';
};

// دوال مساعدة لعمليات إنشاء مفاتيح الاستعلام
export const queryKeys = {
  auth: {
    profile: ['auth', 'profile'],
  },
  users: {
    all: ['users'],
    detail: (id: string) => ['users', id],
  },
  projects: {
    all: ['projects'],
    detail: (id: string) => ['projects', id],
    byUser: (userId: string) => ['projects', 'user', userId],
  },
  tasks: {
    all: ['tasks'],
    detail: (id: string) => ['tasks', id],
    byProject: (projectId: string) => ['tasks', 'project', projectId],
    byUser: (userId: string) => ['tasks', 'user', userId],
    byStatus: (status: string) => ['tasks', 'status', status],
  },
  companies: {
    all: ['companies'],
    detail: (id: string) => ['companies', id],
  },

  notifications: {
    all: ['notifications'],
    unread: ['notifications', 'unread'],
  },
  activityLogs: {
    all: ['activityLogs'],
    byUser: (userId: string) => ['activityLogs', 'user', userId],
    byEntity: (entityType: string, entityId: string) => [
      'activityLogs',
      entityType,
      entityId,
    ],
  },
};
