import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  Avatar,
  Grid,
  TextField,
  InputAdornment,
  IconButton,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TablePagination,
  Paper,
  Menu,
  MenuItem,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControl,
  InputLabel,
  Select,
  FormControlLabel,
  Switch,
  Snackbar,
  Alert,
  Checkbox,
  ListItemText,
  Radio,
  RadioGroup,
  List,
  ListItem,
  ListItemIcon,
  ListItemButton,
  Tab,
  Tabs,
  useTheme,
} from '@mui/material';
import { styled } from '@mui/material/styles';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import VisibilityIcon from '@mui/icons-material/Visibility';
import VerifiedUserIcon from '@mui/icons-material/VerifiedUser';
import BlockIcon from '@mui/icons-material/Block';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import WorkIcon from '@mui/icons-material/Work';
import ReceiptLongIcon from '@mui/icons-material/ReceiptLong';
import TuneIcon from '@mui/icons-material/Tune';
import FilterAltIcon from '@mui/icons-material/FilterAlt';
import ClearAllIcon from '@mui/icons-material/ClearAll';
import PersonIcon from '@mui/icons-material/Person';
import BadgeIcon from '@mui/icons-material/Badge';
import BusinessIcon from '@mui/icons-material/Business';
import SecurityIcon from '@mui/icons-material/Security';
import VpnKeyIcon from '@mui/icons-material/VpnKey';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import EventIcon from '@mui/icons-material/Event';
import LockIcon from '@mui/icons-material/Lock';

import { ProfileAvatar } from '../components/common';
import { useUser } from '../contexts/UserContext';
import { 
  getPermissionColor, 
  getDepartmentColor, 
  getStatusColor, 
  getUserAvatarColor,
  permissionColors,
  PermissionType
} from '../utils/colorUtils';
import Logger from '../utils/logger';

const StyledTableCell = styled(TableCell)(({ theme }) => ({
  fontWeight: 'medium',
  padding: '16px 12px',
  whiteSpace: 'nowrap',
  textAlign: 'center',
  borderBottom: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#000'}`,
  borderRight: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#000'}`,
  '&.MuiTableCell-head': {
    backgroundColor: theme.palette.primary.dark,
    color: theme.palette.primary.contrastText,
    fontWeight: 'bold',
    fontSize: '0.9rem',
    position: 'sticky',
    top: 0,
    zIndex: 1,
    padding: '18px 12px',
    verticalAlign: 'middle',
    boxShadow: '0 2px 3px rgba(0,0,0,0.2)',
    textShadow: '0 1px 1px rgba(0,0,0,0.3)'
  },
  '&.MuiTableCell-body': {
    fontSize: '0.8rem',
    verticalAlign: 'middle',
    height: '60px'
  },
}));

const StyledTableRow = styled(TableRow)(({ theme }) => ({
  '&:nth-of-type(odd)': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255,255,255,0.05)' 
      : theme.palette.action.hover,
  },
  '&:nth-of-type(even)': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(0,0,0,0.15)' 
      : 'inherit',
  },
  '&:last-child td, &:last-child th': {
    borderBottom: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#000'}`,
  },
  '&:hover': {
    backgroundColor: theme.palette.mode === 'dark' 
      ? 'rgba(255,255,255,0.1)' 
      : theme.palette.primary.lighter,
  },
  borderLeft: `1px solid ${theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#000'}`,
  height: '60px'
}));

