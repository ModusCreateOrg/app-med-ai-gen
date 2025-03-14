import { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { IonApp } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { QueryClientProvider } from '@tanstack/react-query';
import i18n from 'common/utils/i18n';
import { queryClient } from '../query-client';
import { AIChatProvider } from 'common/providers/AIChatProvider';

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

const WithMinimalProviders = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <IonApp>
          <IonReactRouter>
            <AIChatProvider>
              <MemoryRouter>{children}</MemoryRouter>
            </AIChatProvider>
          </IonReactRouter>
        </IonApp>
      </QueryClientProvider>
    </I18nextProvider>
  );
};

export default WithMinimalProviders; 