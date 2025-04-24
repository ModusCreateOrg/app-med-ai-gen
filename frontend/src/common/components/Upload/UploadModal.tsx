import { useRef, ChangeEvent, useEffect, useState } from 'react';
import {
  IonModal,
  IonContent,
  IonButton,
  IonIcon,
  IonProgressBar,
  IonLabel,
  IonItem,
} from '@ionic/react';
import {
  closeOutline,
  cloudUploadOutline,
  documentOutline,
  checkmarkOutline,
} from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { UploadStatus, useFileUpload } from '../../hooks/useFileUpload';
import { MedicalReport } from '../../models/medicalReport';
import './UploadModal.scss';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCircleXmark } from '@fortawesome/free-regular-svg-icons';
import { useHistory } from 'react-router';
import { useTimeout } from '../../hooks/useTimeout';

export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload?: (file: File) => Promise<void>;
  onUploadComplete?: (result: MedicalReport) => void;
}

const UploadModal = ({ isOpen, onClose, onUploadComplete }: UploadModalProps): JSX.Element => {
  const { t } = useTranslation();
  const history = useHistory();
  const { setTimeout } = useTimeout();
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Track the upload result to use when the user closes the success screen
  const [uploadResult, setUploadResult] = useState<MedicalReport | null>(null);
  // Track when to show the upload cancelled notice
  const [showCancelNotice, setShowCancelNotice] = useState(false);

  const {
    file,
    status,
    progress,
    error,
    selectFile,
    uploadFile,
    reset,
    formatFileSize,
    cancelUpload,
  } = useFileUpload({
    // Override onUploadComplete to store the result and not call the parent immediately
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onUploadComplete: (result: any) => {
      setUploadResult(result);

      // Automatically redirect to processing screen after 2 seconds
      setTimeout(() => {
        reset();

        if (onUploadComplete) {
          onUploadComplete(result);
        }

        // Navigate to the processing tab with reportId in state
        if (file) {
          history.push('/tabs/processing', {
            reportId: result.id,
          });
        } else {
          history.push('/tabs/processing');
        }
      }, 2000);
    },
  });

  // Effect to automatically start upload when a file is selected and validated
  useEffect(() => {
    if (file && status === UploadStatus.IDLE) {
      // When starting a new upload, hide the cancel notice if it's showing
      setShowCancelNotice(false);
      uploadFile();
    }
  }, [file, status, uploadFile]);

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    selectFile(files[0]);
    // Upload will be triggered by the useEffect
  };

  const handleUploadClick = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };

  const handleCancel = () => {
    if (status === UploadStatus.UPLOADING) {
      cancelUpload?.();
      // Show the cancel notice when a user explicitly cancels an upload in progress
      setShowCancelNotice(true);
    } else {
      reset();
      setUploadResult(null);
    }
  };

  const handleClose = () => {
    // If we have a successful upload result and the user is closing from the success screen,
    // call onUploadComplete now before closing the modal
    if (status === UploadStatus.SUCCESS && uploadResult && onUploadComplete) {
      onUploadComplete(uploadResult);
      return;
    }

    // Reset state
    reset();
    setUploadResult(null);
    setShowCancelNotice(false);

    // Close modal
    onClose();
  };

  const renderInitialState = () => (
    <div className="upload-modal__initial">
      <div className="upload-modal__drop-area">
        <IonIcon icon={cloudUploadOutline} className="upload-modal__icon" />
        <h2>{t('upload.dropFilesHere')}</h2>
        <p>{t('upload.supportedFileTypes')}</p>
        <div className="upload-modal__file-types">
          <span>PDF, JPEG, PNG</span>
        </div>
        <div className="upload-modal__file-limits">
          <p>{t('upload.maxFileSize')}</p>
          <p>
            {t('upload.imageSizeLimit')} / {t('upload.pdfSizeLimit')}
          </p>
        </div>

        {/* Show cancel notice */}
        {showCancelNotice && (
          <div className="upload-modal__cancel-notice">
            <div className="upload-modal__cancel-notice-icon">
              <FontAwesomeIcon icon={faCircleXmark} />
            </div>
            <span>Upload cancelled.</span>
          </div>
        )}

        {error && !showCancelNotice && (
          <IonItem className="upload-modal__error-message">
            <div className="upload-modal__error-icon" slot="start">
              <FontAwesomeIcon icon={faCircleXmark} aria-hidden="true" />
            </div>
            <IonLabel className="upload-modal__error-label ion-text-wrap">{error}</IonLabel>
          </IonItem>
        )}
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.jpeg,.jpg,.png"
          onChange={handleFileChange}
          className="upload-modal__file-input"
        />
        <IonButton expand="block" className="upload-modal__upload-btn" onClick={handleUploadClick}>
          {t('upload.selectFile')}
        </IonButton>
      </div>
    </div>
  );

  const renderUploadingState = () => (
    <div className="upload-modal__initial">
      <div className="upload-modal__drop-area">
        <IonIcon icon={cloudUploadOutline} className="upload-modal__icon" />

        {/* File display item */}
        {file && (
          <div className="upload-modal__file-item">
            <div className="upload-modal__file-icon">
              <IonIcon icon={documentOutline} />
            </div>
            <div className="upload-modal__file-details">
              <div className="upload-modal__filename">{file.name}</div>
              <div className="upload-modal__file-info">
                {formatFileSize(file.size)} • {Math.ceil((1 - progress) * 10)} seconds left
              </div>
              {/* Progress bar */}
              <IonProgressBar value={progress} className="upload-modal__progress" />
            </div>
          </div>
        )}
      </div>

      {/* Cancel button - updated to match the size of the upload button */}
      <div className="upload-modal__bottom-actions">
        <IonButton
          expand="block"
          fill="outline"
          className="upload-modal__cancel-btn"
          onClick={handleCancel}
        >
          {t('common.cancel')}
        </IonButton>
      </div>
    </div>
  );

  const renderSuccessState = () => (
    <div className="upload-modal__initial">
      <div className="upload-modal__drop-area">
        <div className="upload-modal__success-circle">
          <IonIcon icon={checkmarkOutline} className="upload-modal__success-icon" />
        </div>
        <h2 className="upload-modal__success-text">{t('upload.uploadSuccessful')}</h2>
      </div>
    </div>
  );

  const renderContent = () => {
    switch (status) {
      case UploadStatus.UPLOADING:
      case UploadStatus.REQUESTING_PERMISSION:
        return renderUploadingState();
      case UploadStatus.SUCCESS:
        return renderSuccessState();
      case UploadStatus.ERROR:
        return renderInitialState();
      case UploadStatus.IDLE:
      case UploadStatus.VALIDATING:
      default:
        return renderInitialState();
    }
  };

  // Show close button for success state but hide during uploading
  const showCloseButton =
    status !== UploadStatus.UPLOADING && status !== UploadStatus.REQUESTING_PERMISSION;

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={handleClose}
      backdropDismiss={false}
      className="upload-modal"
    >
      <IonContent className="upload-modal__content">
        <div className="upload-modal__header">
          <h1>{t('upload.addNewFile')}</h1>
          {showCloseButton && (
            <IonButton fill="clear" className="upload-modal__close-button" onClick={handleClose}>
              <IonIcon icon={closeOutline} />
            </IonButton>
          )}
        </div>
        {renderContent()}
      </IonContent>
    </IonModal>
  );
};

export default UploadModal;
