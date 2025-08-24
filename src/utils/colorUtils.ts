/**
 * وظائف مساعدة لإدارة ألوان الأدوار والصلاحيات في التطبيق
 */

// تعريف أنواع الصلاحيات
export type PermissionType = 'admin' | 'superadmin' | 'manager' | 'user' | 'viewer' | 'inactive';

// الألوان حسب نوع الصلاحيات
export const permissionColors: Record<PermissionType, string> = {
  'admin': '#4a7bff',       // أزرق مشرف
  'superadmin': '#673ab7',  // بنفسجي مشرف عام
  'manager': '#00b0ff',     // أزرق فاتح مدير
  'user': '#00c853',        // أخضر مستخدم عادي
  'viewer': '#ffab00',      // برتقالي مشاهد
  'inactive': '#ff5252'     // أحمر غير نشط
};

// تعريف أنواع الأقسام
export type DepartmentType = 
  'الهندسة' | 'التصميم' | 'المقاولات' | 'الجودة' | 'المالية' | 
  'الإدارة' | 'الموارد البشرية' | 'المشتريات' | 'التسويق' | 
  'تقنية المعلومات' | 'الأمن والسلامة' | 'الشؤون القانونية' | 'default';

// الألوان حسب القسم
export const departmentColors: Record<DepartmentType, string> = {
  'الهندسة': '#2196f3',
  'التصميم': '#9c27b0',
  'المقاولات': '#ff9800',
  'الجودة': '#4caf50',
  'المالية': '#f44336',
  'الإدارة': '#3f51b5',
  'الموارد البشرية': '#e91e63',
  'المشتريات': '#009688',
  'التسويق': '#cddc39',
  'تقنية المعلومات': '#00bcd4',
  'الأمن والسلامة': '#795548',
  'الشؤون القانونية': '#607d8b',
  'default': '#757575'  // لون افتراضي للأقسام غير المعروفة
};

// تعريف أنواع حالة المهام
export type TaskStatusType = 'pending' | 'in_progress' | 'review' | 'completed' | 'cancelled' | 'delayed';

// الألوان حسب حالة المهمة
export const taskStatusColors: Record<TaskStatusType, string> = {
  'pending': '#ffb74d',    // برتقالي - قيد الانتظار
  'in_progress': '#4fc3f7', // أزرق فاتح - قيد التنفيذ
  'review': '#ba68c8',     // بنفسجي - قيد المراجعة
  'completed': '#81c784',   // أخضر - مكتمل
  'cancelled': '#e57373',   // أحمر - ملغي
  'delayed': '#ff8a65'      // برتقالي محمر - متأخر
};

// تعريف أنواع أولوية المهام
export type TaskPriorityType = 'low' | 'medium' | 'high' | 'urgent';

// الألوان حسب أولوية المهمة
export const taskPriorityColors: Record<TaskPriorityType, string> = {
  'low': '#81c784',      // أخضر - منخفضة
  'medium': '#64b5f6',   // أزرق - متوسطة
  'high': '#ffb74d',     // برتقالي - عالية
  'urgent': '#e57373'    // أحمر - عاجلة
};

// تعريف أنواع الشركات
export type CompanyType = 'مقاول' | 'استشاري' | 'مالك' | 'مورد' | 'شريك' | 'أخرى';

// الألوان حسب نوع الشركة
export const companyTypeColors: Record<CompanyType, string> = {
  'مقاول': '#ff9800',     // برتقالي - مقاول
  'استشاري': '#9c27b0',   // بنفسجي - استشاري
  'مالك': '#2196f3',      // أزرق - مالك
  'مورد': '#4caf50',      // أخضر - مورد
  'شريك': '#3f51b5',      // أزرق داكن - شريك
  'أخرى': '#757575'       // رمادي - أخرى
};

// تعريف أنواع حالة الشركة
export type CompanyStatusType = 'نشطة' | 'نشط' | 'معلقة' | 'معلق' | 'محظورة' | 'مكتملة' | 'متوقفة';

