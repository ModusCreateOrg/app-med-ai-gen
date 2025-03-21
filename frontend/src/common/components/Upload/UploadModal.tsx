import { useRef, ChangeEvent } from 'react';
import {
  IonModal,
  IonContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButton,
  IonIcon,
  IonSpinner,
  IonProgressBar,
} from '@ionic/react';
import { closeOutline, cloudUploadOutline, checkmarkCircleOutline, alertCircleOutline } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import { UploadStatus, useFileUpload } from '../../hooks/useFileUpload';
import './UploadModal.scss';

export interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File) => Promise<void>;
}

const UploadModal = ({ isOpen, onClose, onUpload }: UploadModalProps): JSX.Element => {
  const { t } = useTranslation();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const {
    file,
    status,
    progress,
    error,
    selectFile,
    uploadFile,
    reset,
    formatFileSize
  } = useFileUpload({ onUpload });

  const handleFileChange = (event: ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }
    
    selectFile(files[0]);
  };

  const handleUploadClick = () => {
    if (!fileInputRef.current) return;
    fileInputRef.current.click();
  };

  const handleStartUpload = async () => {
    await uploadFile();
  };

  const handleClose = () => {
    reset();
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
          <span>{t('upload.imageSizeLimit', { size: 5 })}</span>
          <span>{t('upload.pdfSizeLimit', { size: 10 })}</span>
        </div>
        <input
          type="file"
          ref={fileInputRef}
          accept=".pdf,.jpeg,.jpg,.png"
          onChange={handleFileChange}
          className="upload-modal__file-input"
        />
        <IonButton 
          expand="block" 
          className="upload-modal__upload-btn"
          onClick={handleUploadClick}
        >
          {t('upload.selectFile')}
        </IonButton>
      </div>
    </div>
  );

  const renderUploadingState = () => (
    <div className="upload-modal__uploading">
      <div className="upload-modal__file-info">
        <p className="upload-modal__filename">{file?.name}</p>
        <p className="upload-modal__filesize">
          {file ? formatFileSize(file.size) : ''}
        </p>
      </div>
      <div className="upload-modal__progress-container">
        <IonProgressBar value={progress} />
        <div className="upload-modal__progress-text">
          <IonSpinner name="dots" />
          <span>{t('upload.uploading')}</span>
          <span>{Math.round(progress * 100)}%</span>
        </div>
      </div>
    </div>
  );

  const renderSuccessState = () => (
    <div className="upload-modal__success">
      <IonIcon icon={checkmarkCircleOutline} className="upload-modal__success-icon" />
      <h2>{t('upload.uploadSuccessful')}</h2>
      <p>{t('upload.fileReadyForProcessing')}</p>
      <IonButton 
        expand="block" 
        className="upload-modal__close-btn"
        onClick={handleClose}
      >
        {t('common.done')}
      </IonButton>
    </div>
  );

  const renderErrorState = () => (
    <div className="upload-modal__error">
      <IonIcon icon={alertCircleOutline} className="upload-modal__error-icon" />
      <h2>{t('upload.uploadFailed')}</h2>
      <p className="upload-modal__error-message">{error}</p>
      <div className="upload-modal__buttons">
        <IonButton 
          expand="block" 
          className="upload-modal__retry-btn"
          onClick={reset}
        >
          {t('common.tryAgain')}
        </IonButton>
        <IonButton 
          expand="block" 
          fill="outline"
          className="upload-modal__cancel-btn"
          onClick={handleClose}
        >
          {t('common.cancel')}
        </IonButton>
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
        return renderErrorState();
      case UploadStatus.IDLE:
      case UploadStatus.VALIDATING:
      default:
        return renderInitialState();
    }
  };

  return (
    <IonModal isOpen={isOpen} onDidDismiss={handleClose} className="upload-modal">
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('upload.addNewFile')}</IonTitle>
          <IonButton 
            slot="end" 
            fill="clear"
            onClick={handleClose}
          >
            <IonIcon icon={closeOutline} />
          </IonButton>
        </IonToolbar>
      </IonHeader>
      <IonContent className="upload-modal__content">
        {file && status === UploadStatus.IDLE && (
          <div className="upload-modal__selected-file">
            <p className="upload-modal__filename">{file.name}</p>
            <IonButton 
              expand="block" 
              className="upload-modal__start-upload"
              onClick={handleStartUpload}
            >
              {t('upload.upload')}
            </IonButton>
          </div>
        )}
        {renderContent()}
      </IonContent>
    </IonModal>
  );
};

export default UploadModal; 