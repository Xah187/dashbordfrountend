import React, { useState, createContext, useMemo, lazy, Suspense, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import { CacheProvider } from '@emotion/react';
import { Box, CircularProgress, Button, Typography } from '@mui/material';
import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import CssBaseline from '@mui/material/CssBaseline';
import { useTheme } from './contexts/ThemeContext';
import { UserProvider } from './contexts/UserContext';
import { brandColors } from './utils/colorUtils';

// التخطيطات
import DashboardLayout from './components/layouts/DashboardLayout';
import AuthLayout from './components/layouts/AuthLayout';

// Lazy loading للصفحات
const Users = lazy(() => import('./pages/Users'));
const Settings = lazy(() => import('./pages/Settings'));
const Subscriptions = lazy(() => import('./pages/Subscriptions'));
const Login = lazy(() => import('./pages/Login'));
const NotFound = lazy(() => import('./pages/NotFound'));
const AdvancedAnalytics = lazy(() => import('./pages/AdvancedAnalytics'));
const MapView = lazy(() => import('./pages/MapView'));
const TimeAndCostTracking = lazy(() => import('./pages/TimeAndCostTracking'));
const ApiTest = lazy(() => import('./pages/ApiTest'));
const DashboardWithDatabase = lazy(() => import('./pages/DashboardWithDatabase'));
const AdvancedFeatures = lazy(() => import('./pages/AdvancedFeatures'));
const ProjectDetails = lazy(() => import('./pages/ProjectDetails'));
const LoginActivity = lazy(() => import('./pages/LoginActivity'));
const CompaniesSubscribed = lazy(() => import('./pages/CompaniesSubscribed'));

// مكون Loading
const LoadingScreen = () => (
  <Box
    sx={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100vh',
      width: '100%',
    }}
  >
    <CircularProgress size={60} />
  </Box>
);

// TypeScript interfaces
interface AuthContextType {
  isAuthenticated: boolean;
  setIsAuthenticated: (value: boolean) => void;
}

// سياق المصادقة
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// RTL setup
const cacheRtl = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

