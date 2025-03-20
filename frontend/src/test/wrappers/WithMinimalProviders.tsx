import { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { QueryClientProvider } from '@tanstack/react-query';
import i18n from 'common/utils/i18n';
import { queryClient } from '../query-client';

/* Core CSS required for Ionic components to work properly */
import '@ionic/react/css/core.css';

/* Basic CSS for apps built with Ionic */
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';

/* Optional CSS utils that can be commented out */
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

// Mock Ionic components instead of using IonApp and IonReactRouter
// to avoid "window is not defined" errors in the test environment
const MockIonicApp = ({ children }: PropsWithChildren): JSX.Element => (
  <div className="ion-app">{children}</div>
);

const WithMinimalProviders = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <MockIonicApp>
          <MemoryRouter>{children}</MemoryRouter>
        </MockIonicApp>
      </QueryClientProvider>
    </I18nextProvider>
  );
};

export default WithMinimalProviders; 