import { vi, describe, test, expect, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import UploadModal from '../UploadModal';
import '@testing-library/jest-dom';

// Mock the dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, params?: Record<string, unknown>) => {
      if (key === 'upload.imageSizeLimit' && params) {
        return `Image size limit: ${params.size}MB`;
      }
      if (key === 'upload.pdfSizeLimit' && params) {
        return `PDF size limit: ${params.size}MB`;
      }
      return key;
    },
  }),
}));

// Mock Ionic components
vi.mock('@ionic/react', () => ({
  IonModal: ({
    isOpen,
    children,
    className,
  }: {
    isOpen: boolean;
    onDidDismiss: () => void;
    children: React.ReactNode;
    className?: string;
  }) =>
    isOpen ? (
      <div data-testid="ion-modal" className={className}>
        {children}
      </div>
    ) : null,
  IonContent: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="ion-content" className={className}>
      {children}
    </div>
  ),
  IonHeader: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="ion-header">{children}</div>
  ),
  IonToolbar: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="ion-toolbar">{children}</div>
  ),
  IonTitle: ({ children }: { children: React.ReactNode }) => (
    <div data-testid="ion-title">{children}</div>
  ),
  IonButton: ({
    children,
    slot,
    fill,
    expand,
    className,
    onClick,
  }: {
    children: React.ReactNode;
    slot?: string;
    fill?: string;
    expand?: string;
    className?: string;
    onClick?: () => void;
  }) => (
    <button
      data-testid={`ion-button-${slot || 'default'}`}
      data-fill={fill}
      data-expand={expand}
      className={className}
      onClick={onClick}
    >
      {children}
    </button>
  ),
  IonIcon: ({ icon, className }: { icon: string; className?: string }) => (
    <div
      data-testid={`ion-icon-${typeof icon === 'string' ? icon : 'custom'}`}
      className={className}
    >
      {icon}
    </div>
  ),
  IonSpinner: ({ name }: { name: string }) => (
    <div data-testid={`ion-spinner-${name}`}>Loading...</div>
  ),
  IonProgressBar: ({ value }: { value: number }) => (
    <div data-testid="ion-progress-bar" data-value={value}>
      Progress: {value * 100}%
    </div>
  ),
  IonItem: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="ion-item" className={className}>
      {children}
    </div>
  ),
  IonLabel: ({ children, className }: { children: React.ReactNode; className?: string }) => (
    <div data-testid="ion-label" className={className}>
      {children}
    </div>
  ),
}));

// Mock the Ionicons
vi.mock('ionicons/icons', () => ({
  closeOutline: 'close-icon',
  cloudUploadOutline: 'upload-icon',
  checkmarkCircleOutline: 'success-icon',
  alertCircleOutline: 'error-icon',
  documentOutline: 'document-icon',
  checkmarkOutline: 'checkmark-icon',
}));

// Mock the useFileUpload hook
vi.mock('../../../hooks/useFileUpload', () => ({
  UploadStatus: {
    IDLE: 'idle',
    VALIDATING: 'validating',
    REQUESTING_PERMISSION: 'requesting_permission',
    UPLOADING: 'uploading',
    SUCCESS: 'success',
    ERROR: 'error',
  },
  useFileUpload: vi.fn(() => ({
    file: null,
    status: 'idle',
    progress: 0,
    error: null,
    selectFile: vi.fn(),
    uploadFile: vi.fn(),
    reset: vi.fn(),
    formatFileSize: vi.fn((size) => `${size} bytes`),
    cancelUpload: vi.fn(),
  })),
}));

// Get the mock for direct access in tests
import { useFileUpload, UploadStatus } from '../../../hooks/useFileUpload';

