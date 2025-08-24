
import { apiClient } from "./config";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Company,
  CompanySub,
  CompanySubProject,
  UsersCompany,
  StagesSub,
  StageTemplate,
  StagesTemplate,
  CompanyWithSubs,
  CompanySubWithProjects,
  CompanySubProjectWithStages,
  TemplateWithStages,
  Employee,
  EmployeesResponse,
  EmployeeStatsResponse,
} from "../types/database";

// نوع الاستجابة من الباك إند
interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
  code?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    lastId?: number;
    hasNext?: boolean;
  };
}

// نوع للتحكم في pagination
export interface PaginationParams {
  limit?: number;
  lastId?: string | number;
  page?: number;
}

// =========================
// COMPANIES APIs
// =========================

/**
 * جلب الشركات مع pagination حقيقي (10 عناصر لكل طلب)
 */
export const fetchCompanies = async (params: PaginationParams = {}): Promise<{companies: Company[], pagination?: any, hasMore?: boolean}> => {
  const { limit = 10, lastId = 0, page = 1 } = params;
  
  // تجربة نهج مختلف: استخدام page-based pagination بدلاً من cursor-based
  // لأن الباك إند قد لا يدعم cursor-based pagination بشكل صحيح
  
  const queryParams = new URLSearchParams();
  queryParams.append('page', page.toString());
  queryParams.append('limit', limit.toString());
  
  console.log(`🔍 Fetching companies with page-based pagination:`, { limit, page, lastId });
  console.log(`📡 Full URL: /companies?${queryParams.toString()}`);
  console.log(`📊 Logic: Using page=${page} instead of cursor-based`);
  
  try {
    const response = await apiClient.get<ApiResponse<Company[]>>(`/companies?${queryParams.toString()}`);
    console.log(`📊 Companies response:`, response.data);
    console.log(`📊 Response data length:`, response.data?.data?.length);
    console.log(`📊 Companies IDs in response:`, response.data?.data?.map(c => c.id) || []);
    
    if (response.data.success || (response.data as any).masseg === "sucssfuly") {
      const companies = response.data.data || [];
      const totalCompanies = (response.data as any).countcompany || 0;
      const totalPages = Math.ceil(totalCompanies / limit);
      const hasMore = page < totalPages; // إذا كان هناك صفحات أكثر
      
      console.log(`✅ Returning ${companies.length} companies, hasMore: ${hasMore}`);
      console.log(`✅ Companies IDs:`, companies.map(c => c.id));
      console.log(`✅ Page ${page} of ${totalPages} (total: ${totalCompanies})`);
      
      return {
        companies,
        pagination: { currentPage: page, totalPages, totalItems: totalCompanies },
        hasMore
      };
    } else {
      console.error(`❌ API returned error:`, response.data.error || response.data.message);
      return { companies: [], hasMore: false };
    }
  } catch (error) {
    console.error(`💥 Error fetching companies:`, error);
    return { companies: [], hasMore: false };
  }
};

/**
 * جلب شركة واحدة مع تفاصيلها
 */
export const fetchCompanyWithDetails = async (companyId: string): Promise<Company | null> => {
  console.log(`🔍 Fetching company details for ID: ${companyId}`);
  const response = await apiClient.get<ApiResponse<Company>>(`/companies/${companyId}`);
  console.log(`📊 Company details response:`, response.data);
  return response.data.success ? response.data.data || null : null;
};

/**
 * إنشاء شركة جديدة
 */
export const createCompany = async (
  companyData: Omit<Company, "id" | "createdAt" | "updatedAt">
): Promise<Company> => {
  const response = await apiClient.post<ApiResponse<Company>>(
    "/companies",
    companyData
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "فشل في إنشاء الشركة");
  }
  return response.data.data;
};

/**
 * تحديث شركة
 */
export const updateCompany = async (
  companyId: string,
  companyData: Partial<Company>
): Promise<Company> => {
  const response = await apiClient.put<ApiResponse<Company>>(
    `/companies/${companyId}`,
    companyData
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "فشل في تحديث الشركة");
  }
  return response.data.data;
};

/**
 * حذف شركة
 */
export const deleteCompany = async (
  companyId: string
): Promise<{ message: string }> => {
  const response = await apiClient.delete<ApiResponse<any>>(
    `/companies/${companyId}`
  );
  if (!response.data.success) {
    throw new Error(response.data.error || "فشل في حذف الشركة");
  }
  return { message: response.data.message || "تم حذف الشركة بنجاح" };
};

// =========================
// COMPANY SUBS (الفروع) APIs
// =========================

/**
 * جلب فروع الشركة مع pagination حقيقي (10 عناصر لكل طلب)
 */
export const fetchCompanySubs = async (
  companyId: string,
  params: PaginationParams = {}
): Promise<{subs: CompanySub[], pagination?: any, hasMore?: boolean}> => {
  const { limit = 10, lastId = 0 } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.append('number', lastId.toString());
  queryParams.append('limit', limit.toString());
  
  console.log(`🔍 Fetching company subs for companyId: ${companyId} with params:`, { limit, lastId });
  
  const response = await apiClient.get<ApiResponse<CompanySub[]>>(
    `/companies/${companyId}/subs?${queryParams}`
  );
  console.log(`📊 Company subs response:`, response.data);
  
  if (response.data.success) {
    const subs = response.data.data || [];
    const hasMore = subs.length === limit;
    
    return {
      subs,
      pagination: response.data.pagination,
      hasMore
    };
  }
  
  return { subs: [], hasMore: false };
};

