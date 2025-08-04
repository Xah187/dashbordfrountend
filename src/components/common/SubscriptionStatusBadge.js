import React from 'react';
import { Chip } from '@mui/material';
import { getSubscriptionStatusColor } from '../../utils/colorUtils';

/**
 * مكون لعرض حالة الاشتراك
 * @param {Object} props - خصائص المكون
 * @param {string} props.status - حالة الاشتراك
 * @param {Object} props.sx - خصائص إضافية للتنسيق
 * @returns {JSX.Element} مكون شارة حالة الاشتراك
 */
const SubscriptionStatusBadge = ({ status, sx = {} }) => {
  return (
    <Chip
      label={status}
      sx={{
        bgcolor: getSubscriptionStatusColor(status),
        color: 'white',
        fontWeight: 'bold',
        ...sx
      }}
      size="small"
    />
  );
};

export default SubscriptionStatusBadge; 