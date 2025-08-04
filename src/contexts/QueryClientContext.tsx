import React,{useEffect,useState} from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// إنشاء QueryClient واحد للتطبيق كله
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 دقائق
      cacheTime: 10 * 60 * 1000, // 10 دقائق
      retry: 3,
      retryDelay: attemptIndex => Math.min(1000 * 2 ** attemptIndex, 30000),
      refetchOnWindowFocus: false,
      refetchOnMount: true,
      refetchOnReconnect: true,
    },
    mutations: {
      retry: 1,
    },
  },
});

// Provider component بسيط
export const QueryClientContextProvider: React.FC<{ children: React.ReactNode }> = ({ 
  children 
}) => {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
};

// React Query DevTools - نسخة محدثة
export const ReactQueryDevtools: React.FC = () => {
  // تحميل lazy للـ Devtools
  const [DevtoolsComponent, setDevtoolsComponent] = useState<React.ComponentType<any> | null>(null);

  useEffect(() => {
    // إرجاع مبكر في الإنتاج
    if (process.env.NODE_ENV !== 'development') {
      return;
    }

    // تحميل ReactQueryDevtools dynamically
    import('@tanstack/react-query-devtools')
      .then((module) => {
        setDevtoolsComponent(() => module.ReactQueryDevtools);
      })
      .catch((error) => {
        console.warn('Failed to load ReactQueryDevtools:', error);
      });
  }, []);

  // إرجاع null في الإنتاج أو إذا لم يتم تحميل المكون بعد
  if (process.env.NODE_ENV !== 'development' || !DevtoolsComponent) {
    return null;
  }

  return <DevtoolsComponent initialIsOpen={false} position="bottom-right" />;
};

export default QueryClientContextProvider;
