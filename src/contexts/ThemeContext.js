import React, { createContext, useState, useContext, useEffect } from 'react';
import { createTheme, ThemeProvider as MuiThemeProvider } from '@mui/material';
import SecureStorage from '../utils/secureStorage';
import Logger from '../utils/logger';
import { brandColors } from '../utils/colorUtils';

const ThemeContext = createContext();

export const useTheme = () => useContext(ThemeContext);

// القيم الافتراضية للسمة
const defaultSettings = {
  primaryColor: 'brandBlue',
  fontSize: 'medium',
  borderRadius: 'medium',
  highContrast: false,
  roundedCorners: true,
};

export const ThemeProvider = ({ children }) => {
  const [settings, setSettings] = useState(() => {
    try {
      // محاولة استرجاع الإعدادات من التخزين المحلي
      const savedSettings = localStorage.getItem('themeSettings');
      
      if (savedSettings) {
        try {
          const parsedSettings = JSON.parse(savedSettings);
          console.log('تم استرجاع إعدادات مخصصة من التخزين:', parsedSettings);
          return parsedSettings;
        } catch (parseError) {
          console.error('خطأ في تحليل الإعدادات المحفوظة:', parseError);
        }
      }
    } catch (error) {
      console.error('خطأ في استرجاع إعدادات السمة:', error);
    }
    
    console.log('استخدام إعدادات افتراضية لعدم وجود إعدادات محفوظة');
    return defaultSettings;
  });

  // استرجاع وضع الألوان الداكنة من التخزين
  const [darkMode, setDarkMode] = useState(() => {
    try {
      const savedDarkMode = localStorage.getItem('darkMode');
      if (savedDarkMode !== null) {
        return savedDarkMode === 'true';
      }
    } catch (error) {
      console.error('خطأ في استرجاع وضع الألوان الداكنة:', error);
    }
    
    return false; // وضع الألوان الفاتحة افتراضياً
  });
  
  // تطبيق الإعدادات المطلوبة عند بدء التشغيل
  useEffect(() => {
    // للتأكد من أن الإعدادات تُطبَق بشكل صحيح
    console.log('حالة الإعدادات عند بدء التشغيل:', settings);
  }, []);
  
  // التأكد من تطبيق التغييرات في الإعدادات
  useEffect(() => {
    // هذه الوظيفة ستشغل في كل مرة تتغير فيها الإعدادات
    console.log('تم تحديث إعدادات السمة:', settings);
  }, [settings]);

  const toggleDarkMode = () => {
    const newDarkMode = !darkMode;
    try {
      localStorage.setItem('darkMode', newDarkMode);
      setDarkMode(newDarkMode);
    } catch (error) {
      console.error('خطأ في حفظ وضع الألوان الداكنة:', error);
    }
  };

  const updateThemeSettings = (newSettings) => {
    try {
      console.log('بدء تحديث إعدادات السمة:', newSettings);
      
      // تمييز الإعدادات بختم زمني لضمان التحديث
      const timestamp = new Date().getTime();
      
      // استخدام الإعدادات التي اختارها المستخدم
      const updatedSettings = { 
        ...settings, 
        ...newSettings,
        lastUpdated: timestamp // إضافة ختم زمني
      };
      
      // تسجيل التغييرات التي سيتم تطبيقها
      console.log('تطبيق الإعدادات المخصصة:', {
        fontSize: updatedSettings.fontSize,
        highContrast: updatedSettings.highContrast,
        borderRadius: updatedSettings.borderRadius,
        roundedCorners: updatedSettings.roundedCorners,
        primaryColor: updatedSettings.primaryColor
      });
      
      // تطبيق التغييرات على state أولاً
      setSettings(updatedSettings);
      
      // ثم حفظ الإعدادات في التخزين المحلي
      localStorage.setItem('themeSettings', JSON.stringify(updatedSettings));
      console.log('تم حفظ الإعدادات في التخزين المحلي');
      
      // إذا تم تغيير وضع الألوان الداكنة، قم بتحديثه أيضًا
      if (newSettings.hasOwnProperty('darkMode') && newSettings.darkMode !== darkMode) {
        localStorage.setItem('darkMode', newSettings.darkMode);
        setDarkMode(newSettings.darkMode);
        console.log('تم تحديث وضع الألوان الداكنة إلى:', newSettings.darkMode);
      }
      
      // إرجاع القيم المحدثة للاستخدام اللاحق
      return updatedSettings;
      
    } catch (error) {
      console.error('خطأ في تحديث إعدادات السمة:', error);
      return settings;
    }
  };

  // وظائف مساعدة لاسترجاع قيم CSS
  const getPrimaryColorValue = (color) => {
    const colors = {
      blue: '#1976d2',
      red: '#d32f2f',
      green: '#2e7d32',
      purple: '#7b1fa2',
      orange: '#ed6c02',
      teal: '#00796b',
      brandBlue: brandColors.primary // استخدام اللون الرئيسي من وظائف الألوان الموحدة
    };
    return colors[color] || colors.brandBlue;
  };

  const getFontSizeMultiplier = (size) => {
    const sizes = {
      small: '0.9',
      medium: '1',
      large: '1.15'
    };
    return sizes[size] || sizes.medium;
  };

  const getBorderRadiusValue = (size) => {
    const sizes = {
      small: '4px',
      medium: '8px',
      large: '16px',
    };
    return sizes[size] || sizes.medium;
  };
  
  // وظيفة لاسترجاع قيم التباين المرتفع
  const getHighContrastValues = () => {
    return {
      textToBgRatio: settings.highContrast ? 9 : 4.5,
      borderColor: settings.highContrast ? (darkMode ? '#ffffff' : '#000000') : 'rgba(0, 0, 0, 0.12)',
      outlineWidth: settings.highContrast ? '2px' : '1px',
      focusRingWidth: settings.highContrast ? '3px' : '2px'
    };
  };

  const value = {
    darkMode,
    toggleDarkMode,
    themeSettings: settings,
    updateThemeSettings,
    getPrimaryColorValue,
    getFontSizeMultiplier,
    getBorderRadiusValue,
    getHighContrastValues
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
