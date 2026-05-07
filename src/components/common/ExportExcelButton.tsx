import React, { useState } from 'react';
import {
  Button,
  CircularProgress,
  Tooltip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  LinearProgress,
  Typography,
  Box,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AssessmentIcon from '@mui/icons-material/Assessment';
import { generateAdvancedReportData, exportToExcel } from '../../utils/advancedReport';

interface ExportExcelButtonProps {
  label?: string;
  fileName?: string;
}

export const ExportExcelButton: React.FC<ExportExcelButtonProps> = ({
  label = 'تصدير التقرير الشامل',
  fileName = 'تقرير_الشركات_الشامل',
}) => {
  const [loading, setLoading] = useState(false);
  const [progressLog, setProgressLog] = useState<string[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);

  const handleExport = async () => {
    setProgressLog([]);
    setDialogOpen(true);
    setLoading(true);

    try {
      const data = await generateAdvancedReportData((msg) => {
        setProgressLog((prev) => [...prev.slice(-50), msg]); // آخر 50 رسالة فقط
      });

      exportToExcel(data, fileName);

      setProgressLog((prev) => [
        ...prev,
        `🎉 تم تصدير ملف Excel بنجاح! (${data.length} شركة)`,
      ]);
    } catch (error: any) {
      console.error('فشل تصدير التقرير:', error);
      setProgressLog((prev) => [...prev, `❌ خطأ: ${error.message}`]);
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) setDialogOpen(false);
  };

  return (
    <>
      <Tooltip
        title="استخراج تقرير شامل يحتوي على إحصائيات جميع الشركات (فروع، موظفين، مشاريع)"
        placement="top"
      >
        <Button
          variant="contained"
          color="success"
          startIcon={<AssessmentIcon />}
          onClick={handleExport}
          disabled={loading}
          sx={{
            borderRadius: '10px',
            padding: '9px 20px',
            fontWeight: 'bold',
            fontSize: '0.9rem',
            boxShadow: '0 4px 12px rgba(46,125,50,0.3)',
            transition: 'all 0.25s ease',
            '&:hover': {
              transform: 'translateY(-2px)',
              boxShadow: '0 8px 20px rgba(46,125,50,0.4)',
            },
          }}
        >
          {label}
        </Button>
      </Tooltip>

      {/* نافذة التقدم */}
      <Dialog
        open={dialogOpen}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        disableEscapeKeyDown={loading}
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <AssessmentIcon color="success" />
          جارٍ استخراج التقرير الشامل
        </DialogTitle>

        <DialogContent>
          {loading && (
            <Box sx={{ mb: 2 }}>
              <LinearProgress color="success" />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                يتم جلب بيانات الشركات وفروعها ومشاريعها وموظفيها... قد يستغرق بعض الوقت.
              </Typography>
            </Box>
          )}

          <Box
            sx={{
              maxHeight: 300,
              overflowY: 'auto',
              bgcolor: 'grey.900',
              color: 'success.light',
              borderRadius: 2,
              p: 1.5,
              fontFamily: 'monospace',
              fontSize: '0.78rem',
              direction: 'rtl',
            }}
          >
            {progressLog.length === 0 ? (
              <Typography sx={{ color: 'grey.500', fontSize: '0.8rem' }}>
                في انتظار البدء...
              </Typography>
            ) : (
              progressLog.map((log, i) => (
                <Box key={i} sx={{ py: 0.2 }}>
                  {log}
                </Box>
              ))
            )}
          </Box>
        </DialogContent>

        <DialogActions>
          {!loading && (
            <Button onClick={handleClose} variant="outlined" startIcon={<DownloadIcon />}>
              إغلاق
            </Button>
          )}
          {loading && (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, px: 2 }}>
              <CircularProgress size={18} />
              <Typography variant="body2" color="text.secondary">
                يرجى الانتظار...
              </Typography>
            </Box>
          )}
        </DialogActions>
      </Dialog>
    </>
  );
};
