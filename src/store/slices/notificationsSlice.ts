import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Notification, NotificationType } from '../../types';
import axios from 'axios';

interface NotificationsState {
  items: Notification[];
  unreadCount: number;
  isLoading: boolean;
  error: string | null;
}

const initialState: NotificationsState = {
  items: [],
  unreadCount: 0,
  isLoading: false,
  error: null,
};

// Async thunks للتفاعل مع واجهة برمجة التطبيقات
export const fetchNotifications = createAsyncThunk(
  'notifications/fetchAll',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/users/${userId}/notifications`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في جلب الإشعارات');
    }
  }
);

export const markNotificationAsRead = createAsyncThunk(
  'notifications/markAsRead',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/notifications/${notificationId}/read`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في تحديث حالة الإشعار');
    }
  }
);

export const markAllNotificationsAsRead = createAsyncThunk(
  'notifications/markAllAsRead',
  async (userId: string, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/users/${userId}/notifications/read-all`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في تحديث حالة الإشعارات');
    }
  }
);

export const deleteNotification = createAsyncThunk(
  'notifications/delete',
  async (notificationId: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/notifications/${notificationId}`);
      return notificationId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في حذف الإشعار');
    }
  }
);

export const deleteAllNotifications = createAsyncThunk(
  'notifications/deleteAll',
  async (userId: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/users/${userId}/notifications`);
      return userId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في حذف الإشعارات');
    }
  }
);

// إنشاء شريحة الإشعارات
const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Notification>) => {
      state.items.unshift(action.payload);
      if (!action.payload.isRead) {
        state.unreadCount += 1;
      }
    },
    resetNotificationsState: (state) => {
      return initialState;
    },
    sortNotifications: (state, action: PayloadAction<'createdAt' | 'type'>) => {
      const sortField = action.payload;
      if (sortField === 'createdAt') {
        state.items.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      } else if (sortField === 'type') {
        state.items.sort((a, b) => a.type.localeCompare(b.type));
      }
    },
    filterNotificationsByType: (state, action: PayloadAction<NotificationType | 'all'>) => {
      // عملية الفلترة تتم في الواجهة وليس في الحالة
      // هذا المخفض موجود للاكتمال فقط
    },
    updateUnreadCount: (state) => {
      state.unreadCount = state.items.filter(notification => !notification.isRead).length;
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchNotifications
      .addCase(fetchNotifications.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        state.items = action.payload;
        state.unreadCount = action.payload.filter((notification: Notification) => !notification.isRead).length;
        state.isLoading = false;
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // markNotificationAsRead
      .addCase(markNotificationAsRead.fulfilled, (state, action) => {
        const index = state.items.findIndex(notification => notification.id === action.payload.id);
        if (index !== -1) {
          const wasUnread = !state.items[index].isRead;
          state.items[index] = action.payload;
          
          if (wasUnread && action.payload.isRead) {
            state.unreadCount = Math.max(0, state.unreadCount - 1);
          }
        }
      })
      
      // markAllNotificationsAsRead
      .addCase(markAllNotificationsAsRead.fulfilled, (state, action) => {
        state.items = state.items.map(notification => ({
          ...notification,
          isRead: true
        }));
        state.unreadCount = 0;
      })
      
      // deleteNotification
      .addCase(deleteNotification.fulfilled, (state, action) => {
        const deletedNotification = state.items.find(notification => notification.id === action.payload);
        state.items = state.items.filter(notification => notification.id !== action.payload);
        
        if (deletedNotification && !deletedNotification.isRead) {
          state.unreadCount = Math.max(0, state.unreadCount - 1);
        }
      })
      
      // deleteAllNotifications
      .addCase(deleteAllNotifications.fulfilled, (state) => {
        state.items = [];
        state.unreadCount = 0;
      });
  },
});

export const {
  addNotification,
  resetNotificationsState,
  sortNotifications,
  filterNotificationsByType,
  updateUnreadCount,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;
