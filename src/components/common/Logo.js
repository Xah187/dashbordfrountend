import React from 'react';
import { Box, SvgIcon } from '@mui/material';
import { useTheme } from '../../contexts/ThemeContext';
import { getLogoColor, brandColors } from '../../utils/colorUtils';

/**
 * مكون الشعار - يعرض شعار الشركة بطريقة موحدة في جميع أنحاء التطبيق
 * 
 * @param {Object} props خصائص المكون
 * @param {string} props.size حجم الشعار (small, medium, large)
 * @param {string} props.variant نوع العرض (standard, circle, square)
 * @param {Object} props.sx خصائص التنسيق الإضافية
 * @returns {JSX.Element}
 */
const Logo = ({ size = 'medium', variant = 'standard', sx = {} }) => {
  const { darkMode } = useTheme();
  
  // تحديد أحجام الشعار القياسية
  const sizeMap = {
    xsmall: 24,
    small: 32,
    medium: 48,
    large: 64,
    xlarge: 80
  };
  
  // حساب الحجم الفعلي
  const actualSize = sizeMap[size] || sizeMap.medium;
  
  // الحصول على لون الشعار من وظيفة الألوان الموحدة
  const logoColor = getLogoColor();
  
  // تنسيقات مختلفة للشعار حسب النوع
  const variantStyles = {
    standard: {},
    circle: {
      borderRadius: '50%',
      overflow: 'hidden',
      bgcolor: logoColor,
      p: 0
    },
    square: {
      borderRadius: 1,
      overflow: 'hidden',
      bgcolor: logoColor,
      p: 0
    }
  };
  
  // MoshrifIcon SVG component - converted from React Native SVG to React web SVG
  const MoshrifIcon = (props) => (
    <SvgIcon 
      {...props} 
      viewBox="0 0 168 160" 
      sx={{ 
        width: actualSize, 
        height: actualSize,
        fill: darkMode ? logoColor : logoColor,
        '& path': {
          fill: '#FFFFFF'
        }
      }}
    >
      <path d="M32 101.553V73.9885C32 68.9949 36.429 65 41.8423 65H67.2681C70.4395 65 71.9705 65.6991 73.5562 67.9462L80.3365 77.3342C82.633 80.5301 87.7729 80.5301 90.0147 77.3342L96.7949 67.9462C98.3806 65.749 99.9663 65 103.083 65H126.158C131.626 65 136 69.0448 136 73.9885V95.0115C136 100.005 131.571 104 126.158 104H109.535C104.067 104 99.693 99.9552 99.693 95.0115C99.693 89.7682 92.2019 87.7209 89.0305 92.1152L83.1798 100.305C81.1567 103.101 79.2976 104 75.1966 104H64.0967C59.9411 104 58.1367 103.101 56.1136 100.305L50.1535 92.0154C46.9821 87.621 39.4911 89.6684 39.4911 94.9116V101.553C39.4911 103.351 38.7802 104 36.8118 104H34.734C32.7655 104 32.0547 103.351 32.0547 101.553H32Z" />
    </SvgIcon>
  );

  return (
    <Box 
      sx={{ 
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: actualSize,
        height: actualSize,
        ...variantStyles[variant],
        ...sx
      }}
    >
      <MoshrifIcon />
    </Box>
  );
};

export default Logo;
