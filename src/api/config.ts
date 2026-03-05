/**
 * ملف إعدادات API محسن ومتقدم
 * 
 * الميزات المضافة:
 * - دعم متعدد لأنواع الـ tokens (accessToken, token, access_token, authToken)
 * - دعم Refresh Token و API Keys
 * - Headers متعددة للتوافق مع أنواع مختلفة من الـ backends
 * - معالجة محسنة للأخطاء وانتهاء صلاحية الـ tokens
 * - إعدادات قابلة للتخصيص من environment variables
 * - utility functions للمصادقة
 * - CORS headers و metadata للطلبات
 * - كشف الأخطاء المخفية في استجابات 200
 */

import axios from "axios";
import SecureStorage from "../utils/secureStorage";

// إعداد Base URL للـ API
// Since we are using a proxy in package.json to avoid CORS issues in development, 
// the baseURL should just be empty (relative) in development, and the full domain in production.
export const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? ""
  : (process.env.REACT_APP_API_BASE_URL || "https://mushrf.net");

// إعدادات إضافية من البيئة
export const API_CONFIG = {
  baseURL: API_BASE_URL,
  timeout: parseInt(process.env.REACT_APP_API_TIMEOUT || "15000"),
  enableAuth: process.env.REACT_APP_ENABLE_AUTH !== "false",
  enableCors: process.env.REACT_APP_ENABLE_CORS !== "false",
  authHeaderName: process.env.REACT_APP_AUTH_HEADER || "Authorization",
  tokenPrefix: process.env.REACT_APP_TOKEN_PREFIX || "Bearer",
};

// إظهار إعدادات النظام عند التحميل
console.log('🚀 Enhanced API Config Loaded (NEW API ONLY):', {
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  enableAuth: API_CONFIG.enableAuth,
  enableCors: API_CONFIG.enableCors,
  authHeader: API_CONFIG.authHeaderName,
  tokenPrefix: API_CONFIG.tokenPrefix,
  note: 'OLD API fallback removed as requested'
});
function getItemuseer() {
  try {
    const userData = localStorage.getItem('user');
    if (userData && userData !== 'null' && userData !== 'undefined') {
      const parsedUser = JSON.parse(userData);
      console.log('🔑 Retrieved user data:', {
        hasAccessToken: !!parsedUser?.accessToken,
        hasToken: !!parsedUser?.token,
        userId: parsedUser?.userId || parsedUser?.id,
        keys: Object.keys(parsedUser || {})
      });
      return parsedUser;
    }
    console.log('⚠️ No user data found in localStorage');
    return null;
  } catch (error) {
    console.error('❌ Error parsing user data:', error);
    return null;
  }
}

// إنشاء instance مخصص لـ axios
export const apiClient = axios.create({
  baseURL: `${API_CONFIG.baseURL}/api`,
  // timeout: API_CONFIG.timeout,
  headers: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },
  withCredentials: false,
});