/**
 * جلب فرع محدد مع المشاريع
 */
export const fetchCompanySubWithProjects = async (
  subId: string
): Promise<CompanySubWithProjects> => {
  const response = await apiClient.get<ApiResponse<CompanySubWithProjects>>(
    `/company-subs/${subId}/projects`
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "فشل في جلب تفاصيل الفرع");
  }
  return response.data.data;
};

/**
 * إنشاء فرع جديد
 */
export const createCompanySub = async (
  companyId: string,
  subData: Omit<CompanySub, "id" | "companyId" | "createdAt" | "updatedAt">
): Promise<CompanySub> => {
  const response = await apiClient.post<ApiResponse<CompanySub>>(
    `/companies/${companyId}/subs`,
    subData
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "فشل في إنشاء الفرع");
  }
  return response.data.data;
};

/**
 * تحديث فرع
 */
export const updateCompanySub = async (
  subId: string,
  subData: Partial<CompanySub>
): Promise<CompanySub> => {
  // تحويل البيانات إلى تنسيق قاعدة البيانات
  const dbData = {
    NameSub: subData.name,
    BranchAddress: subData.address,
    Email: subData.email,
    PhoneNumber: subData.phone,
  };

  const response = await apiClient.put<ApiResponse<CompanySub>>(
    `/company-sub/${subId}`,
    dbData
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "فشل في تحديث الفرع");
  }
  return response.data.data;
};

/**
 * حذف فرع
 */
export const deleteCompanySub = async (
  subId: string
): Promise<{ message: string }> => {
  const response = await apiClient.delete<ApiResponse<any>>(
    `/company-sub/${subId}`
  );
  if (!response.data.success) {
    throw new Error(response.data.error || "فشل في حذف الفرع");
  }
  return { message: response.data.message || "تم حذف الفرع بنجاح" };
};

// =========================
// COMPANY SUB PROJECTS APIs
// =========================

/**
 * جلب مشاريع الفرع مع pagination حقيقي (10 عناصر لكل طلب)
 */
export const fetchCompanySubProjects = async (
  subId: string,
  params: PaginationParams = {}
): Promise<{projects: CompanySubProject[], pagination?: any, hasMore?: boolean}> => {

  
  if (!subId || subId === "" || subId === "undefined" || subId === "null") {
    return { projects: [], hasMore: false };
  }
  
  const { limit = 10, lastId = 0 } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.append('number', lastId.toString());
  queryParams.append('limit', limit.toString());
  

  
  try {
    const response = await apiClient.get<ApiResponse<CompanySubProject[]>>(
      `/companies/subs/${subId}/projects?${queryParams}`
    );
    
    if (response.data.success && response.data.data && Array.isArray(response.data.data)) {
      const projects = response.data.data;
      const hasMore = projects.length === limit;
      
      return {
        projects,
        pagination: response.data.pagination,
        hasMore
      };
    } else {
      return { projects: [], hasMore: false };
    }
    
  } catch (error: any) {
    return { projects: [], hasMore: false };
  }
};

/**
 * البحث في المشاريع - API جديد
 */
export const searchProjects = async (
  subId: string,
  searchTerm: string,
  params: PaginationParams = {}
): Promise<{projects: CompanySubProject[], pagination?: any}> => {
  const { limit = 10, lastId = 0 } = params;
  

  
  const queryParams = new URLSearchParams();
  queryParams.append('number', lastId.toString());
  queryParams.append('limit', limit.toString());
  queryParams.append('search', searchTerm);
  
  try {
    const response = await apiClient.get<ApiResponse<CompanySubProject[]>>(
      `/companies/subs/${subId}/projects/search?${queryParams}`
    );
    
    if (response.data.success && response.data.data && Array.isArray(response.data.data)) {
      return {
        projects: response.data.data,
        pagination: response.data.pagination
      };
    } else {
      return { projects: [] };
    }
    
  } catch (error: any) {
    return { projects: [] };
  }
};

/**
 * جلب مشروع محدد مع المراحل
 */
export const fetchProjectWithStages = async (
  projectId: string
): Promise<CompanySubProjectWithStages> => {
  const response = await apiClient.get<
    ApiResponse<CompanySubProjectWithStages>
  >(`/company-sub-projects/${projectId}/stages`);
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "فشل في جلب تفاصيل المشروع");
  }
  return response.data.data;
};

/**
 * إنشاء مشروع جديد
 */
export const createCompanySubProject = async (
  subId: string,
  projectData: Omit<
    CompanySubProject,
    "id" | "companySubId" | "createdAt" | "updatedAt"
  >
): Promise<CompanySubProject> => {
  const response = await apiClient.post<ApiResponse<CompanySubProject>>(
    `/company-subs/${subId}/projects`,
    projectData
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "فشل في إنشاء المشروع");
  }
  return response.data.data;
};

/**
 * تحديث مشروع
 */
export const updateCompanySubProject = async (
  projectId: string,
  projectData: Partial<CompanySubProject>
): Promise<CompanySubProject> => {
  const response = await apiClient.put<ApiResponse<CompanySubProject>>(
    `/company-sub-projects/${projectId}`,
    projectData
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "فشل في تحديث المشروع");
  }
  return response.data.data;
};

/**
 * حذف مشروع
 */
export const deleteCompanySubProject = async (
  projectId: string
): Promise<{ message: string }> => {
  const response = await apiClient.delete<ApiResponse<any>>(
    `/company-sub-projects/${projectId}`
  );
  if (!response.data.success) {
    throw new Error(response.data.error || "فشل في حذف المشروع");
  }
  return { message: response.data.message || "تم حذف المشروع بنجاح" };
};

