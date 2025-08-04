import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { User, UserRole, Permission } from '../../types';
import axios from 'axios';

interface UsersState {
  items: User[];
  currentUser: User | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: UsersState = {
  items: [],
  currentUser: null,
  isLoading: false,
  error: null,
};

// Async thunks للتفاعل مع واجهة برمجة التطبيقات
export const fetchUsers = createAsyncThunk(
  'users/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/users');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في جلب المستخدمين');
    }
  }
);

export const fetchUserById = createAsyncThunk(
  'users/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/users/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في جلب المستخدم');
    }
  }
);

export const createUser = createAsyncThunk(
  'users/create',
  async (user: Omit<User, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const response = await axios.post('/users', user);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في إنشاء المستخدم');
    }
  }
);

export const updateUser = createAsyncThunk(
  'users/update',
  async (user: Partial<User> & { id: string }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/users/${user.id}`, user);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في تحديث المستخدم');
    }
  }
);

export const deleteUser = createAsyncThunk(
  'users/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/users/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في حذف المستخدم');
    }
  }
);

export const updateUserStatus = createAsyncThunk(
  'users/updateStatus',
  async ({ id, isActive }: { id: string; isActive: boolean }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/users/${id}/status`, { isActive });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في تحديث حالة المستخدم');
    }
  }
);

export const updateUserPermissions = createAsyncThunk(
  'users/updatePermissions',
  async ({ id, permissions }: { id: string; permissions: Permission[] }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/users/${id}/permissions`, { permissions });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في تحديث صلاحيات المستخدم');
    }
  }
);

// إنشاء شريحة المستخدمين
const usersSlice = createSlice({
  name: 'users',
  initialState,
  reducers: {
    setCurrentUser: (state, action: PayloadAction<User | null>) => {
      state.currentUser = action.payload;
    },
    resetUsersState: (state) => {
      return initialState;
    },
    sortUsers: (state, action: PayloadAction<'name' | 'role' | 'lastLogin'>) => {
      const sortField = action.payload;
      if (sortField === 'name') {
        state.items.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortField === 'role') {
        state.items.sort((a, b) => a.role.localeCompare(b.role));
      } else if (sortField === 'lastLogin') {
        state.items.sort((a, b) => {
          if (!a.lastLogin) return 1;
          if (!b.lastLogin) return -1;
          return new Date(b.lastLogin).getTime() - new Date(a.lastLogin).getTime();
        });
      }
    },
    filterUsersByRole: (state, action: PayloadAction<UserRole | 'all'>) => {
      // عملية الفلترة تتم في الواجهة وليس في الحالة
      // هذا المخفض موجود للاكتمال فقط
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchUsers
      .addCase(fetchUsers.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUsers.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchUsers.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // fetchUserById
      .addCase(fetchUserById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchUserById.fulfilled, (state, action) => {
        state.currentUser = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchUserById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // createUser
      .addCase(createUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createUser.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.isLoading = false;
      })
      .addCase(createUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // updateUser
      .addCase(updateUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateUser.fulfilled, (state, action) => {
        const index = state.items.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
        state.isLoading = false;
      })
      .addCase(updateUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // deleteUser
      .addCase(deleteUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteUser.fulfilled, (state, action) => {
        state.items = state.items.filter(user => user.id !== action.payload);
        if (state.currentUser?.id === action.payload) {
          state.currentUser = null;
        }
        state.isLoading = false;
      })
      .addCase(deleteUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // updateUserStatus
      .addCase(updateUserStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
      })
      
      // updateUserPermissions
      .addCase(updateUserPermissions.fulfilled, (state, action) => {
        const index = state.items.findIndex(user => user.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentUser?.id === action.payload.id) {
          state.currentUser = action.payload;
        }
      });
  },
});

export const { setCurrentUser, resetUsersState, sortUsers, filterUsersByRole } = usersSlice.actions;

export default usersSlice.reducer;
