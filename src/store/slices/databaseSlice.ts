import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import {
  Company,
  CompanySub,
  CompanySubProject,
  StagesSub,
  UsersCompany,
  StageTemplate,
  CompanyWithSubs,
  CompanySubWithProjects,
  CompanySubProjectWithStages
} from '../../types/database';

// Async thunks for companies
export const fetchCompanies = createAsyncThunk(
  'database/fetchCompanies',
  async () => {
    const response = await fetch('/companies');
    return response.json();
  }
);

export const fetchCompanyDetails = createAsyncThunk(
  'database/fetchCompanyDetails',
  async (companyId: string) => {
    const response = await fetch(`/companies/${companyId}/details`);
    return response.json();
  }
);

export const createCompany = createAsyncThunk(
  'database/createCompany',
  async (companyData: Omit<Company, 'id' | 'createdAt' | 'updatedAt'>) => {
    const response = await fetch('/companies', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(companyData)
    });
    return response.json();
  }
);

export const updateCompany = createAsyncThunk(
  'database/updateCompany',
  async ({ id, data }: { id: string; data: Partial<Company> }) => {
    const response = await fetch(`/companies/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
);

export const deleteCompany = createAsyncThunk(
  'database/deleteCompany',
  async (companyId: string) => {
    await fetch(`/companies/${companyId}`, { method: 'DELETE' });
    return companyId;
  }
);

// Async thunks for company subs
export const fetchCompanySubs = createAsyncThunk(
  'database/fetchCompanySubs',
  async (companyId: string) => {
    const response = await fetch(`/companies/${companyId}/subs`);
    return response.json();
  }
);

export const createCompanySub = createAsyncThunk(
  'database/createCompanySub',
  async ({ companyId, subData }: { companyId: string; subData: Omit<CompanySub, 'id' | 'companyId' | 'createdAt' | 'updatedAt'> }) => {
    const response = await fetch(`/companies/${companyId}/subs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(subData)
    });
    return response.json();
  }
);

export const updateCompanySub = createAsyncThunk(
  'database/updateCompanySub',
  async ({ id, data }: { id: string; data: Partial<CompanySub> }) => {
    const response = await fetch(`/company-subs/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
);

export const deleteCompanySub = createAsyncThunk(
  'database/deleteCompanySub',
  async (subId: string) => {
    await fetch(`/company-subs/${subId}`, { method: 'DELETE' });
    return subId;
  }
);

// Async thunks for projects
export const fetchCompanySubProjects = createAsyncThunk(
  'database/fetchCompanySubProjects',
  async (subId: string) => {
    const response = await fetch(`/company-subs/${subId}/projects`);
    return response.json();
  }
);

export const createCompanySubProject = createAsyncThunk(
  'database/createCompanySubProject',
  async ({ subId, projectData }: { subId: string; projectData: Omit<CompanySubProject, 'id' | 'companySubId' | 'createdAt' | 'updatedAt'> }) => {
    const response = await fetch(`/company-subs/${subId}/projects`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(projectData)
    });
    return response.json();
  }
);

export const updateCompanySubProject = createAsyncThunk(
  'database/updateCompanySubProject',
  async ({ id, data }: { id: string; data: Partial<CompanySubProject> }) => {
    const response = await fetch(`/company-sub-projects/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
);

export const deleteCompanySubProject = createAsyncThunk(
  'database/deleteCompanySubProject',
  async (projectId: string) => {
    await fetch(`/company-sub-projects/${projectId}`, { method: 'DELETE' });
    return projectId;
  }
);

// Async thunks for stages
export const fetchProjectStages = createAsyncThunk(
  'database/fetchProjectStages',
  async (projectId: string) => {
    const response = await fetch(`/company-sub-projects/${projectId}/stages`);
    return response.json();
  }
);

export const createProjectStage = createAsyncThunk(
  'database/createProjectStage',
  async ({ projectId, stageData }: { projectId: string; stageData: Omit<StagesSub, 'id' | 'companySubProjectId' | 'createdAt' | 'updatedAt'> }) => {
    const response = await fetch(`/company-sub-projects/${projectId}/stages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(stageData)
    });
    return response.json();
  }
);

export const updateProjectStage = createAsyncThunk(
  'database/updateProjectStage',
  async ({ id, data }: { id: string; data: Partial<StagesSub> }) => {
    const response = await fetch(`/stages-sub/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    return response.json();
  }
);

export const deleteProjectStage = createAsyncThunk(
  'database/deleteProjectStage',
  async (stageId: string) => {
    await fetch(`/stages-sub/${stageId}`, { method: 'DELETE' });
    return stageId;
  }
);

// Async thunks for users
export const fetchCompanyUsers = createAsyncThunk(
  'database/fetchCompanyUsers',
  async (companyId: string) => {
    const response = await fetch(`/companies/${companyId}/users`);
    return response.json();
  }
);

export const addUserToCompany = createAsyncThunk(
  'database/addUserToCompany',
  async ({ companyId, userData }: { companyId: string; userData: Omit<UsersCompany, 'id' | 'companyId' | 'joinedAt'> }) => {
    const response = await fetch(`/companies/${companyId}/users`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(userData)
    });
    return response.json();
  }
);

// Async thunks for templates
export const fetchStageTemplates = createAsyncThunk(
  'database/fetchStageTemplates',
  async () => {
    const response = await fetch('/stage-templates');
    return response.json();
  }
);

export const applyTemplateToProject = createAsyncThunk(
  'database/applyTemplateToProject',
  async ({ projectId, templateId }: { projectId: string; templateId: string }) => {
    const response = await fetch(`/company-sub-projects/${projectId}/apply-template`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ templateId })
    });
    return response.json();
  }
);