// =========================
// USERS COMPANY APIs
// =========================

/**
 * جلب مستخدمي شركة محددة
 */
export const fetchCompanyUsers = async (
  companyId: string
): Promise<UsersCompany[]> => {
  const response = await apiClient.get<ApiResponse<UsersCompany[]>>(
    `/users-company/by-company/${companyId}`
  );
  return response.data.success ? response.data.data || [] : [];
};

/**
 * إضافة مستخدم لشركة
 */
export const addUserToCompany = async (
  companyId: string,
  userData: Omit<UsersCompany, "id" | "companyId" | "joinedAt">
): Promise<UsersCompany> => {
  const response = await apiClient.post<ApiResponse<UsersCompany>>(
    `/companies/${companyId}/users`,
    userData
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "فشل في إضافة المستخدم للشركة");
  }
  return response.data.data;
};

/**
 * تحديث دور مستخدم في الشركة
 */
export const updateUserCompanyRole = async (
  userCompanyId: string,
  roleData: Partial<UsersCompany>
): Promise<UsersCompany> => {
  const response = await apiClient.put<ApiResponse<UsersCompany>>(
    `/users-company/${userCompanyId}`,
    roleData
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "فشل في تحديث دور المستخدم");
  }
  return response.data.data;
};

/**
 * إزالة مستخدم من الشركة
 */
export const removeUserFromCompany = async (
  userCompanyId: string
): Promise<{ message: string }> => {
  const response = await apiClient.delete<ApiResponse<any>>(
    `/users-company/${userCompanyId}`
  );
  if (!response.data.success) {
    throw new Error(response.data.error || "فشل في إزالة المستخدم من الشركة");
  }
  return {
    message: response.data.message || "تم إزالة المستخدم من الشركة بنجاح",
  };
};

// =========================
// STAGES SUB APIs
// =========================

/**
 * جلب مراحل مشروع محدد (استخدم fetchProjectMainStages للـ API الجديد)
 */
export const fetchProjectStagesOld = async (
  projectId: string
): Promise<StagesSub[]> => {
  const response = await apiClient.get<ApiResponse<StagesSub[]>>(
    `/company-sub-projects/${projectId}/stages`
  );
  if (
    response.data.success &&
    response.data.data &&
    typeof response.data.data === "object" &&
    "stages" in response.data.data
  ) {
    return (response.data.data as any).stages || [];
  }
  return response.data.success ? response.data.data || [] : [];
};

/**
 * إنشاء مرحلة جديدة
 */
export const createProjectStage = async (
  projectId: string,
  stageData: Omit<
    StagesSub,
    "id" | "companySubProjectId" | "createdAt" | "updatedAt"
  >
): Promise<StagesSub> => {
  const response = await apiClient.post<ApiResponse<StagesSub>>(
    `/company-sub-projects/${projectId}/stages`,
    stageData
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "فشل في إنشاء المرحلة");
  }
  return response.data.data;
};

/**
 * تحديث مرحلة
 */
export const updateProjectStage = async (
  stageId: string,
  stageData: Partial<StagesSub>
): Promise<StagesSub> => {
  const response = await apiClient.put<ApiResponse<StagesSub>>(
    `/stages-sub/${stageId}`,
    stageData
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "فشل في تحديث المرحلة");
  }
  return response.data.data;
};

/**
 * حذف مرحلة
 */
export const deleteProjectStage = async (
  stageId: string
): Promise<{ message: string }> => {
  const response = await apiClient.delete<ApiResponse<any>>(
    `/stages-sub/${stageId}`
  );
  if (!response.data.success) {
    throw new Error(response.data.error || "فشل في حذف المرحلة");
  }
  return { message: response.data.message || "تم حذف المرحلة بنجاح" };
};

// =========================
// STAGE TEMPLATES APIs
// =========================

/**
 * جلب جميع قوالب المراحل
 */
export const fetchStageTemplates = async (): Promise<StageTemplate[]> => {
  const response = await apiClient.get<ApiResponse<StageTemplate[]>>(
    "/stage-templates"
  );
  return response.data.success ? response.data.data || [] : [];
};

/**
 * جلب قالب محدد مع مراحله
 */
export const fetchTemplateWithStages = async (
  templateId: string
): Promise<TemplateWithStages> => {
  const response = await apiClient.get<ApiResponse<TemplateWithStages>>(
    `/stage-templates/${templateId}/stages`
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "فشل في جلب تفاصيل القالب");
  }
  return response.data.data;
};

/**
 * إنشاء قالب جديد
 */
export const createStageTemplate = async (
  templateData: Omit<StageTemplate, "id" | "createdAt" | "updatedAt">
): Promise<StageTemplate> => {
  const response = await apiClient.post<ApiResponse<StageTemplate>>(
    "/stage-templates",
    templateData
  );
  if (!response.data.success || !response.data.data) {
    throw new Error(response.data.error || "فشل في إنشاء القالب");
  }
  return response.data.data;
};

/**
 * تطبيق قالب على مشروع
 */
export const applyTemplateToProject = async (
  projectId: string,
  templateId: string
): Promise<StagesSub[]> => {
  const response = await apiClient.post<ApiResponse<StagesSub[]>>(
    `/company-sub-projects/${projectId}/apply-template`,
    { templateId }
  );
  if (!response.data.success) {
    throw new Error(response.data.error || "فشل في تطبيق القالب");
  }
  return response.data.data || [];
};

// =========================
// PROJECT TASKS APIs
// =========================

