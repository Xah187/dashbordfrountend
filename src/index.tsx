import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { Provider } from 'react-redux';
// استخدام المكونات البديلة التي أنشأناها
import { QueryClientContextProvider, ReactQueryDevtools } from './contexts/QueryClientContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { store } from './store';
import App from './App';
import { StyledEngineProvider } from '@mui/material/styles';
// eslint-disable-next-line import/no-unresolved
import './index.css';

// تطبيق إعدادات RTL على HTML
document.documentElement.setAttribute('dir', 'rtl');
document.documentElement.setAttribute('lang', 'ar');
document.body.setAttribute('dir', 'rtl');

// بدء تشغيل التطبيق
const root = ReactDOM.createRoot(
  document.getElementById('root') as HTMLElement
);

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <QueryClientContextProvider>
        <BrowserRouter>
          <StyledEngineProvider injectFirst>
            <ThemeProvider>
              <App />
              {/* ReactQueryDevtools مع التحميل الديناميكي */}
              <ReactQueryDevtools />
            </ThemeProvider>
          </StyledEngineProvider>
        </BrowserRouter>
      </QueryClientContextProvider>
    </Provider>
  </React.StrictMode>
);
