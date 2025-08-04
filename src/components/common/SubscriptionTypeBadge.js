import React from 'react';
import { Chip } from '@mui/material';
import { getSubscriptionTypeColor } from '../../utils/colorUtils';

/**
 * مكون لعرض نوع الاشتراك
 * @param {Object} props - خصائص المكون
 * @param {string} props.type - نوع الاشتراك
 * @param {Object} props.sx - خصائص إضافية للتنسيق
 * @returns {JSX.Element} مكون شارة نوع الاشتراك
 */
const SubscriptionTypeBadge = ({ type, sx = {} }) => {
  return (
    <Chip
      label={type}
      sx={{
        bgcolor: getSubscriptionTypeColor(type),
        color: 'white',
        fontWeight: 'bold',
        minWidth: '70px',
        fontSize: '0.75rem',
        ...sx
      }}
      size="small"
    />
  );
};

export default SubscriptionTypeBadge; 