// =========================
// REACT QUERY HOOKS
// =========================

/**
 * Hook لجلب جميع الشركات مع pagination
 */
export const useCompanies = (params: PaginationParams = {}) => {
  return useQuery({
    queryKey: ["companies", params.page, params.lastId, params.limit], 
    queryFn: () => fetchCompanies(params),
    keepPreviousData: false, // عدم الاحتفاظ بالبيانات السابقة
    staleTime: 0, // جعل البيانات stale فوراً لضمان refetch
    cacheTime: 0, // عدم cache نهائياً
    refetchOnWindowFocus: false,
  });
};

/**
 * Hook لجلب شركة محددة مع تفاصيلها
 */
export const useCompanyWithDetails = (companyId: string) => {
  return useQuery({
    queryKey: ["companies", companyId, "details"],
    queryFn: () => fetchCompanyWithDetails(companyId),
    enabled: !!companyId,
  });
};

/**
 * Hook لجلب فروع شركة محددة مع pagination
 */
export const useCompanySubs = (companyId: string, params: PaginationParams = {}) => {
  return useQuery({
    queryKey: ["companySubs", companyId, params],
    queryFn: () => fetchCompanySubs(companyId, params),
    enabled: !!companyId,
  });
};

/**
 * Hook لجلب فرع محدد مع مشاريعه
 */
export const useCompanySubWithProjects = (subId: string) => {
  return useQuery({
    queryKey: ["companySubs", subId, "projects"],
    queryFn: () => fetchCompanySubWithProjects(subId),
    enabled: !!subId,
  });
};

/**
 * Hook لجلب مشاريع فرع محدد مع pagination
 */
export const useCompanySubProjects = (subId: string, params: PaginationParams = {}) => {
  return useQuery({
    queryKey: ["companySubProjects", subId, params],
    queryFn: () => fetchCompanySubProjects(subId, params),
    enabled: !!subId,
  });
};

/**
 * Hook لجلب موظفي الشركة مع pagination
 */
export const useCompanyEmployees = (companyId: string, params: PaginationParams = {}) => {
  return useQuery({
    queryKey: ["companyEmployees", companyId, params],
    queryFn: () => fetchCompanyEmployees(companyId, params),
    enabled: !!companyId,
  });
};

/**
 * Hook لجلب موظفي مشروع محدد
 */
export const useProjectEmployees = (companyId: string, branchId: string, params: PaginationParams = {}) => {
  return useQuery({
    queryKey: ["projectEmployees", companyId, branchId, params],
    queryFn: () => fetchProjectEmployees(companyId, branchId, params),
    enabled: !!companyId && !!branchId,
  });
};

/**
 * Hook لجلب مشروع محدد مع مراحله
 */
export const useProjectWithStages = (projectId: string) => {
  return useQuery({
    queryKey: ["projects", projectId, "stages"],
    queryFn: () => fetchProjectWithStages(projectId),
    enabled: !!projectId,
  });
};

/**
 * Hook لجلب مستخدمي شركة محددة
 */
export const useCompanyUsers = (companyId: string) => {
  return useQuery({
    queryKey: ["companyUsers", companyId],
    queryFn: () => fetchCompanyUsers(companyId),
    enabled: !!companyId,
  });
};

/**
 * Hook لجلب مراحل مشروع محدد
 */
export const useProjectStages = (projectId: string, params: PaginationParams = {}) => {
  return useQuery({
    queryKey: ["projectStages", projectId, params],
    queryFn: () => fetchProjectMainStages(projectId, params),
    enabled: !!projectId,
  });
};

/**
 * Hook لجلب جميع قوالب المراحل
 */
export const useStageTemplates = () => {
  return useQuery({
    queryKey: ["stageTemplates"],
    queryFn: fetchStageTemplates,
  });
};

/**
 * Hook لجلب قالب محدد مع مراحله
 */
export const useTemplateWithStages = (templateId: string) => {
  return useQuery({
    queryKey: ["stageTemplates", templateId, "stages"],
    queryFn: () => fetchTemplateWithStages(templateId),
    enabled: !!templateId,
  });
};

// =========================
// MUTATION HOOKS
// =========================

/**
 * Hook لإنشاء شركة جديدة
 */
export const useCreateCompany = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createCompany,
  });
};

/**
 * Hook لإنشاء فرع جديد
 */
export const useCreateCompanySub = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      companyId,
      subData,
    }: {
      companyId: string;
      subData: Omit<CompanySub, "id" | "companyId" | "createdAt" | "updatedAt">;
    }) => createCompanySub(companyId, subData),
  });
};

/**
 * Hook لإنشاء مشروع جديد
 */
export const useCreateCompanySubProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      subId,
      projectData,
    }: {
      subId: string;
      projectData: Omit<
        CompanySubProject,
        "id" | "companySubId" | "createdAt" | "updatedAt"
      >;
    }) => createCompanySubProject(subId, projectData),
  });
};

/**
 * Hook لإنشاء مرحلة جديدة
 */
export const useCreateProjectStage = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      stageData,
    }: {
      projectId: string;
      stageData: Omit<
        StagesSub,
        "id" | "companySubProjectId" | "createdAt" | "updatedAt"
      >;
    }) => createProjectStage(projectId, stageData),
  });
};

/**
 * Hook لتطبيق قالب على مشروع
 */
export const useApplyTemplateToProject = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      projectId,
      templateId,
    }: {
      projectId: string;
      templateId: string;
    }) => applyTemplateToProject(projectId, templateId),
  });
};

