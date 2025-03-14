import { describe, expect, it, vi, beforeAll, afterAll } from 'vitest';
import { render as defaultRender, screen } from '@testing-library/react';
import TabNavigation from '../TabNavigation';
import WithMinimalProviders from 'test/wrappers/WithMinimalProviders';

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

// Mock Ionic components that access window directly
vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual('@ionic/react');
  return {
    ...actual,
    IonApp: ({ children }: { children: React.ReactNode }) => <div data-testid="mock-ion-app">{children}</div>,
  };
});

// Mock all page components to simplify testing
vi.mock('pages/Home/HomePage', () => ({
  default: () => <div data-testid="mock-home-page">Home Page</div>,
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

// Mock the useAIChat hook
vi.mock('common/providers/AIChatProvider', () => ({
  useAIChat: () => ({
    openChat: vi.fn(),
    closeChat: vi.fn(),
    isVisible: false
  }),
  AIChatProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>
}));

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
    const homeTab = screen.getByTestId('mock-icon-home').closest('ion-tab-button');
    expect(homeTab).toHaveAttribute('href', '/tabs/home');
    
    // Check for analytics tab button
    const analyticsTab = screen.getByTestId('mock-icon-fileLines').closest('ion-tab-button');
    expect(analyticsTab).toHaveAttribute('href', '/tabs/analytics');
    
    // Check for upload tab button
    const uploadTab = screen.getByTestId('mock-icon-arrowUpFromBracket').closest('ion-tab-button');
    expect(uploadTab).toHaveAttribute('href', '/tabs/upload');
    
    // Check for chat tab button - Now uses onClick instead of href
    const chatTab = screen.getByTestId('mock-icon-comment').closest('ion-tab-button');
    expect(chatTab).not.toHaveAttribute('href');
    expect(chatTab).toHaveAttribute('tab', 'chat');
    
    // Check for account tab button
    const accountTab = screen.getByTestId('mock-icon-userCircle').closest('ion-tab-button');
    expect(accountTab).toHaveAttribute('href', '/tabs/account');
  });

  it('should have correct tab attribute values on tab buttons', () => {
    // ARRANGE
    render(<TabNavigation />);

    // ASSERT
    // Check for home tab button
    const homeTab = screen.getByTestId('mock-icon-home').closest('ion-tab-button');
    expect(homeTab).toHaveAttribute('tab', 'home');
    
    // Check for analytics tab button
    const analyticsTab = screen.getByTestId('mock-icon-fileLines').closest('ion-tab-button');
    expect(analyticsTab).toHaveAttribute('tab', 'analytics');
    
    // Check for upload tab button
    const uploadTab = screen.getByTestId('mock-icon-arrowUpFromBracket').closest('ion-tab-button');
    expect(uploadTab).toHaveAttribute('tab', 'upload');
    
    // Check for chat tab button
    const chatTab = screen.getByTestId('mock-icon-comment').closest('ion-tab-button');
    expect(chatTab).toHaveAttribute('tab', 'chat');
    
    // Check for account tab button
    const accountTab = screen.getByTestId('mock-icon-userCircle').closest('ion-tab-button');
    expect(accountTab).toHaveAttribute('tab', 'account');
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
  });
}); 