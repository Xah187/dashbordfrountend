import React from 'react';
import { Box, Button, Typography, Container, Paper } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import ErrorOutlineIcon from '@mui/icons-material/ErrorOutline';
import { styled } from '@mui/material/styles';
import Logo from '../components/common/Logo';

const ErrorContainer = styled(Paper)(({ theme }) => ({
  padding: theme.spacing(6),
  borderRadius: theme.spacing(2),
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  textAlign: 'center',
  maxWidth: '500px',
  margin: '0 auto',
  boxShadow: '0 8px 30px rgba(0,0,0,0.12)',
}));

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <Container maxWidth="md" sx={{ py: 8 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 4 }}>
        <Logo size="medium" />
      </Box>
      <ErrorContainer>
        <ErrorOutlineIcon 
          sx={{ 
            fontSize: '80px', 
            color: 'error.main',
            mb: 3
          }} 
        />
        <Typography variant="h1" gutterBottom sx={{ fontSize: '3.5rem', fontWeight: 'bold' }}>
          404
        </Typography>
        <Typography variant="h4" gutterBottom sx={{ fontWeight: 'medium' }}>
          الصفحة غير موجودة
        </Typography>
        <Typography variant="body1" color="text.secondary" paragraph sx={{ mb: 4, maxWidth: '80%' }}>
          عذراً، الصفحة التي تبحث عنها غير موجودة أو ربما تم نقلها أو حذفها.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button 
            variant="contained" 
            color="primary" 
            size="large"
            onClick={() => navigate('/')}
          >
            العودة للرئيسية
          </Button>
          <Button 
            variant="outlined" 
            color="primary" 
            size="large"
            onClick={() => navigate(-1)}
          >
            العودة للصفحة السابقة
          </Button>
        </Box>
      </ErrorContainer>
    </Container>
  );
};

export default NotFound;
