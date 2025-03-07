import { describe, expect, it, vi } from 'vitest';
import { render as defaultRender, screen, fireEvent } from '@testing-library/react';
import ReportItem from '../ReportItem';
import { MedicalReport, ReportStatus } from 'common/models/medicalReport';
import WithMinimalProviders from 'test/wrappers/WithMinimalProviders';

// Use a custom render that uses our minimal providers
const render = (ui: React.ReactElement) => {
  return defaultRender(ui, { wrapper: WithMinimalProviders });
};

// Only mock the Icon component and date-fns format function
vi.mock('common/components/Icon/Icon', () => ({
  default: ({ icon, iconStyle, className }: any) => (
    <div data-testid={`mocked-icon-${icon}`} data-icon-style={iconStyle} className={className}>
      {icon}
    </div>
  )
}));

vi.mock('date-fns', () => ({
  format: () => '01/27/2025'
}));

describe('ReportItem', () => {
  // Mock medical report for testing
  const mockReport: MedicalReport = {
    id: '1',
    title: 'Blood Test',
    category: 'General' as any,
    date: '2025-01-27',
    status: ReportStatus.UNREAD,
    doctor: 'Dr. Smith',
    facility: 'City Hospital'
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
    expect(screen.getByText('General')).toBeInTheDocument();
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

  it('should render different icons for different categories', () => {
    // Test with different categories
    const categories = [
      { category: 'General' as any, icon: 'user' },
      { category: 'Neurological' as any, icon: 'circleInfo' },
      { category: 'Heart' as any, icon: 'circleInfo' }
    ];

    categories.forEach(({ category, icon }) => {
      const report = { ...mockReport, category };
      
      // ARRANGE & CLEANUP
      const { unmount } = render(<ReportItem report={report} />);
      
      // ASSERT
      expect(screen.getByTestId(`mocked-icon-${icon}`)).toBeInTheDocument();
      
      unmount();
    });
  });
}); 