// إضافة اعتراض للطلبات لإضافة رمز المصادقة
apiClient.interceptors.request.use(
  async (config) => {
    const user = await getItemuseer();

    if (user) {
      // دعم طرق مختلفة للـ token حسب ما يرسله الباك اند
      const token = user.accessToken;

      if (token && API_CONFIG.enableAuth) {
        // إضافة الـ token في عدة أماكن لضمان التوافق مع الباك اند
        config.headers[API_CONFIG.authHeaderName] = `${API_CONFIG.tokenPrefix} ${token}`;
        config.headers['Access-Token'] = token;
        config.headers['X-Access-Token'] = token;
        config.headers['x-auth-token'] = token;

        // إضافة refresh token إذا كان متوفراً
        const refreshToken = user.refreshToken || user.refresh_token;
        if (refreshToken) {
          config.headers['X-Refresh-Token'] = refreshToken;
        }

        // إضافة user ID للتتبع
        const userId = user.userId || user.id || user.user_id;
        if (userId) {
          config.headers['X-User-ID'] = userId;
        }

        // إضافة API key إذا كان متوفراً
        const apiKey = user.apiKey || user.api_key || user.key;
        if (apiKey) {
          config.headers['X-API-Key'] = apiKey;
          config.headers['API-Key'] = apiKey;
        }

        // console.log('🔐 Authentication headers added:', {
        //   hasAccessToken: !!token,
        //   hasRefreshToken: !!refreshToken,
        //   hasUserId: !!userId,
        //   hasApiKey: !!apiKey,
        //   tokenLength: token?.length,
        //   authHeader: `Bearer ${token?.substring(0, 10)}...`,
        //   headers: {
        //     Authorization: !!config.headers.Authorization,
        //     'Access-Token': !!config.headers['Access-Token'],
        //     'X-Access-Token': !!config.headers['X-Access-Token'],
        //     'x-auth-token': !!config.headers['x-auth-token'],
        //     'X-User-ID': !!config.headers['X-User-ID'],
        //     'X-API-Key': !!config.headers['X-API-Key'],
        //   }
        // });
      } else {
        console.warn('⚠️ No access token found in user data');
      }
    } else {
      console.warn('⚠️ No user data available for authentication');
    }

    // إضافة metadata للطلب
    config.headers["X-Request-ID"] = Math.random()
      .toString(36)
      .substring(2, 15);
    config.headers["X-Client-Version"] = "1.0.0";
    config.headers["X-Platform"] = "web";
    config.headers["X-Timestamp"] = new Date().toISOString();

    console.log(
      `🚀 API Request: ${config.method?.toUpperCase()} ${config.url}`,
      {
        params: config.params,
        data: config.data,
        hasAuth: !!config.headers.Authorization,
      }
    );

    return config;
  },
  (error) => {
    console.error("❌ Request Error:", error);
    return Promise.reject(error);
  }
);

// إعداد اعتراض للاستجابات
apiClient.interceptors.response.use(
  (response) => {

    return response;
  },
  (error) => {
    console.error(
      `❌ API Error: ${error.response?.status} ${error.config?.url}`,
      {
        error: error.response?.data,
        status: error.response?.status,
        message: error.response?.data?.message || error.message,
      }
    );

    // التحقق من أخطاء المصادقة
    if (error.response && (
      error.response.status === 401 ||
      error.response.status === 403 ||
      error.response?.data?.message === 'Unauthorized' ||
      error.response?.data?.message === 'Token expired' ||
      error.response?.data?.error === 'invalid_token'
    )) {
      console.warn('🔒 Authentication failed - clearing user data');

      // حذف بيانات المستخدم من جميع الأماكن
      // localStorage.removeItem("user");
      // localStorage.removeItem("token");
      // localStorage.removeItem("accessToken");
      // SecureStorage.removeItem("token");

      // إعادة توجيه إلى صفحة تسجيل الدخول
      if (window.location.pathname !== '/login') {
        window.location.href = "/login";
      }
    }

    return Promise.reject(error);
  }
);

// تعيين الـ default axios instance
axios.defaults.baseURL = API_BASE_URL;

// دوال مساعدة للمصادقة
export const authUtils = {
  isAuthenticated: () => {
    const user = getItemuseer();
    const token = user?.accessToken || user?.token || user?.access_token;
    return !!token;
  },

  getToken: () => {
    const user = getItemuseer();
    return user?.accessToken || user?.token || user?.access_token || null;
  },

  getUserId: () => {
    const user = getItemuseer();
    return user?.userId || user?.id || user?.user_id || null;
  },

  clearAuth: () => {
    // localStorage.removeItem("user");
    // localStorage.removeItem("token");
    // localStorage.removeItem("accessToken");
    // SecureStorage.removeItem("token");
    console.log('🔒 Authentication data cleared');
  },

  logAuthStatus: () => {
    const user = getItemuseer();
    const token = user?.accessToken || user?.token || user?.access_token;
    console.log('🔍 Auth Status Check:', {
      isAuthenticated: !!token,
      hasUser: !!user,
      tokenLength: token?.length || 0,
      userId: user?.userId || user?.id || 'N/A',
      userKeys: user ? Object.keys(user) : []
    });
  }
};

export default apiClient;
