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
  IonModal: ({ isOpen, _onDidDismiss, children, className }: { 
    isOpen: boolean;
    _onDidDismiss: () => void;
    children: React.ReactNode;
    className?: string;
  }) => (
    isOpen ? <div data-testid="ion-modal" className={className}>{children}</div> : null
  ),
  IonContent: ({ children, className }: { children: React.ReactNode; className?: string }) => 
    <div data-testid="ion-content" className={className}>{children}</div>,
  IonHeader: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="ion-header">{children}</div>,
  IonToolbar: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="ion-toolbar">{children}</div>,
  IonTitle: ({ children }: { children: React.ReactNode }) => 
    <div data-testid="ion-title">{children}</div>,
  IonButton: ({ children, slot, fill, expand, className, onClick }: { 
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
  IonIcon: ({ icon, className }: { icon: string; className?: string }) => 
    <div data-testid={`ion-icon-${typeof icon === 'string' ? icon : 'custom'}`} className={className}>{icon}</div>,
  IonSpinner: ({ name }: { name: string }) => 
    <div data-testid={`ion-spinner-${name}`}>Loading...</div>,
  IonProgressBar: ({ value }: { value: number }) => 
    <div data-testid="ion-progress-bar" data-value={value}>Progress: {value * 100}%</div>,
}));

// Mock the Ionicons
vi.mock('ionicons/icons', () => ({
  closeOutline: 'close-icon',
  cloudUploadOutline: 'upload-icon',
  checkmarkCircleOutline: 'success-icon',
  alertCircleOutline: 'error-icon',
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
    });
    
    render(<UploadModal {...mockProps} />);
    
    // Check for key elements in the initial state
    expect(screen.getByText('upload.dropFilesHere')).toBeInTheDocument();
    expect(screen.getByText('PDF, JPEG, PNG')).toBeInTheDocument();
    expect(screen.getByText('upload.selectFile')).toBeInTheDocument();
    expect(screen.getByTestId('ion-icon-upload-icon')).toBeInTheDocument();
  });
  
  test('renders file selection when file is selected', () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const formatFileSizeMock = vi.fn(() => '10 KB');
    
    (useFileUpload as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      file: mockFile,
      status: UploadStatus.IDLE,
      progress: 0,
      error: null,
      selectFile: vi.fn(),
      uploadFile: vi.fn(),
      reset: vi.fn(),
      formatFileSize: formatFileSizeMock,
    });
    
    render(<UploadModal {...mockProps} />);
    
    // Check that the file name is displayed
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    // And the upload button is visible
    expect(screen.getByText('upload.upload')).toBeInTheDocument();
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
    });
    
    render(<UploadModal {...mockProps} />);
    
    // Check for uploading elements
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('upload.uploading')).toBeInTheDocument();
    expect(screen.getByText('50%')).toBeInTheDocument();
    expect(screen.getByTestId('ion-progress-bar')).toHaveAttribute('data-value', '0.5');
    expect(screen.getByTestId('ion-spinner-dots')).toBeInTheDocument();
  });
  
  test('renders requesting permission state', () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const formatFileSizeMock = vi.fn(() => '10 KB');
    
    (useFileUpload as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      file: mockFile,
      status: UploadStatus.REQUESTING_PERMISSION,
      progress: 0,
      error: null,
      selectFile: vi.fn(),
      uploadFile: vi.fn(),
      reset: vi.fn(),
      formatFileSize: formatFileSizeMock,
    });
    
    render(<UploadModal {...mockProps} />);
    
    // Should render the same UI as uploading state
    expect(screen.getByText('test.pdf')).toBeInTheDocument();
    expect(screen.getByText('upload.uploading')).toBeInTheDocument();
    expect(screen.getByTestId('ion-progress-bar')).toBeInTheDocument();
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
    });
    
    render(<UploadModal {...mockProps} />);
    
    // Check for success elements
    expect(screen.getByText('upload.uploadSuccessful')).toBeInTheDocument();
    expect(screen.getByText('upload.fileReadyForProcessing')).toBeInTheDocument();
    expect(screen.getByText('common.done')).toBeInTheDocument();
    expect(screen.getByTestId('ion-icon-success-icon')).toBeInTheDocument();
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
    });
    
    render(<UploadModal {...mockProps} />);
    
    // Check for error elements
    expect(screen.getByText('upload.uploadFailed')).toBeInTheDocument();
    expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    expect(screen.getByText('common.tryAgain')).toBeInTheDocument();
    expect(screen.getByText('common.cancel')).toBeInTheDocument();
    expect(screen.getByTestId('ion-icon-error-icon')).toBeInTheDocument();
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
  
  test('calls uploadFile when start upload button is clicked', async () => {
    const mockFile = new File(['test content'], 'test.pdf', { type: 'application/pdf' });
    const uploadFileMock = vi.fn();
    
    (useFileUpload as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      file: mockFile,
      status: UploadStatus.IDLE,
      progress: 0,
      error: null,
      selectFile: vi.fn(),
      uploadFile: uploadFileMock,
      reset: vi.fn(),
      formatFileSize: vi.fn(),
    });
    
    render(<UploadModal {...mockProps} />);
    
    // Click the upload button
    const uploadButton = screen.getByText('upload.upload');
    fireEvent.click(uploadButton);
    
    // Check that uploadFile was called
    expect(uploadFileMock).toHaveBeenCalled();
  });
  
  test('calls reset and onClose when done button is clicked in success state', () => {
    const resetMock = vi.fn();
    const onCloseMock = vi.fn();
    
    (useFileUpload as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      file: null,
      status: UploadStatus.SUCCESS,
      progress: 1,
      error: null,
      selectFile: vi.fn(),
      uploadFile: vi.fn(),
      reset: resetMock,
      formatFileSize: vi.fn(),
    });
    
    render(<UploadModal isOpen={true} onClose={onCloseMock} onUploadComplete={vi.fn()} />);
    
    // Find and click the done button
    const doneButton = screen.getByText('common.done');
    fireEvent.click(doneButton);
    
    // Check that reset and onClose were called
    expect(resetMock).toHaveBeenCalled();
    expect(onCloseMock).toHaveBeenCalled();
  });
  
  test('calls reset when "Try Again" button is clicked in error state', () => {
    const resetMock = vi.fn();
    
    (useFileUpload as unknown as ReturnType<typeof vi.fn>).mockReturnValue({
      file: null,
      status: UploadStatus.ERROR,
      progress: 0,
      error: 'Something went wrong',
      selectFile: vi.fn(),
      uploadFile: vi.fn(),
      reset: resetMock,
      formatFileSize: vi.fn(),
    });
    
    render(<UploadModal {...mockProps} />);
    
    // Find and click the try again button
    const tryAgainButton = screen.getByText('common.tryAgain');
    fireEvent.click(tryAgainButton);
    
    // Check that reset was called
    expect(resetMock).toHaveBeenCalled();
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
    });

    render(<UploadModal {...mockProps} isOpen={false} />);
    expect(screen.queryByTestId('ion-modal')).not.toBeInTheDocument();
  });
}); 