import React, { useState } from 'react';
import {
  Badge,
  IconButton,
  Menu,
  MenuItem,
  Divider,
  Typography,
  Box,
  ListItemText,
  ListItemIcon,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  Button,
  Tooltip,
  Chip,
} from '@mui/material';
import NotificationsIcon from '@mui/icons-material/Notifications';
import TaskIcon from '@mui/icons-material/Task';
import DescriptionIcon from '@mui/icons-material/Description';
import FolderIcon from '@mui/icons-material/Folder';
import AssignmentIcon from '@mui/icons-material/Assignment';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import DeleteIcon from '@mui/icons-material/Delete';
import MarkChatReadIcon from '@mui/icons-material/MarkChatRead';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../../contexts/UserContext';
import { formatDistanceToNow } from 'date-fns';
import { ar } from 'date-fns/locale';
import { styled } from '@mui/material/styles';
import { brandColors } from '../../utils/colorUtils';

// تخصيص شارة الإشعارات لتكون أكثر وضوحاً
const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    right: -3,
    top: 3,
    backgroundColor: brandColors.notification, // استخدام لون الإشعارات من نظام الألوان الموحد
    color: 'white',
    fontWeight: 'bold',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    padding: '0 6px',
    minWidth: '18px',
    height: '18px',
    fontSize: '0.75rem',
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(1)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(1.4)',
      opacity: 0,
    },
  },
}));

const Notifications = () => {
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const navigate = useNavigate();
  
  const {
    userNotifications,
    unreadNotificationsCount,
    markNotificationAsRead,
    markAllNotificationsAsRead,
    deleteNotification,
    deleteAllNotifications,
  } = useUser();

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleMarkAsRead = (id) => {
    markNotificationAsRead(id);
  };

  const handleMarkAllAsRead = () => {
    markAllNotificationsAsRead();
  };

  const handleDelete = (id, event) => {
    event.stopPropagation();
    deleteNotification(id);
  };

  const handleClearAll = () => {
    deleteAllNotifications();
    handleClose();
  };

  const handleNavigate = (notification) => {
    markNotificationAsRead(notification.id);
    handleClose();
    navigate(notification.link);
  };

  // وظيفة للحصول على أيقونة مناسبة لنوع الإشعار
  const getNotificationIcon = (type) => {
    switch (type) {
      case 'task':
        return <TaskIcon fontSize="small" color="primary" />;
      case 'document':
        return <DescriptionIcon fontSize="small" color="info" />;
      case 'project':
        return <FolderIcon fontSize="small" color="secondary" />;
      default:
        return <AssignmentIcon fontSize="small" color="warning" />;
    }
  };

  // وظيفة لتنسيق التاريخ بشكل نسبي
  const formatDate = (dateString) => {
    try {
      return formatDistanceToNow(new Date(dateString), {
        addSuffix: true,
        locale: ar,
      });
    } catch (error) {
      return 'وقت غير معروف';
    }
  };

  return (
    <>
      <Tooltip title="الإشعارات">
        <IconButton
          color="inherit"
          onClick={handleClick}
          size="large"
          sx={{ mr: 1 }}
        >
          <StyledBadge badgeContent={unreadNotificationsCount} max={99}>
            <NotificationsIcon />
          </StyledBadge>
        </IconButton>
      </Tooltip>
      
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          sx: {
            width: 360,
            maxHeight: 500,
            overflow: 'auto',
            mt: 1.5,
            '& .MuiMenuItem-root': {
              py: 1,
              px: 2,
            },
          },
        }}
        transformOrigin={{ horizontal: 'left', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'left', vertical: 'bottom' }}
      >
        <Box sx={{ p: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h6" component="div">
            الإشعارات
          </Typography>
          {unreadNotificationsCount > 0 && (
            <Chip
              label={`${unreadNotificationsCount} جديدة`}
              sx={{ 
                backgroundColor: brandColors.notification, // استخدام لون الإشعارات من نظام الألوان الموحد
                color: 'white',
                fontWeight: 'bold'
              }}
              size="small"
            />
          )}
        </Box>
        
        <Divider />
        
        {userNotifications.length === 0 ? (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              لا توجد إشعارات جديدة
            </Typography>
          </Box>
        ) : (
          <>
            <List sx={{ pt: 0, pb: 0 }}>
              {userNotifications.map((notification) => (
                <ListItem
                  key={notification.id}
                  sx={{
                    backgroundColor: notification.read ? 'transparent' : 'action.hover',
                    borderRight: notification.read ? 'none' : '3px solid',
                    borderColor: 'primary.main',
                    transition: 'all 0.2s',
                    '&:hover': {
                      backgroundColor: 'action.selected',
                    },
                    pr: notification.read ? 2 : 1.7,
                    cursor: 'pointer',
                  }}
                  onClick={() => handleNavigate(notification)}
                  secondaryAction={
                    <Box sx={{ display: 'flex' }}>
                      {!notification.read && (
                        <Tooltip title="تحديد كمقروء">
                          <IconButton
                            edge="end"
                            size="small"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleMarkAsRead(notification.id);
                            }}
                          >
                            <CheckCircleIcon fontSize="small" />
                          </IconButton>
                        </Tooltip>
                      )}
                      <Tooltip title="حذف">
                        <IconButton
                          edge="end"
                          size="small"
                          onClick={(e) => handleDelete(notification.id, e)}
                        >
                          <DeleteIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Box>
                  }
                >
                  <ListItemAvatar>
                    <Avatar sx={{ bgcolor: notification.read ? 'grey.300' : 'primary.light' }}>
                      {getNotificationIcon(notification.type)}
                    </Avatar>
                  </ListItemAvatar>
                  <ListItemText
                    primary={
                      <Typography
                        variant="subtitle2"
                        sx={{
                          fontWeight: notification.read ? 'normal' : 'bold',
                          color: notification.read ? 'text.primary' : 'text.primary',
                        }}
                      >
                        {notification.title}
                      </Typography>
                    }
                    secondary={
                      <>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{
                            display: '-webkit-box',
                            overflow: 'hidden',
                            WebkitBoxOrient: 'vertical',
                            WebkitLineClamp: 2,
                          }}
                        >
                          {notification.message}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                          sx={{ display: 'block', mt: 0.5 }}
                        >
                          {formatDate(notification.time)}
                        </Typography>
                      </>
                    }
                  />
                </ListItem>
              ))}
            </List>
            
            <Divider />
            
            <Box sx={{ p: 1, display: 'flex', justifyContent: 'space-between' }}>
              <Button
                size="small"
                startIcon={<MarkChatReadIcon />}
                onClick={handleMarkAllAsRead}
                disabled={unreadNotificationsCount === 0}
              >
                تحديد الكل كمقروء
              </Button>
              <Button
                size="small"
                startIcon={<DeleteIcon />}
                color="error"
                onClick={handleClearAll}
              >
                حذف الكل
              </Button>
            </Box>
          </>
        )}
      </Menu>
    </>
  );
};

export default Notifications; 