/**
 * Date utilities for Gregorian calendar formatting
 * تنسيق التواريخ بالتقويم الميلادي
 */

// تنسيق التاريخ الميلادي الأساسي
export const formatGregorianDate = (dateString: string | Date): string => {
  if (!dateString) return 'غير محدد';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'تاريخ غير صالح';
  
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
};

// تنسيق التاريخ والوقت الميلادي
export const formatGregorianDateTime = (dateString: string | Date): string => {
  if (!dateString) return 'غير محدد';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'تاريخ وقت غير صالح';
  
  return date.toLocaleDateString('en-GB', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  }) + ' ' + date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// تنسيق الوقت فقط
export const formatGregorianTime = (dateString: string | Date): string => {
  if (!dateString) return 'غير محدد';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'وقت غير صالح';
  
  return date.toLocaleTimeString('en-GB', {
    hour: '2-digit',
    minute: '2-digit'
  });
};

// تنسيق التاريخ الطويل (مع اسم الشهر)
export const formatGregorianDateLong = (dateString: string | Date): string => {
  if (!dateString) return 'غير محدد';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'تاريخ غير صالح';
  
  return date.toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric'
  });
};

// تنسيق تاريخ قصير (شهر/سنة)
export const formatGregorianMonthYear = (dateString: string | Date): string => {
  if (!dateString) return 'غير محدد';
  
  const date = new Date(dateString);
  if (isNaN(date.getTime())) return 'تاريخ غير صالح';
  
  return date.toLocaleDateString('en-GB', {
    month: 'short',
    year: 'numeric'
  });
};

// للتوافق مع النظام القديم - دالة موحدة
export const formatDate = formatGregorianDate;
export const formatDateTime = formatGregorianDateTime;
export const formatTime = formatGregorianTime;

// دالة لتحويل التواريخ في استجابات API
export const convertApiDatesToGregorian = (data: any): any => {
  if (!data) return data;
  
  if (Array.isArray(data)) {
    return data.map(item => convertApiDatesToGregorian(item));
  }
  
  if (typeof data === 'object') {
    const converted = { ...data };
    
    // البحث عن حقول التواريخ الشائعة
    const dateFields = [
      'date', 'createdAt', 'updatedAt', 'startDate', 'endDate',
      'loginDate', 'logoutDate', 'requestDate', 'completedDate',
      'noteDate', 'sentDate', 'postDate', 'subscriptionStart',
      'subscriptionEnd', 'joinDate', 'closeDate'
    ];
    
    dateFields.forEach(field => {
      if (converted[field]) {
        converted[`${field}Gregorian`] = formatGregorianDate(converted[field]);
      }
    });
    
    // معالجة nested objects
    Object.keys(converted).forEach(key => {
      if (typeof converted[key] === 'object') {
        converted[key] = convertApiDatesToGregorian(converted[key]);
      }
    });
    
    return converted;
  }
  
  return data;
}; 