import { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router';
import { QueryClientProvider } from '@tanstack/react-query';

import { queryClient } from 'test/query-client';
import ConfigContextProvider from 'common/providers/ConfigProvider';
import ToastProvider from 'common/providers/ToastProvider';
import AxiosProvider from 'common/providers/AxiosProvider';
import AuthProvider from 'common/providers/AuthProvider';
import ScrollProvider from 'common/providers/ScrollProvider';
import { AIChatProvider } from 'common/providers/AIChatProvider';

const WithAllProviders = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <ConfigContextProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <AxiosProvider>
            <ToastProvider>
              <ScrollProvider>
                <AIChatProvider>
                  <MemoryRouter>{children}</MemoryRouter>
                </AIChatProvider>
              </ScrollProvider>
            </ToastProvider>
          </AxiosProvider>
        </AuthProvider>
      </QueryClientProvider>
    </ConfigContextProvider>
  );
};

export default WithAllProviders;
