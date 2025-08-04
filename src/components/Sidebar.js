import InsightsIcon from '@mui/icons-material/Insights';
import MapIcon from '@mui/icons-material/Map';
import TimerIcon from '@mui/icons-material/Timer';

// القائمة الرئيسية للوحة التحكم
const mainMenu = [
  {
    title: 'لوحة التحليلات المتقدمة',
    path: '/advanced-analytics',
    icon: <InsightsIcon />
  },
  {
    title: 'نظام الخرائط التفاعلي',
    path: '/map-view',
    icon: <MapIcon />
  },

  {
    title: 'تتبع الوقت والتكاليف',
    path: '/time-cost-tracking',
    icon: <TimerIcon />
  }
]; 