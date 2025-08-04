import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User } from '../../types';
import axios from 'axios';
import SecureStorage from '../../utils/secureStorage';
import Logger from '../../utils/logger';

interface AuthState {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  error: string | null;
  twoFactorRequired: boolean;
  token: string | null;
}

const initialState: AuthState = {
  isAuthenticated: false,
  user: null,
  loading: false,
  error: null,
  twoFactorRequired: false,
  token: SecureStorage.getItem<string>('token'),
};

// إجراءات Async لعمليات المصادقة
export const login = createAsyncThunk(
  'auth/login',
  async (credentials: { email: string; password: string }, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/login', credentials);
      // حفظ رمز المصادقة إذا تم توفيره
      if (response.data.token) {
        SecureStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل تسجيل الدخول');
    }
  }
);

export const logout = createAsyncThunk('auth/logout', async (_, { rejectWithValue }) => {
  try {
    // يمكن إضافة طلب لإنهاء الجلسة على الخادم
    await axios.post('/auth/logout');
    SecureStorage.removeItem('token');
    return null;
  } catch (error: any) {
    return rejectWithValue(error.response?.data?.message || 'فشل تسجيل الخروج');
  }
});

export const verifyTwoFactor = createAsyncThunk(
  'auth/verifyTwoFactor',
  async (code: string, { rejectWithValue }) => {
    try {
      const response = await axios.post('/auth/verify-2fa', { code });
      if (response.data.token) {
        SecureStorage.setItem('token', response.data.token);
      }
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل التحقق من الرمز');
    }
  }
);

export const getUserProfile = createAsyncThunk(
  'auth/getUserProfile',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/auth/profile');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل جلب بيانات المستخدم');
    }
  }
);

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<{ isAuthenticated: boolean; user?: User }>) => {
      state.isAuthenticated = action.payload.isAuthenticated;
      if (action.payload.user) {
        state.user = action.payload.user;
      }
    },
    clearErrors: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // معالجة عملية تسجيل الدخول
      .addCase(login.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(login.fulfilled, (state, action) => {
        state.loading = false;
        if (action.payload.twoFactorRequired) {
          state.twoFactorRequired = true;
        } else {
          state.isAuthenticated = true;
          state.user = action.payload.user;
          state.token = action.payload.token;
        }
      })
      .addCase(login.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // معالجة عملية تسجيل الخروج
      .addCase(logout.fulfilled, (state) => {
        state.isAuthenticated = false;
        state.user = null;
        state.token = null;
        state.twoFactorRequired = false;
      })
      
      // معالجة التحقق من التحقق الثنائي
      .addCase(verifyTwoFactor.pending, (state) => {
        state.loading = true;
      })
      .addCase(verifyTwoFactor.fulfilled, (state, action) => {
        state.loading = false;
        state.twoFactorRequired = false;
        state.isAuthenticated = true;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(verifyTwoFactor.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // معالجة جلب بيانات المستخدم
      .addCase(getUserProfile.pending, (state) => {
        state.loading = true;
      })
      .addCase(getUserProfile.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
      })
      .addCase(getUserProfile.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        // إذا فشل جلب الملف الشخصي، قد يكون رمز المصادقة غير صالح
        if ((action.payload as string).includes('غير مصرح')) {
          state.isAuthenticated = false;
          state.token = null;
          SecureStorage.removeItem('token');
        }
      });
  },
});

export const { setAuth, clearErrors } = authSlice.actions;
export default authSlice.reducer;
