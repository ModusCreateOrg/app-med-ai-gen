import { IonButton } from '@ionic/react';
import '../ProcessingPage.scss';
import warning from '../../../assets/icons/warning.svg';
import UploadModal from 'common/components/Upload/UploadModal';
import { useState } from 'react';
import { useHistory } from 'react-router';

interface ProcessingErrorProps {
  errorMessage: string;
  errorHeading: string;
  onRetry: () => void;
}

/**
 * Component that displays processing error information and actions
 * Exactly matches the design from the provided screenshot
 */
const ProcessingError: React.FC<ProcessingErrorProps> = ({
  errorMessage,
  errorHeading,
  onRetry,
}) => {
  const history = useHistory();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

  const handleUploadComplete = () => {
    setIsUploadModalOpen(false);
    history.push('/tabs/home');
  };

  return (
    <div className="processing-page__error-container">
      <div className="processing-page__error-content">
        <div className="processing-page__error-header">
          <p className="processing-page__error-oops">Oops! ...</p>
          <h2 className="processing-page__error-title">Problem detected</h2>
        </div>

        <div className="processing-page__error-icon">
          <img src={warning} alt="Warning Icon" className="processing-page__error-icon-img" />
        </div>

        <h3 className="processing-page__error-subheading">{errorHeading}</h3>

        <p className="processing-page__error-message">{errorMessage}</p>
      </div>

      <div className="processing-page__error-actions">
        <IonButton
          className="processing-page__retry-btn"
          expand="block"
          fill="outline"
          shape="round"
          color="primary"
          onClick={onRetry}
        >
          Try again
        </IonButton>

        <IonButton
          className="processing-page__upload-btn"
          expand="block"
          shape="round"
          color="primary"
          onClick={() => setIsUploadModalOpen(true)}
        >
          New Upload
        </IonButton>

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={handleUploadComplete}
          onUploadComplete={handleUploadComplete}
        />
      </div>
    </div>
  );
};

export default ProcessingError;
