import apiClient from "../../../api/config";

export interface Company {
  id: number;
  name: string;
  address: string;
  city: string;
  country: string;
  isActive: boolean;
  registrationNumber: string;
  branchesAllowed: number;
  branchesCount: number;
  subscriptionStart: string;
  subscriptionEnd: string;
  apiKey: string;
}

export interface Branch {
  id: number;
  companyId: number;
  name: string;
  address: string;
  email: string;
  phone: string;
  manager: string;
  employeesCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Project {
  id: number;
  IDcompanySub: number;
  Nameproject: string;
  Note: string;
  TypeOFContract: string;
  GuardNumber: number;
  LocationProject: string;
  ProjectStartdate: string;
  Imageproject: string;
  Contractsigningdate: string;
  numberBuilding: number;
  Disabled: string;
  Referencenumber: number;
}

export interface Employee {
  id: number;
  IDCompany: number;
  userName: string;
  IDNumber: string;
  PhoneNumber: string;
  image: string;
  jobdiscrption: string;
  job: string;
  jobHOM: string;
  DateOFjoin: string;
  Activation: string;
  Validity: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
  masseg?: string;
  countcompany?: number;
  totalCount?: number;
  hasMore?: boolean;
}

// APIs الشركات
export const companiesSubscribedApi = {
  // جلب جميع الشركات مع pagination
  async getCompanies(params: {
    page?: number;
    limit?: number;
    search?: string;
    number?: number;
  }): Promise<ApiResponse<Company[]>> {
    try {

      const response = await apiClient.get("/companies", { params } );
      return response.data;
    } catch (error: any) {
      console.error("خطأ في جلب الشركات:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء جلب الشركات",
      };
    }
  },

  // جلب شركة محددة
  async getCompany(id: number): Promise<ApiResponse<Company>> {
    try {
      const response = await apiClient.get(`/companies/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("خطأ في جلب الشركة:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء جلب الشركة",
      };
    }
  },

  // إنشاء شركة جديدة
  async createCompany(companyData: {
    name: string;
    address?: string;
    city?: string;
    country?: string;
    registrationNumber?: string;
    buildingNumber?: string;
    streetName?: string;
    neighborhoodName?: string;
    postalCode?: string;
    taxNumber?: string;
    branchesAllowed?: number;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
    cost?: number;
  }): Promise<ApiResponse<Company>> {
    try {
      const response = await apiClient.post("/companies", companyData);
      return response.data;
    } catch (error: any) {
      console.error("خطأ في إنشاء الشركة:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء إنشاء الشركة",
      };
    }
  },

  // تحديث شركة
  async updateCompany(id: number, companyData: {
    name?: string;
    address?: string;
    city?: string;
    country?: string;
    registrationNumber?: string;
    buildingNumber?: string;
    streetName?: string;
    neighborhoodName?: string;
    postalCode?: string;
    taxNumber?: string;
    branchesAllowed?: number;
    subscriptionStartDate?: string;
    subscriptionEndDate?: string;
    cost?: number;
  }): Promise<ApiResponse<Company>> {
    try {
      const response = await apiClient.put(`/companies/${id}`, companyData);
      return response.data;
    } catch (error: any) {
      console.error("خطأ في تحديث الشركة:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء تحديث الشركة",
      };
    }
  },

  // حذف شركة
  async deleteCompany(id: number): Promise<ApiResponse> {
    try {
      const response = await apiClient.delete(`/companies/${id}`);
      return response.data;
    } catch (error: any) {
      console.error("خطأ في حذف الشركة:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء حذف الشركة",
      };
    }
  },



  // جلب مشاريع فرع محدد مع دعم عدد غير محدود من المشاريع
  async getBranchProjects(IDCompany:number,branchId: number, lastId = 0, limit = 10, includeDisabled = false): Promise<ApiResponse<Project[]>> {
    try {
      // طبقة كاش خفيفة في الفرونت لتقليل الضغط (stale-while-revalidate بسيط)
      const CACHE_TTL_MS = 2 * 60 * 1000; // دقيقتان
      const cacheKey = `v2:branchProjects:${IDCompany}:${branchId}:${lastId}:${limit}:${includeDisabled ? 1 : 0}`;
      try {
        const cachedRaw = localStorage.getItem(cacheKey);
        if (cachedRaw) {
          const cached = JSON.parse(cachedRaw);
          if (cached && Array.isArray(cached.data) && typeof cached.ts === 'number' && (Date.now() - cached.ts) < CACHE_TTL_MS) {
            return { success: true, data: cached.data };
          }
        }
      } catch {}
      // نحاول جلب المشاريع على دفعات صغيرة متعددة لتجاوز قيد LIMIT 3
      const allProjects: any[] = [];
      let currentLastId = lastId;
      const batchSize = 3; // حجم الدفعة الواحدة من الـ backend
      const targetSize = Math.min(limit, 10); // الحد الأقصى المطلوب
      let consecutiveEmptyBatches = 0; // عداد الدفعات الفارغة المتتالية
      const maxIterations = 100; // رفع الحد بشكل كبير لدعم عدد كبير من المشاريع
      let iterations = 0;

      // جلب المشاريع على دفعات
      while (allProjects.length < targetSize && iterations < maxIterations) {
        iterations++;

      const response = await apiClient.get("/brinshCompany/v2/BringProject", {
        params: {
          IDCompany:IDCompany,
          IDcompanySub: branchId,
            IDfinlty: currentLastId,
          type: "cache",
          kind: "all",
            order: "ASC"
          }
        });

        if (!response.data?.success) {
          break;
        }

        const batchProjects = response.data.data || [];

        if (batchProjects.length === 0) {
          consecutiveEmptyBatches++;
          
          // إذا حصلنا على 5 دفعات فارغة متتالية، نعتبر أننا وصلنا للنهاية
          if (consecutiveEmptyBatches >= 5) {
            break;
          }
          
          // جرب زيادة last_id بقفزة أكبر في حالة وجود فجوات في البيانات
          currentLastId += 5;
          continue;
        }

        // إعادة تعيين عداد الدفعات الفارغة
        consecutiveEmptyBatches = 0;

        // إضافة المشاريع الجديدة (تجنب التكرار)
        const newProjects = batchProjects.filter((newProject: any) => 
          !allProjects.some(existingProject => existingProject.id === newProject.id)
        );



        allProjects.push(...newProjects);

        // تحديث currentLastId لآخر مشروع في الدفعة
        if (batchProjects.length > 0) {
          const lastProjectInBatch = batchProjects[batchProjects.length - 1];
          const newLastId = lastProjectInBatch.id;
          
          // تأكد من أن last_id يتقدم
          if (newLastId <= currentLastId) {
            currentLastId = currentLastId + 5;
          } else {
            currentLastId = newLastId;
          }
        }

        // إذا حصلنا على أقل من 3 مشاريع، قد نكون وصلنا للنهاية
        // لكن تابع المحاولة للتأكد (قد توجد فجوات في البيانات)
        if (batchProjects.length < batchSize) {
          console.log('📉 دفعة جزئية، محاولة المتابعة للتأكد من عدم وجود مشاريع أخرى');
          // لا نتوقف مباشرة، نعطي فرص أكثر
        }

        // حماية من الحلقة اللانهائية - حد مرن يمكن رفعه حسب الحاجة
        if (allProjects.length >= 1000) {
          console.warn('⚠️ تم الوصول للحد الأقصى الأمني (1000 مشروع) - إيقاف لحماية الأداء');
          break;
        }
      }

      // فلترة المشاريع المُعطَّلة إذا لم يكن مطلوباً إدراجها
      let filteredProjects = allProjects;
      if (!includeDisabled) {
        // تطبيق فلترة للمشاريع النشطة فقط
        // في قاعدة البيانات: disabled = true يعني نشط، disabled = false يعني متوقف
        filteredProjects = allProjects.filter(project => {
          const disabled = project.Disabled;
          const isActive = disabled === true || disabled === 'true' || Number(disabled) === 1 || disabled === '1';
          return isActive;
        });

      }

      // قطع النتائج حسب الحجم المطلوب
      const finalProjects = filteredProjects.slice(0, targetSize);


      
      // تخزين في الكاش
      try {
        localStorage.setItem(cacheKey, JSON.stringify({ data: finalProjects, ts: Date.now() }));
      } catch {}

      return {
        success: true,
        data: finalProjects
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء جلب مشاريع الفرع",
      };
    }
  },

  // جلب جميع مشاريع الفرع (بما في ذلك المُعطَّلة) لأغراض الإدارة
  async getAllBranchProjects(IDCompany:number,branchId: number, lastId = 0, limit = 50): Promise<ApiResponse<Project[]>> {
    return this.getBranchProjects(IDCompany,branchId, lastId, limit, true); // includeDisabled = true
  },

  // البحث في مشاريع الفرع عبر الباك اند (v2/FilterProject)
  async filterBranchProjects(
    IDCompany: number,
    branchId: number,
    searchTerm: string
  ): Promise<ApiResponse<Project[]>> {
    try {
      const response = await apiClient.get("/brinshCompany/v2/FilterProject", {
        params: {
          IDCompany: IDCompany,
          IDCompanySub: branchId,
          search: searchTerm
        }
      });

      // الباك يُرجع success كنص رسالة، لذا نعتبر النجاح بناءً على حالة HTTP ووجود data
      const data = response.data?.data || [];
      return {
        success: true,
        data,
        message: response.data?.success || response.data?.message
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء البحث في مشاريع الفرع",
      };
    }
  },

  // البحث داخل مشاريع الفرع على دفعات (batching) عبر BringProject ثم فلترة محلية
  async searchBranchProjectsBatched(
    IDCompany: number,
    branchId: number,
    searchTerm: string,
    includeDisabled: boolean = false,
    limitResults: number = 50
  ): Promise<ApiResponse<Project[]>> {
    try {
      if (!searchTerm || !searchTerm.trim()) {
        return { success: true, data: [] };
      }

      const term = searchTerm.toLowerCase();
      const allMatched: any[] = [];
      let currentLastId = 0;
      const batchSizeBackend = 3;
      let consecutiveEmptyBatches = 0;
      const maxIterations = 1000;
      let iterations = 0;

      while (allMatched.length < limitResults && iterations < maxIterations) {
        iterations++;
        const response = await apiClient.get("/brinshCompany/v2/BringProject", {
          params: {
            IDCompany: IDCompany,
            IDcompanySub: branchId,
            IDfinlty: currentLastId,
            type: "cache",
            kind: "all",
            order: "ASC"
          }
        });

        if (!response.data?.success) {
          break;
        }

        const batchProjects = response.data?.data || [];
        if (batchProjects.length === 0) {
          consecutiveEmptyBatches++;
          if (consecutiveEmptyBatches >= 5) break;
          currentLastId += 5;
          continue;
        }

        consecutiveEmptyBatches = 0;

        // فلترة بالبحث ضمن الدفعة فقط
        const filteredBatch = batchProjects.filter((p: any) => {
          const matches = (
            String(p.Nameproject || '').toLowerCase().includes(term) ||
            String(p.TypeOFContract || '').toLowerCase().includes(term) ||
            String(p.LocationProject || '').toLowerCase().includes(term) ||
            String(p.Note || '').toLowerCase().includes(term) ||
            (p.Referencenumber !== undefined && p.Referencenumber !== null && String(p.Referencenumber).toLowerCase().includes(term))
          );
          if (!matches) return false;
          if (includeDisabled) return true;
          const d = p.Disabled;
          const isActive = d === true || d === 'true' || Number(d) === 1 || d === '1';
          return isActive;
        });

        // دمج بدون تكرار
        for (const proj of filteredBatch) {
          if (!allMatched.some((x) => x.id === proj.id)) {
            allMatched.push(proj);
            if (allMatched.length >= limitResults) break;
          }
        }

        // تحديث lastId للدفعة التالية
        const lastProjectInBatch = batchProjects[batchProjects.length - 1];
        const newLastId = lastProjectInBatch?.id ?? currentLastId;
        currentLastId = newLastId <= currentLastId ? currentLastId + 5 : newLastId;

        // حد أمان كبير
        if (currentLastId > 1000000000) break;
      }

      return {
        success: true,
        data: allMatched.slice(0, limitResults)
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء البحث على دفعات في مشاريع الفرع",
      };
    }
  },

  // إنشاء مشروع جديد
  async createProject(projectData: {
    IDcompanySub: number;
    Nameproject: string;
    Note?: string;
    TypeOFContract: string;
    GuardNumber?: number;
    LocationProject?: string;
    ProjectStartdate?: string;
    numberBuilding?: number;
    Referencenumber?: number;
  }): Promise<ApiResponse<Project>> {
    try {
      // إضافة Disabled: true لجعل المشروع نشطاً بشكل افتراضي (حسب منطق قاعدة البيانات الفعلية)
      const projectWithStatus = {
        ...projectData,
        Disabled: true  // true = نشط حسب البيانات الفعلية
      };
      
      const response = await apiClient.post("/brinshCompany/project", projectWithStatus);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء إنشاء المشروع",
      };
    }
  },

  // تفعيل/تعطيل مشروع (حسب منطق قاعدة البيانات الفعلية)
  async toggleProjectStatus(projectId: number, makeActive: boolean = true): Promise<ApiResponse<Project>> {
    try {
      const statusText = makeActive ? 'تفعيل' : 'تعطيل';
      
      // في قاعدة البيانات الفعلية: true = نشط، false = معطل
      const response = await apiClient.put("/brinshCompany/projectUpdat", {
        id: projectId,
        Disabled: makeActive ? true : false
      });
      
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء تغيير حالة المشروع",
      };
    }
  },

  // تحديث مشروع
  async updateProject(projectData: {
    id: number;
    Nameproject?: string;
    Note?: string;
    TypeOFContract?: string;
    GuardNumber?: number;
    LocationProject?: string;
    ProjectStartdate?: string;
    numberBuilding?: number;
  }): Promise<ApiResponse<Project>> {
    try {
      const response = await apiClient.put("/brinshCompany/projectUpdat", projectData);
      return response.data;
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء تحديث المشروع",
      };
    }
  },

  // حذف مشروع
  async deleteProject(projectId: number): Promise<ApiResponse> {
    try {
      const response = await apiClient.get("/brinshCompany/DeletProjectwithDependencies", {
        params: { ProjectID: projectId }
      });
      return response.data;
    } catch (error: any) {
      console.error("خطأ في حذف المشروع:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء حذف المشروع",
      };
    }
  },

  // جلب موظفي شركة محددة مع دعم عدد غير محدود من الموظفين
  async getCompanyEmployees(companyId: number, lastId = 0, limit = 10): Promise<ApiResponse<Employee[]>> {
    try {
      // نحاول جلب الموظفين على دفعات صغيرة متعددة لتجاوز قيود الـ backend
      const allEmployees: any[] = [];
      let currentLastId = lastId;
      const batchSize = 3; // حجم الدفعة الواحدة من الـ backend
      const targetSize = Math.min(limit, 10); // الحد الأقصى المطلوب
      let consecutiveEmptyBatches = 0; // عداد الدفعات الفارغة المتتالية
      const maxIterations = 100; // رفع الحد بشكل كبير لدعم عدد كبير من الموظفين
      let iterations = 0;

      console.log('🚀 بدء تحميل الموظفين (نظام مفتوح):', {
        companyId,
        initialLastId: lastId,
        targetSize,
        batchSize,
        maxIterations,
        note: 'النظام يدعم عدد غير محدود من الموظفين'
      });

      // جلب الموظفين على دفعات
      while (allEmployees.length < targetSize && iterations < maxIterations) {
        iterations++;
        
        console.log(`📦 محاولة جلب الدفعة ${iterations}:`, {
          currentLastId,
          employeesCollected: allEmployees.length,
          targetRemaining: targetSize - allEmployees.length
        });

        const response = await apiClient.get("/user/BringUserCompany", {
          params: {
        IDCompany: companyId,
            number: currentLastId
          }
        });

        if (!response.data?.success) {
          console.error('❌ خطأ في استجابة API:', response.data);
          break;
        }

        const batchEmployees = response.data.data || [];
        console.log('📦 دفعة موظفين مستلمة:', {
          batchNumber: iterations,
          batchSize: batchEmployees.length,
          currentLastId,
          employeeIds: batchEmployees.map((e: any) => e.id),
          employeeNames: batchEmployees.map((e: any) => e.userName)
        });

        if (batchEmployees.length === 0) {
          consecutiveEmptyBatches++;
          console.log(`⚠️ دفعة فارغة ${consecutiveEmptyBatches}:`, { currentLastId });
          
          // إذا حصلنا على 5 دفعات فارغة متتالية، نعتبر أننا وصلنا للنهاية
          if (consecutiveEmptyBatches >= 5) {
            console.log('🔚 انتهاء البيانات - خمس دفعات فارغة متتالية');
            break;
          }
          
          // جرب زيادة last_id بقفزة أكبر في حالة وجود فجوات في البيانات
          currentLastId += 5;
          continue;
        }

        // إعادة تعيين عداد الدفعات الفارغة
        consecutiveEmptyBatches = 0;

        // إضافة الموظفين الجدد (تجنب التكرار)
        const newEmployees = batchEmployees.filter((newEmployee: any) => 
          !allEmployees.some(existingEmployee => existingEmployee.id === newEmployee.id)
        );

        console.log(`✅ إضافة ${newEmployees.length} موظف جديد:`, {
          newEmployeeIds: newEmployees.map((e: any) => e.id),
          totalAfterAdd: allEmployees.length + newEmployees.length
        });

        allEmployees.push(...newEmployees);

        // تحديث currentLastId لآخر موظف في الدفعة
        if (batchEmployees.length > 0) {
          const lastEmployeeInBatch = batchEmployees[batchEmployees.length - 1];
          const newLastId = lastEmployeeInBatch.id;
          
          // تأكد من أن last_id يتقدم
          if (newLastId <= currentLastId) {
            console.log('⚠️ last_id لم يتقدم، زيادة يدوية:', {
              oldLastId: currentLastId,
              newLastId,
              forcedIncrement: currentLastId + 5
            });
            currentLastId = currentLastId + 5;
          } else {
            currentLastId = newLastId;
          }
        }

        // إذا حصلنا على أقل من 3 موظفين، قد نكون وصلنا للنهاية
        // لكن تابع المحاولة للتأكد (قد توجد فجوات في البيانات)
        if (batchEmployees.length < batchSize) {
          console.log('📉 دفعة جزئية، محاولة المتابعة للتأكد من عدم وجود موظفين آخرين');
          // لا نتوقف مباشرة، نعطي فرص أكثر
        }

        // حماية من الحلقة اللانهائية - حد مرن يمكن رفعه حسب الحاجة
        if (allEmployees.length >= 1000) {
          console.warn('⚠️ تم الوصول للحد الأقصى الأمني (1000 موظف) - إيقاف لحماية الأداء');
          break;
        }
      }

      // قطع النتائج حسب الحجم المطلوب
      const finalEmployees = allEmployees.slice(0, targetSize);

      console.log('📊 النتيجة النهائية للموظفين (نظام مفتوح):', {
        companyId,
        startingLastId: lastId,
        finalLastId: currentLastId,
        totalIterations: iterations,
        totalEmployeesFound: allEmployees.length,
        employeesReturned: finalEmployees.length,
        employeeNames: finalEmployees.map((e: any) => e.userName),
        employeeIds: finalEmployees.map((e: any) => e.id),
        hasMore: allEmployees.length >= targetSize,
        systemCapacity: 'مفتوح لعدد غير محدود من الموظفين'
      });

      return {
        success: true,
        data: finalEmployees
      };
    } catch (error: any) {
      console.error("خطأ في جلب موظفي الشركة:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء جلب موظفي الشركة",
      };
    }
  },

  // البحث الشامل في الموظفين عبر جميع الصفحات
  async searchCompanyEmployees(companyId: number, searchTerm: string, filters?: {
    job?: string;
    jobHOM?: string;
    activation?: string;
  }): Promise<ApiResponse<Employee[]>> {
    try {
      console.log('🔍 بدء البحث الشامل في الموظفين:', {
        companyId,
        searchTerm,
        filters,
        note: 'البحث عبر جميع الموظفين وليس فقط الصفحة الحالية'
      });

      // إذا لم يكن هناك مصطلح بحث أو فلاتر، ارجع قائمة فارغة
      if (!searchTerm.trim() && !filters?.job && !filters?.jobHOM && !filters?.activation) {
        return {
          success: true,
          data: []
        };
      }

      // جلب جميع الموظفين على دفعات للبحث فيهم
      const allEmployees: any[] = [];
      let currentLastId = 0;
      const batchSize = 3;
      let consecutiveEmptyBatches = 0;
      const maxIterations = 200; // حد أعلى للبحث الشامل
      let iterations = 0;

      console.log('🚀 جلب جميع الموظفين للبحث فيهم...');

      // جلب جميع الموظفين
      while (iterations < maxIterations) {
        iterations++;
        
        const response = await apiClient.get("/user/BringUserCompany", {
          params: {
            IDCompany: companyId,
            number: currentLastId
          }
        });

        if (!response.data?.success) {
          console.error('❌ خطأ في استجابة API أثناء البحث:', response.data);
          break;
        }

        const batchEmployees = response.data.data || [];
        
        if (batchEmployees.length === 0) {
          consecutiveEmptyBatches++;
          if (consecutiveEmptyBatches >= 5) {
            console.log('🔚 انتهاء البيانات - البحث مكتمل');
            break;
          }
          currentLastId += 5;
          continue;
        }

        consecutiveEmptyBatches = 0;

        // إضافة الموظفين الجدد (تجنب التكرار)
        const newEmployees = batchEmployees.filter((newEmployee: any) => 
          !allEmployees.some(existingEmployee => existingEmployee.id === newEmployee.id)
        );

        allEmployees.push(...newEmployees);

        // تحديث currentLastId
        if (batchEmployees.length > 0) {
          const lastEmployeeInBatch = batchEmployees[batchEmployees.length - 1];
          const newLastId = lastEmployeeInBatch.id;
          
          if (newLastId <= currentLastId) {
            currentLastId = currentLastId + 5;
          } else {
            currentLastId = newLastId;
          }
        }

        // حد أمني للبحث
        if (allEmployees.length >= 2000) {
          console.warn('⚠️ تم الوصول للحد الأقصى في البحث (2000 موظف)');
          break;
        }

        // إذا كان البحث محدوداً ووجدنا نتائج كافية، يمكن التوقف
        if (searchTerm.trim() && allEmployees.length >= 100) {
          // نحتفظ بحد معقول من النتائج للبحث الأولي
          const searchResults = allEmployees.filter(employee => {
            const term = searchTerm.toLowerCase();
            return (
              employee.userName.toLowerCase().includes(term) ||
              employee.job.toLowerCase().includes(term) ||
              employee.jobHOM.toLowerCase().includes(term) ||
              String(employee.PhoneNumber).includes(term) ||
              String(employee.IDNumber).includes(term) ||
              (employee.jobdiscrption && employee.jobdiscrption.toLowerCase().includes(term))
            );
          });

          if (searchResults.length >= 20) {
            // إذا وجدنا نتائج كافية، يمكن التوقف مبكراً لتحسين الأداء
            console.log('🎯 تم العثور على نتائج كافية، توقف مبكر لتحسين الأداء');
            break;
          }
        }
      }

      console.log('📊 إجمالي الموظفين المجمعة للبحث:', {
        totalEmployees: allEmployees.length,
        iterations,
        searchTerm,
        filters
      });

      // تطبيق فلاتر البحث
      let filteredEmployees = allEmployees;

      // فلترة حسب مصطلح البحث
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredEmployees = filteredEmployees.filter(employee => 
          employee.userName.toLowerCase().includes(term) ||
          employee.job.toLowerCase().includes(term) ||
          employee.jobHOM.toLowerCase().includes(term) ||
          String(employee.PhoneNumber).includes(term) ||
          String(employee.IDNumber).includes(term) ||
          (employee.jobdiscrption && employee.jobdiscrption.toLowerCase().includes(term))
        );
      }

      // فلترة حسب الوظيفة
      if (filters?.job) {
        filteredEmployees = filteredEmployees.filter(employee => 
          employee.job === filters.job
        );
      }

      // فلترة حسب القسم
      if (filters?.jobHOM) {
        filteredEmployees = filteredEmployees.filter(employee => 
          employee.jobHOM === filters.jobHOM
        );
      }

      // فلترة حسب الحالة
      if (filters?.activation) {
        filteredEmployees = filteredEmployees.filter(employee => 
          employee.Activation === filters.activation
        );
      }

      // ترتيب النتائج حسب الصلة (الأسماء أولاً)
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredEmployees.sort((a, b) => {
          const aNameMatch = a.userName.toLowerCase().includes(term);
          const bNameMatch = b.userName.toLowerCase().includes(term);
          
          if (aNameMatch && !bNameMatch) return -1;
          if (!aNameMatch && bNameMatch) return 1;
          
          // إذا كان كلاهما يطابق الاسم أو لا يطابق، رتب أبجدياً
          return a.userName.localeCompare(b.userName, 'ar');
        });
      }

      // الحد الأقصى للنتائج (لتحسين الأداء)
      const maxResults = 50;
      const finalResults = filteredEmployees.slice(0, maxResults);

      console.log('🎯 نتائج البحث النهائية:', {
        searchTerm,
        filters,
        totalEmployeesSearched: allEmployees.length,
        matchingResults: filteredEmployees.length,
        returnedResults: finalResults.length,
        resultNames: finalResults.map(e => e.userName),
        hasMore: filteredEmployees.length > maxResults
      });

      return {
        success: true,
        data: finalResults
      };
    } catch (error: any) {
      console.error("خطأ في البحث في الموظفين:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء البحث في الموظفين",
      };
    }
  },

  // تحديث موظف
  async updateEmployee(employeeData: {
    id: number;
    userName?: string;
    IDNumber?: string;
    PhoneNumber?: string;
    jobdiscrption?: string;
    job?: string;
    jobHOM?: string;
    Validity?: string;
  }): Promise<ApiResponse<Employee>> {
    try {
      console.log('🔄 بدء تحديث الموظف في API:', {
        employeeId: employeeData.id,
        data: employeeData
      });

      const response = await apiClient.put("/user/updat", employeeData);
      
      console.log('📥 استجابة تحديث الموظف:', {
        status: response.status,
        data: response.data
      });

      if (response.data) {
        // الخادم قد يرسل استجابات مختلفة
        const isSuccess = response.data.success === "تمت العملية بنجاح" || 
                         response.data.success === true ||
                         response.data.masseg === "تمت العملية بنجاح" ||
                         response.data.message === "تمت العملية بنجاح";
        
        return {
          success: isSuccess,
          data: response.data,
          message: response.data.success || response.data.masseg || response.data.message
        };
      } else {
        return {
          success: false,
          error: "لم يتم الحصول على استجابة صحيحة من الخادم"
        };
      }
    } catch (error: any) {
      console.error("💥 خطأ في API تحديث الموظف:", {
        error,
        employeeId: employeeData.id,
        message: error.message,
        response: error.response?.data
      });

      let errorMessage = "حدث خطأ أثناء تحديث الموظف";
      
      if (error.response) {
        const statusCode = error.response.status;
        const serverError = error.response.data?.error || error.response.data?.message;
        
        if (statusCode === 404) {
          errorMessage = "الموظف غير موجود";
        } else if (statusCode === 403) {
          errorMessage = "ليس لديك صلاحية لتحديث هذا الموظف";
        } else if (statusCode === 400) {
          errorMessage = serverError || "البيانات المرسلة غير صحيحة";
        } else if (serverError) {
          errorMessage = serverError;
        }
      } else if (error.request) {
        errorMessage = "لا يمكن الوصول للخادم، تحقق من الاتصال بالإنترنت";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // إضافة موظف جديد
  async createEmployee(employeeData: {
    IDCompany: number;
    userName: string;
    IDNumber: string;
    PhoneNumber: string;
    jobdiscrption: string;
    job: string;
    jobHOM?: string;
    Validity?: string;
  }): Promise<ApiResponse<Employee>> {
    try {
      console.log('➕ بدء إضافة موظف جديد في API:', {
        companyId: employeeData.IDCompany,
        employeeName: employeeData.userName,
        data: employeeData
      });

      const response = await apiClient.post("/user", employeeData);
      
      console.log('📥 استجابة إضافة الموظف:', {
        status: response.status,
        data: response.data
      });

      if (response.data) {
        // الخادم قد يرسل استجابات مختلفة
        const isSuccess = response.data.success === "تمت العملية بنجاح" || 
                         response.data.success === true ||
                         response.data.masseg === "تمت العملية بنجاح" ||
                         response.data.message === "تمت العملية بنجاح";
        
        return {
          success: isSuccess,
          data: response.data,
          message: response.data.success || response.data.masseg || response.data.message
        };
      } else {
        return {
          success: false,
          error: "لم يتم الحصول على استجابة صحيحة من الخادم"
        };
      }
    } catch (error: any) {
      console.error("💥 خطأ في API إضافة الموظف:", {
        error,
        companyId: employeeData.IDCompany,
        employeeName: employeeData.userName,
        message: error.message,
        response: error.response?.data
      });

      let errorMessage = "حدث خطأ أثناء إضافة الموظف";
      
      if (error.response) {
        const statusCode = error.response.status;
        const serverError = error.response.data?.error || error.response.data?.message;
        
        if (statusCode === 400) {
          errorMessage = serverError || "البيانات المرسلة غير صحيحة";
        } else if (statusCode === 409) {
          errorMessage = "موظف برقم الهوية أو الهاتف موجود مسبقاً";
        } else if (statusCode === 403) {
          errorMessage = "ليس لديك صلاحية لإضافة موظفين لهذه الشركة";
        } else if (serverError) {
          errorMessage = serverError;
        }
      } else if (error.request) {
        errorMessage = "لا يمكن الوصول للخادم، تحقق من الاتصال بالإنترنت";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // حذف موظف (تعطيل)
  async deleteEmployee(employee: Employee): Promise<ApiResponse> {
    try {
      console.log('🗑️ بدء حذف الموظف في API:', {
        employeeId: employee.id,
        employeeName: employee.userName,
        phoneNumber: employee.PhoneNumber,
        endpoint: '/user/DeletUser'
      });

      // الخادم يتوقع PhoneNumber وليس id
      const requestData = { PhoneNumber: employee.PhoneNumber };
      const response = await apiClient.put("/user/DeletUser", requestData);
      
      console.log('📥 استجابة حذف الموظف:', {
        status: response.status,
        data: response.data
      });

      if (response.data) {
        // الخادم يرسل { success: "تمت العملية بنجاح" } وليس { success: true }
        const isSuccess = response.data.success === "تمت العملية بنجاح" || response.data.success === true;
        
        return {
          success: isSuccess,
          data: response.data,
          message: response.data.success || response.data.message
        };
      } else {
        return {
          success: false,
          error: "لم يتم الحصول على استجابة صحيحة من الخادم"
        };
      }
    } catch (error: any) {
      console.error("💥 خطأ في API حذف الموظف:", {
        error,
        employeeId: employee.id,
        phoneNumber: employee.PhoneNumber,
        message: error.message,
        response: error.response?.data
      });

      let errorMessage = "حدث خطأ أثناء حذف الموظف";
      
      if (error.response) {
        const statusCode = error.response.status;
        const serverError = error.response.data?.error || error.response.data?.message;
        
        if (statusCode === 404) {
          errorMessage = "الموظف غير موجود أو تم حذفه مسبقاً";
        } else if (statusCode === 403) {
          errorMessage = "ليس لديك صلاحية لحذف هذا الموظف";
        } else if (statusCode === 409) {
          errorMessage = "لا يمكن حذف الموظف لوجود بيانات مرتبطة به";
        } else if (serverError) {
          errorMessage = serverError;
        }
      } else if (error.request) {
        errorMessage = "لا يمكن الوصول للخادم، تحقق من الاتصال بالإنترنت";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // تم حذف البحث الشامل من الواجهة

  // ================================
  // APIs تفاصيل المشروع المحسنة
  // ================================

  // جلب تفاصيل المشروع الكاملة
  async getProjectFullDetails(projectId: number): Promise<ApiResponse<any>> {
    try {
      const response = await apiClient.get("/brinshCompany/BringProject", {
        params: { ProjectID: projectId }
      });
      return response.data;
    } catch (error: any) {
      console.error("خطأ في جلب تفاصيل المشروع:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء جلب تفاصيل المشروع",
      };
    }
  },

  // جلب المراحل الرئيسية مع تصحيح مشاكل العرض والتنقل
  async getProjectMainStages(projectId: number, lastId = 0): Promise<ApiResponse<any[]>> {
    try {
      console.log(`🔍 [API] بدء جلب المراحل الرئيسية:`, { projectId, lastId });
      
      const response = await apiClient.get("/brinshCompany/BringStage", {
        params: {
          ProjectID: projectId,
          type: "cache"
        }
      });

      console.log(`📡 [API] استجابة الباك اند الخام:`, {
        status: response.status,
        success: response.data?.success,
        dataExists: !!response.data?.data,
        dataLength: response.data?.data?.length,
        firstStage: response.data?.data?.[0],
        fullResponse: response.data
      });

      if (!response.data?.success) {
        console.error('❌ [API] فشل الباك اند:', response.data);
        return {
          success: false,
          error: "فشل في الحصول على استجابة ناجحة من الباك اند"
        };
      }

      const allStages = response.data.data || [];
      console.log(`📊 [API] جميع المراحل المُستلمة:`, {
        totalStages: allStages.length,
        stageNames: allStages.map((s: any) => s.StageName || s.name),
        stageIDs: allStages.map((s: any) => s.StageID || s.StageCustID || s.id),
        sampleStages: allStages.slice(0, 3)
      });

      return {
        success: true,
        data: allStages,
        totalCount: allStages.length,
        hasMore: false // نجلب كل البيانات مرة واحدة
      };
    } catch (error: any) {
      console.error("❌ [API] خطأ في جلب المراحل الرئيسية:", {
        error: error.message,
        response: error.response?.data,
        status: error.response?.status,
        url: error.config?.url,
        params: error.config?.params
      });
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء جلب المراحل الرئيسية",
      };
    }
  },

    // جلب المراحل الفرعية لمرحلة محددة مع نظام batching (7→10)
  async getStageSubStages(stageId: number, projectId: number, lastId = 0, limit = 10): Promise<ApiResponse<any[]>> {
    try {
      console.log(`🔍 [API] جلب المراحل الفرعية مع Batching - StageID: ${stageId}, ProjectID: ${projectId}, lastId: ${lastId}, targetLimit: ${limit}`);
      
      let allSubStages: any[] = [];
      let currentLastId = lastId;
      let maxIterations = 5; // حماية من التكرار اللانهائي
      let iteration = 0;

      // جلب البيانات على دفعات من 7 عناصر حتى نصل إلى 10
      while (allSubStages.length < limit && iteration < maxIterations) {
        console.log(`📦 Batch ${iteration + 1}: جلب من lastId=${currentLastId}`);
        
        const response = await apiClient.get("/brinshCompany/BringStagesub", {
        params: { 
            StageID: stageId,
          ProjectID: projectId,
            type: "update",
            number: currentLastId
          }
        });

        if (!response.data?.success) {
          console.log(`❌ فشل في batch ${iteration + 1}:`, response.data?.error);
          break;
        }

        const batchData = response.data.data || [];
                 console.log(`📨 Batch ${iteration + 1} response:`, {
           batchSize: batchData.length,
           totalCollected: allSubStages.length,
           batchData: batchData.map((item: any) => ({ StageSubID: item.StageSubID, StageSubName: item.StageSubName }))
        });

        if (batchData.length === 0) {
          console.log(`🔚 لا توجد بيانات إضافية في batch ${iteration + 1}`);
          break;
        }

        // إضافة البيانات الجديدة
        allSubStages.push(...batchData);
        
        // تحديث lastId للدفعة التالية
        if (batchData.length > 0) {
          currentLastId = batchData[batchData.length - 1].StageSubID;
        }

        // إذا حصلنا على أقل من 7 عناصر، فهذا يعني أننا وصلنا للنهاية
        if (batchData.length < 7) {
          console.log(`🔚 وصلنا للنهاية - آخر batch حجمه ${batchData.length}`);
          break;
        }

        iteration++;
      }

      // تقليم النتائج إلى العدد المطلوب بالضبط
      const finalSubStages = allSubStages.slice(0, limit);

      console.log(`✅ [API] مجمع النتائج النهائية:`, {
        totalBatches: iteration,
        totalCollected: allSubStages.length,
        targetLimit: limit,
        finalCount: finalSubStages.length,
        hasMore: allSubStages.length === limit && iteration < maxIterations
      });

             return {
         success: true,
         data: finalSubStages
       };

    } catch (error: any) {
      console.error("❌ [API] خطأ في جلب المراحل الفرعية:", error);
      console.error("❌ [API] تفاصيل الخطأ:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء جلب المراحل الفرعية",
      };
    }
  },

  // جلب ملاحظات المرحلة والتأخيرات
  async getStageNotes(stageId: number, projectId: number): Promise<ApiResponse<any[]>> {
    try {
              console.log(`🔍 [API] جلب ملاحظات المرحلة - StageID: ${stageId}, ProjectID: ${projectId}`);
      
      const response = await apiClient.get("/brinshCompany/BringStageNotes", {
        params: { 
          StageID: stageId,
          ProjectID: projectId
        }
      });
      
      console.log(`📨 [API] استجابة ملاحظات المرحلة:`, response.data);
      console.log(`📊 [API] حالة الاستجابة للملاحظات:`, {
        status: response.status,
        success: response.data?.success,
        dataLength: response.data?.data?.length,
        data: response.data?.data
      });
      
      return response.data;
    } catch (error: any) {
      console.error("❌ [API] خطأ في جلب ملاحظات المرحلة:", error);
      console.error("❌ [API] تفاصيل خطأ الملاحظات:", {
        message: error.message,
        status: error.response?.status,
        statusText: error.response?.statusText,
        data: error.response?.data
      });
      
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء جلب ملاحظات المرحلة",
      };
    }
  },

  // جلب المصاريف بنفس منطق الباك إند - إصلاح المعاملات
  async getProjectExpenses(projectId: number, lastId = 0, limit = 10): Promise<ApiResponse<any[]>> {
    try {
      console.log('🔧 جلب المصاريف - إصلاح المعاملات:', { projectId, lastId });
      
      // إصلاح نطاق التاريخ ليشمل كل السنوات
      const fromtime = `2020-01-01`;  // بداية من 2020
      const totime = `2030-12-31`;    // حتى 2030
      
      console.log('📅 نطاق التاريخ:', { fromtime, totime, note: 'نطاق واسع لضمان جلب جميع البيانات' });
      
      const response = await apiClient.get("/brinshCompany/SearchinFinance", {
        params: { 
          projectID: projectId,
          type: "مصروفات",
          from: 0,                  // من 0
          to: 999999999,           // إلى رقم كبير جداً
          fromtime: fromtime,
          totime: totime,
          count: lastId            // count للـ pagination
        }
      });
      
      console.log('📤 معاملات مرسلة للباك إند:', {
        projectID: projectId,
        type: "مصروفات", 
        from: 0,
        to: 999999999,
        fromtime,
        totime,
        count: lastId
      });
      
      console.log('📥 استجابة خام من الباك إند:', {
        success: response.data?.success,
        dataLength: response.data?.data?.length,
        rawResponse: response.data
      });
      
      if (response.data?.success !== "تمت العملية بنجاح") {
        console.error('❌ فشل في جلب المصاريف:', response.data);
        return { success: false, error: "فشل في جلب بيانات المصاريف" };
      }
      
      const expenses = response.data?.data || [];
      
      console.log('📥 بيانات خام من الباك إند (مرتبة حسب التاريخ):', {
        count_sent: lastId,
        results_length: expenses.length,
        backend_sql: 'ORDER BY Date DESC',
        first_3_raw: expenses.slice(0, 3).map((e: any) => ({
          id: e.Expenseid,
          invoiceNo: e.InvoiceNo,
          date: e.Date,
          amount: e.Amount
        }))
      });
      
      // احتفاظ بآخر Expenseid من البيانات الخام للـ pagination
      const rawLastExpenseId = expenses.length > 0 ? expenses[expenses.length - 1].Expenseid : lastId;
      
      // 🔧 إصلاح الترتيب في الفرونت إند: ترتيب المصروفات حسب رقم الفاتورة
      expenses.sort((a: any, b: any) => {
        const invoiceA = a.InvoiceNo || 0;
        const invoiceB = b.InvoiceNo || 0;
        return invoiceB - invoiceA; // ترتيب تنازلي حسب رقم الفاتورة
      });
      
      console.log('✅ بعد الترتيب في الفرونت إند (حسب رقم الفاتورة):', {
        frontend_sort: 'ORDER BY InvoiceNo DESC',
        first_3_sorted: expenses.slice(0, 3).map((e: any) => ({
          id: e.Expenseid,
          invoiceNo: e.InvoiceNo,
          date: e.Date,
          amount: e.Amount
        })),
        note: 'إصلاح اللخبطة في ترتيب الفواتير'
      });
      
      // حساب hasMore: إذا حصلنا على 10 نتائج، فقد يكون هناك المزيد
      const hasMore = expenses.length === 10;
      
      console.log('🔄 معلومات Pagination:', {
        hasMore,
        rawLastExpenseId,
        sortedLastInvoiceNo: expenses.length > 0 ? expenses[expenses.length - 1].InvoiceNo : 'لا يوجد',
        note: 'Pagination يستخدم آخر Expenseid من البيانات الخام، ليس من المرتبة'
      });
      
      return {
        success: true,
        data: expenses,
        hasMore: hasMore,
        lastId: rawLastExpenseId
      } as any;
    } catch (error: any) {
      console.error("خطأ في جلب المصاريف:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء جلب المصاريف",
      };
    }
  },

  // جلب العهد بنفس منطق الباك إند - إصلاح المعاملات
  async getProjectRevenues(projectId: number, lastId = 0, limit = 10): Promise<ApiResponse<any[]>> {
    try {
      console.log('🔧 جلب العهد - إصلاح المعاملات:', { projectId, lastId });
      
      // إصلاح نطاق التاريخ ليشمل كل السنوات
      const fromtime = `2020-01-01`;
      const totime = `2030-12-31`;
      
      console.log('📅 نطاق التاريخ للعهد:', { fromtime, totime });
      
      const response = await apiClient.get("/brinshCompany/SearchinFinance", {
        params: { 
          projectID: projectId,
          type: "عهد",
          from: 0,
          to: 999999999,
          fromtime: fromtime,
          totime: totime,
          count: lastId
        }
      });
      
      console.log('📤 معاملات مرسلة للباك إند (العهد):', {
        projectID: projectId,
        type: "عهد",
        from: 0,
        to: 999999999,
        fromtime,
        totime,
        count: lastId
      });
      
      console.log('📥 استجابة خام من الباك إند (العهد):', {
        success: response.data?.success,
        dataLength: response.data?.data?.length,
        rawResponse: response.data
      });
      
      if (response.data?.success !== "تمت العملية بنجاح") {
        console.error('❌ فشل في جلب العهد:', response.data);
        return { success: false, error: "فشل في جلب بيانات العهد" };
      }
      
      const revenues = response.data?.data || [];
      
      console.log('✅ نتائج العهد:', { 
        count_sent: lastId,
        results_length: revenues.length,
        expected_sql: lastId === 0 
          ? 'SELECT * FROM Revenue WHERE projectID = ? AND RevenueId > 0 ORDER BY Date DESC LIMIT 10'
          : `SELECT * FROM Revenue WHERE projectID = ? AND RevenueId < ${lastId} ORDER BY Date DESC LIMIT 10`,
        first_revenue: revenues[0] ? {
          id: revenues[0].RevenueId,
          date: revenues[0].Date,
          amount: revenues[0].Amount,
          data: revenues[0].Data
        } : 'لا توجد بيانات',
        last_revenue: revenues[revenues.length - 1] ? {
          id: revenues[revenues.length - 1].RevenueId,
          date: revenues[revenues.length - 1].Date,
          amount: revenues[revenues.length - 1].Amount
        } : 'لا توجد بيانات'
      });
      
      // حساب hasMore: إذا حصلنا على 10 نتائج، فقد يكون هناك المزيد
      const hasMore = revenues.length === 10;
      
      // آخر ID للصفحة التالية (أصغر ID في النتائج الحالية)
      const newLastId = revenues.length > 0 ? revenues[revenues.length - 1].RevenueId : lastId;
      
      return {
        success: true,
        data: revenues,
        hasMore: hasMore,
        lastId: newLastId
      } as any;
    } catch (error: any) {
      console.error("خطأ في جلب العهد:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء جلب العهد",
      };
    }
  },



  // جلب الطلبات وفق آلية الباك (v2) مع ترقيم lastID ودمج الحالات المفتوحة/المغلقة وأنواع مختلفة
  async getProjectDetailedRequests(projectId: number, page = 1, limit = 10): Promise<ApiResponse<any[]>> {
    try {
      console.log('🔍 v2 - جلب طلبات المشروع بالترقيم:', { projectId, page, limit });
      const pageSizeBackend = 10; // حد الباك لكل نداء

      // 1) جلب أعداد الطلبات من الباك (V2)
      let totalCount = 0;
      try {
        const countRes = await apiClient.get('/brinshCompany/v2/BringCountRequsts', {
          params: { ProjectID: projectId, type: 'part' }
        });
        const open = Number(countRes.data?.data?.Open || 0);
        const close = Number(countRes.data?.data?.Close || 0);
        totalCount = open + close;
      } catch (e) {
        console.warn('⚠️ فشل جلب الأعداد الإجمالية، سيتم التقدير لاحقاً:', (e as any)?.message);
      }

      const targetEnd = page * limit;
      const buffers: any[] = [];
      let lastIdTrue = 0;  // للمفتوحة
      let lastIdFalse = 0; // للمغلقة
      let moreTrue = true;
      let moreFalse = true;

      // 2) نجلب على دفعات متناوبة من المفتوحة والمغلقة حتى نغطي الصفحة المطلوبة
      const fetchBatch = async (doneVal: 'true' | 'false') => {
        const lastID = doneVal === 'true' ? lastIdTrue : lastIdFalse;
        const resp = await apiClient.get('/brinshCompany/v2/BringDataRequests', {
          params: {
            ProjectID: projectId,
            Type: '',            // فارغ ليشمل كل الأنواع (يتحول إلى LIKE '%%')
            kind: 'part',
            Done: doneVal,
            lastID: lastID,
          }
        });
        const data: any[] = resp.data?.data || [];
        if (data.length > 0) {
          buffers.push(...data);
          const minId = data[data.length - 1]?.RequestsID || lastID;
          if (doneVal === 'true') lastIdTrue = minId; else lastIdFalse = minId;
          if (data.length < pageSizeBackend) {
            if (doneVal === 'true') moreTrue = false; else moreFalse = false;
          }
        } else {
          if (doneVal === 'true') moreTrue = false; else moreFalse = false;
        }
      };

      // نجلب بالتناوب حتى نصل إلى الحد المطلوب أو تنفد البيانات
      while ((buffers.length < targetEnd) && (moreTrue || moreFalse)) {
        if (moreTrue) await fetchBatch('true');
        if (buffers.length >= targetEnd) break;
        if (moreFalse) await fetchBatch('false');
      }

      // دمج وترتيب حسب RequestsID تنازلي ثم التاريخ
      const sorted = buffers
        .sort((a: any, b: any) => {
          if (b.RequestsID !== a.RequestsID) return b.RequestsID - a.RequestsID;
          const dateA = new Date(a.Date || a.DateTime || 0).getTime();
          const dateB = new Date(b.Date || b.DateTime || 0).getTime();
          return dateB - dateA;
        });

      // 3) حساب الصفحة المطلوبة
      const startIndex = (page - 1) * limit;
      const pageData = sorted.slice(startIndex, startIndex + limit);

      const totalPages = totalCount > 0 ? Math.max(1, Math.ceil(totalCount / limit)) : undefined;

      return {
        success: true,
        data: pageData,
        totalCount: totalCount || sorted.length,
        totalPages: totalPages || Math.max(1, Math.ceil(sorted.length / limit)),
        currentPage: page,
        method: 'v2-merged'
      } as any;
    } catch (error: any) {
      console.error('💥 خطأ في جلب طلبات v2:', error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || 'حدث خطأ أثناء جلب الطلبات',
        data: []
      };
    }
  },

  // جلب الأرشيف والملفات مع limit - مُصحح
  async getProjectArchives(projectId: number, page = 1, limit = 10): Promise<ApiResponse<any[]>> {
    try {
      console.log('🚀 جلب الأرشيف:', { projectId, page, limit });
      const response = await apiClient.get("/brinshCompany/BringArchives", {
        params: { 
          idproject: projectId  // تصحيح اسم المعامل
        }
      });
      console.log('📥 استجابة الأرشيف:', response.data);
      return {
        success: response.data?.success === true,  // تصحيح فحص النجاح
        data: response.data?.data || []
      };
    } catch (error: any) {
      console.error("خطأ في جلب الأرشيف:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء جلب الأرشيف",
      };
    }
  },

  // جلب المرتجعات بنفس منطق الباك إند - إصلاح المعاملات
  async getProjectReturns(projectId: number, lastId = 0, limit = 10): Promise<ApiResponse<any[]>> {
    try {
      console.log('🔧 جلب المرتجعات - إصلاح المعاملات:', { projectId, lastId });
      
      // إصلاح نطاق التاريخ ليشمل كل السنوات
      const fromtime = `2020-01-01`;
      const totime = `2030-12-31`;
      
      console.log('📅 نطاق التاريخ للمرتجعات:', { fromtime, totime });
      
      const response = await apiClient.get("/brinshCompany/SearchinFinance", {
        params: { 
          projectID: projectId,
          type: "مرتجع",
          from: 0,
          to: 999999999,
          fromtime: fromtime,
          totime: totime,
          count: lastId
        }
      });
      
      console.log('📤 معاملات مرسلة للباك إند (المرتجعات):', {
        projectID: projectId,
        type: "مرتجع",
        from: 0,
        to: 999999999,
        fromtime,
        totime,
        count: lastId
      });
      
      console.log('📥 استجابة خام من الباك إند (المرتجعات):', {
        success: response.data?.success,
        dataLength: response.data?.data?.length,
        rawResponse: response.data
      });
      
      if (response.data?.success !== "تمت العملية بنجاح") {
        console.error('❌ فشل في جلب المرتجعات:', response.data);
        return { success: false, error: "فشل في جلب بيانات المرتجعات" };
      }
      
      const returns = response.data?.data || [];
      
      console.log('✅ نتائج المرتجعات:', { 
        count_sent: lastId,
        results_length: returns.length,
        expected_sql: lastId === 0 
          ? 'SELECT * FROM Returns WHERE projectID = ? AND ReturnsId > 0 ORDER BY Date DESC LIMIT 10'
          : `SELECT * FROM Returns WHERE projectID = ? AND ReturnsId < ${lastId} ORDER BY Date DESC LIMIT 10`,
        first_return: returns[0] ? {
          id: returns[0].ReturnsId,
          date: returns[0].Date,
          amount: returns[0].Amount,
          data: returns[0].Data
        } : 'لا توجد بيانات',
        last_return: returns[returns.length - 1] ? {
          id: returns[returns.length - 1].ReturnsId,
          date: returns[returns.length - 1].Date,
          amount: returns[returns.length - 1].Amount
        } : 'لا توجد بيانات'
      });
      
      // حساب hasMore: إذا حصلنا على 10 نتائج، فقد يكون هناك المزيد
      const hasMore = returns.length === 10;
      
      // آخر ID للصفحة التالية (أصغر ID في النتائج الحالية)
      const newLastId = returns.length > 0 ? returns[returns.length - 1].ReturnsId : lastId;
      
      return {
        success: true,
        data: returns,
        hasMore: hasMore,
        lastId: newLastId
      } as any;
    } catch (error: any) {
      console.error("خطأ في جلب المرتجعات:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء جلب المرتجعات",
      };
    }
  },

  // جلب العهد المالية - Endpoint مُصحح  
  async getProjectFinancialCustody(projectId: number, companyId: number, branchId: number, page = 1, limit = 10): Promise<ApiResponse<any[]>> {
    try {
      console.log('🚀 جلب العهد المالية:', { projectId, companyId, branchId, page, limit });
      const response = await apiClient.get("/companies/brinsh/BringDataFinancialCustody", {
        params: { 
          IDCompany: companyId,
          IDCompanySub: branchId,
          kindRequest: "معلقة",  // يمكن تغييرها لمغلقة أو مرفوضة
          LastID: 0
        }
      });
      console.log('📥 استجابة العهد المالية:', response.data);
      return {
        success: response.data?.success === "تمت العملية بنجاح",
        data: response.data?.data || []
      };
    } catch (error: any) {
      console.error("خطأ في جلب العهد المالية:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء جلب العهد المالية",
      };
    }
  },

  // جلب فروع شركة محددة مع pagination محسن
  async getCompanyBranches(companyId: number, lastId = 0, limit = 10): Promise<ApiResponse<Branch[]>> {
    try {
      console.log('🏢 بدء تحميل الفروع:', {
        companyId,
        lastId,
        limit,
        endpoint: '/companies/{id}/subs'
      });

      const response = await apiClient.get(`/companies/${companyId}/subs`, {
        params: { 
          number: lastId,
          limit: limit
        }
      });

      console.log('📥 استجابة تحميل الفروع:', {
        status: response.status,
        dataLength: response.data?.data?.length || 0,
        data: response.data
      });

      if (response.data) {
        return {
          success: true,
          data: response.data.data || response.data,
          message: response.data.message
        };
      } else {
        return {
          success: false,
          error: "لم يتم الحصول على استجابة صحيحة من الخادم"
        };
      }
    } catch (error: any) {
      console.error("💥 خطأ في API تحميل الفروع:", {
        error,
        companyId,
        lastId,
        message: error.message,
        response: error.response?.data
      });

      let errorMessage = "حدث خطأ أثناء تحميل الفروع";
      
      if (error.response) {
        const statusCode = error.response.status;
        const serverError = error.response.data?.error || error.response.data?.message;
        
        if (statusCode === 404) {
          errorMessage = "الشركة غير موجودة أو لا توجد فروع";
        } else if (statusCode === 403) {
          errorMessage = "ليس لديك صلاحية لعرض فروع هذه الشركة";
        } else if (serverError) {
          errorMessage = serverError;
        }
      } else if (error.request) {
        errorMessage = "لا يمكن الوصول للخادم، تحقق من الاتصال بالإنترنت";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // إنشاء فرع جديد مع معالجة محسنة
  async createBranch(companyId: number, branchData: {
    name: string;
    manager?: string;
    address?: string;
    email?: string;
    phone?: string;
  }): Promise<ApiResponse<Branch>> {
    try {
      console.log('➕ بدء إضافة فرع جديد:', {
        companyId,
        branchName: branchData.name,
        data: branchData
      });

      const response = await apiClient.post(`/companies/${companyId}/subs`, branchData);
      
      console.log('📥 استجابة إضافة الفرع:', {
        status: response.status,
        data: response.data
      });

      if (response.data) {
        const isSuccess = response.data.success === "تمت العملية بنجاح" || 
                         response.data.success === true ||
                         response.data.masseg === "تمت العملية بنجاح" ||
                         response.data.message === "تمت العملية بنجاح";
        
        return {
          success: isSuccess,
          data: response.data,
          message: response.data.success || response.data.masseg || response.data.message
        };
      } else {
        return {
          success: false,
          error: "لم يتم الحصول على استجابة صحيحة من الخادم"
        };
      }
    } catch (error: any) {
      console.error("💥 خطأ في API إضافة الفرع:", {
        error,
        companyId,
        branchName: branchData.name,
        message: error.message,
        response: error.response?.data
      });

      let errorMessage = "حدث خطأ أثناء إضافة الفرع";
      
      if (error.response) {
        const statusCode = error.response.status;
        const serverError = error.response.data?.error || error.response.data?.message;
        
        if (statusCode === 400) {
          errorMessage = serverError || "البيانات المرسلة غير صحيحة";
        } else if (statusCode === 409) {
          errorMessage = "فرع بنفس الاسم موجود مسبقاً";
        } else if (statusCode === 403) {
          errorMessage = "ليس لديك صلاحية لإضافة فروع لهذه الشركة";
        } else if (statusCode === 429) {
          errorMessage = "تم الوصول للحد الأقصى من الفروع المسموحة";
        } else if (serverError) {
          errorMessage = serverError;
        }
      } else if (error.request) {
        errorMessage = "لا يمكن الوصول للخادم، تحقق من الاتصال بالإنترنت";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // تحديث فرع مع معالجة محسنة
  async updateBranch(branchId: number, branchData: {
    name?: string;
    manager?: string;
    address?: string;
    email?: string;
    phone?: string;
  }): Promise<ApiResponse<Branch>> {
    try {
      console.log('🔄 بدء تحديث الفرع:', {
        branchId,
        data: branchData
      });

      const response = await apiClient.put(`/companies/subs/${branchId}`, branchData);
      
      console.log('📥 استجابة تحديث الفرع:', {
        status: response.status,
        data: response.data
      });

      if (response.data) {
        const isSuccess = response.data.success === "تمت العملية بنجاح" || 
                         response.data.success === true ||
                         response.data.masseg === "تمت العملية بنجاح" ||
                         response.data.message === "تمت العملية بنجاح";
        
        return {
          success: isSuccess,
          data: response.data,
          message: response.data.success || response.data.masseg || response.data.message
        };
      } else {
        return {
          success: false,
          error: "لم يتم الحصول على استجابة صحيحة من الخادم"
        };
      }
    } catch (error: any) {
      console.error("💥 خطأ في API تحديث الفرع:", {
        error,
        branchId,
        message: error.message,
        response: error.response?.data
      });

      let errorMessage = "حدث خطأ أثناء تحديث الفرع";
      
      if (error.response) {
        const statusCode = error.response.status;
        const serverError = error.response.data?.error || error.response.data?.message;
        
        if (statusCode === 404) {
          errorMessage = "الفرع غير موجود";
        } else if (statusCode === 403) {
          errorMessage = "ليس لديك صلاحية لتحديث هذا الفرع";
        } else if (statusCode === 400) {
          errorMessage = serverError || "البيانات المرسلة غير صحيحة";
        } else if (statusCode === 409) {
          errorMessage = "فرع بنفس الاسم موجود مسبقاً";
        } else if (serverError) {
          errorMessage = serverError;
        }
      } else if (error.request) {
        errorMessage = "لا يمكن الوصول للخادم، تحقق من الاتصال بالإنترنت";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // حذف فرع مع معالجة محسنة
  async deleteBranch(branchId: number): Promise<ApiResponse> {
    try {
      console.log('🗑️ بدء حذف الفرع:', {
        branchId,
        endpoint: `/companies/subs/${branchId}`
      });

      const response = await apiClient.delete(`/companies/subs/${branchId}`);
      
      console.log('📥 استجابة حذف الفرع:', {
        status: response.status,
        data: response.data
      });

      if (response.data) {
        const isSuccess = response.data.success === "تمت العملية بنجاح" || 
                         response.data.success === true ||
                         response.data.masseg === "تمت العملية بنجاح" ||
                         response.data.message === "تمت العملية بنجاح";
        
        return {
          success: isSuccess,
          data: response.data,
          message: response.data.success || response.data.masseg || response.data.message
        };
      } else {
        return {
          success: false,
          error: "لم يتم الحصول على استجابة صحيحة من الخادم"
        };
      }
    } catch (error: any) {
      console.error("💥 خطأ في API حذف الفرع:", {
        error,
        branchId,
        message: error.message,
        response: error.response?.data
      });

      let errorMessage = "حدث خطأ أثناء حذف الفرع";
      
      if (error.response) {
        const statusCode = error.response.status;
        const serverError = error.response.data?.error || error.response.data?.message;
        
        if (statusCode === 404) {
          errorMessage = "الفرع غير موجود أو تم حذفه مسبقاً";
        } else if (statusCode === 403) {
          errorMessage = "ليس لديك صلاحية لحذف هذا الفرع";
        } else if (statusCode === 409) {
          errorMessage = "لا يمكن حذف الفرع لوجود مشاريع مرتبطة به";
        } else if (serverError) {
          errorMessage = serverError;
        }
      } else if (error.request) {
        errorMessage = "لا يمكن الوصول للخادم، تحقق من الاتصال بالإنترنت";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // البحث الشامل في الفروع
  async searchCompanyBranches(
    companyId: number, 
    searchTerm: string, 
    filters?: {
      manager?: string;
      isActive?: string;
      city?: string;
    }
  ): Promise<ApiResponse<Branch[]>> {
    try {
      console.log('🔍 بدء البحث الشامل في الفروع:', {
        companyId,
        searchTerm,
        filters,
        note: 'البحث الشامل في جميع فروع الشركة'
      });

      // نجلب جميع الفروع أولاً ثم نفلتر محلياً
      // (يمكن تحسين هذا لاحقاً بإضافة endpoint بحث مخصص)
      const allBranches: Branch[] = [];
      let lastId = 0;
      let hasMore = true;
      let iterations = 0;
      const maxIterations = 100;

      while (hasMore && iterations < maxIterations) {
        iterations++;
        const response = await this.getCompanyBranches(companyId, lastId, 10);
        
        if (!response.success) {
          throw new Error(response.error);
        }
        
        const branches = response.data || [];
        if (branches.length === 0) {
          hasMore = false;
        } else {
          allBranches.push(...branches);
          lastId = branches[branches.length - 1].id;
          hasMore = branches.length === 10;
        }
      }

      // تطبيق الفلترة المحلية
      let filteredBranches = allBranches;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredBranches = filteredBranches.filter(branch =>
          branch.name.toLowerCase().includes(term) ||
          branch.manager?.toLowerCase().includes(term) ||
          branch.address?.toLowerCase().includes(term) ||
          branch.email?.toLowerCase().includes(term) ||
          branch.phone?.toLowerCase().includes(term)
        );
      }

      if (filters) {
        if (filters.manager) {
          filteredBranches = filteredBranches.filter(branch =>
            branch.manager?.toLowerCase().includes(filters.manager!.toLowerCase())
          );
        }
        
        if (filters.isActive !== undefined && filters.isActive !== '') {
          const isActive = filters.isActive === 'true';
          filteredBranches = filteredBranches.filter(branch => branch.isActive === isActive);
        }

        if (filters.city) {
          filteredBranches = filteredBranches.filter(branch =>
            branch.address?.toLowerCase().includes(filters.city!.toLowerCase())
          );
        }
      }

      console.log('🎯 نتائج البحث في الفروع:', {
        searchTerm,
        filtersApplied: filters,
        totalBranchesFound: allBranches.length,
        filteredResults: filteredBranches.length,
        branches: filteredBranches.map(b => ({ id: b.id, name: b.name, manager: b.manager }))
      });

      return {
        success: true,
        data: filteredBranches,
        message: `تم العثور على ${filteredBranches.length} فرع`
      };

    } catch (error: any) {
      console.error("💥 خطأ في البحث الشامل للفروع:", {
        error,
        companyId,
        searchTerm,
        filters,
        message: error.message
      });

      return {
        success: false,
        error: error.message || "حدث خطأ أثناء البحث في الفروع",
      };
    }
  },

  // جلب التقارير المالية - Endpoint مُصحح
  async getProjectFinancialReports(projectId: number, page = 1, limit = 10): Promise<ApiResponse<any[]>> {
    try {
      console.log('🚀 جلب التقارير المالية:', { projectId, page, limit });
      const response = await apiClient.get("/brinshCompany/BringReportforProject", {
        params: { 
          ProjectID: projectId
        }
      });
      console.log('📥 استجابة التقارير المالية:', response.data);
      return {
        success: response.data?.success === "تمت العملية بنجاح",
        data: response.data?.data || []
      };
    } catch (error: any) {
      console.error("خطأ في جلب التقارير المالية:", error);
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء جلب التقارير المالية",
      };
    }
  },

  // APIs الشركات المتقدمة - متوافقة مع نظام الفروع
  
  // جلب الشركات مع last_id pagination متقدم (متوافق مع الفروع)
  async getAdvancedCompanies(lastId = 0, limit = 10): Promise<ApiResponse<Company[]>> {
    try {
      console.log('🏢 بدء تحميل الشركات (النظام المتقدم):', {
        lastId,
        limit,
        endpoint: '/companies',
        system: 'متوافق مع نظام الفروع'
      });

      const response = await apiClient.get("/companies", {
        params: { 
          number: lastId,
          limit: limit,
          _timestamp: new Date().getTime() // Cache busting
        }
      });

      console.log('📥 استجابة تحميل الشركات المتقدم:', {
        status: response.status,
        dataLength: response.data?.data?.length || 0,
        countcompany: response.data?.countcompany,
        data: response.data
      });

      if (response.data && response.data.success !== false) {
        return {
          success: true,
          data: response.data.data || response.data,
          countcompany: response.data.countcompany,
          totalCount: response.data.countcompany,
          message: response.data.message || response.data.masseg
        };
      } else {
        return {
          success: false,
          error: response.data?.error || "لم يتم الحصول على استجابة صحيحة من الخادم"
        };
      }
    } catch (error: any) {
      console.error("💥 خطأ في API تحميل الشركات المتقدم:", {
        error,
        lastId,
        limit,
        message: error.message,
        response: error.response?.data
      });

      let errorMessage = "حدث خطأ أثناء تحميل الشركات";
      
      if (error.response) {
        const statusCode = error.response.status;
        const serverError = error.response.data?.error || error.response.data?.message;
        
        if (statusCode === 404) {
          errorMessage = "لا توجد شركات مسجلة";
        } else if (statusCode === 403) {
          errorMessage = "ليس لديك صلاحية لعرض الشركات";
        } else if (serverError) {
          errorMessage = serverError;
        }
      } else if (error.request) {
        errorMessage = "لا يمكن الوصول للخادم، تحقق من الاتصال بالإنترنت";
      }

      return {
        success: false,
        error: errorMessage,
      };
    }
  },

  // البحث الشامل في الشركات مع فلاتر متقدمة (متوافق مع نظام الفروع)
  async searchAdvancedCompanies(
    searchTerm: string, 
    filters?: {
      city?: string;
      country?: string;
      isActive?: string;
    }
  ): Promise<ApiResponse<Company[]>> {
    try {
      console.log('🔍 بدء البحث الشامل في الشركات:', {
        searchTerm,
        filters,
        note: 'البحث الشامل في جميع الشركات - متوافق مع نظام الفروع'
      });

      // نجلب جميع الشركات أولاً ثم نفلتر محلياً (مثل نظام الفروع تماماً)
      const allCompanies: Company[] = [];
      let lastId = 0;
      let hasMore = true;
      let iterations = 0;
      const maxIterations = 100;

      while (hasMore && iterations < maxIterations) {
        iterations++;
        console.log(`📦 محاولة جلب دفعة الشركات ${iterations}:`, { lastId });
        
        const response = await this.getAdvancedCompanies(lastId, 10);
        
        if (!response.success) {
          throw new Error(response.error);
        }
        
        const companies = response.data || [];
        if (companies.length === 0) {
          hasMore = false;
        } else {
          allCompanies.push(...companies);
          lastId = companies[companies.length - 1].id;
          hasMore = companies.length === 10;
        }
      }

      console.log('📊 إجمالي الشركات المجلبة للبحث:', {
        totalCompanies: allCompanies.length,
        iterations,
        companiesNames: allCompanies.map(c => c.name).slice(0, 10) // عرض أول 10 أسماء فقط
      });

      // تطبيق الفلترة المحلية (مثل نظام الفروع تماماً)
      let filteredCompanies = allCompanies;

      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase();
        filteredCompanies = filteredCompanies.filter(company =>
          company.name.toLowerCase().includes(term) ||
          company.address?.toLowerCase().includes(term) ||
          company.city?.toLowerCase().includes(term) ||
          company.country?.toLowerCase().includes(term) ||
          company.registrationNumber?.toLowerCase().includes(term)
        );
      }

      if (filters) {
        if (filters.city) {
          filteredCompanies = filteredCompanies.filter(company =>
            company.city?.toLowerCase().includes(filters.city!.toLowerCase())
          );
        }
        
        if (filters.country) {
          filteredCompanies = filteredCompanies.filter(company =>
            company.country?.toLowerCase().includes(filters.country!.toLowerCase())
          );
        }

        if (filters.isActive !== undefined && filters.isActive !== '') {
          if (filters.isActive === 'active') {
            filteredCompanies = filteredCompanies.filter(company => {
              const now = new Date();
              const endDate = new Date(company.subscriptionEnd);
              return company.isActive && endDate > now;
            });
          } else if (filters.isActive === 'expired') {
            filteredCompanies = filteredCompanies.filter(company => {
              const now = new Date();
              const endDate = new Date(company.subscriptionEnd);
              return !company.isActive || endDate <= now;
            });
          }
        }
      }

      console.log('🎯 نتائج البحث في الشركات:', {
        searchTerm,
        filtersApplied: filters,
        totalCompaniesSearched: allCompanies.length,
        filteredResults: filteredCompanies.length,
        companies: filteredCompanies.map(c => ({ id: c.id, name: c.name, city: c.city, country: c.country, isActive: c.isActive }))
      });

      return {
        success: true,
        data: filteredCompanies,
        message: `تم العثور على ${filteredCompanies.length} شركة`
      };

    } catch (error: any) {
      console.error("💥 خطأ في البحث الشامل للشركات:", {
        error,
        searchTerm,
        filters,
        message: error.message
      });

      return {
        success: false,
        error: error.message || "حدث خطأ أثناء البحث في الشركات",
      };
    }
  },

  // جلب العدد الفعلي للمشاريع لكل فرع (ميزة منفصلة)
  async getBranchProjectsActualCount(IDCompany: number, branchId: number): Promise<ApiResponse<{ count: number }>> {
    try {
      // جلب جميع المشاريع بدون تحديد حد أقصى
      const allProjects: any[] = [];
      let currentLastId = 0;
      const batchSize = 3; // حجم الدفعة الواحدة من الـ backend
      let consecutiveEmptyBatches = 0;
      const maxIterations = 500; // رفع الحد بشكل كبير لدعم عدد كبير من المشاريع
      let iterations = 0;

      // جلب المشاريع على دفعات حتى نصل للنهاية
      while (iterations < maxIterations) {
        iterations++;

        const response = await apiClient.get("/brinshCompany/v2/BringProject", {
          params: {
            IDCompany: IDCompany,
            IDcompanySub: branchId,
            IDfinlty: currentLastId,
            type: "cache",
            kind: "all",
            order: "ASC"
          }
        });

        if (!response.data?.success) {
          break;
        }

        const batchProjects = response.data.data || [];

        if (batchProjects.length === 0) {
          consecutiveEmptyBatches++;
          
          // إذا حصلنا على 5 دفعات فارغة متتالية، نعتبر أننا وصلنا للنهاية
          if (consecutiveEmptyBatches >= 5) {
            break;
          }
          
          // جرب زيادة last_id بقفزة أكبر في حالة وجود فجوات في البيانات
          currentLastId += 5;
          continue;
        }

        // إعادة تعيين عداد الدفعات الفارغة
        consecutiveEmptyBatches = 0;

        // إضافة المشاريع الجديدة (تجنب التكرار)
        const newProjects = batchProjects.filter((newProject: any) => 
          !allProjects.some(existingProject => existingProject.id === newProject.id)
        );

        allProjects.push(...newProjects);

        // تحديث currentLastId لآخر مشروع في الدفعة
        if (batchProjects.length > 0) {
          const lastProjectInBatch = batchProjects[batchProjects.length - 1];
          const newLastId = lastProjectInBatch.id;
          
          // تأكد من أن last_id يتقدم
          if (newLastId <= currentLastId) {
            currentLastId = currentLastId + 5;
          } else {
            currentLastId = newLastId;
          }
        }

        // حماية من الحلقة اللانهائية - حد مرن يمكن رفعه حسب الحاجة
        if (allProjects.length >= 10000) {
          break;
        }
      }

      const actualCount = allProjects.length;
      
      return {
        success: true,
        data: { count: actualCount }
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.response?.data?.error || error.message || "حدث خطأ أثناء جلب العدد الفعلي للمشاريع للفرع",
      };
    }
  },
};

export default companiesSubscribedApi; 