// =========================
// FINANCIAL APIs (الـ APIs المالية)
// =========================

/**
 * جلب المصروفات لمشروع محدد مع pagination حقيقي (10 عناصر لكل طلب)
 */
export const fetchProjectExpenses = async (
  projectId: string,
  params: PaginationParams = {}
): Promise<{expenses: any[], pagination?: any, hasMore?: boolean}> => {
  const { limit = 10, lastId = 0 } = params;
  
  // تحسين آلية lastId لتجنب التكرار
  const adjustedLastId = lastId === 0 ? 0 : Number(lastId) - 1;
  
  const queryParams = new URLSearchParams({
    idproject: projectId,
    lastID: adjustedLastId.toString(),
    limit: limit.toString()
  });
  
  console.log(`🔍 Fetching expenses for projectId: ${projectId} with params:`, { limit, lastId, adjustedLastId });
  console.log(`📊 Logic: lastId=${lastId} -> adjustedLastId=${adjustedLastId} (avoiding duplicate)`);
  
  const response = await apiClient.get<ApiResponse<any[]>>(
    `/brinshCompany/BringExpense?${queryParams}`
  );
  console.log(`📊 Expenses response:`, response.data);
  console.log(`📊 Expenses IDs in response:`, response.data?.data?.map(e => e.id) || []);
  
  if (response.data.success) {
    const expenses = response.data.data || [];
    const hasMore = expenses.length === limit;
    
    return {
      expenses,
      pagination: response.data.pagination,
      hasMore
    };
  }
  
  return { expenses: [], hasMore: false };
};

/**
 * جلب الإيرادات لمشروع محدد مع pagination حقيقي (10 عناصر لكل طلب)
 */
export const fetchProjectRevenue = async (
  projectId: string,
  params: PaginationParams = {}
): Promise<{revenue: any[], pagination?: any, hasMore?: boolean}> => {
  const { limit = 10, lastId = 0 } = params;
  
  // تحسين آلية lastId لتجنب التكرار
  const adjustedLastId = lastId === 0 ? 0 : Number(lastId) - 1;
  
  const queryParams = new URLSearchParams({
    idproject: projectId,
    lastID: adjustedLastId.toString(),
    limit: limit.toString()
  });
  
  console.log(`🔍 Fetching revenue for projectId: ${projectId} with params:`, { limit, lastId, adjustedLastId });
  console.log(`📊 Logic: lastId=${lastId} -> adjustedLastId=${adjustedLastId} (avoiding duplicate)`);
  
  const response = await apiClient.get<ApiResponse<any[]>>(
    `/brinshCompany/BringRevenue?${queryParams}`
  );
  console.log(`📊 Revenue response:`, response.data);
  console.log(`📊 Revenue IDs in response:`, response.data?.data?.map(r => r.id) || []);
  
  if (response.data.success) {
    const revenue = response.data.data || [];
    const hasMore = revenue.length === limit;
    
    return {
      revenue,
      pagination: response.data.pagination,
      hasMore
    };
  }
  
  return { revenue: [], hasMore: false };
};

/**
 * جلب المرتجعات لمشروع محدد مع pagination حقيقي (10 عناصر لكل طلب)
 */
export const fetchProjectReturns = async (
  projectId: string,
  params: PaginationParams = {}
): Promise<{returns: any[], pagination?: any, hasMore?: boolean}> => {
  const { limit = 10, lastId = 0 } = params;
  
  // تحسين آلية lastId لتجنب التكرار
  const adjustedLastId = lastId === 0 ? 0 : Number(lastId) - 1;
  
  const queryParams = new URLSearchParams({
    idproject: projectId,
    lastID: adjustedLastId.toString(),
    limit: limit.toString()
  });
  
  console.log(`🔍 Fetching returns for projectId: ${projectId} with params:`, { limit, lastId, adjustedLastId });
  console.log(`📊 Logic: lastId=${lastId} -> adjustedLastId=${adjustedLastId} (avoiding duplicate)`);
  
  const response = await apiClient.get<ApiResponse<any[]>>(
    `/brinshCompany/BringReturned?${queryParams}`
  );
  console.log(`📊 Returns response:`, response.data);
  console.log(`📊 Returns IDs in response:`, response.data?.data?.map(r => r.id) || []);
  
  if (response.data.success) {
    const returns = response.data.data || [];
    const hasMore = returns.length === limit;
    
    return {
      returns,
      pagination: response.data.pagination,
      hasMore
    };
  }
  
  return { returns: [], hasMore: false };
};

/**
 * جلب إجمالي المبلغ المالي للمشروع
 */
export const fetchProjectTotalAmount = async (projectId: string): Promise<any> => {
  console.log(`🔍 Fetching total amount for projectId: ${projectId}`);
  
  const response = await apiClient.get<ApiResponse<any>>(
    `/brinshCompany/BringTotalAmountproject?ProjectID=${projectId}`
  );
  console.log(`📊 Total amount response:`, response.data);
  
  return response.data.success ? response.data.data || {} : {};
};

// =========================
// EMPLOYEES APIs (مرتبطة بالشركة وليس الفرع)
// =========================

/**
 * جلب موظفي الشركة مع pagination حقيقي (10 عناصر لكل طلب)
 */
