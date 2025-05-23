import { describe, expect, it, vi } from 'vitest';
import { render as defaultRender, screen, fireEvent } from '@testing-library/react';
import NoReportsMessage from '../NoReportsMessage';
import WithMinimalProviders from 'test/wrappers/WithMinimalProviders';

// Mock react-i18next
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        // Handle namespace prefixes by extracting the actual key
        const actualKey = key.includes(':') ? key.split(':')[1] : key;

        const translations: Record<string, string> = {
          'reports.noReports.title': 'No Reports',
          'reports.noReports.message': 'Upload a report or try again later',
          'reports.noReports.uploadButton': 'Upload Report',
          'label.tryAgain': 'Retry', // Add translation for the retry button
        };
        return translations[actualKey] || key;
      },
      i18n: {
        changeLanguage: vi.fn(),
      },
    }),
  };
});

// Use a custom render that uses our minimal providers
const render = (ui: React.ReactElement) => {
  return defaultRender(ui, { wrapper: WithMinimalProviders });
};

// Mock the Icon component
vi.mock('common/components/Icon/Icon', () => ({
  default: ({
    icon,
    iconStyle,
    className,
    size,
  }: {
    icon: string;
    iconStyle?: string;
    className?: string;
    size?: string;
  }) => (
    <div
      data-testid={`mocked-icon-${icon}`}
      data-icon-style={iconStyle}
      className={className}
      data-size={size}
    >
      {icon}
    </div>
  ),
}));

describe('NoReportsMessage', () => {
  it('should render successfully', () => {
    // ARRANGE
    render(<NoReportsMessage />);

    // ASSERT
    expect(screen.getByText('No Reports')).toBeInTheDocument();
    expect(screen.getByText('Upload a report or try again later')).toBeInTheDocument();
    expect(screen.getByText('Upload Report')).toBeInTheDocument();
    expect(screen.getByTestId('mocked-icon-fileLines')).toBeInTheDocument();
  });

  it('should not render retry button when onRetry is not provided', () => {
    // ARRANGE
    render(<NoReportsMessage onUpload={() => {}} />);

    // ASSERT
    expect(screen.queryByText('Retry')).not.toBeInTheDocument();
  });

  it('should render retry button when onRetry is provided', () => {
    // ARRANGE
    render(<NoReportsMessage onUpload={() => {}} onRetry={() => {}} />);

    // ASSERT
    expect(screen.getByText('Retry')).toBeInTheDocument();
  });

  it('should call onUpload when upload button is clicked', () => {
    // ARRANGE
    const onUploadMock = vi.fn();
    render(<NoReportsMessage onUpload={onUploadMock} />);

    // ACT
    fireEvent.click(screen.getByText('Upload Report'));

    // ASSERT
    expect(onUploadMock).toHaveBeenCalledTimes(1);
  });

  it('should call onRetry when retry button is clicked', () => {
    // ARRANGE
    const onRetryMock = vi.fn();
    render(<NoReportsMessage onUpload={() => {}} onRetry={onRetryMock} />);

    // ACT
    fireEvent.click(screen.getByText('Retry'));

    // ASSERT
    expect(onRetryMock).toHaveBeenCalledTimes(1);
  });
});
