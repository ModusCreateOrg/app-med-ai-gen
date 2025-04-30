import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest';
import { render as defaultRender, screen } from '@testing-library/react';
import TabNavigation from '../TabNavigation';
import '@testing-library/jest-dom';

// Create a mock i18n instance - MOVED UP before any uses
const mockI18n = {
  t: (key: string, options?: Record<string, unknown>) => options?.defaultValue || key,
  language: 'en',
  languages: ['en'],
  use: () => mockI18n, // Return itself for chaining
  init: () => mockI18n, // Return itself for chaining
  changeLanguage: vi.fn(),
  exists: vi.fn(() => true),
  addResourceBundle: vi.fn(),
};

// Mock i18next
vi.mock('i18next', () => ({
  default: mockI18n,
}));

// Mock i18next-browser-languagedetector
vi.mock('i18next-browser-languagedetector', () => ({
  default: function () {
    return {};
  },
}));

// Mock react-i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: Record<string, unknown>) => options?.defaultValue || key,
  }),
  initReactI18next: {},
  I18nextProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock common/utils/i18n
vi.mock('common/utils/i18n', () => ({
  default: mockI18n,
}));

// Mock the window object for Ionic
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation((query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener: vi.fn(),
      removeListener: vi.fn(),
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
      dispatchEvent: vi.fn(),
    })),
  });
});

// Clear mocks after tests
afterAll(() => {
  vi.clearAllMocks();
});

// Create tab button mocks
const mockTabButtons = new Map();

// Mock Ionic components that access window directly
vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual('@ionic/react');
  return {
    ...actual,
    IonApp: ({ children }: { children: React.ReactNode }) => (
      <div data-testid="mock-ion-app">{children}</div>
    ),
    IonTabs: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div data-testid="mock-ion-tabs" className={className}>
        {children}
      </div>
    ),
    IonRouterOutlet: ({ children, id }: { children: React.ReactNode; id?: string }) => (
      <div data-testid="mock-ion-router-outlet" id={id}>
        {children}
      </div>
    ),
    IonTabBar: ({
      children,
      slot,
      className,
    }: {
      children: React.ReactNode;
      slot?: string;
      className?: string;
    }) => (
      <div data-testid="mock-ion-tab-bar" data-slot={slot} className={className}>
        {children}
      </div>
    ),
    IonTabButton: ({
      children,
      tab,
      href,
      className,
      onClick,
    }: {
      children: React.ReactNode;
      tab?: string;
      href?: string;
      className?: string;
      onClick?: () => void;
    }) => {
      const tabButton = (
        <div
          data-testid={`mock-ion-tab-button-${tab}`}
          data-tab={tab}
          data-href={href}
          className={className}
          onClick={onClick}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onClick) {
              onClick();
            }
          }}
          role="button"
          tabIndex={0}
        >
          {children}
        </div>
      );
      if (tab) {
        mockTabButtons.set(tab, tabButton);
      }
      return tabButton;
    },
    IonText: ({ children, className }: { children: React.ReactNode; className?: string }) => (
      <div data-testid="mock-ion-text" className={className}>
        {children}
      </div>
    ),
  };
});

// Mock all page components to simplify testing
vi.mock('pages/Home/HomePage', () => ({
  default: () => <div data-testid="mock-home-page">Home Page</div>,
}));

vi.mock('pages/Chat/ChatPage', () => ({
  default: () => <div data-testid="mock-chat-page">Chat Page</div>,
}));

vi.mock('pages/Users/components/UserList/UserListPage', () => ({
  default: () => <div data-testid="mock-user-list-page">User List Page</div>,
}));

vi.mock('pages/Users/components/UserDetail/UserDetailPage', () => ({
  default: () => <div data-testid="mock-user-detail-page">User Detail Page</div>,
}));

vi.mock('pages/Users/components/UserEdit/UserEditPage', () => ({
  default: () => <div data-testid="mock-user-edit-page">User Edit Page</div>,
}));

vi.mock('pages/Account/AccountPage', () => ({
  default: () => <div data-testid="mock-account-page">Account Page</div>,
}));

vi.mock('pages/Account/components/Profile/ProfilePage', () => ({
  default: () => <div data-testid="mock-profile-page">Profile Page</div>,
}));

