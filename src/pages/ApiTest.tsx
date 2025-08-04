import React, { useState } from 'react';
import {
  Box,
  Button,
  Card,
  CardContent,
  Typography,
  Alert,
  CircularProgress,
  Grid,
  Chip,
  Divider
} from '@mui/material';
import { 
  fetchCompanies, 
  fetchStageTemplates,
  createCompany 
} from '../api/database-api';

const ApiTest: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({});
  const [error, setError] = useState<string | null>(null);

  const testEndpoint = async (name: string, testFn: () => Promise<any>) => {
    setLoading(true);
    setError(null);
    
    try {
      const result = await testFn();
      
      setResults((prev: any) => ({
        ...prev,
        [name]: {
          status: 'success',
          data: result,
          timestamp: new Date().toLocaleTimeString('en-GB')
        }
      }));
    } catch (err) {
      console.error(`❌ فشل ${name}:`, err);
      setError(`فشل في ${name}: ${err instanceof Error ? err.message : 'خطأ غير معروف'}`);
      
      setResults((prev: any) => ({
        ...prev,
        [name]: {
          status: 'error',
          error: err instanceof Error ? err.message : 'خطأ غير معروف',
          timestamp: new Date().toLocaleTimeString('en-GB')
        }
      }));
    } finally {
      setLoading(false);
    }
  };

  const runAllTests = async () => {
    setResults({});
    setError(null);
    
    // اختبار جلب الشركات
    await testEndpoint('جلب الشركات', fetchCompanies);
    
    // اختبار جلب قوالب المراحل
    await testEndpoint('جلب قوالب المراحل', fetchStageTemplates);
    
    // اختبار إنشاء شركة تجريبية
    await testEndpoint('إنشاء شركة تجريبية', () => 
      createCompany({
        name: 'شركة اختبار API',
        industry: 'التكنولوجيا',
        contactEmail: 'test@example.com',
        contactPhone: '+966500000000',
        website: 'https://test.example.com',
        address: 'الرياض، المملكة العربية السعودية',
        isActive: true
      })
    );
  };

  const TestCard: React.FC<{ name: string; result: any }> = ({ name, result }) => (
    <Card sx={{ mb: 2 }}>
      <CardContent>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Typography variant="h6">{name}</Typography>
          <Chip 
            label={result.status === 'success' ? 'نجح' : 'فشل'} 
            color={result.status === 'success' ? 'success' : 'error'}
            size="small"
          />
        </Box>
        
        <Typography variant="caption" color="text.secondary" gutterBottom>
          الوقت: {result.timestamp}
        </Typography>
        
        {result.status === 'success' ? (
          <Box>
            <Typography variant="body2" color="success.main" gutterBottom>
              ✅ تم بنجاح
            </Typography>
            <Box 
              component="pre" 
              sx={{ 
                bgcolor: 'grey.100', 
                p: 2, 
                borderRadius: 1, 
                fontSize: '0.8rem',
                maxHeight: '200px',
                overflow: 'auto'
              }}
            >
              {JSON.stringify(result.data, null, 2)}
            </Box>
          </Box>
        ) : (
          <Alert severity="error">
            {result.error}
          </Alert>
        )}
      </CardContent>
    </Card>
  );

  return (
    <Box p={3}>
      <Typography variant="h4" gutterBottom align="center">
        🔗 اختبار ربط الباك إند
      </Typography>
      
      <Typography variant="body1" color="text.secondary" align="center" mb={4}>
        هذه الصفحة لاختبار الاتصال بين الفرونت إند والباك إند
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                ⚡ إعدادات الاختبار
              </Typography>
              
              <Box mb={2}>
                <Typography variant="body2" color="text.secondary">
                  عنوان الباك إند:
                </Typography>
                <Typography variant="body1" fontWeight="bold">
                  {process.env.REACT_APP_API_BASE_URL || 'http://localhost:5000'}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              <Button
                variant="contained"
                onClick={runAllTests}
                disabled={loading}
                fullWidth
                size="large"
                startIcon={loading ? <CircularProgress size={20} /> : null}
              >
                {loading ? 'جاري الاختبار...' : 'تشغيل جميع الاختبارات'}
              </Button>

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={8}>
          <Typography variant="h6" gutterBottom>
            📋 نتائج الاختبارات
          </Typography>
          
          {Object.keys(results).length === 0 ? (
            <Card>
              <CardContent>
                <Typography variant="body2" color="text.secondary" align="center">
                  اضغط على "تشغيل جميع الاختبارات" لبدء الاختبار
                </Typography>
              </CardContent>
            </Card>
          ) : (
            Object.entries(results).map(([name, result]) => (
              <TestCard key={name} name={name} result={result} />
            ))
          )}
        </Grid>
      </Grid>
    </Box>
  );
};

export default ApiTest; 
