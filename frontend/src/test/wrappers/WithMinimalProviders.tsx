import { PropsWithChildren } from 'react';
import { MemoryRouter } from 'react-router';
import { I18nextProvider } from 'react-i18next';
import { QueryClientProvider } from '@tanstack/react-query';
// Replace the import with a mock i18n
// import i18n from 'common/utils/i18n';
import { queryClient } from '../query-client';
import { vi } from 'vitest';
import type { i18n } from 'i18next';

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

// Create a simple mock i18n object for testing
const mockI18n = {
  t: (key: string, options?: Record<string, unknown>) => options?.defaultValue || key,
  language: 'en',
  languages: ['en'],
  use: () => mockI18n,
  init: () => mockI18n,
  changeLanguage: vi.fn(),
  exists: vi.fn(() => true),
  addResourceBundle: vi.fn(),
  // Add missing properties required by the i18n type
  loadResources: vi.fn(),
  modules: { external: [] },
  services: {},
  store: { resources: {} },
  isInitialized: true,
  options: {},
  isResourcesLoaded: true,
  dir: () => 'ltr',
  getFixedT: () => ((key: string) => key),
  format: vi.fn(),
  formatMessage: vi.fn(),
  hasLoadedNamespace: () => true,
  loadNamespaces: vi.fn(),
  reloadResources: vi.fn(),
  getResource: vi.fn(),
  addResource: vi.fn(),
  addResources: vi.fn(),
  getDataByLanguage: vi.fn(),
  hasResourceBundle: vi.fn(),
  removeResourceBundle: vi.fn(),
  on: vi.fn(),
  off: vi.fn(),
  emit: vi.fn(),
  setDefaultNamespace: vi.fn(),
  resolveNamespace: vi.fn(),
  createInstance: () => mockI18n,
  cloneInstance: () => mockI18n,
  toJSON: () => ({}),
} as unknown as i18n;

// Mock Ionic components instead of using IonApp and IonReactRouter
// to avoid "window is not defined" errors in the test environment
const MockIonicApp = ({ children }: PropsWithChildren): JSX.Element => (
  <div className="ion-app">{children}</div>
);

const WithMinimalProviders = ({ children }: PropsWithChildren): JSX.Element => {
  return (
    <I18nextProvider i18n={mockI18n}>
      <QueryClientProvider client={queryClient}>
        <MockIonicApp>
          <MemoryRouter>{children}</MemoryRouter>
        </MockIonicApp>
      </QueryClientProvider>
    </I18nextProvider>
  );
};

export default WithMinimalProviders;
