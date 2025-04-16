import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest';
import { render as defaultRender, screen } from '@testing-library/react';
import TabNavigation from '../TabNavigation';
import WithMinimalProviders from 'test/wrappers/WithMinimalProviders';
import '@testing-library/jest-dom';

// Mock the window object for Ionic
beforeAll(() => {
  // Mock window.matchMedia
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: vi.fn().mockImplementation(query => ({
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
    IonApp: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-ion-app">{children}</div>,
    IonTabs: ({ children, className }: { children: React.ReactNode, className?: string }) =>
      <div data-testid="mock-ion-tabs" className={className}>{children}</div>,
    IonRouterOutlet: ({ children, id }: { children: React.ReactNode, id?: string }) =>
      <div data-testid="mock-ion-router-outlet" id={id}>{children}</div>,
    IonTabBar: ({ children, slot, className }: { children: React.ReactNode, slot?: string, className?: string }) =>
      <div data-testid="mock-ion-tab-bar" data-slot={slot} className={className}>{children}</div>,
    IonTabButton: ({
      children,
      tab,
      href,
      className,
      onClick
    }: {
      children: React.ReactNode,
      tab?: string,
      href?: string,
      className?: string,
      onClick?: () => void
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

// Mock the AppMenu component
vi.mock('../../Menu/AppMenu', () => ({
  default: () => <div data-testid="mock-app-menu">App Menu</div>,
}));

// Mock the Icon component
vi.mock('../../Icon/Icon', () => ({
  default: ({ icon, iconStyle, className, size, fixedWidth }: {
    icon: string;
    iconStyle?: string;
    className?: string;
    size?: string;
    fixedWidth?: boolean;
  }) => (
    <div
      data-testid={`mock-icon-${icon}`}
      data-icon-style={iconStyle}
      className={className}
      data-size={size}
      data-fixed-width={fixedWidth ? 'true' : 'false'}
    >
      {icon}
    </div>
  ),
}));

// Mock the UploadModal component
vi.mock('../../Upload/UploadModal', () => ({
  default: ({ isOpen, onClose, _onUploadComplete }: {
    isOpen: boolean;
    onClose: () => void;
    _onUploadComplete?: (report: Record<string, unknown>) => void;
  }) => (
    isOpen ? (
      <div data-testid="mock-upload-modal">
        <button onClick={onClose}>Close</button>
      </div>
    ) : null
  ),
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
  };
});

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
    // Check if all tab icons are rendered
    expect(screen.getByTestId('mock-icon-home')).toBeInTheDocument();
    expect(screen.getByTestId('mock-icon-fileLines')).toBeInTheDocument();
    expect(screen.getByTestId('mock-icon-arrowUpFromBracket')).toBeInTheDocument();
    expect(screen.getByTestId('mock-icon-comment')).toBeInTheDocument();
    expect(screen.getByTestId('mock-icon-userCircle')).toBeInTheDocument();
  });

  it('should have correct href attributes on tab buttons', () => {
    // ARRANGE
    render(<TabNavigation />);

    // ASSERT
    // Check for home tab button
    expect(screen.getByTestId('mock-ion-tab-button-home')).toHaveAttribute('data-href', '/tabs/home');

    // Check for analytics tab button
    expect(screen.getByTestId('mock-ion-tab-button-reports')).toHaveAttribute('data-href', '/reports');

    // Check for chat tab button
    expect(screen.getByTestId('mock-ion-tab-button-chat')).toHaveAttribute('data-href', '/tabs/chat');

    // Check for account tab button
    expect(screen.getByTestId('mock-ion-tab-button-account')).toHaveAttribute('data-href', '/tabs/account');

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

    // Check for analytics tab button
    expect(screen.getByTestId('mock-ion-tab-button-reports')).toHaveAttribute('data-tab', 'reports');

    // Check for upload tab button
    expect(screen.getByTestId('mock-ion-tab-button-upload')).toHaveAttribute('data-tab', 'upload');

    // Check for chat tab button
    expect(screen.getByTestId('mock-ion-tab-button-chat')).toHaveAttribute('data-tab', 'chat');

    // Check for account tab button
    expect(screen.getByTestId('mock-ion-tab-button-account')).toHaveAttribute('data-tab', 'account');
  });

  it('should have correct icon styles', () => {
    // ARRANGE
    render(<TabNavigation />);

    // ASSERT
    // Home icon should not have a style (using default solid)
    const homeIcon = screen.getByTestId('mock-icon-home');
    expect(homeIcon).not.toHaveAttribute('data-icon-style');

    // FileLines icon should have regular style
    const fileLinesIcon = screen.getByTestId('mock-icon-fileLines');
    expect(fileLinesIcon).toHaveAttribute('data-icon-style', 'regular');

    // Upload icon should not have a style (using default solid)
    const uploadIcon = screen.getByTestId('mock-icon-arrowUpFromBracket');
    expect(uploadIcon).not.toHaveAttribute('data-icon-style');

    // Comment icon should have regular style
    const commentIcon = screen.getByTestId('mock-icon-comment');
    expect(commentIcon).toHaveAttribute('data-icon-style', 'regular');

    // User icon should not have a style (using default solid)
    const userIcon = screen.getByTestId('mock-icon-userCircle');
    expect(userIcon).not.toHaveAttribute('data-icon-style');
  });
});
