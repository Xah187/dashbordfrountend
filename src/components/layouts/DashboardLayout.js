import React, { useState, useContext, useRef, useEffect } from 'react';
import { Outlet, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../App';
import { styled } from '@mui/material/styles';
import { Logo, ProfileAvatar } from '../common';
import { useUser } from '../../contexts/UserContext';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Avatar,
  Menu,
  MenuItem,
  Badge,
  Tooltip,
  useMediaQuery,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  CssBaseline,
  Snackbar,
  Alert,
  CircularProgress,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import MenuOpenIcon from '@mui/icons-material/MenuOpen';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DashboardIcon from '@mui/icons-material/Dashboard';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import BarChartIcon from '@mui/icons-material/BarChart';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import Brightness4Icon from '@mui/icons-material/Brightness4';
import Brightness7Icon from '@mui/icons-material/Brightness7';
import BusinessIcon from '@mui/icons-material/Business';
import CardMembershipIcon from '@mui/icons-material/CardMembership';
import ExtensionIcon from '@mui/icons-material/Extension';

import { useTheme } from '../../contexts/ThemeContext';
import SearchIcon from '@mui/icons-material/Search';
import { brandColors, getStatusColor } from '../../utils/colorUtils';

const drawerWidth = 280;

const Main = styled('main', { shouldForwardProp: (prop) => prop !== 'open' })(
  ({ theme, open }) => ({
    flexGrow: 1,
    padding: theme.spacing(3),
    paddingRight: theme.spacing(4),
    transition: theme.transitions.create('margin', {
      easing: theme.transitions.easing.sharp,
      duration: theme.transitions.duration.leavingScreen,
    }),
    marginRight: 0,
    ...(open && {
      transition: theme.transitions.create('margin', {
        easing: theme.transitions.easing.easeOut,
        duration: theme.transitions.duration.enteringScreen,
      }),
      marginRight: drawerWidth,
    }),
  }),
);

const AppBarStyled = styled(AppBar, {
  shouldForwardProp: (prop) => prop !== 'open',
})(({ theme, open }) => ({
  width: '100%',
  zIndex: theme.zIndex.drawer + 1,
  transition: theme.transitions.create(['width', 'margin'], {
    easing: theme.transitions.easing.sharp,
    duration: 300,
  }),
  backgroundColor: brandColors.primary,
  ...(open && {
    width: `calc(100% - ${drawerWidth}px)`,
    marginRight: `${drawerWidth}px`,
    transition: theme.transitions.create(['width', 'margin'], {
      easing: theme.transitions.easing.sharp,
      duration: 300,
    }),
  }),
}));

const DrawerHeader = styled('div')(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  padding: theme.spacing(0, 1),
  ...theme.mixins.toolbar,
  justifyContent: 'space-between',
}));

const menuItems = [
  { text: 'لوحة التحكم', icon: <DashboardIcon color="primary" />, path: '/dashboard-with-db' },
  { text: 'الشركات المشتركة', icon: <BusinessIcon color="secondary" />, path: '/companies-subscribed' },
  { text: 'الميزات المتقدمة', icon: <ExtensionIcon color="secondary" />, path: '/advanced-features' },
  { text: 'الاشتراكات', icon: <CardMembershipIcon />, path: '/subscriptions' },
  { text: 'أنشطة تسجيل الدخول', icon: <AssignmentIcon />, path: '/login-activity' },
  { text: 'الإعدادات', icon: <SettingsIcon />, path: '/settings' },
];

