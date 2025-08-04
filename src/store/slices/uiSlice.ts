import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import SecureStorage from '../../utils/secureStorage';
import Logger from '../../utils/logger';

interface UIState {
  sidebarOpen: boolean;
  darkMode: boolean;
  isMobileView: boolean;
  currentPage: string;
  loading: {
    [key: string]: boolean;
  };
  notification: {
    open: boolean;
    message: string;
    type: 'success' | 'error' | 'info' | 'warning' | null;
  };
  confirmDialog: {
    open: boolean;
    title: string;
    message: string;
    confirmText: string;
    cancelText: string;
    confirmAction: string | null;
    data: any;
  };
}

// قم باسترجاع حالة الألوان الداكنة، مع مراعاة أن البيانات قد تكون محفوظة في localStorage أيضاً
const getDarkModePreference = (): boolean => {
  // محاولة استرجاع الإعداد من SecureStorage
  const secureValue = SecureStorage.getItem<boolean | string>('darkMode');
  if (secureValue !== null) {
    // إذا كانت القيمة نصية، قم بتحويلها إلى boolean
    return typeof secureValue === 'string' ? secureValue === 'true' : secureValue;
  }
  
  // محاولة استرجاع الإعداد من localStorage للتوافق مع البيانات القديمة
  const legacyValue = localStorage.getItem('darkMode');
  if (legacyValue !== null) {
    // نقل البيانات القديمة إلى التخزين الآمن
    const parsedValue = legacyValue === 'true';
    SecureStorage.setItem('darkMode', parsedValue);
    // إزالة البيانات القديمة
    localStorage.removeItem('darkMode');
    return parsedValue;
  }
  
  // القيمة الافتراضية
  return false;
};

const initialState: UIState = {
  sidebarOpen: true,
  darkMode: getDarkModePreference(),
  isMobileView: window.innerWidth < 768,
  currentPage: '/',
  loading: {},
  notification: {
    open: false,
    message: '',
    type: null,
  },
  confirmDialog: {
    open: false,
    title: '',
    message: '',
    confirmText: 'تأكيد',
    cancelText: 'إلغاء',
    confirmAction: null,
    data: null,
  },
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    toggleDarkMode: (state) => {
      const newDarkMode = !state.darkMode;
      try {
        SecureStorage.setItem('darkMode', newDarkMode);
        Logger.info('تم تحديث وضع الألوان الداكنة:', newDarkMode);
      } catch (error) {
        Logger.error('خطأ في حفظ وضع الألوان الداكنة:', error);
      }
      state.darkMode = newDarkMode;
    },
    setDarkMode: (state, action: PayloadAction<boolean>) => {
      try {
        SecureStorage.setItem('darkMode', action.payload);
        Logger.info('تم تعيين وضع الألوان الداكنة:', action.payload);
      } catch (error) {
        Logger.error('خطأ في تعيين وضع الألوان الداكنة:', error);
      }
      state.darkMode = action.payload;
    },
    setIsMobileView: (state, action: PayloadAction<boolean>) => {
      state.isMobileView = action.payload;
      if (action.payload) {
        state.sidebarOpen = false;
      }
    },
    setCurrentPage: (state, action: PayloadAction<string>) => {
      state.currentPage = action.payload;
    },
    setLoading: (state, action: PayloadAction<{ key: string; isLoading: boolean }>) => {
      state.loading[action.payload.key] = action.payload.isLoading;
    },
    showNotification: (
      state,
      action: PayloadAction<{ message: string; type: 'success' | 'error' | 'info' | 'warning' }>
    ) => {
      state.notification = {
        open: true,
        message: action.payload.message,
        type: action.payload.type,
      };
    },
    hideNotification: (state) => {
      state.notification.open = false;
    },
    showConfirmDialog: (
      state,
      action: PayloadAction<{
        title: string;
        message: string;
        confirmText?: string;
        cancelText?: string;
        confirmAction: string;
        data?: any;
      }>
    ) => {
      state.confirmDialog = {
        open: true,
        title: action.payload.title,
        message: action.payload.message,
        confirmText: action.payload.confirmText || 'تأكيد',
        cancelText: action.payload.cancelText || 'إلغاء',
        confirmAction: action.payload.confirmAction,
        data: action.payload.data || null,
      };
    },
    hideConfirmDialog: (state) => {
      state.confirmDialog.open = false;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  toggleDarkMode,
  setDarkMode,
  setIsMobileView,
  setCurrentPage,
  setLoading,
  showNotification,
  hideNotification,
  showConfirmDialog,
  hideConfirmDialog,
} = uiSlice.actions;

export default uiSlice.reducer;