export const fetchCompanyEmployees = async (
  companyId: string,
  params: PaginationParams = {}
): Promise<{employees: Employee[], pagination?: any, hasMore?: boolean}> => {
  const { limit = 10, lastId = 0 } = params;
  
  const queryParams = new URLSearchParams();
  queryParams.append('IDCompany', companyId);
  queryParams.append('number', lastId.toString());
  queryParams.append('limit', limit.toString());
  
  console.log(`🔍 Fetching employees for companyId: ${companyId} with params:`, { limit, lastId });
  
  const response = await apiClient.get<ApiResponse<Employee[]>>(
    `/user/BringUserCompany?${queryParams}`
  );
  console.log(`📊 Company employees response:`, response.data);
  
  if (response.data.success) {
    const employees = response.data.data || [];
    const hasMore = employees.length === limit;
    
    return {
      employees,
      pagination: response.data.pagination,
      hasMore
    };
  }
  
  return { employees: [], hasMore: false };
};

/**
 * جلب موظفي مشروع محدد
 */
export const fetchProjectEmployees = async (
  companyId: string,
  branchId: string,
  params: PaginationParams = {}
): Promise<{employees: Employee[], pagination?: any}> => {
  const { limit = 10, lastId = 0 } = params;
  
  const queryParams = new URLSearchParams({
    IDCompany: companyId,
    idBrinsh: branchId,
    type: "1",
    number: lastId.toString(),
    limit: limit.toString()
  });
  
  console.log(`🔍 Fetching project employees for companyId: ${companyId}, branchId: ${branchId}`);
  
  const response = await apiClient.get<ApiResponse<Employee[]>>(
    `/user/BringUserCompanyinv2?${queryParams}`
  );
  console.log(`📊 Project employees response:`, response.data);
  
  if (response.data.success) {
    return {
      employees: response.data.data || [],
      pagination: response.data.pagination
    };
  }
  
  return { employees: [] };
};

// ============= EMPLOYEES FUNCTIONS =============

export const fetchBranchEmployees = async (
  branchId: number,
  options?: { sortBy?: string; filterBy?: string }
): Promise<Employee[]> => {
  try {
    console.log(`🔍 جلب موظفي الفرع ${branchId}...`);

    // بناء URL مع معاملات الاستعلام
    let url = `/companies/branches/${branchId}/employees`;
    const params = new URLSearchParams();

    if (options?.sortBy) {
      params.append("sortBy", options.sortBy);
    }
    if (options?.filterBy && options.filterBy !== "all") {
      params.append("filterBy", options.filterBy);
    }

    if (params.toString()) {
      url += `?${params.toString()}`;
    }

    const response = await apiClient.get(url);

    if (!response.data.success) {
      throw new Error(response.data.message || "فشل في جلب بيانات الموظفين");
    }

    console.log(
      `✅ تم جلب ${response.data.data?.length || 0} موظف للفرع ${branchId}`
    );
    return response.data.data || [];
  } catch (error) {
    console.error(`❌ خطأ في جلب موظفي الفرع ${branchId}:`, error);
    throw error;
  }
};

export const fetchBranchEmployeesStats = async (
  branchId: number
): Promise<EmployeeStatsResponse> => {
  try {
    console.log(`📊 جلب إحصائيات موظفي الفرع ${branchId}...`);

    const response = await apiClient.get<EmployeeStatsResponse>(
      `/companies/branches/${branchId}/employees/stats`
    );

    if (!response.data.success) {
      throw new Error(response.data.message || "فشل في جلب إحصائيات الموظفين");
    }

    console.log(`✅ تم جلب إحصائيات ${response.data.stats.total} موظف`);
    return response.data;
  } catch (error) {
    console.error("❌ خطأ في جلب إحصائيات الموظفين:", error);
    throw error;
  }
};

export const createEmployee = async (
  employeeData: Partial<Employee>
): Promise<Employee> => {
  try {
    console.log("🆕 إنشاء موظف جديد...");

    const response = await apiClient.post<ApiResponse<Employee>>(
      "/employees",
      employeeData
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "فشل في إنشاء الموظف");
    }

    console.log("✅ تم إنشاء الموظف بنجاح");
    return response.data.data;
  } catch (error) {
    console.error("❌ خطأ في إنشاء الموظف:", error);
    throw error;
  }
};

export const updateEmployee = async (
  employeeId: number,
  employeeData: Partial<Employee>
): Promise<Employee> => {
  try {
    console.log(`📝 تحديث بيانات الموظف ${employeeId}...`);

    const response = await apiClient.put<ApiResponse<Employee>>(
      `/employees/${employeeId}`,
      employeeData
    );

    if (!response.data.success || !response.data.data) {
      throw new Error(response.data.error || "فشل في تحديث بيانات الموظف");
    }

    console.log("✅ تم تحديث بيانات الموظف بنجاح");
    return response.data.data;
  } catch (error) {
    console.error("❌ خطأ في تحديث بيانات الموظف:", error);
    throw error;
  }
};

export const deleteEmployee = async (employeeId: number): Promise<void> => {
  try {
    console.log(`🗑️ حذف الموظف ${employeeId}...`);

    const response = await apiClient.delete<ApiResponse<any>>(
      `/employees/${employeeId}`
    );

    if (!response.data.success) {
      throw new Error(response.data.error || "فشل في حذف الموظف");
    }

    console.log("✅ تم حذف الموظف بنجاح");
  } catch (error) {
    console.error("❌ خطأ في حذف الموظف:", error);
    throw error;
  }
};

// React Query hooks للموظفين
export const useBranchEmployees = (
  branchId: number,
  options?: { sortBy?: string; filterBy?: string }
) => {
  return useQuery({
    queryKey: ["branchEmployees", branchId, options?.sortBy, options?.filterBy],
    queryFn: () => fetchBranchEmployees(branchId, options),
    enabled: !!branchId,
    staleTime: 5 * 60 * 1000, // 5 دقائق
  });
};

