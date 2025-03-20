import { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { QueryClientProvider } from '@tanstack/react-query';
import i18n from 'common/utils/i18n';
import { queryClient } from '../query-client';

// Mock wrapper that doesn't use real Ionic components
const WithTestProviders = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <div className="mock-ion-app">
          <div className="mock-ion-router">
            <MemoryRouter>{children}</MemoryRouter>
          </div>
        </div>
      </QueryClientProvider>
    </I18nextProvider>
  );
};

export default WithTestProviders; 