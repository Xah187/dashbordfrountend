import React from 'react';
import { Chip } from '@mui/material';
import { getCompanyTypeColor } from '../../utils/colorUtils';

/**
 * مكون لعرض نوع الشركة
 * @param {Object} props - خصائص المكون
 * @param {string} props.type - نوع الشركة
 * @param {Object} props.sx - خصائص إضافية للتنسيق
 * @returns {JSX.Element} مكون شارة نوع الشركة
 */
const CompanyTypeBadge = ({ type, sx = {} }) => {
  const displayType = type || 'أخرى';
  
  return (
    <Chip
      label={displayType}
      sx={{
        bgcolor: getCompanyTypeColor(displayType),
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

export default CompanyTypeBadge; 