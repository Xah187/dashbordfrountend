import React from 'react';
import { Chip } from '@mui/material';
import { getCompanyStatusColor } from '../../utils/colorUtils';

/**
 * مكون لعرض حالة الشركة
 * @param {Object} props - خصائص المكون
 * @param {string} props.status - حالة الشركة
 * @param {Object} props.sx - خصائص إضافية للتنسيق
 * @returns {JSX.Element} مكون شارة حالة الشركة
 */
const CompanyStatusBadge = ({ status, sx = {} }) => {
  return (
    <Chip
      label={status}
      sx={{
        bgcolor: getCompanyStatusColor(status),
        color: 'white',
        fontWeight: 'bold',
        minWidth: '60px',
        fontSize: '0.75rem',
        ...sx
      }}
      size="small"
    />
  );
};

export default CompanyStatusBadge; 