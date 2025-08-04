import React, { useState, useEffect, useRef } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Grid,
  TextField,
  Divider,
  Switch,
  List,
  ListItem,
  ListItemText,
  Avatar,
  Paper,
  Tab,
  Tabs,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Snackbar,
  Alert,
  IconButton,
  Radio,
  RadioGroup,
  FormControlLabel,
  CircularProgress,
  Stack,
  Tooltip,
  Chip
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import PaletteIcon from '@mui/icons-material/Palette';
import PersonIcon from '@mui/icons-material/Person';
import BackupIcon from '@mui/icons-material/Backup';
import SaveIcon from '@mui/icons-material/Save';
import DownloadIcon from '@mui/icons-material/Download';
import CloudUploadIcon from '@mui/icons-material/CloudUpload';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';

import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import { useTheme } from '../contexts/ThemeContext';
import { useUser } from '../contexts/UserContext';
import { ProfileAvatar } from '../components/common';

const Settings = () => {
  const [tabValue, setTabValue] = useState(0);
  const { darkMode, themeSettings, updateThemeSettings, getPrimaryColorValue, getFontSizeMultiplier, getBorderRadiusValue } = useTheme();
  const { 
    userProfile, 
    notifications, 
    backups,
    updateUserProfile,
    updateNotificationSettings,
    createBackup,
    restoreBackup,
    deleteBackup,
    profileUpdateStatus,
    exportUserProfile,
    importUserProfile
  } = useUser();
  
  // ضمان تزامن إعدادات الثيم مع سياق الثيم
  useEffect(() => {
    setSettings(prevSettings => ({
      ...prevSettings,
      appearance: {
        ...prevSettings.appearance,
        darkMode: darkMode,
        highContrast: themeSettings?.highContrast || false,
        fontSize: themeSettings?.fontSize || 'medium',
        primaryColor: themeSettings?.primaryColor || 'brandBlue',
        borderRadius: themeSettings?.borderRadius || 'medium',
        roundedCorners: themeSettings?.roundedCorners !== undefined ? themeSettings.roundedCorners : true,
      }
    }));
  }, [darkMode, themeSettings]);
  
  const [settings, setSettings] = useState({
    notifications: {
      email: notifications.email,
      push: notifications.push,
      sms: notifications.sms,
      desktop: notifications.desktop,
    },
    appearance: {
      darkMode: darkMode,
      highContrast: themeSettings?.highContrast || false,
      fontSize: themeSettings?.fontSize || 'medium',
      primaryColor: themeSettings?.primaryColor || 'brandBlue',
      borderRadius: themeSettings?.borderRadius || 'medium',
      rtl: true,
      roundedCorners: themeSettings?.roundedCorners !== undefined ? themeSettings.roundedCorners : true,
    },
  });
  
  const [isLoading, setIsLoading] = useState(false);
  
  // مزامنة userProfile من UserContext مع الحقول الجديدة
      const [profileData, setProfileData] = useState({
      firstName: userProfile.firstName,
    email: userProfile.email,
    phone: userProfile.phone,
    jobTitle: userProfile.jobTitle,
    department: userProfile.department,
    address: userProfile.address || '',
    bio: userProfile.bio || ''
  });
  
  // استخدام backups من UserContext مباشرة
  const [isBackupInProgress, setIsBackupInProgress] = useState(false);
  const [backupProgress, setBackupProgress] = useState(0);
  
  // حالة لتخزين صورة الملف الشخصي
  const [profileImage, setProfileImage] = useState(userProfile.avatar);

  // مرجع إلى عنصر input الخاص بتحميل الصورة
  const fileInputRef = useRef(null);
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  // تحديث البيانات المحلية عندما يتغير userProfile (عند تسجيل الدخول أو إعادة التحميل)
  useEffect(() => {
    setProfileData({
      firstName: userProfile.firstName,
      email: userProfile.email,
      phone: userProfile.phone,
      jobTitle: userProfile.jobTitle,
      department: userProfile.department,
      address: userProfile.address || '',
      bio: userProfile.bio || ''
    });
  }, [userProfile]);

  // محاولة تحميل البيانات الحقيقية عند فتح صفحة الإعدادات
  useEffect(() => {
    const checkAndLoadRealData = async () => {
      try {
        // التحقق إذا كانت البيانات الحالية افتراضية (المعرف 1 هو القيمة الافتراضية)
        const isUsingDefaultData = !userProfile.id || userProfile.id === 1;
        
        // التحقق من وجود بيانات حقيقية في localStorage
        const userData = localStorage.getItem("user");
        const hasStoredData = userData && userData !== 'null' && userData !== 'undefined';
        
        if (isUsingDefaultData && hasStoredData) {
          // محاولة إعادة تهيئة UserContext من localStorage
          try {
            const parsedData = JSON.parse(userData);
            const hasValidId = parsedData.id || parsedData.IDNumber || parsedData.userId;
            
            if (hasValidId) {
              // تحديث البيانات من localStorage دون استدعاء الباك اند
              window.dispatchEvent(new Event('storage'));
            }
          } catch (parseError) {
            console.error('خطأ في تحليل البيانات المخزنة:', parseError);
          }
        }
      } catch (error) {
        console.error('خطأ في فحص البيانات:', error);
      }
    };

    // تأخير قصير للسماح للمكونات بالتحميل
    const timeout = setTimeout(checkAndLoadRealData, 1000);
    
    return () => clearTimeout(timeout);
  }, []); // يتم تشغيله مرة واحدة فقط عند تحميل الصفحة

  // تحديث للحصول على حالة المعالجة من السياق
  useEffect(() => {
    if (profileUpdateStatus.success) {
      setSnackbar({
        open: true,
        message: 'تم حفظ المعلومات بنجاح',
        severity: 'success',
      });
    }
    
    if (profileUpdateStatus.error) {
      setSnackbar({
        open: true,
        message: `حدث خطأ: ${profileUpdateStatus.error}`,
        severity: 'error',
      });
    }
  }, [profileUpdateStatus]);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  // تطبيق تغييرات الإشعارات والمظهر تلقائياً
  const handleSwitchChange = (section, key) => (event) => {
    const newSettings = {
      ...settings,
      [section]: {
        ...settings[section],
        [key]: event.target.checked,
      },
    };
    
    setSettings(newSettings);
    
    // تطبيق التغييرات فوراً بدون إشعار مزعج
    if (section === 'notifications') {
      updateNotificationSettings(newSettings.notifications);
    } else if (section === 'appearance') {
      // تطبيق إعدادات المظهر
      updateThemeSettings(newSettings.appearance);
    }
  };



  const handleFontSizeChange = (event) => {
    handleAppearanceChange('fontSize', event.target.value);
  };



  // تطبيق تغييرات الملف الشخصي تلقائياً
  const handleUserProfileChange = (field) => (event) => {
    const newProfileData = {
      ...profileData,
      [field]: event.target.value,
    };
    
    setProfileData(newProfileData);
    
    // تطبيق التغييرات فوراً بدون إشعار مزعج
    const result = updateUserProfile(newProfileData);
  };

  const handleSaveUserProfile = async () => {
    setIsLoading(true);
    
    try {
      // تحديث البيانات باستخدام UserContext (الآن async)
      const result = await updateUserProfile(profileData);
      
      // التعامل مع النتيجة المرجعة من updateUserProfile
      if (result.success) {
        setIsLoading(false);
        setSnackbar({
          open: true,
          message: 'تم حفظ المعلومات الشخصية بنجاح في الباك اند',
          severity: 'success',
        });
      } else {
        setIsLoading(false);
        setSnackbar({
          open: true,
          message: `حدث خطأ: ${result.error || 'خطأ غير معروف'}`,
          severity: 'error',
        });
      }
    } catch (error) {
      setIsLoading(false);
      setSnackbar({
        open: true,
        message: `حدث خطأ: ${error.message}`,
        severity: 'error',
      });
    }
  };



  const handleSaveNotifications = () => {
    setIsLoading(true);
    
    // تحديث إعدادات الإشعارات باستخدام UserContext
    const updatedNotifications = updateNotificationSettings(settings.notifications);
    
    setTimeout(() => {
      setIsLoading(false);
      setSnackbar({
        open: true,
        message: 'تم حفظ إعدادات الإشعارات بنجاح',
        severity: 'success',
      });
    }, 800);
  };

  // تطبيق إعدادات المظهر تلقائياً
  const handleAppearanceChange = (key, value) => {
    const newSettings = {
      ...settings,
      appearance: {
        ...settings.appearance,
        [key]: value
      }
    };
    
    setSettings(newSettings);

    // تطبيق التغييرات مباشرة باستخدام ThemeContext
    const updatedThemeSettings = updateThemeSettings({
      darkMode: newSettings.appearance.darkMode,
      primaryColor: newSettings.appearance.primaryColor,
      fontSize: newSettings.appearance.fontSize,
      highContrast: newSettings.appearance.highContrast,
      borderRadius: newSettings.appearance.borderRadius,
      roundedCorners: newSettings.appearance.roundedCorners
    });
  };



  const handleCreateBackup = () => {
    setIsLoading(true);
    setIsBackupInProgress(true);
    setBackupProgress(0);
    
    // محاكاة عملية النسخ الاحتياطي
    const interval = setInterval(() => {
      setBackupProgress((prevProgress) => {
        const newProgress = prevProgress + 10;
        if (newProgress >= 100) {
          clearInterval(interval);
          
          // إضافة النسخة الاحتياطية الجديدة
          const newBackup = {
            id: Date.now().toString(),
            name: `نسخة احتياطية ${new Date().toLocaleString('en-GB')}`,
            date: new Date().toISOString(),
            size: `${Math.floor(Math.random() * 10) + 2} ميجابايت`,
            type: 'كاملة',
          };
          
          createBackup(newBackup);
          
          setIsBackupInProgress(false);
          setIsLoading(false);
          setSnackbar({
            open: true,
            message: 'تم إنشاء النسخة الاحتياطية بنجاح',
            severity: 'success',
          });
        }
        return newProgress;
      });
    }, 500);
  };

  const handleRestoreBackup = (id) => {
    const selectedBackup = backups.find(backup => backup.id === id);
    if (!selectedBackup) return;
    
    setIsLoading(true);
    setIsBackupInProgress(true);
    setBackupProgress(0);
    
    // محاكاة عملية استعادة النسخة الاحتياطية
    const interval = setInterval(() => {
      setBackupProgress((prevProgress) => {
        const newProgress = prevProgress + 15;
        if (newProgress >= 100) {
          clearInterval(interval);
          
          restoreBackup(id);
          
          setIsBackupInProgress(false);
          setIsLoading(false);
          setSnackbar({
            open: true,
            message: `تم استعادة النسخة الاحتياطية "${selectedBackup.name}" بنجاح`,
            severity: 'success',
          });
          
          // إعادة تحميل البيانات - تحديث الإعدادات والملف الشخصي
          setTimeout(() => {
            setSettings({
              notifications: {
                email: notifications.email,
                push: notifications.push,
                sms: notifications.sms,
                desktop: notifications.desktop,
              },
              appearance: {
                darkMode: darkMode,
                highContrast: themeSettings?.highContrast || false,
                fontSize: themeSettings?.fontSize || 'medium',
                primaryColor: themeSettings?.primaryColor || 'blue',
                borderRadius: themeSettings?.borderRadius || 'medium',
                rtl: true,
                roundedCorners: themeSettings?.roundedCorners !== undefined ? themeSettings.roundedCorners : true,
              },
            });
            
            setProfileData({
              firstName: userProfile.firstName,
              email: userProfile.email,
              phone: userProfile.phone,
              jobTitle: userProfile.jobTitle,
              department: userProfile.department,
              address: userProfile.address || '',
              bio: userProfile.bio || ''
            });
          }, 1000);
        }
        return newProgress;
      });
    }, 400);
  };

  const handleDeleteBackup = (id) => {
    // استخدام وظيفة deleteBackup من UserContext
    deleteBackup(id);
    
    setSnackbar({
      open: true,
      message: 'تم حذف النسخة الاحتياطية بنجاح',
      severity: 'success',
    });
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handleColorChange = (color) => {
    handleAppearanceChange('primaryColor', color);
  };

  const handleBorderRadiusChange = (event) => {
    handleAppearanceChange('borderRadius', event.target.value);
  };

  const handleRoundedCornersChange = (event) => {
    handleAppearanceChange('roundedCorners', event.target.checked);
  };

  const getPreviewBackgroundColor = () => {
    return settings.appearance.darkMode ? '#121212' : '#ffffff';
  };

  const getPreviewTextColor = () => {
    return settings.appearance.darkMode ? '#ffffff' : '#121212';
  };

  // التعامل مع فتح مربع اختيار الملف
  const handleImageClick = () => {
    fileInputRef.current.click();
  };
  
  // التعامل مع تغيير الصورة
  const handleImageChange = (event) => {
    if (event.target.files && event.target.files[0]) {
      const file = event.target.files[0];
      const reader = new FileReader();
      
      reader.onload = (e) => {
        const newAvatar = e.target.result;
        // تحديث الصورة في الواجهة
        setProfileImage(newAvatar);
        
        // تحديث البيانات في profileData للاستخدام في النموذج
        setProfileData({
          ...profileData,
          avatar: newAvatar
        });
        
        // تطبيق التغيير فوراً في UserContext لتحديث جميع أجزاء التطبيق
        updateUserProfile({ avatar: newAvatar });
        
        // إظهار رسالة نجاح
        setSnackbar({
          open: true,
          message: 'تم تحديث الصورة الشخصية بنجاح',
          severity: 'success',
        });
      };
      
      reader.readAsDataURL(file);
    }
  };

  // إضافة وظيفة تصدير ملف المستخدم الشخصي
  const handleExportProfile = () => {
    const result = exportUserProfile();
    if (result.success) {
      setSnackbar({
        open: true,
        message: result.message,
        severity: 'success',
      });
    } else {
      setSnackbar({
        open: true,
        message: `فشل تصدير الملف: ${result.error}`,
        severity: 'error',
      });
    }
  };
  
  // إضافة وظيفة استيراد ملف المستخدم الشخصي
  const handleImportProfile = (event) => {
    const file = event.target.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const result = importUserProfile(e.target.result);
        if (result.success) {
          // تحديث البيانات المحلية بعد الاستيراد
          setProfileData({
            firstName: userProfile.firstName,
            email: userProfile.email,
            phone: userProfile.phone,
            jobTitle: userProfile.jobTitle,
            department: userProfile.department,
            address: userProfile.address || '',
            bio: userProfile.bio || ''
          });
          
          setSnackbar({
            open: true,
            message: result.message,
            severity: 'success',
          });
        } else {
          setSnackbar({
            open: true,
            message: `فشل استيراد الملف: ${result.error}`,
            severity: 'error',
          });
        }
      } catch (error) {
        setSnackbar({
          open: true,
          message: `فشل استيراد الملف: ${error.message}`,
          severity: 'error',
        });
      }
    };
    reader.readAsText(file);
  };
  
  // مرجع لعنصر استيراد الملف
  const importFileRef = useRef(null);
  
  // تنشيط نافذة اختيار الملف للاستيراد
  const triggerImportFile = () => {
    importFileRef.current.click();
  };

  return (
    <Box sx={{ 
      width: '100%', 
      direction: 'rtl',
      minHeight: '100vh',
      '& *': {
        direction: 'inherit'
      }
    }}>
      {/* Header */}
      <Box sx={{ 
        mb: 4, 
        width: '100%', 
        textAlign: 'right',
        direction: 'rtl',
        overflow: 'hidden',
        '&::after': {
          content: '""',
          display: 'table',
          clear: 'both'
        }
      }}>
        <Typography
          variant="h4"
          component="h1"
          style={{ 
            fontWeight: 'bold', 
            textAlign: 'right',
            marginBottom: '16px',
            direction: 'rtl',
            width: '100%',
            float: 'right',
            clear: 'both'
          }}
        >
          إعدادات لوحة التحكم
        </Typography>
        <Typography
          variant="body1"
          color="text.secondary"
          style={{ 
            textAlign: 'right',
            marginBottom: '16px',
            direction: 'rtl',
            width: '100%',
            float: 'right',
            clear: 'both'
          }}
        >
          تخصيص وإدارة إعدادات المستخدم والملف الشخصي في لوحة التحكم
        </Typography>

      </Box>

      {/* Tabs */}
      <Paper sx={{ mb: 4, borderRadius: 2, boxShadow: 2, overflow: 'hidden', width: '100%', direction: 'rtl' }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ 
            borderBottom: 1, 
            borderColor: 'divider',
            width: '100%',
            direction: 'rtl',
            '& .MuiTabs-scroller': {
              direction: 'rtl',
            },
            '& .MuiTabs-flexContainer': {
              flexDirection: 'row-reverse',
            },
            '& .MuiTab-root': {
              minHeight: 56,
              fontSize: 14,
              fontWeight: 500,
              mx: 0.5,
              transition: 'all 0.2s ease',
              flexDirection: 'row-reverse',
              '&.Mui-selected': {
                color: 'primary.main',
                fontWeight: 600,
              }
            }
          }}
        >
          <Tab icon={<PersonIcon />} label="معلومات المستخدم" iconPosition="start" />
          <Tab icon={<NotificationsIcon />} label="إشعارات النظام" iconPosition="start" />
          <Tab icon={<PaletteIcon />} label="المظهر" iconPosition="start" />
        </Tabs>
      </Paper>

      {/* Tab Content */}
      {tabValue === 0 && (
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2, boxShadow: 2, height: '100%', width: '100%' }}>
              <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 4, direction: 'rtl' }}>
                <Box sx={{ position: 'relative' }}>
                  <ProfileAvatar 
                    size="xlarge"
                    src={profileImage}
                    sx={{ 
                      mb: 2, 
                      fontSize: 36, 
                      bgcolor: 'primary.main',
                      border: '4px solid',
                      borderColor: 'divider'
                    }}
                    useCurrentUserAvatar={!profileImage}
                  />
                  <input
                    type="file"
                    hidden
                    ref={fileInputRef}
                    accept="image/*"
                    onChange={handleImageChange}
                  />
                  <IconButton
                    sx={{
                      position: 'absolute',
                      right: 0,
                      bottom: 16,
                      bgcolor: 'background.paper',
                      boxShadow: 2,
                      '&:hover': {
                        bgcolor: 'background.default',
                      }
                    }}
                    onClick={handleImageClick}
                  >
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
                <Typography variant="h6" sx={{ mb: 1, fontWeight: 600, textAlign: 'center' }}>
                  {userProfile.firstName}
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 1, textAlign: 'center' }}>
                  {userProfile.jobTitle}
                </Typography>
                {/* عرض معلومات إضافية من البيانات الحقيقية */}
                <Box sx={{ mb: 3, textAlign: 'center' }}>
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 0.5, mb: 1 }}>


                  </Box>
                  
                  {/* معلومات تواريخ تسجيل الدخول */}
                  {userProfile.dateOfLogin && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      📅 تاريخ الدخول: {userProfile.dateOfLogin}
                    </Typography>
                  )}
                  {userProfile.dateEndLogin && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block' }}>
                      ⏰ انتهاء الجلسة: {userProfile.dateEndLogin}
                    </Typography>
                  )}
                  {userProfile.lastLogin && !userProfile.dateOfLogin && (
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1 }}>
                      آخر دخول: {new Date(userProfile.lastLogin).toLocaleDateString('ar-SA')}
                    </Typography>
                  )}
                  
                  {/* تم إزالة الرسالة التحذيرية بناءً على طلب المستخدم */}
                </Box>
                
                {/* أزرار العمليات */}
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%' }}>

                  <Button 
                    variant="outlined" 
                    color="primary" 
                    startIcon={<DownloadIcon />}
                    fullWidth
                    onClick={handleExportProfile}
                    sx={{ borderRadius: 1.5 }}
                  >
                    تصدير الملف الشخصي
                  </Button>
                  <Button 
                    variant="outlined" 
                    color="secondary" 
                    startIcon={<UploadFileIcon />}
                    fullWidth
                    onClick={triggerImportFile}
                    sx={{ borderRadius: 1.5 }}
                  >
                    استيراد ملف شخصي
                  </Button>
                  <input
                    type="file"
                    hidden
                    ref={importFileRef}
                    accept="application/json"
                    onChange={handleImportProfile}
                  />
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 2, boxShadow: 2, width: '100%' }}>
              <CardContent sx={{ p: 4, direction: 'rtl' }}>
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', mb: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    
                  </Box>
                  <Typography variant="h6" gutterBottom sx={{ textAlign: 'right', fontWeight: 600, color: 'primary.main' }}>
                    معلومات المستخدم
                </Typography>
                </Box>
                <Grid container spacing={3}>
                  <Grid item xs={12}>
                    <TextField
                      label="الاسم الأول"
                      value={profileData.firstName}
                      onChange={handleUserProfileChange('firstName')}
                      fullWidth
                      variant="outlined"
                      sx={{ direction: 'ltr' }}
                      InputProps={{ sx: { borderRadius: 1.5, textAlign: 'left' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="البريد الإلكتروني"
                      value={profileData.email}
                      onChange={handleUserProfileChange('email')}
                      fullWidth
                      variant="outlined"
                      sx={{ direction: 'ltr' }}
                      InputProps={{ sx: { borderRadius: 1.5, textAlign: 'left' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="رقم الهاتف"
                      value={profileData.phone}
                      onChange={handleUserProfileChange('phone')}
                      fullWidth
                      variant="outlined"
                      dir="ltr"
                      inputProps={{ dir: 'ltr' }}
                      sx={{ direction: 'ltr' }}
                      InputProps={{ sx: { borderRadius: 1.5, textAlign: 'left' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="المسمى الوظيفي"
                      value={profileData.jobTitle}
                      onChange={handleUserProfileChange('jobTitle')}
                      fullWidth
                      variant="outlined"
                      sx={{ direction: 'ltr' }}
                      InputProps={{ sx: { borderRadius: 1.5, textAlign: 'left' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="القسم"
                      value={profileData.department}
                      onChange={handleUserProfileChange('department')}
                      fullWidth
                      variant="outlined"
                      sx={{ direction: 'ltr' }}
                      InputProps={{ sx: { borderRadius: 1.5, textAlign: 'left' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="العنوان"
                      value={profileData.address}
                      onChange={handleUserProfileChange('address')}
                      fullWidth
                      variant="outlined"
                      sx={{ direction: 'ltr' }}
                      InputProps={{ sx: { borderRadius: 1.5, textAlign: 'left' } }}
                    />
                  </Grid>
                  <Grid item xs={12}>
                    <TextField
                      label="نبذة مهنية"
                      value={profileData.bio}
                      onChange={handleUserProfileChange('bio')}
                      fullWidth
                      multiline
                      rows={3}
                      variant="outlined"
                      sx={{ direction: 'ltr' }}
                      InputProps={{ sx: { borderRadius: 1.5, textAlign: 'left' } }}
                    />
                  </Grid>
                  
                  {/* قسم الروابط الاجتماعية تم حذفه */}
                  
                  <Grid item xs={12}>
                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 2 }}>
                      <Button 
                        variant="contained" 
                        color="primary" 
                        startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
                        sx={{ 
                          px: 3, 
                          py: 1, 
                          borderRadius: 1.5, 
                          fontWeight: 600,
                          boxShadow: 2
                        }}
                        onClick={handleSaveUserProfile}
                        disabled={isLoading || profileUpdateStatus.loading}
                      >
                        {isLoading || profileUpdateStatus.loading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
                      </Button>
                    </Box>
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}

      {tabValue === 1 && (
        <Card sx={{ borderRadius: 2, boxShadow: 2, width: '100%' }}>
          <CardContent sx={{ p: 4, direction: 'rtl' }}>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: 3 }}>
              <Typography variant="h6" gutterBottom sx={{ textAlign: 'right', fontWeight: 600, color: 'primary.main' }}>
                إشعارات نظام لوحة التحكم
            </Typography>
            </Box>
            <List sx={{ mb: 2 }}>
              <ListItem 
                sx={{ 
                  py: 1.5,
                  pr: 2,
                  pl: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  direction: 'rtl'
                }}
              >
                  <Switch
                    checked={settings.notifications.email}
                    onChange={handleSwitchChange('notifications', 'email')}
                    color="primary"
                  />
                <Box sx={{ flex: 1, textAlign: 'left', ml: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    إشعارات النظام العامة
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    تلقي إشعارات عند تحديث النظام أو إضافة بيانات جديدة
                  </Typography>
                </Box>
              </ListItem>
              <Divider />
              <ListItem 
                sx={{ 
                  py: 1.5,
                  pr: 2,
                  pl: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  direction: 'rtl'
                }}
              >
                  <Switch
                    checked={settings.notifications.push}
                    onChange={handleSwitchChange('notifications', 'push')}
                    color="primary"
                  />
                <Box sx={{ flex: 1, textAlign: 'left', ml: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    إشعارات المهام
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    تلقي إشعارات عند إضافة مهام جديدة أو اقتراب المواعيد النهائية
                  </Typography>
                </Box>
              </ListItem>
              <Divider />
              <ListItem 
                sx={{ 
                  py: 1.5,
                  pr: 2,
                  pl: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  direction: 'rtl'
                }}
              >
                  <Switch
                    checked={settings.notifications.sms}
                    onChange={handleSwitchChange('notifications', 'sms')}
                    color="primary"
                  />
                <Box sx={{ flex: 1, textAlign: 'left', ml: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    إشعارات البيانات
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    تلقي إشعارات عند إضافة أو تحديث البيانات في النظام
                  </Typography>
                </Box>
              </ListItem>
              <Divider />
              <ListItem 
                sx={{ 
                  py: 1.5,
                  pr: 2,
                  pl: 2,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                  direction: 'rtl'
                }}
              >
                  <Switch
                    checked={settings.notifications.desktop}
                    onChange={handleSwitchChange('notifications', 'desktop')}
                    color="primary"
                  />
                <Box sx={{ flex: 1, textAlign: 'left', ml: 2 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500, mb: 0.5 }}>
                    إشعارات التنبيهات
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    تلقي إشعارات عند ظهور تنبيهات أو رسائل مهمة في النظام
                  </Typography>
                </Box>
              </ListItem>
            </List>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 3 }}>
              <Button 
                variant="contained" 
                color="primary"
                sx={{ 
                  px: 3, 
                  py: 1, 
                  borderRadius: 1.5, 
                  fontWeight: 600,
                  boxShadow: 2
                }}
                onClick={handleSaveNotifications}
                disabled={isLoading}
                startIcon={isLoading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                {isLoading ? 'جاري الحفظ...' : 'حفظ التغييرات'}
              </Button>
            </Box>
          </CardContent>
        </Card>
      )}

      {tabValue === 2 && (
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Card sx={{ borderRadius: 2, boxShadow: 2, width: '100%' }}>
              <CardContent sx={{ p: 4, direction: 'rtl' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ textAlign: 'right', fontWeight: 600, color: 'primary.main' }}>
                  إعدادات المظهر
                </Typography>
                </Box>
                
                {/* استبدال رسالة التأكيد برسالة توضيحية */}
                <Box sx={{ 
                  p: 2, 
                  mb: 3, 
                  bgcolor: 'info.light', 
                  color: 'info.contrastText',
                  borderRadius: 2,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'flex-end'
                }}>
                  <Typography variant="body1">
                    يمكنك تخصيص مظهر التطبيق من خلال هذه الإعدادات
                  </Typography>
                </Box>
                
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: 1 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ textAlign: 'right', fontWeight: 500 }}>
                    الوضع واللون
                  </Typography>
                  </Box>
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <ListItem 
                        sx={{ 
                          py: 1.5,
                          pr: 2,
                          pl: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          mb: 1,
                          direction: 'rtl'
                        }}
                      >
                  <Switch
                          edge="start"
                    checked={settings.appearance.darkMode}
                    onChange={handleSwitchChange('appearance', 'darkMode')}
                          color="primary"
                  />
                <ListItemText
                  primary="الوضع المظلم"
                  secondary="تفعيل الوضع المظلم في التطبيق"
                          primaryTypographyProps={{ 
                            align: 'left', 
                            fontWeight: 500,
                            mb: 0.5
                          }}
                          secondaryTypographyProps={{ 
                            align: 'left',
                            sx: { 
                              fontSize: '0.85rem'
                            }
                          }}
                  />
              </ListItem>
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <ListItem 
                        sx={{ 
                          py: 1.5,
                          pr: 2,
                          pl: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          mb: 1,
                          bgcolor: settings.appearance.highContrast ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                          direction: 'rtl'
                        }}
                      >
                  <Switch
                          edge="start"
                    checked={settings.appearance.highContrast}
                    onChange={handleSwitchChange('appearance', 'highContrast')}
                          color="primary"
                  />
                <ListItemText
                  primary="التباين العالي"
                  secondary="زيادة التباين لتحسين وضوح النص"
                          primaryTypographyProps={{ 
                            align: 'left', 
                            fontWeight: 500,
                            mb: 0.5
                          }}
                          secondaryTypographyProps={{ 
                            align: 'left',
                            sx: { 
                              fontSize: '0.85rem'
                            }
                          }}
                  />
              </ListItem>
                    </Grid>
                  </Grid>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: 1 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ textAlign: 'right', fontWeight: 500 }}>
                    اللون الرئيسي
                  </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
                    اختر اللون الرئيسي للتطبيق
                  </Typography>
                  </Box>
                  
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1, flexWrap: 'wrap', mb: 2 }}>
                    {['brandBlue', 'blue', 'purple', 'green', 'red', 'orange', 'teal'].map((color) => (
                      <Box
                        key={color}
                        onClick={() => handleColorChange(color)}
                        sx={{
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                          bgcolor: getPrimaryColorValue(color),
                          cursor: 'pointer',
                          border: settings.appearance.primaryColor === color ? '3px solid' : '2px solid',
                          borderColor: settings.appearance.primaryColor === color ? 'primary.main' : 'transparent',
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            transform: 'scale(1.1)',
                            boxShadow: 2
                          }
                        }}
                      />
                    ))}
                  </Box>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: 1 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ textAlign: 'right', fontWeight: 500 }}>
                    حجم الخط
                  </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: 2 }}>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'right' }}>
                    تغيير حجم الخط في جميع أنحاء التطبيق
                  </Typography>
                  </Box>
                  
                  <FormControl component="fieldset" sx={{ width: '100%', direction: 'rtl' }}>
                    <RadioGroup
                      value={settings.appearance.fontSize}
                      onChange={handleFontSizeChange}
                      sx={{ 
                        display: 'flex', 
                        flexDirection: 'row', 
                        justifyContent: 'flex-end',
                        direction: 'rtl'
                      }}
                    >
                      <FormControlLabel 
                        value="large" 
                        control={<Radio color="primary" />} 
                        label="كبير" 
                        sx={{ 
                          ml: 2,
                          direction: 'rtl',
                          '& .MuiFormControlLabel-label': {
                            marginRight: '8px',
                            marginLeft: 0
                          }
                        }}
                      />
                      <FormControlLabel 
                        value="medium" 
                        control={<Radio color="primary" />} 
                        label="متوسط" 
                        sx={{ 
                          ml: 2,
                          direction: 'rtl',
                          '& .MuiFormControlLabel-label': {
                            marginRight: '8px',
                            marginLeft: 0
                          }
                        }}
                      />
                      <FormControlLabel 
                        value="small" 
                        control={<Radio color="primary" />} 
                        label="صغير"
                        sx={{ 
                          ml: 2,
                          direction: 'rtl',
                          '& .MuiFormControlLabel-label': {
                            marginRight: '8px',
                            marginLeft: 0
                          }
                        }}
                      />
                    </RadioGroup>
                  </FormControl>
                </Box>
                
                <Divider sx={{ my: 3 }} />
                
                <Box sx={{ mb: 4 }}>
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: 1 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ textAlign: 'right', fontWeight: 500 }}>
                    الزوايا والحواف
                  </Typography>
                  </Box>
                  
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={6}>
                      <ListItem 
                        sx={{ 
                          py: 1.5,
                          pr: 2,
                          pl: 2,
                          display: 'flex',
                          justifyContent: 'space-between',
                          alignItems: 'center',
                          border: '1px solid',
                          borderColor: 'divider',
                          borderRadius: 2,
                          mb: 1,
                          bgcolor: settings.appearance.roundedCorners ? 'rgba(25, 118, 210, 0.08)' : 'transparent',
                          direction: 'rtl'
                        }}
                      >
                         <Switch
                           edge="start"
                           checked={settings.appearance.roundedCorners}
                           onChange={handleRoundedCornersChange}
                           color="primary"
                         />
                        <ListItemText
                          primary="زوايا مدورة"
                          secondary="استخدام زوايا مدورة في كافة العناصر"
                          primaryTypographyProps={{ 
                            align: 'left', 
                            fontWeight: 500,
                            mb: 0.5
                          }}
                          secondaryTypographyProps={{ 
                            align: 'left',
                            sx: { 
                              fontSize: '0.85rem'
                            }
                          }}
                        />
                      </ListItem>
                    </Grid>
                    
                    <Grid item xs={12} sm={6}>
                      <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: 1 }}>
                        <Typography variant="body2" sx={{ textAlign: 'right' }}>
                          حجم الانحناء
                        </Typography>
                      </Box>
                      <FormControl fullWidth variant="outlined" sx={{ textAlign: 'right', direction: 'rtl' }}>
                        <Select
                          value={settings.appearance.borderRadius}
                          onChange={handleBorderRadiusChange}
                          sx={{ borderRadius: 1.5, textAlign: 'right' }}
                          disabled={!settings.appearance.roundedCorners}
                        >
                          <MenuItem value="small">صغير</MenuItem>
                          <MenuItem value="medium">متوسط</MenuItem>
                          <MenuItem value="large">كبير</MenuItem>
                        </Select>
                      </FormControl>
                    </Grid>
                  </Grid>
                </Box>
                
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mt: 3, flexWrap: 'wrap', gap: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="info.main" sx={{ fontWeight: 600 }}>
                      التغييرات تطبق فوراً
                    </Typography>
                    <CheckCircleIcon color="info" />
                  </Box>
                  <Button 
                    variant="outlined" 
                    color="secondary"
                    sx={{ 
                      px: 3, 
                      py: 1, 
                      borderRadius: 1.5, 
                      fontWeight: 600
                    }}
                    onClick={() => {
                      const defaultSettings = {
                          darkMode: false,
                          highContrast: false,
                          fontSize: 'medium',
                          primaryColor: 'brandBlue',
                          borderRadius: 'medium',
                          rtl: true,
                          roundedCorners: true,
                      };
                      
                      setSettings({
                        ...settings,
                        appearance: defaultSettings
                      });
                      
                      // تطبيق الإعدادات الافتراضية
                      updateThemeSettings(defaultSettings);
                      
                      setSnackbar({
                        open: true,
                        message: 'تم إعادة تعيين إعدادات المظهر',
                        severity: 'success',
                      });
                    }}
                  >
                    إعادة تعيين
                  </Button>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="body2" color="success.main" sx={{ fontWeight: 600 }}>
                      التطبيق التلقائي مُفعّل
                    </Typography>
                    <CheckCircleIcon color="success" />
                  </Box>
                </Box>
          </CardContent>
        </Card>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Card sx={{ borderRadius: 2, boxShadow: 2, height: '100%', width: '100%' }}>
              <CardContent sx={{ p: 4, direction: 'rtl' }}>
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', width: '100%', mb: 3 }}>
                  <Typography variant="h6" gutterBottom sx={{ textAlign: 'right', fontWeight: 600, color: 'primary.main' }}>
                  معاينة الإعدادات
                </Typography>
                </Box>
                
                <Box
                  sx={{
                    p: 3,
                    borderRadius: getBorderRadiusValue(settings.appearance.borderRadius),
                    bgcolor: getPreviewBackgroundColor(),
                    color: getPreviewTextColor(),
                    transition: 'all 0.3s ease',
                    border: '1px solid',
                    borderColor: 'divider',
                    mb: 3,
                    minHeight: 250,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-end',
                    textAlign: 'right',
                  }}
                >
                  <Typography 
                    variant="h6" 
                    sx={{ 
                      color: getPreviewTextColor(), 
                      mb: 2, 
                      fontSize: settings.appearance.fontSize === 'large' ? '1.3rem' : 
                                settings.appearance.fontSize === 'small' ? '1rem' : '1.15rem'
                    }}
                  >
                    معاينة العنوان
                  </Typography>
                  
                  <Typography 
                    variant="body1" 
                    sx={{ 
                      color: getPreviewTextColor(), 
                      mb: 3,
                      opacity: 0.8,
                      fontSize: settings.appearance.fontSize === 'large' ? '1.1rem' : 
                                settings.appearance.fontSize === 'small' ? '0.85rem' : '0.95rem'
                    }}
                  >
                    هذا نص توضيحي لمعاينة إعدادات المظهر التي قمت باختيارها
                  </Typography>
                  
                  <Button
                    variant="contained"
                    sx={{
                      bgcolor: getPrimaryColorValue(settings.appearance.primaryColor),
                      color: '#fff',
                      borderRadius: settings.appearance.roundedCorners ? 
                                    getBorderRadiusValue(settings.appearance.borderRadius) : '4px',
                      alignSelf: 'flex-end',
                      '&:hover': {
                        bgcolor: getPrimaryColorValue(settings.appearance.primaryColor),
                        filter: 'brightness(0.9)'
                      }
                    }}
                  >
                    زر توضيحي
                  </Button>
                </Box>
                
                <Box 
                  sx={{ 
                    p: 2, 
                    borderRadius: 1.5, 
                    bgcolor: 'primary.50', 
                    textAlign: 'right'
                  }}
                >
                  <Typography variant="subtitle2" color="primary" sx={{ mb: 1, fontWeight: 600 }}>
                    تلميح مفيد
                  </Typography>
                  <Typography variant="body2">
                    يمكنك الاطلاع على التغييرات في المعاينة قبل حفظها وتطبيقها على النظام بأكمله.
                  </Typography>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        </Grid>
      )}





      {/* Snackbar للرسائل التنبيهية */}
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={6000} 
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%', alignItems: 'center', textAlign: 'right' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Settings;