export const useBranchEmployeesStats = (branchId: number) => {
  return useQuery({
    queryKey: ["branchEmployeesStats", branchId],
    queryFn: () => fetchBranchEmployeesStats(branchId),
    enabled: !!branchId,
    staleTime: 10 * 60 * 1000, // 10 دقائق
  });
};

// البحث الشامل في النظام - تفعيل API مغلق
// تم حذف البحث الشامل من الواجهة

/**
 * جلب تفاصيل شركة محددة مع إحصائيات - تفعيل API مغلق
 */
export const fetchCompanyDetails = async (companyId: string): Promise<any> => {
  console.log(`🔍 جاري جلب تفاصيل الشركة مع الإحصائيات: ${companyId}`);
  
  try {
    const response = await apiClient.get<ApiResponse<any>>(
      `/companies/${companyId}/details`
    );
    
    console.log('📊 تفاصيل الشركة مع الإحصائيات:', response.data);
    
    if (response.data.success) {
      return response.data.data;
    } else {
      throw new Error(response.data.error || 'فشل في جلب تفاصيل الشركة');
    }
  } catch (error) {
    console.error('❌ خطأ في جلب تفاصيل الشركة:', error);
    throw error;
  }
};

/**
 * جلب إحصائيات موظفي الفرع المتقدمة - تفعيل API مغلق
 */
export const fetchAdvancedBranchEmployeesStats = async (branchId: number): Promise<any> => {
  console.log(`📊 جاري جلب إحصائيات موظفي الفرع المتقدمة: ${branchId}`);
  
  try {
    const response = await apiClient.get<ApiResponse<any>>(
      `/companies/branches/${branchId}/employees/stats`
    );
    
    console.log('📊 إحصائيات موظفي الفرع المتقدمة:', response.data);
    
    if (response.data.success) {
      return response.data;
    } else {
      throw new Error(response.data.message || 'فشل في جلب إحصائيات موظفي الفرع المتقدمة');
    }
  } catch (error) {
    console.error('❌ خطأ في جلب إحصائيات موظفي الفرع المتقدمة:', error);
    throw error;
  }
};

// =========================
// PROJECT STAGES APIs (الـ APIs المراحل)
// =========================

/**
 * جلب المراحل الرئيسية للمشروع مع pagination حقيقي (10 عناصر لكل طلب)
 */
export const fetchProjectMainStages = async (
  projectId: string,
  params: PaginationParams = {}
): Promise<{stages: any[], pagination?: any, hasMore?: boolean}> => {
  const { limit = 10, lastId = 0 } = params;
  
  const queryParams = new URLSearchParams({
    ProjectID: projectId,
    type: "cache",
    number: lastId.toString(),
    limit: limit.toString()
  });
  
  console.log(`🔍 Fetching stages for projectId: ${projectId} with params:`, { limit, lastId });
  
  const response = await apiClient.get<ApiResponse<any[]>>(
    `/brinshCompany/BringStage?${queryParams}`
  );
  console.log(`📊 Stages response:`, response.data);
  
  if (response.data.success) {
    const stages = response.data.data || [];
    const hasMore = stages.length === limit;
    
    return {
      stages,
      pagination: response.data.pagination,
      hasMore
    };
  }
  
  return { stages: [], hasMore: false };
};

/**
 * جلب المراحل الفرعية للمرحلة مع pagination حقيقي (10 عناصر لكل طلب)
 */
export const fetchStageSubStages = async (
  projectId: string,
  stageId: string,
  params: PaginationParams = {}
): Promise<{subStages: any[], pagination?: any, hasMore?: boolean}> => {
  const { limit = 10, lastId = 0 } = params;
  
  const queryParams = new URLSearchParams({
    ProjectID: projectId,
    StageID: stageId,
    type: "cache",
    number: lastId.toString(),
    limit: limit.toString()
  });
  
  console.log(`🔍 Fetching sub-stages for projectId: ${projectId}, stageId: ${stageId} with params:`, { limit, lastId });
  
  const response = await apiClient.get<ApiResponse<any[]>>(
    `/brinshCompany/BringStagesub?${queryParams}`
  );
  console.log(`📊 Sub-stages response:`, response.data);
  
  if (response.data.success) {
    const subStages = response.data.data || [];
    const hasMore = subStages.length === limit;
    
    return {
      subStages,
      pagination: response.data.pagination,
      hasMore
    };
  }
  
  return { subStages: [], hasMore: false };
};

/**
 * جلب ملاحظات المرحلة مع pagination حقيقي (10 عناصر لكل طلب)
 */
export const fetchStageNotes = async (
  projectId: string,
  stageId: string,
  params: PaginationParams = {}
): Promise<{notes: any[], pagination?: any, hasMore?: boolean}> => {
  const { limit = 10, lastId = 0 } = params;
  
  const queryParams = new URLSearchParams({
    ProjectID: projectId,
    StageID: stageId,
    number: lastId.toString(),
    limit: limit.toString()
  });
  
  console.log(`🔍 Fetching stage notes for projectId: ${projectId}, stageId: ${stageId} with params:`, { limit, lastId });
  
  const response = await apiClient.get<ApiResponse<any[]>>(
    `/brinshCompany/BringStageNotes?${queryParams}`
  );
  console.log(`📊 Stage notes response:`, response.data);
  
  if (response.data.success) {
    const notes = response.data.data || [];
    const hasMore = notes.length === limit;
    
    return {
      notes,
      pagination: response.data.pagination,
      hasMore
    };
  }
  
  return { notes: [], hasMore: false };
};