// الألوان حسب حالة الشركة
export const companyStatusColors: Record<CompanyStatusType, string> = {
  'نشطة': '#4caf50',      // أخضر - نشطة
  'نشط': '#4caf50',       // أخضر - نشط (للتوافق)
  'معلقة': '#ff9800',     // برتقالي - معلقة
  'معلق': '#ff9800',      // برتقالي - معلق (للتوافق)
  'محظورة': '#f44336',    // أحمر - محظورة
  'مكتملة': '#2196f3',    // أزرق - مكتملة
  'متوقفة': '#9e9e9e'     // رمادي - متوقفة
};

// تعريف أنواع الفروع
export type BranchType = 'رئيسي' | 'فرعي' | 'مكتب مبيعات' | 'مستودع' | 'معرض' | 'مصنع' | 'أخرى';

// الألوان حسب نوع الفرع
export const branchTypeColors: Record<BranchType, string> = {
  'رئيسي': '#3f51b5',      // أزرق داكن - رئيسي
  'فرعي': '#5c6bc0',       // أزرق فاتح - فرعي
  'مكتب مبيعات': '#26a69a', // أخضر مزرق - مكتب مبيعات
  'مستودع': '#8d6e63',     // بني - مستودع
  'معرض': '#7e57c2',       // بنفسجي - معرض
  'مصنع': '#ef5350',       // أحمر - مصنع
  'أخرى': '#78909c'        // رمادي مزرق - أخرى
};

// تعريف أنواع الاشتراكات
export type SubscriptionType = 'شهري' | 'ربع سنوي' | 'نصف سنوي' | 'سنوي' | 'تجريبي' | 'مخصص';

// الألوان حسب نوع الاشتراك
export const subscriptionTypeColors: Record<SubscriptionType, string> = {
  'شهري': '#26c6da',       // أزرق فاتح - شهري
  'ربع سنوي': '#9c27b0',   // بنفسجي - ربع سنوي
  'نصف سنوي': '#00bcd4',   // سماوي - نصف سنوي
  'سنوي': '#2196f3',       // أزرق - سنوي
  'تجريبي': '#ff9800',     // برتقالي - تجريبي
  'مخصص': '#607d8b'        // رمادي مزرق - مخصص
};

// تعريف حالات الاشتراكات
export type SubscriptionStatusType = 'active' | 'expired' | 'expiring' | 'نشط' | 'منتهي' | 'قيد التجديد' | 'ملغي' | 'معلق';

// الألوان حسب حالة الاشتراك
export const subscriptionStatusColors: Record<SubscriptionStatusType, string> = {
  'active': '#4caf50',      // أخضر - نشط
  'expired': '#f44336',     // أحمر - منتهي
  'expiring': '#ff9800',    // برتقالي - ينتهي قريباً
  'نشط': '#4caf50',        // أخضر - نشط
  'منتهي': '#f44336',      // أحمر - منتهي
  'قيد التجديد': '#ff9800', // برتقالي - قيد التجديد
  'ملغي': '#9e9e9e',       // رمادي - ملغي
  'معلق': '#ffc107'        // أصفر - معلق
};

// تعريف حالات التجديد التلقائي
export type AutoRenewType = 'مفعل' | 'غير مفعل';

// الألوان حسب حالة التجديد التلقائي
export const autoRenewColors: Record<AutoRenewType, string> = {
  'مفعل': '#00c853',       // أخضر فاتح - مفعل
  'غير مفعل': '#757575'    // رمادي - غير مفعل
};

// تعريف ألوان الشعار والعلامة التجارية
export const brandColors = {
  primary: '#2117FB',      // اللون الأزرق الرئيسي للشركة
  secondary: '#f50057',    // اللون الثانوي
  logoBackground: '#2117FB', // خلفية الشعار
  accent: '#00c853',       // لون التمييز
  notification: '#ff1744'  // لون الإشعارات
};

