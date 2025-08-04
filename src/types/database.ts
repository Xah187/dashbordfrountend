// أنواع قاعدة البيانات المحددة من الباك إند

/**
 * جدول الشركات الرئيسي
 */
export interface Company {
  id: string;
  name: string;
  industry?: string;
  address?: string;
  city?: string;
  country?: string;
  contactEmail?: string;
  contactPhone?: string;
  website?: string;
  logo?: string;
  isActive: boolean;
  branchesCount?: number; // عدد الفروع الحالية
  branchesAllowed?: number; // عدد الفروع المسموح بها
  registrationNumber?: string; // رقم السجل التجاري
  buildingNumber?: string; // رقم المبنى
  streetName?: string; // اسم الشارع
  neighborhoodName?: string; // اسم الحي
  postalCode?: string; // الرمز البريدي
  taxNumber?: string; // الرقم الضريبي
  subscriptionStartDate?: string; // تاريخ بداية الاشتراك
  subscriptionEndDate?: string; // تاريخ انتهاء الاشتراك
  cost?: number; // التكلفة
  apiKey?: string; // مفتاح API الخاص بالشركة
  createdAt: string;
  updatedAt: string;
}

/**
 * جدول الفروع (companySub)
 */
export interface CompanySub {
  id: string;
  companyId: string; // Foreign Key to company
  name: string;
  manager?: string;
  address?: string;
  phone?: string;
  email?: string;
  employeesCount: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * جدول مشاريع الفروع (companySubprojects)
 */
export interface CompanySubProject {
  id: string;
  companySubId: string; // Foreign Key to companySub
  name: string;
  description?: string;
  contractType?: string; // نوع العقد
  location?: string; // موقع المشروع
  startDate?: string;
  endDate?: string;
  contractDate?: string; // تاريخ توقيع العقد
  cost?: number; // التكلفة
  progress: number; // معدل التقدم
  status: string; // حالة المشروع
  referenceNumber?: string | number; // رقم المرجع
  guardNumber?: string | number; // رقم الحارس
  numberBuilding?: number; // رقم المبنى
  userCount?: number; // عدد المستخدمين
  isActive?: boolean; // نشط أم لا
  budget?: number; // الميزانية (للتوافق مع الكود القديم)
  createdAt?: string;
  updatedAt?: string;
}

/**
 * جدول مهام المشاريع (StagesSub)
 */
export interface ProjectTask {
  id: string;
  projectId: string; // Foreign Key to companySubprojects
  stageCode: string; // رمز المرحلة (A1, B2, etc.)
  name: string;
  description?: string;
  status: 'pending' | 'in-progress' | 'completed';
  completedDate?: string;
  notes?: string;
  priority: 'عالية' | 'متوسطة' | 'منخفضة' | 'عادية';
  orderIndex: number; // ترتيب المهمة
  isCompleted: boolean;
  progress: number; // نسبة الإنجاز (0-100)
  createdAt?: string;
  updatedAt?: string;
}

/**
 * جدول مستخدمي الشركات (userscompany)
 */
export interface UsersCompany {
  id: string;
  userId: string; // Foreign Key to users table
  companyId: string; // Foreign Key to company
  role: UserRole;
  permissions: string[]; // JSON array of permissions
  joinedAt: string;
  isActive: boolean;
}

/**
 * جدول مراحل الفروع (StagesSub)
 */
export interface StagesSub {
  id: string;
  companySubProjectId: string; // Foreign Key to companySubprojects
  name: string;
  description?: string;
  order: number;
  status: StageStatus;
  startDate: string;
  endDate: string;
  progress: number;
  assignedTo?: string; // User ID
  createdAt: string;
  updatedAt: string;
}

/**
 * جدول قوالب المراحل (Templet)
 */
export interface StageTemplate {
  id: string;
  name: string;
  description?: string;
  category?: string;
  isDefault: boolean;
  createdBy: string; // User ID
  createdAt: string;
  updatedAt: string;
}

/**
 * جدول مراحل القوالب (StagesTemplet)
 */
export interface StagesTemplate {
  id: string;
  templateId: string; // Foreign Key to Templet
  name: string;
  description?: string;
  order: number;
  estimatedDuration: number; // in days
  dependencies?: string[]; // JSON array of stage IDs
  requiredSkills?: string[]; // JSON array of skills
  createdAt: string;
  updatedAt: string;
}

// Enums for status types
export enum ProjectStatus {
  NOT_STARTED = 'لم_يبدأ',
  IN_PROGRESS = 'جاري_العمل',
  ON_HOLD = 'معلق',
  COMPLETED = 'منجز',
  CANCELLED = 'ملغي',
  SUSPENDED = 'متوقف'
}

export enum StageStatus {
  PENDING = 'في_الانتظار',
  IN_PROGRESS = 'قيد_التنفيذ',
  REVIEW = 'قيد_المراجعة',
  COMPLETED = 'مكتمل',
  BLOCKED = 'معطل'
}

export enum UserRole {
  ADMIN = 'مدير',
  MANAGER = 'مشرف',
  USER = 'مستخدم',
  VIEWER = 'مشاهد'
}

export enum TaskPriority {
  HIGH = 'عالية',
  MEDIUM = 'متوسطة',
  LOW = 'منخفضة',
  NORMAL = 'عادية'
}

export enum TaskStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in-progress',
  COMPLETED = 'completed'
}

