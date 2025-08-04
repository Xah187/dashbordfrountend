import React from 'react';
import { Avatar, Badge, Tooltip } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useUser } from '../../contexts/UserContext';
import { getUserAvatarColor, getStatusColor } from '../../utils/colorUtils';

// تخصيص شارة الحالة
const StyledBadge = styled(Badge)(({ theme, status }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: status === 'online' ? '#44b700' : 
                    status === 'away' ? '#ff9800' : 
                    status === 'offline' ? '#bdbdbd' : '#44b700',
    color: status === 'online' ? '#44b700' : 
          status === 'away' ? '#ff9800' : 
          status === 'offline' ? '#bdbdbd' : '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': status === 'online' ? {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    } : {},
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

/**
 * مكون الصورة الشخصية القابل لإعادة الاستخدام
 * 
 * @param {Object} props - خصائص المكون
 * @param {string} props.src - مصدر الصورة (اختياري، إذا لم يتم تحديده سيتم استخدام صورة المستخدم الحالي)
 * @param {string} props.firstName - الاسم الأول (اختياري، إذا لم يتم تحديده سيتم استخدام اسم المستخدم الحالي)

 * @param {string} props.size - حجم الصورة: 'small', 'medium', 'large', 'xlarge' أو قيمة محددة بالبكسل
 * @param {Object} props.sx - نمط إضافي للصورة
 * @param {string} props.status - حالة المستخدم: 'online', 'away', 'offline' أو 'none'
 * @param {string} props.tooltip - نص التلميح عند تحويم الماوس (اختياري)
 * @param {Function} props.onClick - وظيفة النقر على الصورة (اختياري)
 * @param {boolean} props.useCurrentUserAvatar - ما إذا كان سيتم استخدام صورة المستخدم الحالي
 * @param {string} props.permission - صلاحية المستخدم (اختياري)
 * @param {boolean} props.isActive - حالة نشاط المستخدم (اختياري)
 */
const ProfileAvatar = React.forwardRef(({ 
  src, 
  firstName, 
  size = 'medium',
  sx = {}, 
  status = 'none',
  tooltip = '',
  onClick,
  useCurrentUserAvatar = false,
  permission = 'user',
  isActive = true,
  user = null,
  ...props 
}, ref) => {
  // استخدام سياق المستخدم للحصول على بيانات المستخدم الحالي
  const { userProfile } = useUser();
  
  // استخدام البيانات المقدمة أو البيانات من سياق المستخدم
  // إذا كان هناك src محدد، فاستخدمه، وإلا استخدم صورة المستخدم الحالي فقط إذا تم تحديد useCurrentUserAvatar
  const avatarSrc = src || (useCurrentUserAvatar ? userProfile.avatar : undefined);
  // استخدام الاسم المقدم أو اسم المستخدم الحالي فقط إذا تم تحديد useCurrentUserAvatar
  const name = firstName || (useCurrentUserAvatar ? userProfile.firstName : '');
  
  // تحديد حجم الصورة
  const sizeMap = {
    small: 32,
    medium: 40,
    large: 64,
    xlarge: 120
  };
  
  const avatarSize = sizeMap[size] || size;
  
  // إنشاء الحرف الأول من الاسم في حالة عدم وجود صورة
  const firstLetter = name ? name.charAt(0).toUpperCase() : 'م';
  
  // الحصول على لون خلفية الأفاتار بناءً على بيانات المستخدم
  const getAvatarBackgroundColor = () => {
    // إذا تم تمرير كائن المستخدم بالكامل
    if (user) {
      return getUserAvatarColor(user);
    }
    
    // إذا تم تمرير الصلاحية وحالة النشاط فقط
    const userObj = {
      permissions: permission,
      isActive
    };
    return getUserAvatarColor(userObj);
  };
  
  // إنشاء صورة مع أو بدون شارة حالة
  const AvatarComponent = React.forwardRef((avatarProps, avatarRef) => (
    <Avatar
      ref={avatarRef}
      src={avatarSrc}
      sx={{ 
        width: avatarSize, 
        height: avatarSize,
        fontSize: typeof avatarSize === 'number' ? avatarSize / 2.5 : '1rem',
        bgcolor: !avatarSrc ? getAvatarBackgroundColor() : undefined,
        ...sx 
      }}
      onClick={onClick}
      {...props}
      {...avatarProps}
    >
      {!avatarSrc && firstLetter}
    </Avatar>
  ));
  
  // إذا كانت هناك حالة، أضف شارة
  if (status !== 'none') {
    return (
      <Tooltip title={tooltip} arrow={!!tooltip}>
        <StyledBadge
          overlap="circular"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
          variant="dot"
          status={status}
        >
          <AvatarComponent ref={ref} />
        </StyledBadge>
      </Tooltip>
    );
  }
  
  // إذا كان هناك تلميح، أضفه
  if (tooltip) {
    return (
      <Tooltip title={tooltip} arrow>
        <AvatarComponent ref={ref} />
      </Tooltip>
    );
  }
  
  // صورة عادية بدون إضافات
  return <AvatarComponent ref={ref} />;
});

// إضافة displayName للمكون
ProfileAvatar.displayName = 'ProfileAvatar';

export default ProfileAvatar; 