// تعريف ألوان الرسوم البيانية
export const chartColors = [
  '#4a7bff', // أزرق فاتح
  '#00c853', // أخضر واضح
  '#ffab00', // برتقالي فاتح
  '#ff5252', // أحمر واضح
  '#00b0ff', // أزرق فاتح مختلف
  '#673ab7', // بنفسجي
  '#f50057', // وردي
  '#009688', // تركواز
  '#607d8b', // رمادي أزرق
  '#ff6d00'  // برتقالي داكن
];

/**
 * الحصول على لون مناسب للصلاحية
 * @param permission - نوع الصلاحية
 * @returns لون الصلاحية
 */
export const getPermissionColor = (permission: string): string => {
  return permissionColors[permission as PermissionType] || permissionColors.user;
};

/**
 * الحصول على لون مناسب للقسم
 * @param department - اسم القسم
 * @returns لون القسم
 */
export const getDepartmentColor = (department: string): string => {
  return departmentColors[department as DepartmentType] || departmentColors.default;
};

/**
 * الحصول على لون مناسب للحالة
 * @param isActive - حالة النشاط
 * @returns لون الحالة
 */
export const getStatusColor = (isActive: boolean): string => {
  return isActive ? '#00c853' : '#ff5252';
};

/**
 * أنماط شارة حالة هادئة (Soft) للخلفية والنص وحدود خفيفة
 */
export const getSoftStatusChipSx = (isActive: boolean): { bgcolor: string; color: string; border: string; borderColor: string } => {
  return isActive
    ? { bgcolor: 'rgba(76, 175, 80, 0.12)', color: '#2e7d32', border: '1px solid', borderColor: 'rgba(76,175,80,0.3)' }
    : { bgcolor: 'rgba(244, 67, 54, 0.12)', color: '#c62828', border: '1px solid', borderColor: 'rgba(244,67,54,0.3)' };
};

/**
 * أنماط شارة حالة الاشتراك هادئة حسب الحالة النصية
 */
export const getSoftSubscriptionStatusChipSx = (status: string): { bgcolor: string; color: string; border: string; borderColor: string } => {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    'active': { bg: 'rgba(76,175,80,0.12)', text: '#2e7d32', border: 'rgba(76,175,80,0.3)' },
    'نشط': { bg: 'rgba(76,175,80,0.12)', text: '#2e7d32', border: 'rgba(76,175,80,0.3)' },
    'expired': { bg: 'rgba(244,67,54,0.12)', text: '#c62828', border: 'rgba(244,67,54,0.3)' },
    'منتهي': { bg: 'rgba(244,67,54,0.12)', text: '#c62828', border: 'rgba(244,67,54,0.3)' },
    'expiring': { bg: 'rgba(255,152,0,0.12)', text: '#ef6c00', border: 'rgba(255,152,0,0.3)' },
    'قيد التجديد': { bg: 'rgba(255,152,0,0.12)', text: '#ef6c00', border: 'rgba(255,152,0,0.3)' },
    'معلق': { bg: 'rgba(255,193,7,0.12)', text: '#f9a825', border: 'rgba(255,193,7,0.3)' },
    'ملغي': { bg: 'rgba(158,158,158,0.18)', text: '#455a64', border: 'rgba(158,158,158,0.35)' },
  };
  const key = status in map ? status : (status || '').toString().toLowerCase();
  const v = map[key] || { bg: 'rgba(158,158,158,0.12)', text: '#546e7a', border: 'rgba(158,158,158,0.3)' };
  return { bgcolor: v.bg, color: v.text, border: '1px solid', borderColor: v.border };
};

/** أنماط شارة حالة المراحل: مكتملة/متأخرة/قيد التنفيذ */
export const getSoftStageStatusChipSx = (done: boolean, delayed: boolean): { bgcolor: string; color: string; border: string; borderColor: string } => {
  if (done) return { bgcolor: 'rgba(76,175,80,0.12)', color: '#2e7d32', border: '1px solid', borderColor: 'rgba(76,175,80,0.3)' };
  if (delayed) return { bgcolor: 'rgba(244,67,54,0.12)', color: '#c62828', border: '1px solid', borderColor: 'rgba(244,67,54,0.3)' };
  return { bgcolor: 'rgba(255,193,7,0.12)', color: '#ef6c00', border: '1px solid', borderColor: 'rgba(255,193,7,0.3)' };
};

