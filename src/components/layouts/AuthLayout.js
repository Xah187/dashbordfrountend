import React from 'react';
import { Box, Container, Paper, Typography } from '@mui/material';
import { styled } from '@mui/material/styles';
import { useTheme } from '../../contexts/ThemeContext';
import Logo from '../common/Logo';

const AuthWrapper = styled(Box)(({ theme }) => ({
  display: 'flex',
  minHeight: '100vh',
  alignItems: 'center',
  justifyContent: 'center',
  background: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.primary.dark} 100%)`,
  padding: theme.spacing(2),
}));

const AuthPaper = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(4),
  borderRadius: theme.spacing(2),
  maxWidth: 450,
  width: '100%',
  boxShadow: '0 8px 40px rgba(0,0,0,0.12)',
  margin: '0 auto',
}));

const AuthHeader = styled(Box)(({ theme }) => ({
  marginBottom: theme.spacing(4),
  textAlign: 'center',
}));

const AuthLayout = ({ children }) => {
  const { darkMode } = useTheme();
  
  return (
    <AuthWrapper>
      <Container maxWidth="sm" sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
        <AuthPaper elevation={6}>
          <AuthHeader>
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mb: 2 }}>
              <Logo size="xlarge" variant="circle" sx={{ mb: 2 }} />
            </Box>
            <Typography 
              variant="h4" 
              component="h1" 
              gutterBottom
              sx={{ 
                fontWeight: 800, 
                color: theme => theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                mb: 2,
                letterSpacing: '0.5px'
              }}
            >
              لوحة تحكم مشرف
            </Typography>
            <Typography 
              variant="body1" 
              sx={{ 
                color: theme => theme.palette.mode === 'dark' ? '#ffffff' : '#000000',
                fontWeight: 600,
                mb: 3,
                letterSpacing: '0.3px'
              }}
            >
              مرحباً بك في لوحة التحكم الإدارية
            </Typography>
          </AuthHeader>
          {children}
        </AuthPaper>
      </Container>
    </AuthWrapper>
  );
};

export default AuthLayout;