describe('UploadModal', () => {
  const mockProps = {
    isOpen: true,
    onClose: vi.fn(),
    onUploadComplete: vi.fn(),
  };

  beforeEach(() => {
    vi.resetAllMocks();
  });

  test('renders correctly in initial state', () => {
    (useFileUpload as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      file: null,
      status: UploadStatus.IDLE,
      progress: 0,
      error: null,
      selectFile: vi.fn(),
      uploadFile: vi.fn(),
      reset: vi.fn(),
      formatFileSize: vi.fn((size) => `${size} bytes`),
      cancelUpload: vi.fn(),
    });

    render(<UploadModal {...mockProps} />);

    // Check for key elements in the initial state
    expect(screen.getByText('upload.dropFilesHere')).toBeInTheDocument();
    expect(screen.getByText('PDF, JPEG, PNG')).toBeInTheDocument();
    expect(screen.getByText('upload.selectFile')).toBeInTheDocument();
    expect(screen.getByTestId('ion-icon-upload-icon')).toBeInTheDocument();
  });

  test('automatically starts upload when file is selected', () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const uploadFileMock = vi.fn();
    const selectFileMock = vi.fn();

    (useFileUpload as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      file: mockFile,
      status: UploadStatus.IDLE,
      progress: 0,
      error: null,
      selectFile: selectFileMock,
      uploadFile: uploadFileMock,
      reset: vi.fn(),
      formatFileSize: vi.fn(() => '10 KB'),
      cancelUpload: vi.fn(),
    });

    const { container } = render(<UploadModal {...mockProps} />);

    // Get file input and simulate file selection
    container.querySelector('input[type="file"]');

    // Verify that the useEffect would trigger the upload
    expect(uploadFileMock).toHaveBeenCalled();
  });

  test('renders uploading state', () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const formatFileSizeMock = vi.fn(() => '10 KB');

    (useFileUpload as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      file: mockFile,
      status: UploadStatus.UPLOADING,
      progress: 0.5,
      error: null,
      selectFile: vi.fn(),
      uploadFile: vi.fn(),
      reset: vi.fn(),
      formatFileSize: formatFileSizeMock,
      cancelUpload: vi.fn(),
    });

    render(<UploadModal {...mockProps} />);

    // Check for uploading elements
    expect(screen.getByTestId('ion-icon-document-icon')).toBeInTheDocument();
    expect(screen.getByTestId('ion-progress-bar')).toHaveAttribute('data-value', '0.5');
    expect(screen.getByText('common.cancel')).toBeInTheDocument();

    // Checking if we can find the seconds left text
    const fileInfo = screen.getByText(/seconds left/);
    expect(fileInfo.textContent).toContain('10 KB');
    expect(fileInfo.textContent).toContain('seconds left');
  });

  test('renders requesting permission state', () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    (useFileUpload as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      file: mockFile,
      status: UploadStatus.REQUESTING_PERMISSION,
      progress: 0,
      error: null,
      selectFile: vi.fn(),
      uploadFile: vi.fn(),
      reset: vi.fn(),
      formatFileSize: vi.fn(() => '10 KB'),
      cancelUpload: vi.fn(),
    });

    render(<UploadModal {...mockProps} />);

    // Should render similar elements as uploading state
    expect(screen.getByTestId('ion-icon-document-icon')).toBeInTheDocument();
    expect(screen.getByTestId('ion-progress-bar')).toBeInTheDocument();
    expect(screen.getByText('common.cancel')).toBeInTheDocument();
  });

  test('renders success state', () => {
    (useFileUpload as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      file: null,
      status: UploadStatus.SUCCESS,
      progress: 1,
      error: null,
      selectFile: vi.fn(),
      uploadFile: vi.fn(),
      reset: vi.fn(),
      formatFileSize: vi.fn(),
      cancelUpload: vi.fn(),
    });

    render(<UploadModal {...mockProps} />);

    // Check for success elements
    expect(screen.getByTestId('ion-icon-checkmark-icon')).toBeInTheDocument();
    expect(screen.getByText('upload.uploadSuccessful')).toBeInTheDocument();
  });

  test('renders error state', () => {
    (useFileUpload as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      file: null,
      status: UploadStatus.ERROR,
      progress: 0,
      error: 'Something went wrong',
      selectFile: vi.fn(),
      uploadFile: vi.fn(),
      reset: vi.fn(),
      formatFileSize: vi.fn(),
      cancelUpload: vi.fn(),
    });

    render(<UploadModal {...mockProps} />);

    // Check for error elements
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
  });

  test('opens the file picker when select file button is clicked', () => {
    // Create a mock for the file input click
    const clickSpy = vi.fn();

    // Mock Element.prototype.click
    const originalClick = HTMLElement.prototype.click;
    HTMLElement.prototype.click = clickSpy;

    // Mock the hook
    (useFileUpload as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      file: null,
      status: UploadStatus.IDLE,
      progress: 0,
      error: null,
      selectFile: vi.fn(),
      uploadFile: vi.fn(),
      reset: vi.fn(),
      formatFileSize: vi.fn(),
      cancelUpload: vi.fn(),
    });

    // Render component
    render(<UploadModal {...mockProps} />);

    // Get the upload button and click it
    const selectFileButton = screen.getByText('upload.selectFile');
    fireEvent.click(selectFileButton);

    // Check that click was called on the file input (the button should trigger the hidden input)
    expect(clickSpy).toHaveBeenCalled();

    // Restore original click
    HTMLElement.prototype.click = originalClick;
  });

  test('calls reset and onClose when close button is clicked in success state', () => {
    const resetMock = vi.fn();
    const onCloseMock = vi.fn();
    const onUploadCompleteMock = vi.fn();

    (useFileUpload as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      file: null,
      status: UploadStatus.SUCCESS,
      progress: 1,
      error: null,
      selectFile: vi.fn(),
      uploadFile: vi.fn(),
      reset: resetMock,
      formatFileSize: vi.fn(),
      cancelUpload: vi.fn(),
    });

    render(
      <UploadModal isOpen={true} onClose={onCloseMock} onUploadComplete={onUploadCompleteMock} />,
    );

    // Find and click the close button
    const closeButton = screen.getByTestId('ion-button-default');
    fireEvent.click(closeButton);

    // Check that reset and onClose were called
    expect(resetMock).toHaveBeenCalled();
    expect(onCloseMock).toHaveBeenCalled();
  });

  test('calls cancel when Cancel button is clicked during upload', () => {
    const cancelUploadMock = vi.fn();

    (useFileUpload as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      file: { name: 'test.pdf', size: 1024 },
      status: UploadStatus.UPLOADING,
      progress: 0.5,
      error: null,
      selectFile: vi.fn(),
      uploadFile: vi.fn(),
      reset: vi.fn(),
      formatFileSize: vi.fn(() => '1 KB'),
      cancelUpload: cancelUploadMock,
    });

    render(<UploadModal {...mockProps} />);

    // Find and click the cancel button
    const cancelButton = screen.getByText('common.cancel');
    fireEvent.click(cancelButton);

    // Check that cancelUpload was called
    expect(cancelUploadMock).toHaveBeenCalled();
  });

  test('renders nothing when isOpen is false', () => {
    // Mock the hook before rendering the component
    (useFileUpload as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      file: null,
      status: UploadStatus.IDLE,
      progress: 0,
      error: null,
      selectFile: vi.fn(),
      uploadFile: vi.fn(),
      reset: vi.fn(),
      formatFileSize: vi.fn(),
      cancelUpload: vi.fn(),
    });

    render(<UploadModal {...mockProps} isOpen={false} />);
    expect(screen.queryByTestId('ion-modal')).not.toBeInTheDocument();
  });
});