/**
 * إنشاء لون أفاتار متناسق للمستخدم بناء على صلاحياته
 * @param user - معلومات المستخدم
 * @returns لون الأفاتار
 */
export const getUserAvatarColor = (user: any): string => {
  // إذا كان المستخدم غير نشط، استخدم لون غير نشط
  if (!user.isActive) {
    return permissionColors.inactive;
  }
  
  // استخدم لون حسب الصلاحية
  return getPermissionColor(user.permissions);
};

/**
 * الحصول على لون مناسب لحالة المهمة
 * @param status - حالة المهمة
 * @returns لون حالة المهمة
 */
export const getTaskStatusColor = (status: string): string => {
  return taskStatusColors[status as TaskStatusType] || '#757575';
};

/**
 * الحصول على لون مناسب لأولوية المهمة
 * @param priority - أولوية المهمة
 * @returns لون أولوية المهمة
 */
export const getTaskPriorityColor = (priority: string): string => {
  return taskPriorityColors[priority as TaskPriorityType] || '#757575';
};

/**
 * الحصول على لون مناسب لنوع الشركة
 * @param type - نوع الشركة
 * @returns لون نوع الشركة
 */
export const getCompanyTypeColor = (type: string): string => {
  return companyTypeColors[type as CompanyType] || companyTypeColors['أخرى'];
};

/**
 * الحصول على لون مناسب لحالة الشركة
 * @param status - حالة الشركة
 * @returns لون حالة الشركة
 */
export const getCompanyStatusColor = (status: string): string => {
  return companyStatusColors[status as CompanyStatusType] || '#757575';
};

/**
 * الحصول على لون مناسب لنوع الفرع
 * @param type - نوع الفرع
 * @returns لون نوع الفرع
 */
export const getBranchTypeColor = (type: string): string => {
  return branchTypeColors[type as BranchType] || branchTypeColors['أخرى'];
};

/**
 * الحصول على لون مناسب لنوع الاشتراك
 * @param type - نوع الاشتراك
 * @returns لون نوع الاشتراك
 */
export const getSubscriptionTypeColor = (type: string): string => {
  return subscriptionTypeColors[type as SubscriptionType] || subscriptionTypeColors['مخصص'];
};

/**
 * الحصول على لون مناسب لحالة الاشتراك
 * @param status - حالة الاشتراك
 * @returns لون حالة الاشتراك
 */
export const getSubscriptionStatusColor = (status: string): string => {
  return subscriptionStatusColors[status as SubscriptionStatusType] || '#757575';
};

/**
 * الحصول على لون مناسب لحالة التجديد التلقائي
 * @param autoRenew - حالة التجديد التلقائي (true/false أو "مفعل"/"غير مفعل")
 * @returns لون حالة التجديد التلقائي
 */
export const getAutoRenewColor = (autoRenew: boolean | string): string => {
  if (typeof autoRenew === 'boolean') {
    return autoRenew ? autoRenewColors['مفعل'] : autoRenewColors['غير مفعل'];
  }
  return autoRenewColors[autoRenew as AutoRenewType] || autoRenewColors['غير مفعل'];
};

/**
 * الحصول على ألوان الرسوم البيانية
 * @param count - عدد الألوان المطلوبة (اختياري)
 * @returns مصفوفة الألوان
 */
export const getChartColors = (count?: number): string[] => {
  if (!count || count >= chartColors.length) {
    return chartColors;
  }
  return chartColors.slice(0, count);
};

/**
 * الحصول على لون من مخطط التلوين حسب الفهرس
 * @param index - فهرس اللون المطلوب
 * @returns لون من مخطط التلوين
 */
export const getColorByIndex = (index: number): string => {
  return chartColors[index % chartColors.length];
};

/**
 * الحصول على لون الشعار
 * @returns لون خلفية الشعار
 */
export const getLogoColor = (): string => {
  return brandColors.logoBackground;
}; 