// =========================
// PROJECT REQUESTS APIs (الـ APIs الطلبيات)
// =========================

/**
 * جلب طلبيات المشروع مع pagination حقيقي (10 عناصر لكل طلب)
 */
export const fetchProjectRequests = async (
  projectId: string,
  type: string = "",
  done: string = "",
  params: PaginationParams = {}
): Promise<{requests: any[], pagination?: any, hasMore?: boolean}> => {
  const { limit = 10, lastId = 0 } = params;
  
  // تحسين آلية lastId لتجنب التكرار
  const adjustedLastId = lastId === 0 ? 0 : Number(lastId) - 1;
  
  const queryParams = new URLSearchParams({
    ProjectID: projectId,
    Type: type,
    Done: done,
    lastID: adjustedLastId.toString(),
    limit: limit.toString()
  });
  
  console.log(`🔍 Fetching requests for projectId: ${projectId} with params:`, { limit, lastId, adjustedLastId });
  console.log(`📊 Logic: lastId=${lastId} -> adjustedLastId=${adjustedLastId} (avoiding duplicate)`);
  
  const response = await apiClient.get<ApiResponse<any[]>>(
    `/brinshCompany/v2/BringDataRequests?${queryParams}`
  );
  console.log(`📊 Requests response:`, response.data);
  console.log(`📊 Requests IDs in response:`, response.data?.data?.map(r => r.id) || []);
  
  if (response.data.success) {
    const requests = response.data.data || [];
    const hasMore = requests.length === limit;
    
    return {
      requests,
      pagination: response.data.pagination,
      hasMore
    };
  }
  
  return { requests: [], hasMore: false };
};

/**
 * جلب عدد الطلبيات للمشروع
 */
export const fetchProjectRequestsCount = async (projectId: string): Promise<any> => {
  console.log(`🔍 Fetching requests count for projectId: ${projectId}`);
  
  const response = await apiClient.get<ApiResponse<any>>(
    `/brinshCompany/v2/BringCountRequsts?ProjectID=${projectId}`
  );
  console.log(`📊 Requests count response:`, response.data);
  
  return response.data.success ? response.data.data || {} : {};
};

// =========================
// FINANCIAL REACT QUERY HOOKS
// =========================

/**
 * Hook لجلب مصروفات المشروع
 */
export const useProjectExpenses = (projectId: string, params: PaginationParams = {}) => {
  return useQuery({
    queryKey: ["projectExpenses", projectId, params],
    queryFn: () => fetchProjectExpenses(projectId, params),
    enabled: !!projectId,
  });
};

/**
 * Hook لجلب إيرادات المشروع
 */
export const useProjectRevenue = (projectId: string, params: PaginationParams = {}) => {
  return useQuery({
    queryKey: ["projectRevenue", projectId, params],
    queryFn: () => fetchProjectRevenue(projectId, params),
    enabled: !!projectId,
  });
};

/**
 * Hook لجلب مرتجعات المشروع
 */
export const useProjectReturns = (projectId: string, params: PaginationParams = {}) => {
  return useQuery({
    queryKey: ["projectReturns", projectId, params],
    queryFn: () => fetchProjectReturns(projectId, params),
    enabled: !!projectId,
  });
};

/**
 * Hook لجلب إجمالي المبلغ المالي للمشروع
 */
export const useProjectTotalAmount = (projectId: string) => {
  return useQuery({
    queryKey: ["projectTotalAmount", projectId],
    queryFn: () => fetchProjectTotalAmount(projectId),
    enabled: !!projectId,
  });
};

// =========================
// STAGES REACT QUERY HOOKS
// =========================

/**
 * Hook لجلب المراحل الرئيسية للمشروع
 */
export const useProjectMainStages = (projectId: string, params: PaginationParams = {}) => {
  return useQuery({
    queryKey: ["projectMainStages", projectId, params],
    queryFn: () => fetchProjectMainStages(projectId, params),
    enabled: !!projectId,
  });
};

/**
 * Hook لجلب المراحل الفرعية
 */
export const useStageSubStages = (projectId: string, stageId: string, params: PaginationParams = {}) => {
  return useQuery({
    queryKey: ["stageSubStages", projectId, stageId, params],
    queryFn: () => fetchStageSubStages(projectId, stageId, params),
    enabled: !!projectId && !!stageId,
  });
};

/**
 * Hook لجلب ملاحظات المرحلة مع pagination
 */
export const useStageNotes = (projectId: string, stageId: string, params: PaginationParams = {}) => {
  return useQuery({
    queryKey: ["stageNotes", projectId, stageId, params],
    queryFn: () => fetchStageNotes(projectId, stageId, params),
    enabled: !!projectId && !!stageId,
  });
};

// =========================
// REQUESTS REACT QUERY HOOKS
// =========================

/**
 * Hook لجلب طلبيات المشروع
 */
export const useProjectRequests = (projectId: string, type: string = "", done: string = "", params: PaginationParams = {}) => {
  return useQuery({
    queryKey: ["projectRequests", projectId, type, done, params],
    queryFn: () => fetchProjectRequests(projectId, type, done, params),
    enabled: !!projectId,
  });
};

/**
 * Hook لجلب عدد طلبيات المشروع
 */
export const useProjectRequestsCount = (projectId: string) => {
  return useQuery({
    queryKey: ["projectRequestsCount", projectId],
    queryFn: () => fetchProjectRequestsCount(projectId),
    enabled: !!projectId,
  });
};