// Relations helpers
export interface CompanyWithSubs extends Company {
  companySubs?: CompanySub[];
  users?: UsersCompany[];
}

export interface CompanySubWithProjects extends CompanySub {
  projects?: CompanySubProject[];
}

export interface CompanySubProjectWithStages extends CompanySubProject {
  stages?: StagesSub[];
}

export interface CompanySubProjectWithTasks extends CompanySubProject {
  tasks?: ProjectTask[];
}

export interface TemplateWithStages extends StageTemplate {
  stages?: StagesTemplate[];
}

export interface Employee {
  id: number;
  companyId: number;
  name: string;
  nationalId: string;
  phone: string;
  image?: string;
  jobDescription: string;
  position: string;
  department: string;
  joinDate: string;
  isActive: boolean;
  branchRole: string;
  projectCount: number;
  hasCovenantAccess: boolean;
  status: 'نشط' | 'غير نشط';
  experienceYears: number;
  profileComplete: boolean;
  userType: 'owner' | 'admin' | 'manager' | 'engineer' | 'admin_staff' | 'employee' | 'visitor';
  userTypeLabel: string;
}

export interface EmployeeSummary {
  total: number;
  active: number;
  managers: number;
  withProjects: number;
}

export interface EmployeeDetailedStats {
  owners: number;
  admins: number;
  managers: number;
  engineers: number;
  adminStaff: number;
  employees: number;
  visitors: number;
}

export interface EmployeeFilters {
  sortBy: string | null;
  filterBy: string;
}

export interface EmployeesResponse {
  success: boolean;
  data: Employee[];
  count: number;
  totalCount: number;
  branchId: number;
  summary: EmployeeSummary;
  detailedStats: EmployeeDetailedStats;
  filteredStats: EmployeeSummary;
  filters: EmployeeFilters;
  message?: string;
}

export interface EmployeeStatsDetail {
  type: string;
  label: string;
  count: number;
  active: number;
  inactive: number;
  percentage: string;
  positions: string[];
}

export interface EmployeeStats {
  total: number;
  active: number;
  inactive: number;
  byType: {
    owners: number;
    managers: number;
    engineers: number;
    adminStaff: number;
    employees: number;
    visitors: number;
  };
  details: EmployeeStatsDetail[];
}

export interface EmployeeStatsResponse {
  success: boolean;
  branchId: number;
  stats: EmployeeStats;
  message?: string;
} 