interface DatabaseState {
  // Companies
  companies: Company[];
  currentCompany: CompanyWithSubs | null;
  
  // Company Subs
  companySubs: CompanySub[];
  currentCompanySub: CompanySubWithProjects | null;
  
  // Projects
  companySubProjects: CompanySubProject[];
  currentProject: CompanySubProjectWithStages | null;
  
  // Stages
  projectStages: StagesSub[];
  
  // Users
  companyUsers: UsersCompany[];
  
  // Templates
  stageTemplates: StageTemplate[];
  
  // UI state
  loading: {
    companies: boolean;
    companySubs: boolean;
    projects: boolean;
    stages: boolean;
    users: boolean;
    templates: boolean;
  };
  
  error: {
    companies: string | null;
    companySubs: string | null;
    projects: string | null;
    stages: string | null;
    users: string | null;
    templates: string | null;
  };
  
  selectedIds: {
    companyId: string | null;
    subId: string | null;
    projectId: string | null;
  };
}

const initialState: DatabaseState = {
  companies: [],
  currentCompany: null,
  companySubs: [],
  currentCompanySub: null,
  companySubProjects: [],
  currentProject: null,
  projectStages: [],
  companyUsers: [],
  stageTemplates: [],
  loading: {
    companies: false,
    companySubs: false,
    projects: false,
    stages: false,
    users: false,
    templates: false,
  },
  error: {
    companies: null,
    companySubs: null,
    projects: null,
    stages: null,
    users: null,
    templates: null,
  },
  selectedIds: {
    companyId: null,
    subId: null,
    projectId: null,
  },
};

