/**
 * UserContext - إدارة بيانات المستخدمين المتعددين
 * 
 * 👥 يدعم جميع المستخدمين المسجلين في قاعدة البيانات:
 * 
 * ✅ جميع المستخدمين في جدول usersCompany
 * ✅ أي مستخدم لديه IDNumber صالح
 * ✅ أي مستخدم لديه PhoneNumber مسجل
 * ✅ جميع أنواع المستخدمين (Admin, مدير الفرع, موظف, إلخ)
 * ✅ جميع الشركات (IDCompany)
 * 
 * ❌ لا توجد قيود على مستخدم واحد أو شركة واحدة
 * ❌ لا توجد قيود على أدوار محددة
 * 
 * البيانات تُجلب من localStorage بعد تسجيل الدخول الناجح
 */

import React, { createContext, useContext, useState, useEffect } from "react";
import { apiClient } from '../api/config';

// إنشاء سياق المستخدم
const UserContext = createContext();

// مزود سياق المستخدم
export const UserProvider = ({ children }) => {
  // جلب بيانات المستخدم الحقيقية من localStorage
  const getStoredUserData = () => {
    try {
      const userData = localStorage.getItem("user");
      if (userData && userData !== 'null' && userData !== 'undefined') {
        const parsedData = JSON.parse(userData);
        
        // إذا كانت البيانات في كائن data، استخرجها (يدعم جميع المستخدمين)
        if (parsedData.success && parsedData.data) {
          return parsedData.data;
        }
        
        // إذا كانت البيانات في الجذر مباشرة
        return parsedData;
      }
      return null;
    } catch (error) {
      console.error("خطأ في قراءة بيانات المستخدم:", error);
      return null;
    }
  };

  const getStoredLastLogin = () => {
    return localStorage.getItem("lastLoginTime") || new Date().toISOString();
  };

  // تهيئة بيانات المستخدم من localStorage أو القيم الافتراضية
  const initializeUserProfile = () => {
    const storedUserData = getStoredUserData();
    
    if (storedUserData) {
      // استخدام البيانات الحقيقية من localStorage مع دمج البيانات المفقودة
      const phoneNumber = storedUserData.phone || storedUserData.PhoneNumber;
      const formattedPhone = phoneNumber ? 
        (phoneNumber.startsWith('+966') ? phoneNumber : `+966${phoneNumber}`) : 
        "+966 50 123 4567";
        

      
      return {
        id: storedUserData.id || storedUserData.IDNumber || 1,
        firstName: storedUserData.firstName || storedUserData.userName || "مستخدم",
        email: storedUserData.email || "",
        phone: formattedPhone,
        avatar: storedUserData.avatar || storedUserData.image || null,
        jobTitle: storedUserData.jobTitle || storedUserData.job || "مستخدم",
        role: storedUserData.role || "user",
        department: storedUserData.department || "",
        lastLogin: getStoredLastLogin(),
        createdAt: storedUserData.createdAt || getStoredLastLogin(),
        // إضافة حقول جديدة للمعلومات الشخصية
        address: storedUserData.address || "",
        bio: storedUserData.bio || storedUserData.jobdiscrption || "",
        socialLinks: storedUserData.socialLinks || {
          twitter: "",
          linkedin: "",
          github: "",
        },
        // إضافة معلومات إضافية من الباك اند
        companyId: storedUserData.companyId || storedUserData.IDCompany || null,
        isActive: storedUserData.isActive || storedUserData.Activation || true,
        codeVerification: storedUserData.codeVerification || null,
        // إضافة معلومات من JWT
        commercialRegistrationNumber: storedUserData.CommercialRegistrationNumber || null,
        dateOfLogin: storedUserData.DateOFlogin || null,
        dateEndLogin: storedUserData.DateEndLogin || null,
      };
    }
    
    // القيم الافتراضية في حالة عدم وجود بيانات
    return {
      id: 1,
      firstName: "مستخدم",
      email: "",
      phone: "+966 50 123 4567",
      avatar: null,
      jobTitle: "مستخدم",
      role: "user",
      department: "",
      lastLogin: getStoredLastLogin(),
      createdAt: getStoredLastLogin(),
      address: "",
      bio: "",
      socialLinks: {
        twitter: "",
        linkedin: "",
        github: "",
      },
      companyId: null,
      isActive: true,
      codeVerification: null,
    };
  };

  const [userProfile, setUserProfile] = useState(initializeUserProfile());

      // مراقبة تغييرات localStorage وتحديث البيانات عند تسجيل الدخول
  useEffect(() => {
    const handleStorageChange = () => {
      const updatedProfile = initializeUserProfile();
      setUserProfile(updatedProfile);
    };

    // تحديث فوري عند تحميل المكون (في حالة وجود بيانات جديدة)
    const initialCheck = () => {
      const storedData = getStoredUserData();
      if (storedData && (storedData.IDNumber || storedData.id)) {
        handleStorageChange();
      }
    };

    // تأخير قصير للسماح للمكونات بالتحميل
    const timeoutId = setTimeout(initialCheck, 500);

    // الاستماع لتغييرات localStorage
    window.addEventListener('storage', handleStorageChange);

    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, []);

  // حالة الإشعارات
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    sms: false,
    desktop: true,
  });

  // إعدادات الخصوصية
  const [privacySettings, setPrivacySettings] = useState({
    showProfile: true,
    showActivity: true,
    allowTagging: true,
    showEmail: false,
    showPhone: false,
  });

  // إعدادات اللغة
  const [languageSettings, setLanguageSettings] = useState({
    language: "ar",
    dateFormat: "1",
    timeFormat: "1",
  });

  // حالة النسخ الاحتياطية
  const [backups, setBackups] = useState([
    {
      id: "1",
      name: "نسخة احتياطية كاملة",
      date: "2023-06-15T10:30:00Z",
      size: "4.2 ميجابايت",
      type: "كاملة",
    },
    {
      id: "2",
      name: "نسخة احتياطية للإعدادات",
      date: "2023-05-20T14:45:00Z",
      size: "1.8 ميجابايت",
      type: "إعدادات",
    },
  ]);

  // قائمة الإشعارات الحالية
  const [userNotifications, setUserNotifications] = useState([
    {
      id: 1,
      title: "تم تعيين مهمة جديدة",
      message:
        'تم تعيينك لمهمة "تطوير واجهة المستخدم" في مشروع نظام إدارة المبيعات',
      time: "2023-07-01T09:30:00Z",
      read: false,
      type: "task",
      link: "#", // تم حذف صفحة المهام
    },
    {
      id: 2,
      title: "تحديث في المشروع",
      message:
        'قام أحمد بتحديث حالة مشروع "نظام إدارة المبيعات" إلى "قيد التنفيذ"',
      time: "2023-06-30T14:20:00Z",
      read: true,
      type: "project",
      link: "#", // تم حذف صفحة المشاريع
    },
  ]);

  // حالة تحميل لعمليات تحديث الملف الشخصي
  const [profileUpdateStatus, setProfileUpdateStatus] = useState({
    loading: false,
    success: false,
    error: null,
    lastUpdated: null,
  });

  // التحقق من صحة البريد الإلكتروني
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  // التحقق من صحة رقم الهاتف السعودي
  const isValidSaudiPhone = (phone) => {
    // يقبل الصيغ المختلفة لأرقام الهواتف السعودية
    // مثل: +966501234567, 966501234567, 0501234567
    const phoneRegex = /^(\+966|966|0)5\d{8}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ""));
  };

  // تحديث بيانات الملف الشخصي مع التحقق وإرسال للباك اند
  const updateUserProfile = async (newProfile) => {
    try {
      setProfileUpdateStatus({
        ...profileUpdateStatus,
        loading: true,
        error: null,
      });

      // التحقق من صحة البيانات
      if (newProfile.email && !isValidEmail(newProfile.email)) {
        throw new Error("البريد الإلكتروني غير صالح");
      }

      if (newProfile.phone && !isValidSaudiPhone(newProfile.phone)) {
        throw new Error("رقم الهاتف غير صالح");
      }

      // إعداد البيانات المحدثة محلياً
      const updatedProfile = { ...userProfile, ...newProfile };
      
      // محاولة إرسال التحديث للباك اند
      try {
        const updateData = {
          userName: newProfile.firstName || updatedProfile.firstName,
          PhoneNumber: (newProfile.phone || updatedProfile.phone).replace(/\s+/g, '').replace('+966', ''),
          email: newProfile.email || updatedProfile.email,
          job: newProfile.jobTitle || updatedProfile.jobTitle,
          department: newProfile.department || updatedProfile.department,
          address: newProfile.address || updatedProfile.address,
          jobdiscrption: newProfile.bio || updatedProfile.bio,
        };

        // البحث عن معرف المستخدم بنفس المنطق المستخدم في refreshUserProfile
        const storedData = getStoredUserData();
        const userId = storedData?.id || 
                      storedData?.IDNumber || 
                      storedData?.userId || 
                      storedData?.user_id ||
                      updatedProfile.id;

        if (!userId) {
          console.warn('⚠️ لا يوجد معرف مستخدم صالح لتحديث البيانات في الباك اند، سيتم الحفظ محلياً فقط');
          // الاستمرار في العملية محلياً دون محاولة الباك اند
        } else {
          console.log(`🔄 تحديث بيانات المستخدم في الباك اند باستخدام المعرف: ${userId}`);

          // إرسال البيانات المحدثة للباك اند
          const response = await apiClient.put(`/users/${userId}`, updateData);
          
          if (response.data.success) {
            console.log('✅ تم تحديث بيانات المستخدم في الباك اند بنجاح');
            
            // تحديث localStorage بالبيانات الجديدة مع الحفاظ على البنية الأصلية
            const fullStoredData = JSON.parse(localStorage.getItem("user"));
            const currentUserData = getStoredUserData();
            
            const updatedUserData = {
              ...currentUserData,
              userName: updateData.userName,
              PhoneNumber: updateData.PhoneNumber,
              email: updateData.email,
              job: updateData.job,
              department: updateData.department,
              address: updateData.address,
              jobdiscrption: updateData.jobdiscrption,
            };
            
            // إذا كانت البيانات في كائن data، احتفظ بالبنية
            if (fullStoredData.success && fullStoredData.data) {
              fullStoredData.data = updatedUserData;
              localStorage.setItem("user", JSON.stringify(fullStoredData));
            } else {
              // إذا كانت البيانات في الجذر
              localStorage.setItem("user", JSON.stringify(updatedUserData));
            }
          }
        }
      } catch (apiError) {
        console.warn('⚠️ فشل في تحديث البيانات في الباك اند، سيتم الحفظ محلياً فقط:', apiError.message);
        // الاستمرار في التحديث المحلي حتى لو فشل الباك اند
      }

      // تحديث البيانات محلياً في جميع الأحوال
      setUserProfile(updatedProfile);

      // حفظ البيانات في localStorage مع الحفاظ على البنية الأصلية
      const fullStoredData = JSON.parse(localStorage.getItem("user"));
      const currentUserData = getStoredUserData();
      
      if (currentUserData) {
        const updatedUserData = {
          ...currentUserData,
          userName: newProfile.firstName || updatedProfile.firstName,
          PhoneNumber: (newProfile.phone || updatedProfile.phone).replace(/\s+/g, '').replace('+966', ''),
          email: newProfile.email || updatedProfile.email,
          job: newProfile.jobTitle || updatedProfile.jobTitle,
          department: newProfile.department || updatedProfile.department,
          address: newProfile.address || updatedProfile.address,
          jobdiscrption: newProfile.bio || updatedProfile.bio,
        };
        
        // إذا كانت البيانات في كائن data، احتفظ بالبنية
        if (fullStoredData && fullStoredData.success && fullStoredData.data) {
          fullStoredData.data = updatedUserData;
          localStorage.setItem("user", JSON.stringify(fullStoredData));
        } else if (currentUserData) {
          localStorage.setItem("user", JSON.stringify(updatedUserData));
        }
      }
      
      // حفظ البيانات الإضافية
      if (newProfile.phone) {
        localStorage.setItem("userPhoneNumber", newProfile.phone);
      }
      if (newProfile.firstName) {
        localStorage.setItem(
          "userDisplayName",
          updatedProfile.firstName
        );
      }

      // تسجيل وقت آخر تحديث
      const updateTime = new Date();
      setProfileUpdateStatus({
        loading: false,
        success: true,
        error: null,
        lastUpdated: updateTime.toISOString(),
      });

      return {
        success: true,
        data: updatedProfile,
        lastUpdated: updateTime.toISOString(),
      };
    } catch (error) {
      setProfileUpdateStatus({
        loading: false,
        success: false,
        error: error.message,
        lastUpdated: profileUpdateStatus.lastUpdated,
      });
      return { success: false, error: error.message };
    }
  };

  // تحديث إعدادات الإشعارات
  const updateNotificationSettings = (newSettings) => {
    setProfileUpdateStatus({
      ...profileUpdateStatus,
      loading: true,
      error: null,
    });
    try {
      setNotifications({ ...notifications, ...newSettings });

      setProfileUpdateStatus({
        loading: false,
        success: true,
        error: null,
        lastUpdated: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      setProfileUpdateStatus({
        loading: false,
        success: false,
        error: error.message,
        lastUpdated: profileUpdateStatus.lastUpdated,
      });
      return { success: false, error: error.message };
    }
  };

  // تحديث إعدادات الخصوصية
  const updatePrivacySettings = (newSettings) => {
    setProfileUpdateStatus({
      ...profileUpdateStatus,
      loading: true,
      error: null,
    });
    try {
      setPrivacySettings({ ...privacySettings, ...newSettings });

      setProfileUpdateStatus({
        loading: false,
        success: true,
        error: null,
        lastUpdated: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      setProfileUpdateStatus({
        loading: false,
        success: false,
        error: error.message,
        lastUpdated: profileUpdateStatus.lastUpdated,
      });
      return { success: false, error: error.message };
    }
  };

  // تحديث إعدادات اللغة
  const updateLanguageSettings = (newSettings) => {
    setProfileUpdateStatus({
      ...profileUpdateStatus,
      loading: true,
      error: null,
    });
    try {
      setLanguageSettings({ ...languageSettings, ...newSettings });

      setProfileUpdateStatus({
        loading: false,
        success: true,
        error: null,
        lastUpdated: new Date().toISOString(),
      });

      return { success: true };
    } catch (error) {
      setProfileUpdateStatus({
        loading: false,
        success: false,
        error: error.message,
        lastUpdated: profileUpdateStatus.lastUpdated,
      });
      return { success: false, error: error.message };
    }
  };

  // إعادة تحميل بيانات المستخدم من الباك اند
  const refreshUserProfile = async () => {
    try {
      const storedData = getStoredUserData();
      
      // فحص مفصل للبيانات المخزنة
      console.log('🔍 فحص البيانات المخزنة:', storedData);
      
      if (!storedData) {
        console.warn('❌ لا توجد بيانات مستخدم في localStorage');
        return { success: false, error: 'لا توجد بيانات مستخدم مخزنة' };
      }

      // البحث عن معرف المستخدم في حقول مختلفة
      const userId = storedData.id || 
                    storedData.IDNumber || 
                    storedData.userId || 
                    storedData.user_id ||
                    storedData.IDCompany || // ربما يكون معرف الشركة هو المطلوب
                    null;

      console.log('🆔 معرف المستخدم المستخرج:', userId);
      console.log('📋 جميع المفاتيح المتاحة:', Object.keys(storedData));

      if (!userId) {
        console.warn('❌ لا يوجد معرف مستخدم في البيانات المخزنة');
        console.log('📊 البيانات الكاملة:', JSON.stringify(storedData, null, 2));
        return { 
          success: false, 
          error: 'لا يوجد معرف مستخدم في البيانات المخزنة', 
          details: 'تحقق من بيانات تسجيل الدخول'
        };
      }

      console.log(`🔄 محاولة جلب بيانات المستخدم من الباك اند باستخدام المعرف: ${userId}`);
      
      // محاولة عدة endpoints مختلفة
      let response;
      const endpoints = [
        `/users/${userId}`,
        `/user/${userId}`,
        `/api/users/${userId}`,
        `/dashbord/user/${userId}`
      ];

      for (const endpoint of endpoints) {
        try {
          console.log(`🌐 محاولة endpoint: ${endpoint}`);
          response = await apiClient.get(endpoint);
          
          if (response.data && (response.data.success || response.data.data)) {
            console.log(`✅ نجح endpoint: ${endpoint}`, response.data);
            break;
          }
        } catch (endpointError) {
          console.log(`❌ فشل endpoint ${endpoint}:`, endpointError.message);
          continue;
        }
      }
      
      if (!response || (!response.data.success && !response.data.data)) {
        console.warn('❌ جميع endpoints فشلت في إرجاع بيانات صحيحة');
        return { success: false, error: 'فشل في جلب البيانات من جميع endpoints المتاحة' };
      }

      const freshUserData = response.data.data || response.data;
      
      if (freshUserData) {
        // تحديث localStorage بالبيانات الجديدة مع الحفاظ على البنية الأصلية
        const fullStoredData = JSON.parse(localStorage.getItem("user"));
        
        // إذا كانت البيانات في كائن data، احتفظ بالبنية
        if (fullStoredData.success && fullStoredData.data) {
          fullStoredData.data = { ...fullStoredData.data, ...freshUserData };
          localStorage.setItem("user", JSON.stringify(fullStoredData));
        } else {
          // إذا كانت البيانات في الجذر
          const updatedStoredData = { ...storedData, ...freshUserData };
          localStorage.setItem("user", JSON.stringify(updatedStoredData));
        }
        
        // تحديث UserContext
        const updatedProfile = initializeUserProfile();
        setUserProfile(updatedProfile);
        
        console.log('✅ تم تحديث بيانات المستخدم من الباك اند بنجاح');
        return { success: true, data: updatedProfile };
      }
      
      return { success: false, error: 'البيانات المُستلمة من الباك اند فارغة' };
      
    } catch (error) {
      console.error('💥 خطأ في إعادة تحميل بيانات المستخدم:', error);
      return { 
        success: false, 
        error: error.message,
        details: 'تحقق من اتصال الإنترنت والباك اند'
      };
    }
  };

  // إنشاء نسخة احتياطية جديدة
  const createBackup = (newBackup) => {
    setBackups([newBackup, ...backups]);
    return newBackup;
  };

  // استعادة نسخة احتياطية
  const restoreBackup = (id) => {
    // في التطبيق الحقيقي، سيتم استعادة البيانات من النسخة الاحتياطية
    return true;
  };

  // حذف نسخة احتياطية
  const deleteBackup = (id) => {
    setBackups(backups.filter((backup) => backup.id !== id));
    return true;
  };

  // تحديث كلمة المرور
  const updatePassword = (currentPassword, newPassword) => {
    setProfileUpdateStatus({
      ...profileUpdateStatus,
      loading: true,
      error: null,
    });
    try {
      // في التطبيق الحقيقي، سيتم التحقق من كلمة المرور الحالية وتحديثها

      setProfileUpdateStatus({
        loading: false,
        success: true,
        error: null,
        lastUpdated: new Date().toISOString(),
      });

      return { success: true, message: "تم تحديث كلمة المرور بنجاح" };
    } catch (error) {
      setProfileUpdateStatus({
        loading: false,
        success: false,
        error: error.message,
        lastUpdated: profileUpdateStatus.lastUpdated,
      });
      return { success: false, error: error.message };
    }
  };

  // إضافة إشعار جديد
  const addNotification = (notification) => {
    const newNotification = {
      id: Date.now(),
      time: new Date().toISOString(),
      read: false,
      ...notification,
    };
    setUserNotifications([newNotification, ...userNotifications]);
    return newNotification;
  };

  // تحديد إشعار كمقروء
  const markNotificationAsRead = (id) => {
    setUserNotifications(
      userNotifications.map((notification) =>
        notification.id === id ? { ...notification, read: true } : notification
      )
    );
    return true;
  };

  // تحديد جميع الإشعارات كمقروءة
  const markAllNotificationsAsRead = () => {
    setUserNotifications(
      userNotifications.map((notification) => ({ ...notification, read: true }))
    );
    return true;
  };

  // حذف إشعار
  const deleteNotification = (id) => {
    setUserNotifications(
      userNotifications.filter((notification) => notification.id !== id)
    );
    return true;
  };

  // حذف جميع الإشعارات
  const deleteAllNotifications = () => {
    setUserNotifications([]);
    return true;
  };

  // ترتيب الإشعارات حسب التاريخ
  const sortedNotifications = userNotifications.sort(
    (a, b) => new Date(b.time) - new Date(a.time)
  );

  // عدد الإشعارات غير المقروءة
  const unreadNotificationsCount = userNotifications.filter(
    (notification) => !notification.read
  ).length;

  // تصدير ملف المستخدم الشخصي
  const exportUserProfile = () => {
    try {
      const profileData = {
        ...userProfile,
        privacySettings,
        notifications,
        languageSettings,
        exportDate: new Date().toISOString(),
      };

      // تحويل البيانات إلى نص JSON
      const jsonData = JSON.stringify(profileData, null, 2);

      // إنشاء ملف للتنزيل
      const blob = new Blob([jsonData], { type: "application/json" });
      const url = URL.createObjectURL(blob);

      // إنشاء رابط وتنزيل الملف
      const a = document.createElement("a");
      a.href = url;
      a.download = `profile_${userProfile.firstName}_${
        new Date().toISOString().split("T")[0]
      }.json`;
      document.body.appendChild(a);
      a.click();

      // تنظيف
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      return { success: true, message: "تم تصدير الملف الشخصي بنجاح" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // استيراد ملف المستخدم الشخصي
  const importUserProfile = (jsonData) => {
    try {
      const profileData = JSON.parse(jsonData);

      // التحقق من البيانات قبل الاستيراد
      if (!profileData.firstName || !profileData.email) {
        throw new Error("ملف غير صالح أو بيانات مفقودة");
      }

      // تحديث البيانات
      setUserProfile({
        ...userProfile,
        firstName: profileData.firstName,
        email: profileData.email,
        phone: profileData.phone,
        jobTitle: profileData.jobTitle,
        department: profileData.department,
        // عدم استيراد الحقول الحساسة مثل الدور أو المعرف
      });

      // تحديث الإعدادات إذا كانت موجودة
      if (profileData.privacySettings) {
        setPrivacySettings({
          ...privacySettings,
          ...profileData.privacySettings,
        });
      }

      if (profileData.notifications) {
        setNotifications({ ...notifications, ...profileData.notifications });
      }

      if (profileData.languageSettings) {
        setLanguageSettings({
          ...languageSettings,
          ...profileData.languageSettings,
        });
      }

      return { success: true, message: "تم استيراد الملف الشخصي بنجاح" };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  return (
    <UserContext.Provider
      value={{
        userProfile,
        notifications,
        privacySettings,
        languageSettings,
        backups,
        userNotifications: sortedNotifications,
        unreadNotificationsCount,
        profileUpdateStatus,
        updateUserProfile,
        refreshUserProfile,
        updateNotificationSettings,
        updatePrivacySettings,
        updateLanguageSettings,
        createBackup,
        restoreBackup,
        deleteBackup,
        updatePassword,
        addNotification,
        markNotificationAsRead,
        markAllNotificationsAsRead,
        deleteNotification,
        deleteAllNotifications,
        exportUserProfile,
        importUserProfile,
      }}
    >
      {children}
    </UserContext.Provider>
  );
};

// هوك مخصص لاستخدام سياق المستخدم
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export default UserContext;