export default function DashboardLayout() {
  const { setIsAuthenticated } = useContext(AuthContext);
  const [open, setOpen] = useState(true);
  const [anchorEl, setAnchorEl] = useState(null);
  const [notificationEl, setNotificationEl] = useState(null);
  const { darkMode, toggleDarkMode } = useTheme();
  const navigate = useNavigate();
  const isMobile = useMediaQuery(theme => theme.breakpoints.down('sm'));
  
  const { userProfile, updateUserProfile, profileUpdateStatus } = useUser();
  
  const [openImageDialog, setOpenImageDialog] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [previewImage, setPreviewImage] = useState(null);
  const fileInputRef = useRef(null);
  
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    if (profileUpdateStatus.success && profileUpdateStatus.lastUpdated) {
      setSnackbar({
        open: true,
        message: 'تم تحديث الصورة الشخصية بنجاح',
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

  const handleDrawerOpen = () => {
    setOpen(true);
  };

  const handleDrawerClose = () => {
    setOpen(false);
  };

  // إغلاق القائمة افتراضياً على الجوال وفتحها على الشاشات الأكبر
  useEffect(() => {
    if (isMobile) {
      setOpen(false);
    }
  }, [isMobile]);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleCloseMenu = () => {
    setAnchorEl(null);
  };

  const handleNotificationMenu = (event) => {
    setNotificationEl(event.currentTarget);
  };

  const handleCloseNotification = () => {
    setNotificationEl(null);
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const handleProfileClick = () => {
    navigate('/settings');
    handleCloseMenu();
  };

  const handleOpenImageDialog = () => {
    setOpenImageDialog(true);
    handleCloseMenu();
  };

  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
  };

  const handleFileChange = (event) => {
    const file = event.target.files[0];
    if (file) {
      if (!file.type.match('image.*')) {
        setSnackbar({
          open: true,
          message: 'يرجى اختيار ملف صورة صالح',
          severity: 'error',
        });
        return;
      }
      
      if (file.size > 5 * 1024 * 1024) {
        setSnackbar({
          open: true,
          message: 'حجم الصورة كبير جدًا، يجب أن يكون أقل من 5 ميغابايت',
          severity: 'error',
        });
        return;
      }
      
      const reader = new FileReader();
      setIsImageLoading(true);
      
      reader.onload = (e) => {
        setPreviewImage(e.target.result);
        setIsImageLoading(false);
      };
      
      reader.readAsDataURL(file);
    }
  };
  
  const handleSaveImage = () => {
    if (previewImage) {
      setIsImageLoading(true);
      updateUserProfile({ avatar: previewImage });
      
      setTimeout(() => {
        setIsImageLoading(false);
        setOpenImageDialog(false);
        setPreviewImage(null);
      }, 1000);
    }
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    handleCloseMenu();
  };

  const handleNavigateToSettings = () => {
    navigate('/settings');
    handleCloseMenu();
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'online':
        return getStatusColor(true);
      case 'away':
        return '#ff9800';
      case 'offline':
      default:
        return getStatusColor(false);
    }
  };

  return (
    <Box sx={{ display: 'flex', overflow: 'hidden' }}>
      <CssBaseline />
      <AppBar
        position="fixed"
        open={open}
        sx={{
          zIndex: theme => theme.zIndex.drawer + 1,
          background: theme => theme.palette.mode === 'light' ? theme.palette.primary.main : 'background.default',
          boxShadow: 2,
          width: '100%',
          transition: theme => theme.transitions.create(['width', 'margin'], {
            easing: theme.transitions.easing.sharp,
            duration: 300,
          }),
          // لا نغير عرض الشريط على الجوال
          ...(!isMobile && open && {
            width: `calc(100% - ${drawerWidth}px)`,
            marginRight: `${drawerWidth}px`,
            transition: theme => theme.transitions.create(['width', 'margin'], {
              easing: theme.transitions.easing.sharp,
              duration: 300,
            }),
          }),
        }}
      >
        <Toolbar>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Logo size="small" sx={{ mr: 1.5 }} />
            {!isMobile && (
              <Typography 
                variant="h6" 
                component="div" 
                sx={{ 
                  fontWeight: 'bold', 
                  color: theme => theme.palette.common.white 
                }}
              >
                مشرف
              </Typography>
            )}
          </Box>
          
          {/* Global Search Bar (disabled, keep placeholder to preserve layout) */}
          <Box sx={{ 
            flexGrow: 1, 
            display: { xs: 'none', md: 'flex' }, 
            justifyContent: 'center', 
            mx: { xs: 1, md: 4 }
          }} />
          
          <Box sx={{ display: { xs: 'none', md: 'flex' }, alignItems: 'center', gap: 1 }}>
            <Tooltip title="الوضع المظلم">
              <IconButton
                onClick={toggleDarkMode}
                color="inherit"
                sx={{ ml: 1 }}
              >
                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            <Tooltip title="الإعدادات السريعة">
              <IconButton 
                color="inherit" 
                onClick={handleMenu}
              >
                <ProfileAvatar 
                  size="small"
                  status="online"
                  sx={{ bgcolor: 'primary.dark' }}
                  useCurrentUserAvatar={true}
                />
              </IconButton>
            </Tooltip>
            <IconButton
              color="inherit"
              aria-label="open drawer"
              edge="end"
              onClick={handleDrawerOpen}
              sx={{ ...(open && { display: 'none' }), ml: 2 }}
            >
              <MenuIcon />
            </IconButton>
          </Box>
          
          {/* Mobile Search & Menu Buttons (swapped order on mobile) */}
          <Box sx={{ 
            flexGrow: 1, 
            display: { xs: 'flex', md: 'none' }, 
            justifyContent: 'flex-end',
            gap: 0.5
          }}>
            {/* Mobile theme toggle */}
            <Tooltip title={darkMode ? 'الوضع النهاري' : 'الوضع الليلي'}>
              <IconButton
                onClick={toggleDarkMode}
                color="inherit"
                aria-label="toggle theme"
              >
                {darkMode ? <Brightness7Icon /> : <Brightness4Icon />}
              </IconButton>
            </Tooltip>
            {/* Mobile search button removed to disable global search */}
            {/* زر فتح القائمة على الجوال */}
            <IconButton
              color="inherit"
              onClick={handleDrawerOpen}
              aria-label="open drawer"
            >
              <MenuIcon />
            </IconButton>
          </Box>
          
          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleCloseMenu}
            PaperProps={{
              sx: {
                mt: 1.5,
                width: 200,
                maxWidth: '100%',
                borderRadius: (theme) => `${theme.shape.borderRadius}px`,
                '& .MuiList-root': {
                  py: 1
                }
              }
            }}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          >
            <MenuItem onClick={handleNavigateToSettings}>
              <ListItemIcon>
                <SettingsIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="الإعدادات" primaryTypographyProps={{ align: 'right' }} />
            </MenuItem>
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" />
              </ListItemIcon>
              <ListItemText primary="تسجيل الخروج" primaryTypographyProps={{ align: 'right' }} />
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>
      {/* لا نزاحم المحتوى على الجوال عند فتح القائمة */}
      <Main open={open && !isMobile}>
        <DrawerHeader />
        <Outlet />
      </Main>
      <Drawer
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          position: 'fixed',
          '& .MuiDrawer-paper': {
            width: drawerWidth,
            position: 'fixed',
          },
        }}
        variant={isMobile ? 'temporary' : 'persistent'}
        anchor="right"
        open={open}
        onClose={handleDrawerClose}
      >
        <DrawerHeader>
          <Box sx={{ display: 'flex', alignItems: 'center', flexDirection: 'column', width: '100%', py: 2 }}>
            <Logo size="large" variant="circle" sx={{ mb: 1.5 }} />
            <Typography variant="h6" component="div" sx={{ fontWeight: 'bold' }}>
              لوحة تحكم مشرف
            </Typography>
          </Box>
          <IconButton onClick={handleDrawerClose} sx={{ position: 'absolute', top: '12px', right: '12px' }}>
            <ChevronRightIcon />
          </IconButton>
        </DrawerHeader>
        <Divider />
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <ProfileAvatar 
              size="medium"
              onClick={handleNavigateToSettings}
              tooltip="الذهاب إلى الملف الشخصي"
              sx={{ mr: 2, cursor: 'pointer' }}
              useCurrentUserAvatar={true}
            />
            <Box>
              <Typography variant="subtitle1" sx={{ fontWeight: 'bold' }}>
                                      {userProfile.firstName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {userProfile.jobTitle}
              </Typography>
            </Box>
          </Box>
        </Box>
        <Divider />
        <List>
          {menuItems.map((item) => (
              <ListItem key={item.text} disablePadding>
                <ListItemButton onClick={() => handleNavigate(item.path)}>
                  <ListItemIcon>{item.icon}</ListItemIcon>
                  <ListItemText
                    primary={item.text}
                    primaryTypographyProps={{ fontWeight: 'medium' }}
                  />
                </ListItemButton>
              </ListItem>
          ))}
        </List>
        <Divider />
        <Box sx={{ p: 2, mt: 'auto', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Logo size="xsmall" sx={{ mb: 1 }} />
          <Typography variant="body2" sx={{ align: 'center', color: theme => theme.palette.mode === 'dark' ? '#ffffff' : '#000000', fontWeight: 500 }}>
            حقوق النشر © 2025 تطبيق مشرف
          </Typography>
        </Box>
      </Drawer>
      
      <Dialog
        open={openImageDialog}
        onClose={handleCloseImageDialog}
        aria-labelledby="image-dialog-title"
      >
        <DialogTitle id="image-dialog-title">تغيير الصورة الشخصية</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mt: 2 }}>
            <ProfileAvatar 
              size="xlarge"
              src={previewImage || userProfile.avatar}
              sx={{ mb: 2, border: '4px solid', borderColor: 'divider' }}
              useCurrentUserAvatar={!previewImage && !userProfile.avatar}
            />
            
            {isImageLoading && (
              <CircularProgress size={24} sx={{ position: 'absolute', top: '50%' }} />
            )}
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              style={{ display: 'none' }}
              onChange={handleFileChange}
            />
            
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, width: '100%', mt: 2 }}>
              <Button 
                variant="contained" 
                color="primary" 
                onClick={triggerFileInput}
                disabled={isImageLoading}
                startIcon={isImageLoading ? <CircularProgress size={20} color="inherit" /> : null}
              >
                اختيار صورة من الجهاز
              </Button>
              
              {previewImage && (
                <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'center', mt: 1 }}>
                  تم اختيار الصورة. انقر على "حفظ" لتطبيق التغييرات.
                </Typography>
              )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button 
            onClick={handleCloseImageDialog} 
            disabled={isImageLoading}
          >
            إلغاء
          </Button>
          
          {previewImage && (
            <Button 
              onClick={handleSaveImage} 
              color="primary" 
              variant="contained"
              disabled={isImageLoading}
              startIcon={isImageLoading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              حفظ
            </Button>
          )}
        </DialogActions>
      </Dialog>
      
      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={handleCloseSnackbar}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'left' }}
      >
        <Alert 
          onClose={handleCloseSnackbar} 
          severity={snackbar.severity} 
          variant="filled"
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