vi.mock('pages/Account/components/Diagnostics/DiagnosticsPage', () => ({
  default: () => <div data-testid="mock-diagnostics-page">Diagnostics Page</div>,
}));

vi.mock('pages/Upload/UploadPage', () => ({
  default: () => <div data-testid="mock-upload-page">Upload Page</div>,
}));

vi.mock('pages/Reports/ReportsListPage', () => ({
  default: () => <div data-testid="mock-reports-list-page">Reports List Page</div>,
}));

vi.mock('pages/Reports/ReportDetailPage', () => ({
  default: () => <div data-testid="mock-report-detail-page">Report Detail Page</div>,
}));

vi.mock('pages/Processing/ProcessingPage', () => ({
  default: () => <div data-testid="mock-processing-page">Processing Page</div>,
}));

// Mock the AppMenu component
vi.mock('../../Menu/AppMenu', () => ({
  default: () => <div data-testid="mock-app-menu">App Menu</div>,
}));

// Mock the SvgIcon component
vi.mock('../../Icon/SvgIcon', () => ({
  default: ({
    src,
    alt,
    active,
    className,
    width,
    height,
    testid = 'svg-icon',
  }: {
    src: string;
    alt?: string;
    active?: boolean;
    className?: string;
    width?: number | string;
    height?: number | string;
    testid?: string;
  }) => (
    <div
      data-testid={testid}
      data-src={src}
      data-alt={alt}
      data-active={active ? 'true' : 'false'}
      className={className}
      data-width={width}
      data-height={height}
    >
      <img data-testid={`${testid}-img`} src={src} alt={alt} />
    </div>
  ),
}));

// Mock the SVG icons
vi.mock('assets/icons/home.svg', () => ({
  default: 'mocked-home-icon.svg'
}));
vi.mock('assets/icons/reports.svg', () => ({
  default: 'mocked-reports-icon.svg'
}));
vi.mock('assets/icons/upload.svg', () => ({
  default: 'mocked-upload-icon.svg'
}));
vi.mock('assets/icons/chat.svg', () => ({
  default: 'mocked-chat-icon.svg'
}));
vi.mock('assets/icons/profile.svg', () => ({
  default: 'mocked-profile-icon.svg'
}));

// Mock the UploadModal component
vi.mock('../../Upload/UploadModal', () => ({
  default: ({
    isOpen,
    onClose,
    _onUploadComplete,
  }: {
    isOpen: boolean;
    onClose: () => void;
    _onUploadComplete?: () => void;
  }) =>
    isOpen ? (
      <div data-testid="mock-upload-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null,
}));

// Mock the useGetCurrentUser hook
vi.mock('common/api/useGetCurrentUser', () => ({
  useGetCurrentUser: () => ({
    data: { name: 'Test User' },
  }),
}));

// Mock the useAuth hook
vi.mock('common/hooks/useAuth', () => ({
  useAuth: () => ({
    isAuthenticated: true,
  }),
}));

// Mock the react-router-dom hooks
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useHistory: () => ({
      push: vi.fn(),
    }),
    useLocation: () => ({
      pathname: '/tabs/home',
    }),
  };
});

// Import the WithMinimalProviders wrapper - THIS NEEDS TO COME AFTER ALL THE MOCKS
import WithMinimalProviders from 'test/wrappers/WithMinimalProviders';

// Use a custom render that uses our minimal providers
const render = (ui: React.ReactElement) => {
  return defaultRender(ui, { wrapper: WithMinimalProviders });
};

