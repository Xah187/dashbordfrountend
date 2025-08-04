// تعريفات الأنواع الأساسية للمشروع

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  department?: string;
  permissions: Permission[];
  phoneNumber?: string;
  lastLogin?: string;
  createdAt: string;
  isActive: boolean;
  twoFactorEnabled?: boolean;
}

export enum UserRole {
  ADMIN = 'مدير',
  MANAGER = 'مشرف',
  USER = 'مستخدم',
  VIEWER = 'مشاهد'
}

export enum Permission {
  VIEW_DASHBOARD = 'عرض_لوحة_التحكم',
  MANAGE_USERS = 'إدارة_المستخدمين',
  MANAGE_PROJECTS = 'إدارة_المشاريع',
  MANAGE_TASKS = 'إدارة_المهام',
  MANAGE_COMPANIES = 'إدارة_الشركات',
  MANAGE_SUBSCRIPTIONS = 'إدارة_الاشتراكات',
  MANAGE_SETTINGS = 'إدارة_الإعدادات'
}

export interface Project {
  id: string;
  title: string;
  description: string;
  startDate: string;
  endDate: string;
  status: ProjectStatus;
  progress: number;
  budget?: number;
  teamMembers: User[];
  tasks: Task[];
  client?: Company;
  createdAt: string;
  updatedAt: string;
  tags?: string[];
}

export enum ProjectStatus {
  NOT_STARTED = 'لم_يبدأ',
  IN_PROGRESS = 'جاري_العمل',
  ON_HOLD = 'معلق',
  COMPLETED = 'منجز',
  CANCELLED = 'ملغي',
  SUSPENDED = 'متوقف'
}

export interface Task {
  id: string;
  title: string;
  description: string;
  assignedTo?: User;
  project?: Project;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string;
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
  comments: Comment[];
  progress: number;
  estimatedHours?: number;
  actualHours?: number;
  order?: number;
}

export enum TaskStatus {
  TODO = 'قيد_الانتظار',
  IN_PROGRESS = 'قيد_التنفيذ',
  REVIEW = 'قيد_المراجعة',
  COMPLETED = 'مكتمل',
  BLOCKED = 'معطل'
}

export enum TaskPriority {
  LOW = 'منخفض',
  MEDIUM = 'متوسط',
  HIGH = 'عالي',
  URGENT = 'عاجل'
}

export interface Attachment {
  id: string;
  fileName: string;
  fileSize: number;
  fileType: string;
  uploadedBy: User;
  uploadedAt: string;
  url: string;
}

export interface Comment {
  id: string;
  content: string;
  createdBy: User;
  createdAt: string;
  updatedAt: string;
  attachments: Attachment[];
}

export interface Company {
  id: string;
  name: string;
  logo?: string;
  industry: string;
  contactEmail: string;
  contactPhone?: string;
  address?: string;
  website?: string;
  subscription?: Subscription;
  createdAt: string;
  projects?: Project[];
  isActive: boolean;
}

export interface Subscription {
  id: string;
  plan: SubscriptionPlan;
  startDate: string;
  endDate: string;
  status: SubscriptionStatus;
  price: number;
  autoRenew: boolean;
  company: Company;
}

export enum SubscriptionPlan {
  BASIC = 'أساسي',
  STANDARD = 'قياسي',
  PREMIUM = 'متميز',
  ENTERPRISE = 'مؤسسات'
}

export enum SubscriptionStatus {
  ACTIVE = 'نشط',
  EXPIRED = 'منتهي',
  CANCELLED = 'ملغي',
  PENDING = 'معلق'
}



export interface Notification {
  id: string;
  title: string;
  content: string;
  type: NotificationType;
  isRead: boolean;
  createdAt: string;
  user: User;
  link?: string;
  relatedEntityId?: string;
  relatedEntityType?: string;
}

export enum NotificationType {
  INFO = 'معلومات',
  SUCCESS = 'نجاح',
  WARNING = 'تحذير',
  ERROR = 'خطأ'
}

export interface ActivityLog {
  id: string;
  action: string;
  performedBy: User;
  targetEntity: string;
  targetEntityId: string;
  details?: any;
  timestamp: string;
  ipAddress?: string;
}

export interface ThemeSettings {
  darkMode: boolean;
  primaryColor?: string;
  fontSize?: string;
  density?: 'compact' | 'normal' | 'comfortable';
}

export interface UserSettings {
  id: string;
  user: User;
  theme: ThemeSettings;
  notifications: NotificationSettings;
  language: string;
  lastUpdated: string;
}

export interface NotificationSettings {
  email: boolean;
  push: boolean;
  taskAssignment: boolean;
  taskUpdate: boolean;
  projectUpdate: boolean;
  mentions: boolean;
  teamActivity: boolean;
}

export interface HelpArticle {
  id: string;
  title: string;
  content: string;
  category: string;
  tags: string[];
  publishedAt: string;
  updatedAt: string;
  author: User;
  relatedArticles?: string[];
}
