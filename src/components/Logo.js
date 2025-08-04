import React from 'react';
import { Box, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import ConstructionIcon from '@mui/icons-material/Construction';
import EngineeringIcon from '@mui/icons-material/Engineering';
import SupervisorAccountIcon from '@mui/icons-material/SupervisorAccount';

const LogoWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  flexDirection: 'column',
}));

const LogoIconWrapper = styled(Box)(({ theme, color }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 60,
  height: 60,
  borderRadius: '50%',
  backgroundColor: color || theme.palette.primary.main,
  marginBottom: 8,
}));

// مكون الشعار
const Logo = ({ size = 'medium', withText = true, color, printMode = false, type = 'default' }) => {
  // أحجام مختلفة للشعار
  const sizeMap = {
    small: {
      iconSize: 24,
      wrapperSize: 40,
      fontSize: 12,
    },
    medium: {
      iconSize: 40,
      wrapperSize: 60,
      fontSize: 16,
    },
    large: {
      iconSize: 56,
      wrapperSize: 80,
      fontSize: 20,
    },
    print: {
      iconSize: 60,
      wrapperSize: 90,
      fontSize: 24,
    }
  };

  // تحديد نوع الشعار المستخدم
  const logoType = printMode ? 'moshrif' : type;
  
  // مكون الأيقونة حسب النوع
  const getLogoIcon = () => {
    switch(logoType) {
      case 'moshrif':
        return <SupervisorAccountIcon sx={{ fontSize: iconSize, color: '#fff' }} />;
      case 'engineering':
        return <EngineeringIcon sx={{ fontSize: iconSize, color: '#fff' }} />;
      case 'default':
      default:
        return <ConstructionIcon sx={{ fontSize: iconSize, color: '#fff' }} />;
    }
  };

  // عنوان الشعار حسب النوع
  const getLogoTitle = () => {
    switch(logoType) {
      case 'moshrif':
        return (
          <>
            منصة مشرف
            <Typography
              component="span"
              display="block"
              sx={{ 
                fontSize: fontSize * 0.75,
                fontWeight: 'medium',
                ...(printMode && {
                  color: 'text.secondary'
                })
              }}
            >
              لإدارة المشاريع
            </Typography>
          </>
        );
      default:
        return (
          <>
            منصة إدارة المشاريع
            <Typography
              component="span"
              display="block"
              sx={{ 
                fontSize: fontSize * 0.75,
                fontWeight: 'medium',
                ...(printMode && {
                  color: 'text.secondary'
                })
              }}
            >
              الإنشائية
            </Typography>
          </>
        );
    }
  };

  const { iconSize, wrapperSize, fontSize } = printMode 
    ? sizeMap.print 
    : sizeMap[size] || sizeMap.medium;

  return (
    <LogoWrapper>
      <LogoIconWrapper
        color={color}
        sx={{ 
          width: wrapperSize, 
          height: wrapperSize,
          ...(printMode && {
            border: '2px solid',
            borderColor: 'primary.main'
          })
        }}
      >
        {getLogoIcon()}
      </LogoIconWrapper>
      {withText && (
        <Typography
          variant={printMode ? 'h5' : 'subtitle1'}
          sx={{ 
            fontWeight: 'bold',
            fontSize: fontSize,
            textAlign: 'center',
            ...(printMode && {
              color: 'primary.main'
            })
          }}
        >
          {getLogoTitle()}
        </Typography>
      )}
    </LogoWrapper>
  );
};

export default Logo; 