const databaseSlice = createSlice({
  name: 'database',
  initialState,
  reducers: {
    setSelectedCompanyId: (state, action: PayloadAction<string | null>) => {
      state.selectedIds.companyId = action.payload;
      if (!action.payload) {
        state.selectedIds.subId = null;
        state.selectedIds.projectId = null;
      }
    },
    setSelectedSubId: (state, action: PayloadAction<string | null>) => {
      state.selectedIds.subId = action.payload;
      if (!action.payload) {
        state.selectedIds.projectId = null;
      }
    },
    setSelectedProjectId: (state, action: PayloadAction<string | null>) => {
      state.selectedIds.projectId = action.payload;
    },
    clearErrors: (state) => {
      state.error = {
        companies: null,
        companySubs: null,
        projects: null,
        stages: null,
        users: null,
        templates: null,
      };
    },
  },
  extraReducers: (builder) => {
    // Companies
    builder
      .addCase(fetchCompanies.pending, (state) => {
        state.loading.companies = true;
        state.error.companies = null;
      })
      .addCase(fetchCompanies.fulfilled, (state, action) => {
        state.loading.companies = false;
        state.companies = action.payload;
      })
      .addCase(fetchCompanies.rejected, (state, action) => {
        state.loading.companies = false;
        state.error.companies = action.error.message || 'خطأ في تحميل الشركات';
      })
      
      .addCase(fetchCompanyDetails.pending, (state) => {
        state.loading.companies = true;
      })
      .addCase(fetchCompanyDetails.fulfilled, (state, action) => {
        state.loading.companies = false;
        state.currentCompany = action.payload;
      })
      
      .addCase(createCompany.fulfilled, (state, action) => {
        state.companies.push(action.payload);
      })
      
      .addCase(updateCompany.fulfilled, (state, action) => {
        const index = state.companies.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.companies[index] = action.payload;
        }
      })
      
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.companies = state.companies.filter(c => c.id !== action.payload);
      });

    // Company Subs
    builder
      .addCase(fetchCompanySubs.pending, (state) => {
        state.loading.companySubs = true;
        state.error.companySubs = null;
      })
      .addCase(fetchCompanySubs.fulfilled, (state, action) => {
        state.loading.companySubs = false;
        state.companySubs = action.payload;
      })
      .addCase(fetchCompanySubs.rejected, (state, action) => {
        state.loading.companySubs = false;
        state.error.companySubs = action.error.message || 'خطأ في تحميل الفروع';
      })
      
      .addCase(createCompanySub.fulfilled, (state, action) => {
        state.companySubs.push(action.payload);
      })
      
      .addCase(updateCompanySub.fulfilled, (state, action) => {
        const index = state.companySubs.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.companySubs[index] = action.payload;
        }
      })
      
      .addCase(deleteCompanySub.fulfilled, (state, action) => {
        state.companySubs = state.companySubs.filter(s => s.id !== action.payload);
      });

    // Projects
    builder
      .addCase(fetchCompanySubProjects.pending, (state) => {
        state.loading.projects = true;
        state.error.projects = null;
      })
      .addCase(fetchCompanySubProjects.fulfilled, (state, action) => {
        state.loading.projects = false;
        state.companySubProjects = action.payload;
      })
      .addCase(fetchCompanySubProjects.rejected, (state, action) => {
        state.loading.projects = false;
        state.error.projects = action.error.message || 'خطأ في تحميل المشاريع';
      })
      
      .addCase(createCompanySubProject.fulfilled, (state, action) => {
        state.companySubProjects.push(action.payload);
      })
      
      .addCase(updateCompanySubProject.fulfilled, (state, action) => {
        const index = state.companySubProjects.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.companySubProjects[index] = action.payload;
        }
      })
      
      .addCase(deleteCompanySubProject.fulfilled, (state, action) => {
        state.companySubProjects = state.companySubProjects.filter(p => p.id !== action.payload);
      });

    // Stages
    builder
      .addCase(fetchProjectStages.pending, (state) => {
        state.loading.stages = true;
        state.error.stages = null;
      })
      .addCase(fetchProjectStages.fulfilled, (state, action) => {
        state.loading.stages = false;
        state.projectStages = action.payload;
      })
      .addCase(fetchProjectStages.rejected, (state, action) => {
        state.loading.stages = false;
        state.error.stages = action.error.message || 'خطأ في تحميل المراحل';
      })
      
      .addCase(createProjectStage.fulfilled, (state, action) => {
        state.projectStages.push(action.payload);
      })
      
      .addCase(updateProjectStage.fulfilled, (state, action) => {
        const index = state.projectStages.findIndex(s => s.id === action.payload.id);
        if (index !== -1) {
          state.projectStages[index] = action.payload;
        }
      })
      
      .addCase(deleteProjectStage.fulfilled, (state, action) => {
        state.projectStages = state.projectStages.filter(s => s.id !== action.payload);
      })
      
      .addCase(applyTemplateToProject.fulfilled, (state, action) => {
        state.projectStages = action.payload;
      });

    // Users
    builder
      .addCase(fetchCompanyUsers.pending, (state) => {
        state.loading.users = true;
        state.error.users = null;
      })
      .addCase(fetchCompanyUsers.fulfilled, (state, action) => {
        state.loading.users = false;
        state.companyUsers = action.payload;
      })
      .addCase(fetchCompanyUsers.rejected, (state, action) => {
        state.loading.users = false;
        state.error.users = action.error.message || 'خطأ في تحميل المستخدمين';
      })
      
      .addCase(addUserToCompany.fulfilled, (state, action) => {
        state.companyUsers.push(action.payload);
      });

    // Templates
    builder
      .addCase(fetchStageTemplates.pending, (state) => {
        state.loading.templates = true;
        state.error.templates = null;
      })
      .addCase(fetchStageTemplates.fulfilled, (state, action) => {
        state.loading.templates = false;
        state.stageTemplates = action.payload;
      })
      .addCase(fetchStageTemplates.rejected, (state, action) => {
        state.loading.templates = false;
        state.error.templates = action.error.message || 'خطأ في تحميل القوالب';
      });
  },
});

export const {
  setSelectedCompanyId,
  setSelectedSubId,
  setSelectedProjectId,
  clearErrors,
} = databaseSlice.actions;

// Selectors
export const selectCompanies = (state: { database: DatabaseState }) => state.database.companies;
export const selectCurrentCompany = (state: { database: DatabaseState }) => state.database.currentCompany;
export const selectCompanySubs = (state: { database: DatabaseState }) => state.database.companySubs;
export const selectCompanySubProjects = (state: { database: DatabaseState }) => state.database.companySubProjects;
export const selectProjectStages = (state: { database: DatabaseState }) => state.database.projectStages;
export const selectCompanyUsers = (state: { database: DatabaseState }) => state.database.companyUsers;
export const selectStageTemplates = (state: { database: DatabaseState }) => state.database.stageTemplates;
export const selectSelectedIds = (state: { database: DatabaseState }) => state.database.selectedIds;
export const selectLoading = (state: { database: DatabaseState }) => state.database.loading;
export const selectErrors = (state: { database: DatabaseState }) => state.database.error;

export default databaseSlice.reducer; 