const Users = () => {
  const { userProfile } = useUser(); // استدعاء UserContext للحصول على بيانات المستخدم الحالي
  const theme = useTheme(); // استدعاء useTheme للحصول على theme
  
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [filterAnchorEl, setFilterAnchorEl] = useState(null);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [openUserModal, setOpenUserModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success'
  });
  const [userForm, setUserForm] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    department: '',
    isActive: true,
    permissions: 'user',
    password: '',
    confirmPassword: ''
  });
  const [passwordMode, setPasswordMode] = useState('auto');
  const [activeFilter, setActiveFilter] = useState('all');
  const [usersList, setUsersList] = useState([
    {
      id: 1,
      name: 'أحمد محمد',
      email: 'ahmed@example.com',
      phone: '0512345678',
      role: 'مهندس تنفيذ',
      department: 'الهندسة',
      isActive: true,
      permissions: 'admin',
      avatarColor: '#4a7bff'
    },
    {
      id: 2,
      name: 'سارة علي',
      email: 'sara@example.com',
      phone: '0523456789',
      role: 'مهندس إنشائي',
      department: 'الهندسة',
      isActive: true,
      permissions: 'user',
      avatarColor: '#00c853'
    },
    {
      id: 3,
      name: 'خالد العلي',
      email: 'khalid@example.com',
      phone: '0534567890',
      role: 'مقاول سباكة',
      department: 'المقاولات',
      isActive: false,
      permissions: 'user',
      avatarColor: '#ff5252'
    },
    {
      id: 4,
      name: 'نورة سعيد',
      email: 'noura@example.com',
      phone: '0545678901',
      role: 'مهندس معماري',
      department: 'التصميم',
      isActive: true,
      permissions: 'user',
      avatarColor: '#ffab00'
    },
    {
      id: 5,
      name: 'محمد أحمد',
      email: 'mohammed@example.com', // هذا هو المستخدم الحالي في UserContext
      phone: '0556789012',
      role: 'مهندس مراقبة جودة',
      department: 'الجودة',
      isActive: true,
      permissions: 'manager',
      avatarColor: '#00b0ff',
      avatar: '' // سيتم تحديثه تلقائياً من UserContext
    },
    {
      id: 6,
      name: 'فاطمة أحمد',
      email: 'fatima@example.com',
      phone: '0567890123',
      role: 'مراقب جودة',
      department: 'ضمان الجودة',
      isActive: true,
      permissions: 'user',
      avatarColor: '#00b0ff'
    },
    {
      id: 7,
      name: 'عبدالرحمن محمد',
      email: 'abdulrahman@example.com',
      phone: '0578901234',
      role: 'مشرف موقع',
      department: 'الإشراف الميداني',
      isActive: true,
      permissions: 'admin',
      avatarColor: '#4a7bff'
    },
    {
      id: 8,
      name: 'لمياء عمر',
      email: 'lamia@example.com',
      phone: '0589012345',
      role: 'مهندس ميكانيكا',
      department: 'الهندسة الميكانيكية',
      isActive: false,
      permissions: 'user',
      avatarColor: '#ff5252'
    },
    {
      id: 9,
      name: 'سعد فيصل',
      email: 'saad@example.com',
      phone: '0590123456',
      role: 'مدير المشتريات',
      department: 'المشتريات',
      isActive: true,
      permissions: 'manager',
      avatarColor: '#00b0ff'
    },
    {
      id: 10,
      name: 'هند ناصر',
      email: 'hind@example.com',
      phone: '0501234567',
      role: 'مسؤول عقود',
      department: 'الشؤون القانونية',
      isActive: true,
      permissions: 'user',
      avatarColor: '#00c853'
    },
    {
      id: 11,
      name: 'عمر سالم',
      email: 'omar@example.com',
      phone: '0512345678',
      role: 'محاسب مشاريع',
      department: 'المالية',
      isActive: true,
      permissions: 'user',
      avatarColor: '#00c853'
    },
    {
      id: 12,
      name: 'رنا محمد',
      email: 'rana@example.com',
      phone: '0523456789',
      role: 'مهندس سلامة',
      department: 'الأمن والسلامة',
      isActive: true,
      permissions: 'user',
      avatarColor: '#00c853'
    },
  ]);

  // الأقسام في المنظمة
  const departments = [
    'الهندسة',
    'التصميم',
    'المقاولات',
    'الجودة',
    'المالية',
    'الإدارة',
    'الموارد البشرية',
    'المشتريات',
    'التسويق',
    'تقنية المعلومات'
  ];

  // الأدوار الوظيفية
  const roles = [
    'مهندس تنفيذ',
    'مهندس إنشائي',
    'مهندس معماري',
    'مهندس مراقبة جودة',
    'مقاول سباكة',
    'مقاول كهرباء',
    'مقاول تكييف',
    'مدير مشروع',
    'مدير قسم',
    'مدير عام',
    'محاسب',
    'موظف إداري',
    // أدوار تقنية المعلومات
    'مطور برمجيات',
    'مهندس شبكات',
    'أخصائي أمن معلومات',
    'محلل نظم',
    'مدير تقنية المعلومات',
    'فني دعم تقني',
    'مدير قواعد البيانات',
    'مطور واجهات أمامية',
    'مطور تطبيقات الجوال',
    'مختبر جودة البرمجيات',
    // أدوار إضافية للأقسام الأخرى
    'مسؤول موارد بشرية',
    'أخصائي توظيف',
    'مدير تسويق',
    'أخصائي تسويق رقمي',
    'محلل مالي',
    'مدير مشتريات',
    'منسق إداري',
    'مسؤول علاقات عامة'
  ];

  // مستويات الصلاحيات
  const permissionLevels = [
    { value: 'user', label: 'مستخدم عادي' },
    { value: 'manager', label: 'مدير' },
    { value: 'admin', label: 'مشرف' },
    { value: 'superadmin', label: 'مشرف عام' }
  ];

  const [deleteConfirmation, setDeleteConfirmation] = useState({
    open: false,
    userId: null,
    userName: ''
  });

  const [openAdvancedFilter, setOpenAdvancedFilter] = useState(false);
  const [advancedFilterOptions, setAdvancedFilterOptions] = useState({
    status: 'all', // 'all', 'active', 'inactive'
    permissions: [], // array of permission values
    departments: [], // array of department names
    roles: [], // array of role names
  });

  const [openUserDetails, setOpenUserDetails] = useState(false);
  const [openPermissions, setOpenPermissions] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [permissionsTab, setPermissionsTab] = useState(0);
  const [userPermissions, setUserPermissions] = useState({
    dashboard: false,
    projects: {
      view: false,
      create: false,
      edit: false,
      delete: false,
    },
    tasks: {
      view: false,
      create: false,
      edit: false,
      delete: false,
      assign: false,
    },
    users: {
      view: false,
      create: false,
      edit: false,
      delete: false,
      permissions: false,
    },
    settings: false,
  });

  const filterOpen = Boolean(filterAnchorEl);
  const actionMenuOpen = Boolean(anchorEl);

  const handleFilterClick = (event) => {
    setFilterAnchorEl(event.currentTarget);
  };

  const handleFilterClose = () => {
    setFilterAnchorEl(null);
  };

  const handleActionClick = (event, id) => {
    setAnchorEl(event.currentTarget);
    setSelectedId(id);
  };

  const handleActionClose = () => {
    setAnchorEl(null);
    setSelectedId(null);
  };

  const handleChangePage = (event, newPage) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  const handleSearchChange = (event) => {
    setSearchQuery(event.target.value);
    setPage(0);
  };

  const handleOpenUserModal = (editUser = null) => {
    if (editUser) {
      // وضع التعديل - تعبئة النموذج بمعلومات المستخدم الحالي
      setUserForm({
        ...editUser,
        password: '',
        confirmPassword: ''
      });
      setEditMode(true);
    } else {
      // وضع الإضافة - تفريغ النموذج
      setUserForm({
        name: '',
        email: '',
        phone: '',
        role: '',
        department: '',
        isActive: true,
        permissions: 'user',
        password: '',
        confirmPassword: ''
      });
      setEditMode(false);
    }
    setOpenUserModal(true);
  };

  const handleCloseUserModal = () => {
    setOpenUserModal(false);
  };

  const handleUserFormChange = (e) => {
    const { name, value, checked, type } = e.target;
    
    // إذا كان الحقل هو البريد الإلكتروني، قم بالتحقق من صحته
    if (name === 'email' && value !== '' && !isValidEmail(value)) {
      setSnackbar({
        open: true,
        message: 'يرجى إدخال بريد إلكتروني صحيح',
        severity: 'warning'
      });
    }
    
    // إذا كان الحقل هو رقم الهاتف، قم بالتحقق من صحته
    if (name === 'phone' && value !== '' && !isValidPhone(value)) {
      setSnackbar({
        open: true,
        message: 'يرجى إدخال رقم هاتف صحيح (يبدأ بـ 05 أو 966)',
        severity: 'warning'
      });
    }
    
    setUserForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }));
  };

  const handleCloseSnackbar = (event, reason) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbar({ ...snackbar, open: false });
  };

  const handlePasswordModeChange = (event) => {
    setPasswordMode(event.target.checked ? 'auto' : 'manual');
  };

  const handleSubmitUser = (e) => {
    e.preventDefault();
    
    if (editMode) {
      // تحديث المستخدم الموجود
      const updatedUsersList = usersList.map(user => 
        user.id === userForm.id 
          ? { 
              ...userForm, 
              // إذا تم تغيير كلمة المرور
              password: passwordMode === 'manual' && userForm.password 
                ? userForm.password 
                : user.password 
            } 
          : user
      );
      
      setUsersList(updatedUsersList);
      
      setSnackbar({
        open: true,
        message: `تم تحديث بيانات المستخدم ${userForm.name} بنجاح`,
        severity: 'success'
      });
    } else {
      // التحقق من عدم تكرار البريد الإلكتروني
      if (usersList.some(user => user.email === userForm.email)) {
        setSnackbar({
          open: true,
          message: 'البريد الإلكتروني مستخدم بالفعل، يرجى استخدام بريد آخر',
          severity: 'error'
        });
        return;
      }
      
      // التحقق من عدم تكرار رقم الهاتف
      if (userForm.phone && usersList.some(user => user.phone === userForm.phone)) {
        setSnackbar({
          open: true,
          message: 'رقم الهاتف مستخدم بالفعل، يرجى استخدام رقم آخر',
          severity: 'error'
        });
        return;
      }
      
      // التحقق من تطابق كلمة المرور في حالة الإدخال اليدوي
      if (passwordMode === 'manual' && userForm.password !== userForm.confirmPassword) {
        setSnackbar({
          open: true,
          message: 'كلمة المرور غير متطابقة، يرجى التحقق',
          severity: 'error'
        });
        return;
      }
      
      // إضافة مستخدم جديد
      const newUser = {
        id: usersList.length + 1,
        name: userForm.name,
        email: userForm.email,
        phone: userForm.phone,
        role: userForm.role,
        department: userForm.department,
        isActive: userForm.isActive,
        permissions: userForm.permissions,
        avatarColor: getUserAvatarColor({ permissions: userForm.permissions, isActive: userForm.isActive }),
        createdAt: new Date().toISOString()
      };
      
      setUsersList([...usersList, newUser]);
      
      setSnackbar({
        open: true,
        message: 'تمت إضافة المستخدم بنجاح',
        severity: 'success'
      });
    }
    
    handleCloseUserModal();
  };

  const handleEditUser = (userId) => {
    const userToEdit = usersList.find(user => user.id === userId);
    if (userToEdit) {
      handleOpenUserModal(userToEdit);
    }
    handleActionClose();
  };

  // دالة إنشاء لون عشوائي للصورة الرمزية يدعم الوضع المظلم
  const getRandomColor = () => {
    Logger.warn('تم استخدام وظيفة اللون العشوائي، يفضل استخدام وظيفة getUserAvatarColor بدلاً منها');
    const colors = [
      theme.palette.primary.main, // أزرق مشرف
      theme.palette.success.main, // أخضر مستخدم
      theme.palette.info.main, // أزرق فاتح مدير
      theme.palette.warning.main, // برتقالي
      theme.palette.secondary.main, // بنفسجي
      theme.palette.error.main, // أحمر
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // دالة تطبيق التصفية
  const handleApplyFilter = (filterType) => {
    setActiveFilter(filterType);
    setPage(0); // إعادة تعيين الصفحة إلى الأولى عند تغيير التصفية
    handleFilterClose();
  };

  const handleOpenAdvancedFilter = () => {
    setOpenAdvancedFilter(true);
  };

  const handleCloseAdvancedFilter = () => {
    setOpenAdvancedFilter(false);
  };

  const handleAdvancedFilterChange = (event) => {
    const { name, value } = event.target;
    setAdvancedFilterOptions({
      ...advancedFilterOptions,
      [name]: value,
    });
  };

  const handleMultiSelectChange = (event) => {
    const { name, value } = event.target;
    setAdvancedFilterOptions({
      ...advancedFilterOptions,
      [name]: typeof value === 'string' ? value.split(',') : value,
    });
  };

  const handleApplyAdvancedFilter = () => {
    // تطبيق التصفية المتقدمة
    setActiveFilter('advanced');
    setPage(0);
    handleCloseAdvancedFilter();
    
    setSnackbar({
      open: true,
      message: 'تم تطبيق التصفية المتقدمة',
      severity: 'success'
    });
  };

  const handleResetAdvancedFilter = () => {
    setAdvancedFilterOptions({
      status: 'all',
      permissions: [],
      departments: [],
      roles: [],
    });
  };

  // تصفية المستخدمين حسب البحث والفلتر النشط
  const getFilteredUsers = () => {
    // أولًا: تطبيق تصفية البحث
    let filtered = usersList.filter(user => 
      user.name.includes(searchQuery) || 
      user.email.includes(searchQuery) || 
      user.role.includes(searchQuery) || 
      user.department.includes(searchQuery)
    );

    // ثانيًا: تطبيق نوع التصفية المحدد
    switch (activeFilter) {
      case 'active':
        return filtered.filter(user => user.isActive);
      case 'inactive':
        return filtered.filter(user => !user.isActive);
      case 'admins':
        return filtered.filter(user => user.permissions === 'admin' || user.permissions === 'superadmin');
      case 'managers':
        return filtered.filter(user => user.permissions === 'manager');
      case 'engineers':
        return filtered.filter(user => user.role.includes('مهندس'));
      case 'contractors':
        return filtered.filter(user => user.role.includes('مقاول'));
      case 'advanced':
        // تطبيق التصفية المتقدمة
        return filtered.filter(user => {
          // تصفية حسب الحالة
          if (advancedFilterOptions.status !== 'all') {
            if (advancedFilterOptions.status === 'active' && !user.isActive) return false;
            if (advancedFilterOptions.status === 'inactive' && user.isActive) return false;
          }
          
          // تصفية حسب الصلاحيات
          if (advancedFilterOptions.permissions.length > 0 && !advancedFilterOptions.permissions.includes(user.permissions)) {
            return false;
          }
          
          // تصفية حسب الأقسام
          if (advancedFilterOptions.departments.length > 0 && !advancedFilterOptions.departments.includes(user.department)) {
            return false;
          }
          
          // تصفية حسب الأدوار
          if (advancedFilterOptions.roles.length > 0 && !advancedFilterOptions.roles.includes(user.role)) {
            return false;
          }
          
          return true;
        });
      default:
        return filtered;
    }
  };

  // الحصول على عدد المستخدمين لكل فئة تصفية
  const getUsersCountByFilter = (filterType) => {
    switch (filterType) {
      case 'active':
        return usersList.filter(user => user.isActive).length;
      case 'inactive':
        return usersList.filter(user => !user.isActive).length;
      case 'admins':
        return usersList.filter(user => user.permissions === 'admin' || user.permissions === 'superadmin').length;
      case 'managers':
        return usersList.filter(user => user.permissions === 'manager').length;
      case 'engineers':
        return usersList.filter(user => user.role.includes('مهندس')).length;
      case 'contractors':
        return usersList.filter(user => user.role.includes('مقاول')).length;
      case 'advanced':
        return getFilteredUsers().length;
      default:
        return usersList.length;
    }
  };
  
  // الحصول على اسم التصفية النشطة بالعربية
  const getActiveFilterName = () => {
    switch (activeFilter) {
      case 'active':
        return 'المستخدمين النشطين';
      case 'inactive':
        return 'المستخدمين غير النشطين';
      case 'admins':
        return 'المشرفين';
      case 'managers':
        return 'المدراء';
      case 'engineers':
        return 'المهندسين';
      case 'contractors':
        return 'المقاولين';
      case 'advanced':
        return 'تصفية متقدمة';
      default:
        return 'جميع المستخدمين';
    }
  };

  // Calcular usuarios que se muestran en la página actual
  const visibleUsers = getFilteredUsers().slice(
    page * rowsPerPage,
    page * rowsPerPage + rowsPerPage,
  );

  // تصدير بيانات المستخدمين إلى Excel
  const handleExportToExcel = () => {
    const fields = ['name', 'email', 'phone', 'role', 'department', 'isActive', 'permissions'];
    const headers = ['اسم المستخدم', 'البريد الإلكتروني', 'رقم الهاتف', 'الدور', 'القسم', 'الحالة', 'الصلاحيات'];
    
    // تحضير البيانات للتصدير
    const exportData = getFilteredUsers().map(user => ({
      ...user,
      isActive: user.isActive ? 'نشط' : 'معطل',
      permissions: user.permissions === 'admin' ? 'مشرف' : 
                  user.permissions === 'superadmin' ? 'مشرف عام' : 
                  user.permissions === 'manager' ? 'مدير' : 'مستخدم'
    }));
    
    // تم إزالة تصدير البيانات إلى Excel
  };

  // دالة للتحقق من صحة البريد الإلكتروني
  const isValidEmail = (email) => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };
  
  // دالة للتحقق من صحة رقم الهاتف
  const isValidPhone = (phone) => {
    // التحقق من أن رقم الهاتف يبدأ بـ 05 أو 966 وطوله يتراوح بين 10 و 14 رقم
    const phoneRegex = /^(05\d{8}|966\d{9}|\+966\d{9})$/;
    return phoneRegex.test(phone);
  };

  const handleDeleteConfirmation = (userId) => {
    const userToDelete = usersList.find(user => user.id === userId);
    if (userToDelete) {
      setDeleteConfirmation({
        open: true,
        userId: userId,
        userName: userToDelete.name
      });
    }
    handleActionClose();
  };

  const handleCloseDeleteConfirmation = () => {
    setDeleteConfirmation({
      open: false,
      userId: null,
      userName: ''
    });
  };

  const handleDeleteUser = () => {
    const updatedUsersList = usersList.filter(user => user.id !== deleteConfirmation.userId);
    setUsersList(updatedUsersList);
    
    setSnackbar({
      open: true,
      message: `تم حذف المستخدم ${deleteConfirmation.userName} بنجاح`,
      severity: 'success'
    });
    
    handleCloseDeleteConfirmation();
  };

  const handleToggleUserStatus = (userId) => {
    const updatedUsersList = usersList.map(user => 
      user.id === userId 
        ? { ...user, isActive: !user.isActive } 
        : user
    );
    
    setUsersList(updatedUsersList);
    
    const updatedUser = updatedUsersList.find(user => user.id === userId);
    
    setSnackbar({
      open: true,
      message: updatedUser.isActive 
        ? `تم تفعيل حساب المستخدم ${updatedUser.name} بنجاح` 
        : `تم تعطيل حساب المستخدم ${updatedUser.name} بنجاح`,
      severity: 'success'
    });
    
    handleActionClose();
  };

  // عرض تفاصيل المستخدم
  const handleViewUserDetails = (userId) => {
    const user = usersList.find(user => user.id === userId);
    if (user) {
      setSelectedUser(user);
      setOpenUserDetails(true);
    }
    handleActionClose();
  };

  const handleCloseUserDetails = () => {
    setOpenUserDetails(false);
    setSelectedUser(null);
  };

  // إدارة صلاحيات المستخدم
  const handleManagePermissions = (userId) => {
    const user = usersList.find(user => user.id === userId);
    if (user) {
      setSelectedUser(user);
      // تعيين صلاحيات افتراضية بناءً على مستوى صلاحيات المستخدم
      let defaultPermissions = {
        dashboard: false,
        projects: {
          view: false,
          create: false,
          edit: false,
          delete: false,
        },
        tasks: {
          view: false,
          create: false,
          edit: false,
          delete: false,
          assign: false,
        },
        users: {
          view: false,
          create: false,
          edit: false,
          delete: false,
          permissions: false,
        },
        settings: false,
      };

      // تعيين الصلاحيات حسب مستوى المستخدم
      if (user.permissions === 'superadmin') {
        defaultPermissions = {
          dashboard: true,
          projects: {
            view: true,
            create: true,
            edit: true,
            delete: true,
          },
          tasks: {
            view: true,
            create: true,
            edit: true,
            delete: true,
            assign: true,
          },
          users: {
            view: true,
            create: true,
            edit: true,
            delete: true,
            permissions: true,
          },
          settings: true,
        };
      } else if (user.permissions === 'admin') {
        defaultPermissions = {
          dashboard: true,
          projects: {
            view: true,
            create: true,
            edit: true,
            delete: false,
          },
          tasks: {
            view: true,
            create: true,
            edit: true,
            delete: true,
            assign: true,
          },
          users: {
            view: true,
            create: true,
            edit: true,
            delete: false,
            permissions: false,
          },
          settings: false,
        };
      } else if (user.permissions === 'manager') {
        defaultPermissions = {
          dashboard: true,
          projects: {
            view: true,
            create: true,
            edit: true,
            delete: false,
          },
          tasks: {
            view: true,
            create: true,
            edit: true,
            delete: false,
            assign: true,
          },
          users: {
            view: true,
            create: false,
            edit: false,
            delete: false,
            permissions: false,
          },
          settings: false,
        };
      } else { // user
        defaultPermissions = {
          dashboard: true,
          projects: {
            view: true,
            create: false,
            edit: false,
            delete: false,
          },
          tasks: {
            view: true,
            create: true,
            edit: true,
            delete: false,
            assign: false,
          },
          users: {
            view: false,
            create: false,
            edit: false,
            delete: false,
            permissions: false,
          },
          settings: false,
        };
      }
      
      setUserPermissions(defaultPermissions);
      setOpenPermissions(true);
    }
    handleActionClose();
  };

  const handleClosePermissions = () => {
    setOpenPermissions(false);
    setSelectedUser(null);
    setPermissionsTab(0);
  };

  const handlePermissionsTabChange = (event, newValue) => {
    setPermissionsTab(newValue);
  };

  const handlePermissionChange = (section, key = null, event) => {
    const { checked } = event.target;
    
    if (key === null) {
      // تغيير قيمة القسم بأكمله
      setUserPermissions({
        ...userPermissions,
        [section]: checked,
      });
    } else {
      // تغيير قيمة إذن محدد داخل قسم
      setUserPermissions({
        ...userPermissions,
        [section]: {
          ...userPermissions[section],
          [key]: checked,
        },
      });
    }
  };

  const handleSavePermissions = () => {
    // تحديث صلاحيات المستخدم
    const updatedUsersList = usersList.map(user => 
      user.id === selectedUser.id 
        ? { 
            ...user, 
            customPermissions: userPermissions // إضافة الصلاحيات المخصصة للمستخدم
          } 
        : user
    );
    
    setUsersList(updatedUsersList);
    
    setSnackbar({
      open: true,
      message: `تم تحديث صلاحيات المستخدم ${selectedUser.name} بنجاح`,
      severity: 'success'
    });
    
    handleClosePermissions();
  };

  // تتبع المستخدم الحالي من UserContext وتحديثه في قائمة المستخدمين
  useEffect(() => {
    const currentUserEmail = userProfile.email;
    
    // التحقق مما إذا كان المستخدم الحالي موجودًا في القائمة
    const currentUserExists = usersList.some(user => user.email === currentUserEmail);
    
    if (currentUserExists) {
      // تحديث بيانات المستخدم الحالي إذا كان موجودًا في القائمة
      setUsersList(prevList => 
        prevList.map(user => 
          user.email === currentUserEmail ? 
          {
            ...user,
            avatar: userProfile.avatar,
            name: userProfile.firstName,
            jobTitle: userProfile.jobTitle,
            department: userProfile.department,
            role: userProfile.jobTitle
          } : 
          user
        )
      );
    } else {
      // إضافة المستخدم الحالي إلى القائمة إذا لم يكن موجودًا
      const newUser = {
        id: usersList.length + 1,
        name: userProfile.firstName,
        email: userProfile.email,
        phone: userProfile.phone || '05xxxxxxxx',
        role: userProfile.jobTitle || 'مستخدم النظام',
        department: userProfile.department || 'تكنولوجيا المعلومات',
        isActive: true,
        permissions: 'user',
        avatarColor: theme.palette.primary.main,
        avatar: userProfile.avatar
      };
      
      setUsersList(prevList => [...prevList, newUser]);
    }
  }, [userProfile]);

  // استخدام الألوان في Chip للحالة
  const renderUserStatus = (isActive) => {
    return (
      <Chip
        label={isActive ? 'نشط' : 'غير نشط'}
        color={isActive ? 'success' : 'error'}
        size="small"
        sx={{
          backgroundColor: getStatusColor(isActive),
          fontWeight: 'bold',
          minWidth: '80px',
          '& .MuiChip-label': {
            px: 2
          }
        }}
      />
    );
  };

  // استخدام الألوان في Chip لمستوى الصلاحيات
  const renderPermissionLevel = (permission) => {
    const permissionLabels = {
      'superadmin': 'مشرف عام',
      'admin': 'مشرف',
      'manager': 'مدير',
      'user': 'مستخدم',
      'viewer': 'مشاهد'
    };

    return (
      <Chip
        label={permissionLabels[permission] || 'مستخدم'}
        size="small"
        sx={{
          backgroundColor: getPermissionColor(permission),
          color: '#fff',
          fontWeight: 'bold',
          minWidth: '80px',
          '& .MuiChip-label': {
            px: 2
          }
        }}
      />
    );
  };

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', textAlign: 'right', mb: 1 }}>
          إدارة المستخدمين
        </Typography>
        <Typography variant="body1" color="text.secondary" sx={{ textAlign: 'right' }}>
          إدارة حسابات المستخدمين وصلاحياتهم في النظام
        </Typography>
      </Box>

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundColor: theme.palette.primary.main, 
            color: theme.palette.primary.contrastText 
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>
                إجمالي المستخدمين
              </Typography>
              <Typography variant="h3" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                {usersList.length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundColor: theme.palette.success.main, 
            color: theme.palette.success.contrastText 
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>
                المستخدمين النشطين
              </Typography>
              <Typography variant="h3" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                {usersList.filter(user => user.isActive).length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundColor: theme.palette.info.main, 
            color: theme.palette.info.contrastText
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>
                المشرفين
              </Typography>
              <Typography variant="h3" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                {usersList.filter(user => user.permissions === 'admin' || user.permissions === 'superadmin').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <Card sx={{ 
            backgroundColor: theme.palette.warning.main, 
            color: theme.palette.warning.contrastText
          }}>
            <CardContent>
              <Typography variant="h6" sx={{ textAlign: 'center', mb: 1 }}>
                المدراء
              </Typography>
              <Typography variant="h3" sx={{ textAlign: 'center', fontWeight: 'bold' }}>
                {usersList.filter(user => user.permissions === 'manager').length}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Toolbar */}
      <Box sx={{ mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              variant="outlined"
              placeholder="البحث عن مستخدم..."
              size="small"
              value={searchQuery}
              onChange={handleSearchChange}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
            />
          </Grid>
          <Grid item xs={12} md={6} sx={{ display: 'flex', gap: 2, justifyContent: { xs: 'flex-start', md: 'flex-end' } }}>
            <Button
              variant={activeFilter !== 'all' ? "contained" : "outlined"}
              startIcon={<FilterListIcon />}
              onClick={handleFilterClick}
              color={activeFilter !== 'all' ? "info" : "primary"}
            >
              {activeFilter === 'all' ? 'تصفية' : getActiveFilterName()}
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<TuneIcon />}
              onClick={handleOpenAdvancedFilter}
            >
              تصفية متقدمة
            </Button>
            <Button
              variant="outlined"
              color="secondary"
              startIcon={<ReceiptLongIcon />}
              onClick={handleExportToExcel}
            >
              تصدير إلى Excel
            </Button>
            <Menu
              id="filter-menu"
              anchorEl={filterAnchorEl}
              open={filterOpen}
              onClose={handleFilterClose}
              MenuListProps={{
                'aria-labelledby': 'filter-button',
              }}
            >
              <MenuItem 
                onClick={() => handleApplyFilter('all')}
                sx={{ fontWeight: activeFilter === 'all' ? 'bold' : 'normal' }}
              >
                جميع المستخدمين
                {activeFilter === 'all' ? (
                  <Chip size="small" label="نشط" color="primary" sx={{ mr: 1, ml: 1 }} />
                ) : (
                  <Chip size="small" label={getUsersCountByFilter('all')} color="default" variant="outlined" sx={{ mr: 1, ml: 1 }} />
                )}
              </MenuItem>
              <MenuItem 
                onClick={() => handleApplyFilter('active')}
                sx={{ fontWeight: activeFilter === 'active' ? 'bold' : 'normal' }}
              >
                المستخدمين النشطين
                {activeFilter === 'active' ? (
                  <Chip size="small" label="نشط" color="primary" sx={{ mr: 1, ml: 1 }} />
                ) : (
                  <Chip size="small" label={getUsersCountByFilter('active')} color="success" variant="outlined" sx={{ mr: 1, ml: 1 }} />
                )}
              </MenuItem>
              <MenuItem 
                onClick={() => handleApplyFilter('inactive')}
                sx={{ fontWeight: activeFilter === 'inactive' ? 'bold' : 'normal' }}
              >
                المستخدمين غير النشطين
                {activeFilter === 'inactive' ? (
                  <Chip size="small" label="نشط" color="primary" sx={{ mr: 1, ml: 1 }} />
                ) : (
                  <Chip size="small" label={getUsersCountByFilter('inactive')} color="error" variant="outlined" sx={{ mr: 1, ml: 1 }} />
                )}
              </MenuItem>
              <Divider />
              <MenuItem 
                onClick={() => handleApplyFilter('managers')}
                sx={{ fontWeight: activeFilter === 'managers' ? 'bold' : 'normal' }}
              >
                المدراء
                {activeFilter === 'managers' ? (
                  <Chip size="small" label="نشط" color="primary" sx={{ mr: 1, ml: 1 }} />
                ) : (
                  <Chip size="small" label={getUsersCountByFilter('managers')} color="warning" variant="outlined" sx={{ mr: 1, ml: 1 }} />
                )}
              </MenuItem>
              <MenuItem 
                onClick={() => handleApplyFilter('engineers')}
                sx={{ fontWeight: activeFilter === 'engineers' ? 'bold' : 'normal' }}
              >
                المهندسين
                {activeFilter === 'engineers' ? (
                  <Chip size="small" label="نشط" color="primary" sx={{ mr: 1, ml: 1 }} />
                ) : (
                  <Chip size="small" label={getUsersCountByFilter('engineers')} color="info" variant="outlined" sx={{ mr: 1, ml: 1 }} />
                )}
              </MenuItem>
              <MenuItem 
                onClick={() => handleApplyFilter('admins')}
                sx={{ fontWeight: activeFilter === 'admins' ? 'bold' : 'normal' }}
              >
                المشرفين
                {activeFilter === 'admins' ? (
                  <Chip size="small" label="نشط" color="primary" sx={{ mr: 1, ml: 1 }} />
                ) : (
                  <Chip size="small" label={getUsersCountByFilter('admins')} color="primary" variant="outlined" sx={{ mr: 1, ml: 1 }} />
                )}
              </MenuItem>
              <MenuItem 
                onClick={() => handleApplyFilter('contractors')}
                sx={{ fontWeight: activeFilter === 'contractors' ? 'bold' : 'normal' }}
              >
                المقاولين
                {activeFilter === 'contractors' ? (
                  <Chip size="small" label="نشط" color="primary" sx={{ mr: 1, ml: 1 }} />
                ) : (
                  <Chip size="small" label={getUsersCountByFilter('contractors')} color="secondary" variant="outlined" sx={{ mr: 1, ml: 1 }} />
                )}
              </MenuItem>
            </Menu>
            <Button
              variant="contained"
              color="primary"
              startIcon={<PersonAddIcon />}
              onClick={() => handleOpenUserModal()}
            >
              إضافة مستخدم
            </Button>
          </Grid>
        </Grid>
        {activeFilter !== 'all' && (
          <Box sx={{ mt: 2, p: 1, bgcolor: 'background.paper', borderRadius: 1, border: 1, borderColor: 'divider', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
              <FilterListIcon color="info" sx={{ mr: 1 }} />
              <Typography variant="body2">
                التصفية النشطة: <strong>{getActiveFilterName()}</strong> | تم العثور على <strong>{getFilteredUsers().length}</strong> {getFilteredUsers().length === 1 ? 'مستخدم' : 'مستخدمين'}
              </Typography>
            </Box>
            <Button 
              size="small" 
              variant="outlined"
              onClick={() => handleApplyFilter('all')}
              startIcon={<FilterListIcon />}
              color="info"
            >
              إلغاء التصفية
            </Button>
          </Box>
        )}
      </Box>

      {/* Users Table */}
      <TableContainer 
        component={Paper} 
        sx={{ 
          mb: 4, 
          overflowX: 'auto', 
          border: (theme) => `2px solid ${theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#000'}`, 
          borderRadius: '8px',
          boxShadow: (theme) => theme.palette.mode === 'dark' 
            ? '0 6px 12px rgba(0,0,0,0.3), 0 0 15px rgba(100,150,255,0.1) inset'
            : '0 6px 12px rgba(0,0,0,0.15), 0 0 15px rgba(50,100,200,0.2) inset',
          background: (theme) => theme.palette.mode === 'dark'
            ? 'linear-gradient(to bottom, #2c2c2c, #1f1f1f)'
            : 'linear-gradient(to bottom, #f9f9f9, #fff)'
        }}
      >
        <Table sx={{ minWidth: 1050, borderCollapse: 'collapse' }} aria-label="users table">
          <TableHead>
            <TableRow>
              <StyledTableCell align="center" sx={{ minWidth: '180px' }}>المستخدم</StyledTableCell>
              <StyledTableCell align="center" sx={{ minWidth: '150px' }}>القسم</StyledTableCell>
              <StyledTableCell align="center" sx={{ minWidth: '150px' }}>الدور</StyledTableCell>
              <StyledTableCell align="center" sx={{ minWidth: '200px' }}>
                <Box sx={{ 
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '100%',
                  direction: 'ltr'
                }}>
                  البريد الإلكتروني
                </Box>
              </StyledTableCell>
              <StyledTableCell align="center" sx={{ minWidth: '120px' }}>رقم الهاتف</StyledTableCell>
              <StyledTableCell align="center" sx={{ minWidth: '80px' }}>الحالة</StyledTableCell>
              <StyledTableCell align="center" sx={{ minWidth: '100px' }}>الصلاحيات</StyledTableCell>
              <StyledTableCell align="center" sx={{ minWidth: '80px' }}>الإجراءات</StyledTableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {visibleUsers.map((user) => (
              <StyledTableRow key={user.id}>
                <StyledTableCell component="th" scope="row" align="center" sx={{ minWidth: '180px' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1 }}>
                    <ProfileAvatar 
                      size="small"
                      sx={{ bgcolor: getUserAvatarColor(user) }} 
                      firstName={user.name}
                      src={user.avatar}
                      useCurrentUserAvatar={false}
                    />
                    <Typography variant="body2" sx={{ 
                      overflow: 'hidden', 
                      textOverflow: 'ellipsis', 
                      whiteSpace: 'nowrap',
                      maxWidth: '120px'
                    }}>
                      {user.name}
                    </Typography>
                  </Box>
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ minWidth: '150px' }}>
                  <Typography variant="body2" sx={{ 
                    textAlign: 'center',
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                    maxWidth: '130px',
                    margin: '0 auto'
                  }}>
                    {user.department}
                  </Typography>
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ minWidth: '150px' }}>
                  <Typography variant="body2" sx={{ 
                    textAlign: 'center',
                    overflow: 'hidden', 
                    textOverflow: 'ellipsis', 
                    whiteSpace: 'nowrap',
                    maxWidth: '130px',
                    margin: '0 auto'
                  }}>
                    {user.role}
                  </Typography>
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ minWidth: '200px' }}>
                  <Box sx={{ 
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    width: '100%',
                    direction: 'ltr'
                  }}>
                    {user.email}
                  </Box>
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ minWidth: '120px' }}>{user.phone}</StyledTableCell>
                <StyledTableCell align="center" sx={{ minWidth: '80px' }}>
                  {renderUserStatus(user.isActive)}
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ minWidth: '100px' }}>
                  {renderPermissionLevel(user.permissions)}
                </StyledTableCell>
                <StyledTableCell align="center" sx={{ minWidth: '80px' }}>
                  <IconButton size="small" onClick={(e) => handleActionClick(e, user.id)}>
                    <MoreVertIcon />
                  </IconButton>
                </StyledTableCell>
              </StyledTableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25]}
        component="div"
        count={getFilteredUsers().length}
        rowsPerPage={rowsPerPage}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        labelRowsPerPage="صفوف في الصفحة:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} من ${count}`}
      />

      {/* Action Menu */}
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={actionMenuOpen}
        onClose={handleActionClose}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
      >
        <MenuItem onClick={() => handleViewUserDetails(selectedId)}>
          <VisibilityIcon fontSize="small" sx={{ mr: 1 }} />
          عرض التفاصيل
        </MenuItem>
        <MenuItem onClick={() => handleEditUser(selectedId)}>
          <EditIcon fontSize="small" sx={{ mr: 1 }} />
          تعديل
        </MenuItem>
        <MenuItem onClick={() => handleManagePermissions(selectedId)}>
          <VerifiedUserIcon fontSize="small" sx={{ mr: 1 }} />
          إدارة الصلاحيات
        </MenuItem>
        <Divider />
        <MenuItem onClick={() => handleToggleUserStatus(selectedId)}>
          <BlockIcon fontSize="small" sx={{ mr: 1 }} />
          {usersList.find(user => user.id === selectedId)?.isActive ? 'تعطيل الحساب' : 'تفعيل الحساب'}
        </MenuItem>
        <MenuItem onClick={() => handleDeleteConfirmation(selectedId)} sx={{ color: 'error.main' }}>
          <DeleteIcon fontSize="small" sx={{ mr: 1 }} />
          حذف
        </MenuItem>
      </Menu>

      {/* نافذة إضافة/تعديل مستخدم */}
      <Dialog
        open={openUserModal}
        onClose={handleCloseUserModal}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ textAlign: 'right', fontWeight: 'bold' }}>
          {editMode ? 'تعديل بيانات المستخدم' : 'إضافة مستخدم جديد'}
        </DialogTitle>
        <DialogContent>
          <Box component="form" onSubmit={handleSubmitUser} sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <TextField
                  required
                  fullWidth
                  label="اسم المستخدم"
                  name="name"
                  value={userForm.name}
                  onChange={handleUserFormChange}
                  sx={{ mb: 2 }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="البريد الإلكتروني"
                  name="email"
                  type="email"
                  value={userForm.email}
                  onChange={handleUserFormChange}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <EmailIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  required
                  fullWidth
                  label="رقم الهاتف"
                  name="phone"
                  value={userForm.phone}
                  onChange={handleUserFormChange}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PhoneIcon />
                      </InputAdornment>
                    ),
                  }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>الدور الوظيفي</InputLabel>
                  <Select
                    name="role"
                    value={userForm.role}
                    label="الدور الوظيفي"
                    onChange={handleUserFormChange}
                    required
                    InputProps={{
                      startAdornment: (
                        <InputAdornment position="start">
                          <WorkIcon />
                        </InputAdornment>
                      ),
                    }}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role} value={role}>{role}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>القسم</InputLabel>
                  <Select
                    name="department"
                    value={userForm.department}
                    label="القسم"
                    onChange={handleUserFormChange}
                    required
                  >
                    {departments.map((department) => (
                      <MenuItem key={department} value={department}>{department}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>مستوى الصلاحيات</InputLabel>
                  <Select
                    name="permissions"
                    value={userForm.permissions}
                    label="مستوى الصلاحيات"
                    onChange={handleUserFormChange}
                  >
                    {permissionLevels.map((level) => (
                      <MenuItem key={level.value} value={level.value}>{level.label}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={userForm.isActive}
                      onChange={handleUserFormChange}
                      name="isActive"
                      color="success"
                    />
                  }
                  label="المستخدم نشط"
                  sx={{ mt: 2 }}
                />
              </Grid>
              <Grid item xs={12}>
                <Divider sx={{ mb: 2 }} />
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  كلمة المرور
                </Typography>
                <FormControlLabel
                  control={
                    <Switch 
                      checked={passwordMode === 'auto'} 
                      onChange={handlePasswordModeChange}
                      color="primary"
                    />
                  }
                  label="إرسال رسالة تفعيل الحساب وتعيين كلمة المرور للمستخدم"
                />
                
                {passwordMode === 'manual' && (
                  <Grid container spacing={3} sx={{ mt: 1 }}>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        label="كلمة المرور"
                        name="password"
                        type="password"
                        value={userForm.password}
                        onChange={handleUserFormChange}
                        sx={{ mb: 2 }}
                      />
                    </Grid>
                    <Grid item xs={12} sm={6}>
                      <TextField
                        fullWidth
                        required
                        label="تأكيد كلمة المرور"
                        name="confirmPassword"
                        type="password"
                        value={userForm.confirmPassword}
                        onChange={handleUserFormChange}
                        sx={{ mb: 2 }}
                        error={userForm.password !== userForm.confirmPassword && userForm.confirmPassword !== ''}
                        helperText={userForm.password !== userForm.confirmPassword && userForm.confirmPassword !== '' ? 'كلمة المرور غير متطابقة' : ''}
                      />
                    </Grid>
                  </Grid>
                )}
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseUserModal}>
            إلغاء
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmitUser}
            disabled={!userForm.name || !userForm.email || !userForm.role || !userForm.department || 
                     (passwordMode === 'manual' && !editMode && (!userForm.password || !userForm.confirmPassword || userForm.password !== userForm.confirmPassword))}
          >
            {editMode ? 'حفظ التغييرات' : 'إضافة المستخدم'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* نافذة تأكيد الحذف */}
      <Dialog
        open={deleteConfirmation.open}
        onClose={handleCloseDeleteConfirmation}
      >
        <DialogTitle sx={{ textAlign: 'right', fontWeight: 'bold' }}>
          تأكيد حذف المستخدم
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mb: 2 }}>
            هل أنت متأكد من رغبتك في حذف المستخدم <strong>{deleteConfirmation.userName}</strong>؟
          </Typography>
          <Typography variant="body2" color="error">
            هذا الإجراء لا يمكن التراجع عنه.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleCloseDeleteConfirmation}>
            إلغاء
          </Button>
          <Button 
            variant="contained" 
            color="error" 
            onClick={handleDeleteUser}
          >
            حذف
          </Button>
        </DialogActions>
      </Dialog>

      {/* نافذة التصفية المتقدمة */}
      <Dialog
        open={openAdvancedFilter}
        onClose={handleCloseAdvancedFilter}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ textAlign: 'right', fontWeight: 'bold' }}>
          تصفية متقدمة للمستخدمين
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Grid container spacing={3}>
              <Grid item xs={12}>
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  تصفية حسب الحالة
                </Typography>
                <RadioGroup
                  name="status"
                  value={advancedFilterOptions.status}
                  onChange={handleAdvancedFilterChange}
                  row
                >
                  <FormControlLabel value="all" control={<Radio />} label="الجميع" />
                  <FormControlLabel value="active" control={<Radio />} label="المستخدمين النشطين" />
                  <FormControlLabel value="inactive" control={<Radio />} label="المستخدمين غير النشطين" />
                </RadioGroup>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>الأقسام</InputLabel>
                  <Select
                    multiple
                    name="departments"
                    value={advancedFilterOptions.departments}
                    onChange={handleMultiSelectChange}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {departments.map((department) => (
                      <MenuItem key={department} value={department}>
                        <Checkbox checked={advancedFilterOptions.departments.indexOf(department) > -1} />
                        <ListItemText primary={department} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>الأدوار الوظيفية</InputLabel>
                  <Select
                    multiple
                    name="roles"
                    value={advancedFilterOptions.roles}
                    onChange={handleMultiSelectChange}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={value} size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {roles.map((role) => (
                      <MenuItem key={role} value={role}>
                        <Checkbox checked={advancedFilterOptions.roles.indexOf(role) > -1} />
                        <ListItemText primary={role} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} md={6}>
                <FormControl fullWidth>
                  <InputLabel>مستوى الصلاحيات</InputLabel>
                  <Select
                    multiple
                    name="permissions"
                    value={advancedFilterOptions.permissions}
                    onChange={handleMultiSelectChange}
                    renderValue={(selected) => (
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                        {selected.map((value) => (
                          <Chip key={value} label={
                            value === 'user' ? 'مستخدم عادي' :
                            value === 'manager' ? 'مدير' :
                            value === 'admin' ? 'مشرف' : 'مشرف عام'
                          } size="small" />
                        ))}
                      </Box>
                    )}
                  >
                    {permissionLevels.map((level) => (
                      <MenuItem key={level.value} value={level.value}>
                        <Checkbox checked={advancedFilterOptions.permissions.indexOf(level.value) > -1} />
                        <ListItemText primary={level.label} />
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleResetAdvancedFilter}
            startIcon={<ClearAllIcon />}
          >
            إعادة ضبط
          </Button>
          <Button onClick={handleCloseAdvancedFilter}>
            إلغاء
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleApplyAdvancedFilter}
            startIcon={<FilterAltIcon />}
          >
            تطبيق التصفية
          </Button>
        </DialogActions>
      </Dialog>

      {/* نافذة عرض تفاصيل المستخدم */}
      <Dialog
        open={openUserDetails}
        onClose={handleCloseUserDetails}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ textAlign: 'right', fontWeight: 'bold', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">تفاصيل المستخدم</Typography>
            {selectedUser && (
              <Chip 
                label={selectedUser.isActive ? "نشط" : "معطل"} 
                color={selectedUser.isActive ? "success" : "error"} 
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Grid container spacing={3}>
                <Grid item xs={12} sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                  <ProfileAvatar 
                    size="xlarge"
                    sx={{ 
                      bgcolor: getUserAvatarColor(selectedUser), 
                      fontSize: '2.5rem',
                      fontWeight: 'bold'
                    }}
                    firstName={selectedUser.name}
                    src={selectedUser.avatar}
                    useCurrentUserAvatar={selectedUser.email === userProfile.email}
                  />
                </Grid>
                
                <Grid item xs={12}>
                  <Typography variant="h5" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 2 }}>
                    {selectedUser.name}
                  </Typography>
                </Grid>
                
                <Grid item xs={12}>
                  <Paper variant="outlined" sx={{ p: 2 }}>
                    <List>
                      <ListItem>
                        <ListItemIcon>
                          <PersonIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="الاسم الكامل" 
                          secondary={selectedUser.name} 
                          primaryTypographyProps={{ align: 'right' }}
                          secondaryTypographyProps={{ align: 'right' }}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem>
                        <ListItemIcon>
                          <EmailIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="البريد الإلكتروني" 
                          secondary={selectedUser.email} 
                          primaryTypographyProps={{ align: 'right' }}
                          secondaryTypographyProps={{ align: 'right' }}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem>
                        <ListItemIcon>
                          <PhoneIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="رقم الهاتف" 
                          secondary={selectedUser.phone} 
                          primaryTypographyProps={{ align: 'right' }}
                          secondaryTypographyProps={{ align: 'right' }}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem>
                        <ListItemIcon>
                          <BadgeIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="الدور الوظيفي" 
                          secondary={selectedUser.role} 
                          primaryTypographyProps={{ align: 'right' }}
                          secondaryTypographyProps={{ align: 'right' }}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem>
                        <ListItemIcon>
                          <BusinessIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="القسم" 
                          secondary={selectedUser.department} 
                          primaryTypographyProps={{ align: 'right' }}
                          secondaryTypographyProps={{ align: 'right' }}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem>
                        <ListItemIcon>
                          <SecurityIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="مستوى الصلاحيات" 
                          secondary={
                            <Chip 
                              label={
                                selectedUser.permissions === 'admin' ? "مشرف" : 
                                selectedUser.permissions === 'superadmin' ? "مشرف عام" : 
                                selectedUser.permissions === 'manager' ? "مدير" : "مستخدم"
                              }
                              size="small"
                              sx={{
                                backgroundColor: getPermissionColor(selectedUser.permissions),
                                color: '#fff',
                                fontWeight: 'bold',
                                mt: 1
                              }}
                            />
                          } 
                          primaryTypographyProps={{ align: 'right' }}
                          secondaryTypographyProps={{ align: 'right' }}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem>
                        <ListItemIcon>
                          <CalendarTodayIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="تاريخ الإنشاء" 
                          secondary="22/06/2023" 
                          primaryTypographyProps={{ align: 'right' }}
                          secondaryTypographyProps={{ align: 'right' }}
                        />
                      </ListItem>
                      <Divider variant="inset" component="li" />
                      <ListItem>
                        <ListItemIcon>
                          <EventIcon color="primary" />
                        </ListItemIcon>
                        <ListItemText 
                          primary="آخر تسجيل دخول" 
                          secondary="15/08/2023 - 10:45" 
                          primaryTypographyProps={{ align: 'right' }}
                          secondaryTypographyProps={{ align: 'right' }}
                        />
                      </ListItem>
                    </List>
                  </Paper>
                </Grid>
              </Grid>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={() => handleEditUser(selectedUser?.id)}
            startIcon={<EditIcon />}
            color="primary"
          >
            تعديل
          </Button>
          <Button 
            onClick={handleCloseUserDetails}
            variant="contained"
          >
            إغلاق
          </Button>
        </DialogActions>
      </Dialog>

      {/* نافذة إدارة صلاحيات المستخدم */}
      <Dialog
        open={openPermissions}
        onClose={handleClosePermissions}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle sx={{ textAlign: 'right', fontWeight: 'bold', bgcolor: 'primary.main', color: 'primary.contrastText' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h6">إدارة صلاحيات المستخدم</Typography>
            {selectedUser && (
              <Chip 
                label={selectedUser.name} 
                color="default" 
                avatar={
                  <ProfileAvatar 
                    size="small"
                    sx={{ bgcolor: getUserAvatarColor(selectedUser) }}
                    firstName={selectedUser.name}
                    src={selectedUser.avatar}
                    useCurrentUserAvatar={false}
                  />
                }
              />
            )}
          </Box>
        </DialogTitle>
        <DialogContent>
          {selectedUser && (
            <Box sx={{ mt: 2 }}>
              <Paper sx={{ mb: 2, p: 2 }} variant="outlined">
                <Typography variant="subtitle1" sx={{ mb: 1, fontWeight: 'bold' }}>
                  مستوى الصلاحيات الحالي:
                </Typography>
                <Chip 
                  label={
                    selectedUser.permissions === 'admin' ? "مشرف" : 
                    selectedUser.permissions === 'superadmin' ? "مشرف عام" : 
                    selectedUser.permissions === 'manager' ? "مدير" : "مستخدم"
                  } 
                  sx={{
                    backgroundColor: getPermissionColor(selectedUser.permissions),
                    color: '#fff',
                    fontWeight: 'bold'
                  }} 
                />
              </Paper>

              <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
                <Tabs value={permissionsTab} onChange={handlePermissionsTabChange} centered>
                  <Tab label="لوحة التحكم" />
                  <Tab label="المشاريع" />
                  <Tab label="المهام" />
                  <Tab label="المستخدمين" />
                  <Tab label="التقارير" />
                </Tabs>
              </Box>

              {/* لوحة التحكم */}
              {permissionsTab === 0 && (
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPermissions.dashboard}
                        onChange={(e) => handlePermissionChange('dashboard', null, e)}
                        color="primary"
                      />
                    }
                    label="الوصول إلى لوحة التحكم"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPermissions.settings}
                        onChange={(e) => handlePermissionChange('settings', null, e)}
                        color="primary"
                      />
                    }
                    label="الوصول إلى الإعدادات"
                  />
                </Box>
              )}

              {/* المشاريع */}
              {permissionsTab === 1 && (
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPermissions.projects.view}
                        onChange={(e) => handlePermissionChange('projects', 'view', e)}
                        color="primary"
                      />
                    }
                    label="عرض المشاريع"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPermissions.projects.create}
                        onChange={(e) => handlePermissionChange('projects', 'create', e)}
                        color="primary"
                      />
                    }
                    label="إنشاء مشاريع جديدة"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPermissions.projects.edit}
                        onChange={(e) => handlePermissionChange('projects', 'edit', e)}
                        color="primary"
                      />
                    }
                    label="تعديل المشاريع"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPermissions.projects.delete}
                        onChange={(e) => handlePermissionChange('projects', 'delete', e)}
                        color="primary"
                      />
                    }
                    label="حذف المشاريع"
                  />
                </Box>
              )}

              {/* المهام */}
              {permissionsTab === 2 && (
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPermissions.tasks.view}
                        onChange={(e) => handlePermissionChange('tasks', 'view', e)}
                        color="primary"
                      />
                    }
                    label="عرض المهام"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPermissions.tasks.create}
                        onChange={(e) => handlePermissionChange('tasks', 'create', e)}
                        color="primary"
                      />
                    }
                    label="إنشاء مهام جديدة"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPermissions.tasks.edit}
                        onChange={(e) => handlePermissionChange('tasks', 'edit', e)}
                        color="primary"
                      />
                    }
                    label="تعديل المهام"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPermissions.tasks.delete}
                        onChange={(e) => handlePermissionChange('tasks', 'delete', e)}
                        color="primary"
                      />
                    }
                    label="حذف المهام"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPermissions.tasks.assign}
                        onChange={(e) => handlePermissionChange('tasks', 'assign', e)}
                        color="primary"
                      />
                    }
                    label="تعيين المهام للمستخدمين"
                  />
                </Box>
              )}

              {/* المستخدمين */}
              {permissionsTab === 3 && (
                <Box>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPermissions.users.view}
                        onChange={(e) => handlePermissionChange('users', 'view', e)}
                        color="primary"
                      />
                    }
                    label="عرض المستخدمين"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPermissions.users.create}
                        onChange={(e) => handlePermissionChange('users', 'create', e)}
                        color="primary"
                      />
                    }
                    label="إضافة مستخدمين جدد"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPermissions.users.edit}
                        onChange={(e) => handlePermissionChange('users', 'edit', e)}
                        color="primary"
                      />
                    }
                    label="تعديل بيانات المستخدمين"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPermissions.users.delete}
                        onChange={(e) => handlePermissionChange('users', 'delete', e)}
                        color="primary"
                      />
                    }
                    label="حذف المستخدمين"
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={userPermissions.users.permissions}
                        onChange={(e) => handlePermissionChange('users', 'permissions', e)}
                        color="primary"
                      />
                    }
                    label="إدارة صلاحيات المستخدمين"
                  />
                </Box>
              )}

              {/* التقارير */}
              {permissionsTab === 4 && (
                <Box>
                  <FormControlLabel
                    control={
                      <Switch

                        color="primary"
                      />
                    }
                    label="عرض التقارير"
                  />
                  <FormControlLabel
                    control={
                      <Switch

                        color="primary"
                      />
                    }
                    label="تصدير التقارير"
                  />
                  <FormControlLabel
                    control={
                      <Switch

                        color="primary"
                      />
                    }
                    label="إنشاء تقارير مخصصة"
                  />
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button 
            onClick={handleClosePermissions}
          >
            إلغاء
          </Button>
          <Button 
            variant="contained" 
            color="primary"
            onClick={handleSavePermissions}
            startIcon={<VpnKeyIcon />}
          >
            حفظ الصلاحيات
          </Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar للإشعارات */}
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
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default Users;
