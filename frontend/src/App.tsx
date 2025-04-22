import { IonApp, setupIonicReact } from '@ionic/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { ErrorBoundary } from 'react-error-boundary';
import { StatusBar, Style } from '@capacitor/status-bar';
import { Capacitor } from '@capacitor/core';
import { useEffect } from 'react';

import ErrorPage from 'common/components/Error/ErrorPage';
import ConfigContextProvider from './common/providers/ConfigProvider';
import { queryClient } from 'common/utils/query-client';
import AuthProvider from 'common/providers/AuthProvider';
import AxiosProvider from 'common/providers/AxiosProvider';
import ToastProvider from 'common/providers/ToastProvider';
import ScrollProvider from 'common/providers/ScrollProvider';
import Toasts from 'common/components/Toast/Toasts';
import AppRouter from 'common/components/Router/AppRouter';

import './theme/main.css';

setupIonicReact({
  mode: 'ios', // Force iOS mode for consistent styling
});

// Initialize StatusBar
const initializeStatusBar = async () => {
  try {
    if (Capacitor.isPluginAvailable('StatusBar')) {
      await StatusBar.setStyle({ style: Style.Light });

      if (Capacitor.getPlatform() === 'android') {
        // Make status bar transparent on Android
        await StatusBar.setBackgroundColor({ color: '#4765ff' });
      }
    }
  } catch (err) {
    console.warn('StatusBar API not available', err);
  }
};

/**
 * The application root module. The outermost component of the Ionic React
 * application hierarchy. Declares application-wide providers.
 * @returns JSX
 */
const App = (): JSX.Element => {
  useEffect(() => {
    initializeStatusBar();
  }, []);

  return (
    <IonApp data-testid="app">
      <ErrorBoundary FallbackComponent={ErrorPage}>
        <ConfigContextProvider>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <AxiosProvider>
                <ToastProvider>
                  <ScrollProvider>
                    <AppRouter />
                    <Toasts />
                    <ReactQueryDevtools initialIsOpen={false} buttonPosition="bottom-left" />
                  </ScrollProvider>
                </ToastProvider>
              </AxiosProvider>
            </AuthProvider>
          </QueryClientProvider>
        </ConfigContextProvider>
      </ErrorBoundary>
    </IonApp>
  );
};

export default App;