// Error Boundary لمعالجة ChunkLoadError
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends React.Component<{children: React.ReactNode}, ErrorBoundaryState> {
  constructor(props: {children: React.ReactNode}) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
    
    // معالجة خاصة لـ ChunkLoadError
    if (error.message && error.message.includes('Loading chunk')) {
      console.log('ChunkLoadError detected, reloading page...');
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <Box sx={{ 
          display: 'flex', 
          flexDirection: 'column', 
          alignItems: 'center', 
          justifyContent: 'center', 
          height: '100vh',
          gap: 2,
          p: 3
        }}>
          <Typography variant="h5">حدث خطأ في التطبيق</Typography>
          <Typography variant="body1" color="text.secondary">
            {this.state.error?.message.includes('Loading chunk') 
              ? 'جاري إعادة تحميل الصفحة...' 
              : 'يرجى إعادة تحميل الصفحة'
            }
          </Typography>
          {!this.state.error?.message.includes('Loading chunk') && (
            <Button 
              variant="contained" 
              onClick={() => window.location.reload()}
            >
              إعادة التحميل
            </Button>
          )}
        </Box>
      );
    }

    return this.props.children;
  }
}

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { darkMode, themeSettings, getHighContrastValues, getPrimaryColorValue, getFontSizeMultiplier, getBorderRadiusValue } = useTheme();
  
  // استرجاع قيم التباين العالي
  const highContrastValues = getHighContrastValues();
  const isHighContrast = themeSettings?.highContrast || false;
  
  // استرجاع قيم اللون الرئيسي وحجم الخط
  const primaryColor = getPrimaryColorValue(themeSettings?.primaryColor || 'brandBlue');
  const fontSizeMultiplier = getFontSizeMultiplier(themeSettings?.fontSize || 'medium');
  
  // استرجاع قيم الزوايا والحواف
  const borderRadius = getBorderRadiusValue(themeSettings?.borderRadius || 'medium');
  const roundedCorners = themeSettings?.roundedCorners !== undefined ? themeSettings.roundedCorners : true;
  
  // طباعة الإعدادات المستخدمة للتأكد من أنها تطبق بشكل صحيح
  useEffect(() => {
    console.log('تم تحديث إعدادات المظهر في App.tsx:', {
      darkMode,
      primaryColor,
      fontSizeMultiplier,
      isHighContrast,
      borderRadius,
      roundedCorners,
      themeSettings
    });
  }, [darkMode, primaryColor, fontSizeMultiplier, isHighContrast, borderRadius, roundedCorners, themeSettings]);
  
  // Custom theme inspired by the main app with dark mode support
  const theme = useMemo(() => createTheme({
    direction: 'rtl',
    palette: {
      mode: darkMode ? 'dark' : 'light',
      primary: {
        main: primaryColor, // استخدام اللون الرئيسي المحدد من الإعدادات
        light: darkMode ? '#6d6dff' : '#4f46fb',
        dark: darkMode ? '#0000c9' : '#1a12a7',
        contrastText: '#fff',
      },
      secondary: {
        main: brandColors.secondary,
        light: '#ff4081',
        dark: '#c51162',
        contrastText: '#fff',
      },
      background: {
        default: darkMode ? '#121212' : '#f5f7fa',
        paper: darkMode ? '#1e1e1e' : '#ffffff',
      },
      text: {
        primary: darkMode ? '#ffffff' : (isHighContrast ? '#000000' : 'rgba(0, 0, 0, 0.87)'),
        secondary: darkMode ? '#ffffff' : (isHighContrast ? '#222222' : 'rgba(0, 0, 0, 0.6)'),
        disabled: darkMode ? '#9e9e9e' : (isHighContrast ? '#757575' : 'rgba(0, 0, 0, 0.38)'),
      },
      divider: darkMode ? '#ffffff' : (isHighContrast ? '#000000' : (darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)')),
      action: {
        active: darkMode ? '#ffffff' : (isHighContrast ? '#000000' : 'rgba(0, 0, 0, 0.54)'),
        hover: darkMode ? 'rgba(255, 255, 255, 0.15)' : (isHighContrast ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.04)'),
        selected: darkMode ? 'rgba(255, 255, 255, 0.25)' : (isHighContrast ? 'rgba(0, 0, 0, 0.2)' : 'rgba(0, 0, 0, 0.08)'),
        disabled: darkMode ? 'rgba(255, 255, 255, 0.35)' : (isHighContrast ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.26)'),
        focus: darkMode ? 'rgba(255, 255, 255, 0.15)' : 'rgba(0, 0, 0, 0.05)',
      }
    },
    typography: {
      fontFamily: 'Tajawal, Arial, sans-serif',
      fontSize: parseFloat(fontSizeMultiplier) * 14, // تطبيق مضاعف حجم الخط
      h1: {
        fontWeight: 800,
        fontSize: `calc(2.125rem * ${fontSizeMultiplier})`,
        color: darkMode ? '#ffffff' : (isHighContrast ? '#000000' : 'inherit'),
      },
      h2: {
        fontWeight: 800,
        fontSize: `calc(1.875rem * ${fontSizeMultiplier})`,
        color: darkMode ? '#ffffff' : (isHighContrast ? '#000000' : 'inherit'),
      },
      h3: {
        fontWeight: 700,
        fontSize: `calc(1.5rem * ${fontSizeMultiplier})`,
        color: darkMode ? '#ffffff' : (isHighContrast ? '#000000' : 'inherit'),
      },
      h4: {
        fontWeight: 700,
        fontSize: `calc(1.25rem * ${fontSizeMultiplier})`,
        color: darkMode ? '#ffffff' : (isHighContrast ? '#000000' : 'inherit'),
      },
      h5: {
        fontWeight: 600,
        fontSize: `calc(1.125rem * ${fontSizeMultiplier})`,
        color: darkMode ? '#ffffff' : (isHighContrast ? '#000000' : 'inherit'),
      },
      h6: {
        fontWeight: 600,
        fontSize: `calc(1rem * ${fontSizeMultiplier})`,
        color: darkMode ? '#ffffff' : (isHighContrast ? '#000000' : 'inherit'),
      },
      subtitle1: {
        fontWeight: 600,
        fontSize: `calc(1rem * ${fontSizeMultiplier})`,
        color: darkMode ? '#ffffff' : (isHighContrast ? '#000000' : 'inherit'),
      },
      subtitle2: {
        fontWeight: 600,
        fontSize: `calc(0.875rem * ${fontSizeMultiplier})`,
        color: darkMode ? '#ffffff' : (isHighContrast ? '#000000' : 'inherit'),
      },
      body1: {
        fontWeight: 500,
        fontSize: `calc(1rem * ${fontSizeMultiplier})`,
        color: darkMode ? '#ffffff' : (isHighContrast ? '#000000' : 'inherit'),
      },
      body2: {
        fontWeight: 500,
        fontSize: `calc(0.875rem * ${fontSizeMultiplier})`,
        color: darkMode ? '#ffffff' : (isHighContrast ? '#000000' : 'inherit'),
      },
      button: {
        fontWeight: 600,
        fontSize: `calc(0.875rem * ${fontSizeMultiplier})`,
        textTransform: 'none',
      },
      caption: {
        fontSize: `calc(0.75rem * ${fontSizeMultiplier})`,
      },
      overline: {
        fontSize: `calc(0.75rem * ${fontSizeMultiplier})`,
        textTransform: 'uppercase',
      },
    },
    components: {
      MuiButton: {
        styleOverrides: {
          root: {
            borderRadius: roundedCorners ? borderRadius : '0px',
            textTransform: 'none',
            fontWeight: 600,
            color: darkMode ? '#ffffff' : 'inherit',
            ...(isHighContrast && {
              border: `${highContrastValues.outlineWidth} solid`,
              borderColor: 'currentColor',
            }),
            '& .MuiButton-label': {
              color: darkMode ? '#ffffff !important' : 'inherit',
            }
          },
          text: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
          outlined: {
            color: darkMode ? '#ffffff' : 'inherit',
          }
        }
      },
      MuiCard: {
        styleOverrides: {
          root: {
            borderRadius: roundedCorners ? (parseInt(borderRadius) * 2) + 'px' : '0px',
            boxShadow: '0px 4px 20px rgba(0, 0, 0, 0.05)',
            ...(isHighContrast && {
              border: `${highContrastValues.outlineWidth} solid`,
              borderColor: highContrastValues.borderColor,
            }),
          },
        },
      },
      MuiPaper: {
        styleOverrides: {
          root: {
            borderRadius: roundedCorners ? borderRadius : '0px',
            ...(isHighContrast && {
              border: `${highContrastValues.outlineWidth} solid`,
              borderColor: highContrastValues.borderColor,
            }),
          },
        },
      },
      MuiTextField: {
        styleOverrides: {
          root: {
            '& .MuiOutlinedInput-root': {
              borderRadius: roundedCorners ? borderRadius : '0px',
              ...(isHighContrast && {
                '& fieldset': {
                  borderWidth: highContrastValues.outlineWidth,
                  borderColor: highContrastValues.borderColor,
                },
              }),
            },
          },
        },
      },
      MuiInputBase: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiTypography: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiSvgIcon: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiListItemText: {
        styleOverrides: {
          primary: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
          secondary: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiListItemIcon: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiDrawer: {
        styleOverrides: {
          paper: {
            borderRadius: '0px',
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
          },
        },
      },
      MuiAppBar: {
        styleOverrides: {
          root: {
            borderRadius: '0px',
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiToolbar: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiIconButton: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiTableCell: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
            borderColor: darkMode ? 'rgba(255, 255, 255, 0.12)' : 'rgba(224, 224, 224, 1)',
          },
          head: {
            backgroundColor: darkMode ? '#333333' : '#f5f5f5',
            color: darkMode ? '#ffffff' : 'inherit',
            fontWeight: 600,
          },
        },
      },
      MuiTableRow: {
        styleOverrides: {
          root: {
            '&:nth-of-type(odd)': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.04)',
            },
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiTab: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
            fontWeight: 600,
            textTransform: 'none',
          },
        },
      },
      MuiTabs: {
        styleOverrides: {
          root: {
            '& .MuiTabs-indicator': {
              backgroundColor: primaryColor,
            },
          },
        },
      },
      MuiSelect: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
          icon: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiMenuItem: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiFormLabel: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiInputLabel: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiCheckbox: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiRadio: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiSwitch: {
        styleOverrides: {
          root: {
            '& .MuiSwitch-track': {
              backgroundColor: darkMode ? '#666666' : '#E0E0E0',
            },
          },
        },
      },
      MuiSlider: {
        styleOverrides: {
          root: {
            color: primaryColor,
          },
        },
      },
      MuiChip: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
            backgroundColor: darkMode ? '#444444' : '#E0E0E0',
            borderRadius: roundedCorners ? borderRadius : '0px',
          },
        },
      },
      MuiAvatar: {
        styleOverrides: {
          root: {
            backgroundColor: primaryColor,
            color: '#ffffff',
          },
        },
      },
      MuiBadge: {
        styleOverrides: {
          badge: {
            backgroundColor: primaryColor,
            color: '#ffffff',
          },
        },
      },
      MuiLinearProgress: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#666666' : '#E0E0E0',
          },
          bar: {
            backgroundColor: primaryColor,
          },
        },
      },
      MuiCircularProgress: {
        styleOverrides: {
          root: {
            color: primaryColor,
          },
        },
      },
      MuiDialog: {
        styleOverrides: {
          paper: {
            borderRadius: roundedCorners ? (parseInt(borderRadius) * 2) + 'px' : '0px',
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiDialogTitle: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiDialogContent: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiDialogActions: {
        styleOverrides: {
          root: {
            '& .MuiButton-root': {
              color: darkMode ? '#ffffff' : 'inherit',
            },
          },
        },
      },
      MuiSnackbar: {
        styleOverrides: {
          root: {
            '& .MuiSnackbarContent-root': {
              backgroundColor: darkMode ? '#333333' : '#323232',
              color: '#ffffff',
            },
          },
        },
      },
      MuiAccordion: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
            color: darkMode ? '#ffffff' : 'inherit',
            borderRadius: roundedCorners ? borderRadius : '0px',
            '&:before': {
              display: 'none',
            },
          },
        },
      },
      MuiAccordionSummary: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiAccordionDetails: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiBottomNavigation: {
        styleOverrides: {
          root: {
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
          },
        },
      },
      MuiBottomNavigationAction: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiBreadcrumbs: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiLink: {
        styleOverrides: {
          root: {
            color: primaryColor,
          },
        },
      },
      MuiRating: {
        styleOverrides: {
          root: {
            color: primaryColor,
          },
        },
      },
      MuiStepper: {
        styleOverrides: {
          root: {
            backgroundColor: 'transparent',
          },
        },
      },
      MuiStep: {
        styleOverrides: {
          root: {
            '& .MuiStepIcon-root': {
              color: darkMode ? '#666666' : '#E0E0E0',
              '&.Mui-active': {
                color: primaryColor,
              },
              '&.Mui-completed': {
                color: primaryColor,
              },
            },
          },
        },
      },
      MuiStepLabel: {
        styleOverrides: {
          label: {
            color: darkMode ? '#ffffff' : 'inherit',
          },
        },
      },
      MuiToggleButton: {
        styleOverrides: {
          root: {
            color: darkMode ? '#ffffff' : 'inherit',
            borderColor: darkMode ? '#666666' : '#E0E0E0',
            '&.Mui-selected': {
              backgroundColor: primaryColor,
              color: '#ffffff',
            },
          },
        },
      },

      MuiAutocomplete: {
        styleOverrides: {
          root: {
            '& .MuiAutocomplete-inputRoot': {
              color: darkMode ? '#ffffff' : 'inherit',
            },
          },
          paper: {
            backgroundColor: darkMode ? '#1e1e1e' : '#ffffff',
            color: darkMode ? '#ffffff' : 'inherit',
          },
          option: {
            '&:hover': {
              backgroundColor: darkMode ? 'rgba(255, 255, 255, 0.08)' : 'rgba(0, 0, 0, 0.04)',
            },
          },
        },
      },
      MuiTooltip: {
        styleOverrides: {
          tooltip: {
            backgroundColor: darkMode ? '#333333' : '#616161',
            color: '#ffffff',
          },
        },
      },
      MuiSpeedDial: {
        styleOverrides: {
          fab: {
            backgroundColor: primaryColor,
            color: '#ffffff',
            '&:hover': {
              backgroundColor: darkMode ? '#0000c9' : '#1a12a7',
            },
          },
        },
      },

    },
  }), [darkMode, isHighContrast, highContrastValues, primaryColor, fontSizeMultiplier, roundedCorners, borderRadius]);

  return (
    <ErrorBoundary>
      <CacheProvider value={cacheRtl}>
        <ThemeProvider theme={theme}>
          <CssBaseline />
          <AuthContext.Provider value={{ isAuthenticated, setIsAuthenticated }}>
            {isAuthenticated ? (
              <UserProvider>
                <Routes>
                  <Route path="/" element={<DashboardLayout />}>
                    <Route index element={<Navigate to="/dashboard-with-db" replace />} />
                    
                    <Route path="users" element={<Suspense fallback={<LoadingScreen />}><Users /></Suspense>} />
                    <Route path="settings" element={<Suspense fallback={<LoadingScreen />}><Settings /></Suspense>} />
                                <Route path="subscriptions" element={<Suspense fallback={<LoadingScreen />}><Subscriptions /></Suspense>} />
            <Route path="login-activity" element={<Suspense fallback={<LoadingScreen />}><LoginActivity /></Suspense>} />
            <Route path="advanced-analytics" element={<Suspense fallback={<LoadingScreen />}><AdvancedAnalytics /></Suspense>} />
                    <Route path="map-view" element={<Suspense fallback={<LoadingScreen />}><MapView /></Suspense>} />
                    <Route path="time-cost-tracking" element={<Suspense fallback={<LoadingScreen />}><TimeAndCostTracking /></Suspense>} />
                    <Route path="api-test" element={<Suspense fallback={<LoadingScreen />}><ApiTest /></Suspense>} />
                    <Route path="dashboard-with-db" element={<Suspense fallback={<LoadingScreen />}><DashboardWithDatabase /></Suspense>} />
                    <Route path="advanced-features" element={<Suspense fallback={<LoadingScreen />}><AdvancedFeatures /></Suspense>} />
                    <Route path="project-details/:projectId" element={<Suspense fallback={<LoadingScreen />}><ProjectDetails /></Suspense>} />
                    <Route path="companies-subscribed" element={<Suspense fallback={<LoadingScreen />}><CompaniesSubscribed /></Suspense>} />
                  </Route>
                  <Route path="*" element={<Navigate to="/" replace />} />
                </Routes>
              </UserProvider>
             ) : (
               <Routes>
                 <Route path="/" element={<Navigate to="/login" replace />} />
                 <Route path="/login" element={<Suspense fallback={<LoadingScreen />}><AuthLayout><Login /></AuthLayout></Suspense>} />
                 <Route path="*" element={<Navigate to="/login" replace />} />
                 <Route path="/not-found" element={<Suspense fallback={<LoadingScreen />}><NotFound /></Suspense>} />
               </Routes>
             )}
          </AuthContext.Provider>
        </ThemeProvider>
      </CacheProvider>
    </ErrorBoundary>
  );
}

export default App;
