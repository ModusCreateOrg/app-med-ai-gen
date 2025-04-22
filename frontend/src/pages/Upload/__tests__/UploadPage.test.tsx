import { vi, describe, test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UploadPage from '../UploadPage';
import { MemoryRouter } from 'react-router-dom';
import {
  MedicalReport,
  ReportCategory,
  ReportStatus,
  ProcessingStatus,
} from 'common/models/medicalReport';
import '@testing-library/jest-dom';

// Mock the dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => key, // Just return the key for simplicity
  }),
}));

// Prepare history mock
const mockHistoryPush = vi.fn();

// Only mock the useHistory hook, not the entire module
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useHistory: () => ({
      push: mockHistoryPush,
    }),
  };
});

// Mock the UploadModal component
vi.mock('common/components/Upload/UploadModal', () => {
  const ModalMock = ({
    isOpen,
    onClose,
    onUploadComplete,
  }: {
    isOpen: boolean;
    onClose: () => void;
    onUploadComplete: (report: MedicalReport) => void;
  }) => {
    if (!isOpen) return null;

    // Mock report that will be returned on upload complete
    const mockReport: MedicalReport = {
      id: '123',
      userId: 'test-user',
      title: 'Test Report',
      category: ReportCategory.GENERAL,
      createdAt: '2023-01-01',
      status: ReportStatus.UNREAD,
      bookmarked: false,
      processingStatus: ProcessingStatus.PROCESSED,
      labValues: [],
      summary: 'Test report summary',
      filePath: '/reports/test-report.pdf',
      originalFilename: 'test-report.pdf',
      fileSize: 1024,
      confidence: 0.95,
      updatedAt: '2023-01-01',
    };

    return (
      <div data-testid="upload-modal">
        <button data-testid="close-modal-btn" onClick={onClose}>
          Close Modal
        </button>
        <button data-testid="complete-upload-btn" onClick={() => onUploadComplete(mockReport)}>
          Complete Upload
        </button>
      </div>
    );
  };

  return {
    default: ModalMock,
  };
});

// Mock Ionic components
vi.mock('@ionic/react', () => ({
  IonContent: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonHeader: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonPage: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonTitle: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonToolbar: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  IonButton: ({
    children,
    onClick,
  }: {
    children: React.ReactNode;
    onClick?: () => void;
    expand?: string;
    className?: string;
  }) => (
    <button onClick={onClick} data-testid="select-file-btn">
      {children}
    </button>
  ),
}));

describe('UploadPage', () => {
  beforeEach(() => {
    // Reset mocks before each test
    vi.clearAllMocks();
  });

  test('renders correctly', () => {
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );

    // Check for key elements
    expect(screen.getByText('pages.upload.title')).toBeInTheDocument();
    expect(screen.getByText('pages.upload.subtitle')).toBeInTheDocument();
    expect(screen.getByText('pages.upload.description')).toBeInTheDocument();
    expect(screen.getByText('upload.selectFile')).toBeInTheDocument();
  });

  test('opens modal when button is clicked', () => {
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );

    // Modal should not be visible initially
    expect(screen.queryByTestId('upload-modal')).not.toBeInTheDocument();

    // Click the button to open modal
    const button = screen.getByTestId('select-file-btn');
    fireEvent.click(button);

    // Modal should now be visible
    expect(screen.getByTestId('upload-modal')).toBeInTheDocument();
  });

  test('closes modal when onClose is called', () => {
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );

    // Open the modal first
    const openButton = screen.getByTestId('select-file-btn');
    fireEvent.click(openButton);

    // Modal should be visible
    expect(screen.getByTestId('upload-modal')).toBeInTheDocument();

    // Click the close button
    const closeButton = screen.getByTestId('close-modal-btn');
    fireEvent.click(closeButton);

    // Modal should now be hidden
    expect(screen.queryByTestId('upload-modal')).not.toBeInTheDocument();
  });

  test('navigates to home page after successful upload', () => {
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );

    // Open the modal first
    const openButton = screen.getByTestId('select-file-btn');
    fireEvent.click(openButton);

    // Complete the upload
    const completeButton = screen.getByTestId('complete-upload-btn');
    fireEvent.click(completeButton);

    // Should navigate to home page
    expect(mockHistoryPush).toHaveBeenCalledWith('/tabs/home');

    // Modal should be closed after upload completion
    expect(screen.queryByTestId('upload-modal')).not.toBeInTheDocument();
  });

  test('handles canceling an upload', () => {
    render(
      <MemoryRouter>
        <UploadPage />
      </MemoryRouter>,
    );

    // Open the modal
    const openButton = screen.getByTestId('select-file-btn');
    fireEvent.click(openButton);

    // Verify modal is shown
    expect(screen.getByTestId('upload-modal')).toBeInTheDocument();

    // Cancel/close the upload
    const closeButton = screen.getByTestId('close-modal-btn');
    fireEvent.click(closeButton);

    // Modal should be hidden and no navigation should happen
    expect(screen.queryByTestId('upload-modal')).not.toBeInTheDocument();
    expect(mockHistoryPush).not.toHaveBeenCalled();
  });
});
