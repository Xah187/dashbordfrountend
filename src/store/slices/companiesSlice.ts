import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Company, SubscriptionPlan, SubscriptionStatus } from '../../types';
import axios from 'axios';

interface CompaniesState {
  items: Company[];
  currentCompany: Company | null;
  isLoading: boolean;
  error: string | null;
}

const initialState: CompaniesState = {
  items: [],
  currentCompany: null,
  isLoading: false,
  error: null,
};

// Async thunks للتفاعل مع واجهة برمجة التطبيقات
export const fetchCompanies = createAsyncThunk(
  'companies/fetchAll',
  async (_, { rejectWithValue }) => {
    try {
      const response = await axios.get('/companies');
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في جلب الشركات');
    }
  }
);

export const fetchCompanyById = createAsyncThunk(
  'companies/fetchById',
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await axios.get(`/companies/${id}`);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في جلب الشركة');
    }
  }
);

export const createCompany = createAsyncThunk(
  'companies/create',
  async (company: Omit<Company, 'id' | 'createdAt'>, { rejectWithValue }) => {
    try {
      const response = await axios.post('/companies', company);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في إنشاء الشركة');
    }
  }
);

export const updateCompany = createAsyncThunk(
  'companies/update',
  async (company: Partial<Company> & { id: string }, { rejectWithValue }) => {
    try {
      const response = await axios.put(`/companies/${company.id}`, company);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في تحديث الشركة');
    }
  }
);

export const deleteCompany = createAsyncThunk(
  'companies/delete',
  async (id: string, { rejectWithValue }) => {
    try {
      await axios.delete(`/companies/${id}`);
      return id;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في حذف الشركة');
    }
  }
);

export const updateCompanyStatus = createAsyncThunk(
  'companies/updateStatus',
  async ({ id, isActive }: { id: string; isActive: boolean }, { rejectWithValue }) => {
    try {
      const response = await axios.patch(`/companies/${id}/status`, { isActive });
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في تحديث حالة الشركة');
    }
  }
);

export const updateCompanySubscription = createAsyncThunk(
  'companies/updateSubscription',
  async (
    {
      id,
      subscriptionData,
    }: {
      id: string;
      subscriptionData: {
        plan: SubscriptionPlan;
        startDate: string;
        endDate: string;
        status: SubscriptionStatus;
        price: number;
        autoRenew: boolean;
      };
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await axios.patch(`/companies/${id}/subscription`, subscriptionData);
      return response.data;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'فشل في تحديث اشتراك الشركة');
    }
  }
);

// إنشاء شريحة الشركات
const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    setCurrentCompany: (state, action: PayloadAction<Company | null>) => {
      state.currentCompany = action.payload;
    },
    resetCompaniesState: (state) => {
      return initialState;
    },
    sortCompanies: (state, action: PayloadAction<'name' | 'industry' | 'createdAt'>) => {
      const sortField = action.payload;
      if (sortField === 'name') {
        state.items.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sortField === 'industry') {
        state.items.sort((a, b) => a.industry.localeCompare(b.industry));
      } else if (sortField === 'createdAt') {
        state.items.sort((a, b) => {
          return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
        });
      }
    },
    filterCompaniesByStatus: (state, action: PayloadAction<'active' | 'inactive' | 'all'>) => {
      // عملية الفلترة تتم في الواجهة وليس في الحالة
      // هذا المخفض موجود للاكتمال فقط
    },
  },
  extraReducers: (builder) => {
    builder
      // fetchCompanies
      .addCase(fetchCompanies.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.items = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // fetchCompanyById
      .addCase(fetchCompanyById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchCompanyById.fulfilled, (state, action) => {
        state.currentCompany = action.payload;
        state.isLoading = false;
      })
      .addCase(fetchCompanyById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // createCompany
      .addCase(createCompany.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createCompany.fulfilled, (state, action) => {
        state.items.push(action.payload);
        state.isLoading = false;
      })
      .addCase(createCompany.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // updateCompany
      .addCase(updateCompany.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        const index = state.items.findIndex(company => company.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentCompany?.id === action.payload.id) {
          state.currentCompany = action.payload;
        }
        state.isLoading = false;
      })
      .addCase(updateCompany.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // deleteCompany
      .addCase(deleteCompany.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.items = state.items.filter(company => company.id !== action.payload);
        if (state.currentCompany?.id === action.payload) {
          state.currentCompany = null;
        }
        state.isLoading = false;
      })
      .addCase(deleteCompany.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      
      // updateCompanyStatus
      .addCase(updateCompanyStatus.fulfilled, (state, action) => {
        const index = state.items.findIndex(company => company.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentCompany?.id === action.payload.id) {
          state.currentCompany = action.payload;
        }
      })
      
      // updateCompanySubscription
      .addCase(updateCompanySubscription.fulfilled, (state, action) => {
        const index = state.items.findIndex(company => company.id === action.payload.id);
        if (index !== -1) {
          state.items[index] = action.payload;
        }
        if (state.currentCompany?.id === action.payload.id) {
          state.currentCompany = action.payload;
        }
      });
  },
});

export const {
  setCurrentCompany,
  resetCompaniesState,
  sortCompanies,
  filterCompaniesByStatus,
} = companiesSlice.actions;

export default companiesSlice.reducer;
