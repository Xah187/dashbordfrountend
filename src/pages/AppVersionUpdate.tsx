import React, { useState, useEffect } from 'react';
import {
  Box, Typography, Paper, TextField, Button, CircularProgress,
  Snackbar, Alert, Container
} from '@mui/material';
import apiClient, { API_BASE_URL } from '../api/config';
const API_URL = API_BASE_URL;

const AppVersionUpdate = () => {
  const [version, setVersion] = useState('');
  const [messageUpdate, setMessageUpdate] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  useEffect(() => {
    fetchCurrentVersion();
  }, []);

  const fetchCurrentVersion = async () => {
    try {
      setLoading(true);
      const response = await apiClient.get(`${API_URL}/Maintenance`);
      if (response.data && response.data.success) {
        setVersion(response.data.success.Update || '');
        setMessageUpdate(response.data.success.messageUpdate || '');
      }
    } catch (error) {
      console.error('Error fetching version:', error);
      setSnackbar({ open: true, message: 'فشل في جلب الإصدار الحالي', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!version.trim()) {
      setSnackbar({ open: true, message: 'يرجى إدخال رقم الإصدار', severity: 'warning' });
      return;
    }

    try {
      setSaving(true);
      const response = await apiClient.post(`${API_URL}/Maintenance/UpdateSystem`, {
        version: version.trim(),
        messageUpdate: messageUpdate.trim(),
      });

      if (response.data && response.data.success) {
        setSnackbar({ open: true, message: 'تم التحديث بنجاح', severity: 'success' });
      }
    } catch (error) {
      console.error('Error updating version:', error);
      try {
        await apiClient.get(`${API_URL}/Maintenance/UpdateSystem`, {
          params: { version: version.trim(), messageUpdate: messageUpdate.trim() }
        });
        setSnackbar({ open: true, message: 'تم التحديث بنجاح', severity: 'success' });
      } catch (fallbackError) {
        setSnackbar({ open: true, message: 'فشل في تحديث الإصدار', severity: 'error' });
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ mt: 4, mb: 4 }} dir="rtl">
      <Paper sx={{ p: 4, borderRadius: 2, boxShadow: 3 }}>
        <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 'bold', mb: 3 }}>
          إدارة إصدار التطبيق
        </Typography>

        <Typography variant="body1" color="text.secondary" paragraph>
          قم بإدخال رقم الإصدار الجديد (الحد الأدنى المطلوب). سيتم إجبار المستخدمين الذين يملكون إصداراً أقدم من هذا الرقم على التحديث.
        </Typography>

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', my: 4 }}>
            <CircularProgress />
          </Box>
        ) : (
          <Box component="form" onSubmit={handleUpdate} sx={{ mt: 3 }}>
            <TextField
              fullWidth
              label="رقم الإصدار (مثال: 1.0.1)"
              variant="outlined"
              value={version}
              onChange={(e) => setVersion(e.target.value)}
              margin="normal"
              required
              sx={{ mb: 3 }}
              InputProps={{
                style: { textAlign: 'left', direction: 'ltr' }
              }}
            />

            <TextField
              fullWidth
              label="رسالة التحديث (تظهر للمستخدم)"
              variant="outlined"
              value={messageUpdate}
              onChange={(e) => setMessageUpdate(e.target.value)}
              margin="normal"
              multiline
              rows={4}
              sx={{ mb: 4 }}
              placeholder="يرجى تحديث التطبيق للحصول على أحدث الميزات والإصلاحات"
            />

            <Button
              type="submit"
              variant="contained"
              color="primary"
              size="large"
              disabled={saving}
              sx={{
                px: 4,
                py: 1.5,
                fontWeight: 'bold',
                fontSize: '1.1rem'
              }}
            >
              {saving ? <CircularProgress size={24} color="inherit" /> : 'حفظ التحديث'}
            </Button>
          </Box>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity as any}
          sx={{ width: '100%', fontSize: '1.1rem' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Container>
  );
};

export default AppVersionUpdate;
