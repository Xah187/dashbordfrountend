import React from 'react';
import { Chip, keyframes } from '@mui/material';
import { getAutoRenewColor } from '../../utils/colorUtils';

// تأثير النبض للتجديد التلقائي المفعل
const pulse = keyframes`
  0% {
    box-shadow: 0 0 0 0 rgba(0, 200, 83, 0.7);
  }
  70% {
    box-shadow: 0 0 0 6px rgba(0, 200, 83, 0);
  }
  100% {
    box-shadow: 0 0 0 0 rgba(0, 200, 83, 0);
  }
`;

/**
 * مكون لعرض حالة التجديد التلقائي للاشتراكات
 * @param {Object} props - خصائص المكون
 * @param {boolean} props.autoRenew - حالة التجديد التلقائي
 * @param {Object} props.sx - خصائص إضافية للتنسيق
 * @returns {JSX.Element} مكون شارة حالة التجديد التلقائي
 */
const AutoRenewBadge = ({ autoRenew, sx = {} }) => {
  const isActive = typeof autoRenew === 'boolean' ? autoRenew : autoRenew === 'مفعل';
  
  return (
    <Chip
      label={isActive ? 'مفعل' : 'غير مفعل'}
      sx={{
        bgcolor: getAutoRenewColor(isActive),
        color: 'white',
        fontWeight: 'bold',
        animation: isActive ? `${pulse} 2s infinite` : 'none',
        ...sx
      }}
      size="small"
    />
  );
};

export default AutoRenewBadge; 