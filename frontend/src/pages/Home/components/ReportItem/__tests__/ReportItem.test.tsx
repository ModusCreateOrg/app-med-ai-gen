import { describe, expect, it, vi, afterEach } from 'vitest';
import { render as defaultRender, screen, fireEvent, cleanup } from '@testing-library/react';
import ReportItem from '../ReportItem';
import { MedicalReport, ReportStatus, ReportCategory } from 'common/models/medicalReport';
import WithMinimalProviders from 'test/wrappers/WithMinimalProviders';

// Mock react-i18next
vi.mock('react-i18next', async () => {
  const actual = await vi.importActual('react-i18next');
  return {
    ...actual,
    useTranslation: () => ({
      t: (key: string) => {
        if (key === 'reports.uploadDate') return 'Upload Date';
        return key;
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

// Only mock the Icon component and date-fns format function
vi.mock('common/components/Icon/Icon', () => ({
  default: ({ icon, iconStyle, className }: {
    icon: string;
    iconStyle?: string;
    className?: string;
  }) => (
    <div data-testid={`mocked-icon-${icon}`} data-icon-style={iconStyle} className={className}>
      {icon}
    </div>
  )
}));

vi.mock('date-fns', () => ({
  format: () => '01/27/2025'
}));

// Cleanup after each test to prevent memory leaks and timing issues
afterEach(() => {
  cleanup();
});

describe('ReportItem', () => {
  // Mock medical report for testing
  const mockReport: MedicalReport = {
    id: '1',
    title: 'Blood Test',
    category: ReportCategory.GENERAL,
    createdAt: '2025-01-27',
    status: ReportStatus.UNREAD,
    userId: '1',
    bookmarked: false,
    isProcessed: true,
    labValues: [],
    summary: '',
    filePath: '',
    updatedAt: '2025-01-27',
  };

  const mockReadReport: MedicalReport = {
    ...mockReport,
    id: '2',
    title: 'MRI Scan',
    status: ReportStatus.READ
  };

  it('should render successfully with unread report', () => {
    // ARRANGE
    render(<ReportItem report={mockReport} />);

    // ASSERT
    expect(screen.getByText('Blood Test')).toBeInTheDocument();
    expect(screen.getByText(/Upload Date • 01\/27\/2025/)).toBeInTheDocument();
    expect(screen.getByTestId('mocked-icon-user')).toBeInTheDocument();

    // Check for unread class
    const reportItem = screen.getByText('Blood Test').closest('.report-item');
    expect(reportItem).toHaveClass('report-item--unread');
  });

  it('should render successfully with read report', () => {
    // ARRANGE
    render(<ReportItem report={mockReadReport} />);

    // ASSERT
    expect(screen.getByText('MRI Scan')).toBeInTheDocument();

    // Check that it doesn't have unread class
    const reportItem = screen.getByText('MRI Scan').closest('.report-item');
    expect(reportItem).not.toHaveClass('report-item--unread');
  });

  it('should call onClick when clicked', () => {
    // ARRANGE
    const onClickMock = vi.fn();
    render(<ReportItem report={mockReport} onClick={onClickMock} />);

    // ACT
    fireEvent.click(screen.getByText('Blood Test'));

    // ASSERT
    expect(onClickMock).toHaveBeenCalledTimes(1);
  });
});