describe('TabNavigation', () => {
  it('should render successfully', () => {
    // ARRANGE
    render(<TabNavigation />);

    // ASSERT
    expect(screen.getByTestId('mock-app-menu')).toBeInTheDocument();
    expect(screen.getByTestId('mock-ion-tabs')).toBeInTheDocument();
    expect(screen.getByTestId('mock-ion-tab-bar')).toBeInTheDocument();
  });

  it('should render tab buttons with correct icons', () => {
    // ARRANGE
    render(<TabNavigation />);

    // ASSERT
    // Check if all SvgIcon components are rendered
    const homeTab = screen.getByTestId('mock-ion-tab-button-home');
    const svgIconInHomeTab = homeTab.querySelector('[data-testid="svg-icon"]');
    expect(svgIconInHomeTab).toBeInTheDocument();
    expect(svgIconInHomeTab).toHaveAttribute('data-src', 'mocked-home-icon.svg');

    const reportsTab = screen.getByTestId('mock-ion-tab-button-reports');
    const svgIconInReportsTab = reportsTab.querySelector('[data-testid="svg-icon"]');
    expect(svgIconInReportsTab).toBeInTheDocument();
    expect(svgIconInReportsTab).toHaveAttribute('data-src', 'mocked-reports-icon.svg');

    const uploadTab = screen.getByTestId('mock-ion-tab-button-upload');
    const svgIconInUploadTab = uploadTab.querySelector('[data-testid="svg-icon"]');
    expect(svgIconInUploadTab).toBeInTheDocument();
    expect(svgIconInUploadTab).toHaveAttribute('data-src', 'mocked-upload-icon.svg');

    const chatTab = screen.getByTestId('mock-ion-tab-button-chat');
    const svgIconInChatTab = chatTab.querySelector('[data-testid="svg-icon"]');
    expect(svgIconInChatTab).toBeInTheDocument();
    expect(svgIconInChatTab).toHaveAttribute('data-src', 'mocked-chat-icon.svg');

    const accountTab = screen.getByTestId('mock-ion-tab-button-account');
    const svgIconInAccountTab = accountTab.querySelector('[data-testid="svg-icon"]');
    expect(svgIconInAccountTab).toBeInTheDocument();
    expect(svgIconInAccountTab).toHaveAttribute('data-src', 'mocked-profile-icon.svg');
  });

  it('should have correct href attributes on tab buttons', () => {
    // ARRANGE
    render(<TabNavigation />);

    // ASSERT
    // Check for home tab button
    expect(screen.getByTestId('mock-ion-tab-button-home')).toHaveAttribute(
      'data-href',
      '/tabs/home',
    );

    // Check for reports tab button
    expect(screen.getByTestId('mock-ion-tab-button-reports')).toHaveAttribute(
      'data-href',
      '/tabs/reports',
    );

    // Check for chat tab button
    expect(screen.getByTestId('mock-ion-tab-button-chat')).toHaveAttribute(
      'data-href',
      '/tabs/chat',
    );

    // Check for account tab button
    expect(screen.getByTestId('mock-ion-tab-button-account')).toHaveAttribute(
      'data-href',
      '/tabs/account',
    );

    // Upload button doesn't have href attribute as it opens modal
    const uploadButton = screen.getByTestId('mock-ion-tab-button-upload');
    expect(uploadButton).not.toHaveAttribute('data-href');
  });

  it('should have correct tab attribute values on tab buttons', () => {
    // ARRANGE
    render(<TabNavigation />);

    // ASSERT
    // Check for home tab button
    expect(screen.getByTestId('mock-ion-tab-button-home')).toHaveAttribute('data-tab', 'home');

    // Check for reports tab button
    expect(screen.getByTestId('mock-ion-tab-button-reports')).toHaveAttribute(
      'data-tab',
      'reports',
    );

    // Check for upload tab button
    expect(screen.getByTestId('mock-ion-tab-button-upload')).toHaveAttribute('data-tab', 'upload');

    // Check for chat tab button
    expect(screen.getByTestId('mock-ion-tab-button-chat')).toHaveAttribute('data-tab', 'chat');

    // Check for account tab button
    expect(screen.getByTestId('mock-ion-tab-button-account')).toHaveAttribute(
      'data-tab',
      'account',
    );
  });

  it('should have active state based on current location', () => {
    // ARRANGE
    render(<TabNavigation />);

    // ASSERT
    // Home icon should be active since we mocked location.pathname to be '/tabs/home'
    const homeTab = screen.getByTestId('mock-ion-tab-button-home');
    const svgIconInHomeTab = homeTab.querySelector('[data-testid="svg-icon"]');
    expect(svgIconInHomeTab).toHaveAttribute('data-active', 'true');

    // Other tabs should not be active
    const reportsTab = screen.getByTestId('mock-ion-tab-button-reports');
    const svgIconInReportsTab = reportsTab.querySelector('[data-testid="svg-icon"]');
    expect(svgIconInReportsTab).toHaveAttribute('data-active', 'false');
  });
});
