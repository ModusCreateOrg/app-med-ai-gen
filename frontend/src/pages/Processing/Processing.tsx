import { IonContent, IonPage } from '@ionic/react';
import { useCurrentUser } from '../../common/hooks/useAuth';
import Avatar from '../../common/components/Icon/Avatar';
import { useLocation, useHistory } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { useAxios } from '../../common/hooks/useAxios';
import './Processing.scss';
import { getAuthConfig } from 'common/api/reportService';
const API_URL = import.meta.env.VITE_BASE_URL_API || '';

/**
 * Processing page that shows while the system analyzes uploaded documents
 * This page automatically displays after a successful upload
 */
const Processing: React.FC = () => {
  const currentUser = useCurrentUser();
  const firstName = currentUser?.name?.split(' ')[0];
  const axios = useAxios();
  const history = useHistory();

  // States to track processing
  const [isProcessing, setIsProcessing] = useState(true);
  const [processingError, setProcessingError] = useState<string | null>(null);

  // Get the location state which may contain the filePath
  const location = useLocation<{ filePath: string }>();
  const filePath = location.state?.filePath;
  const [reportId, setReportId] = useState(null);
  const [isFetching, setIsFetching] = useState(false);

  // Send the API request when component mounts
  useEffect(() => {
    if (!filePath) {
      setProcessingError('No file path provided');
      setIsProcessing(false);
      return;
    }

    if (reportId && isFetching) {
      return;
    }

    const processFile = async () => {
      setIsFetching(true);

      try {
        // Send POST request to backend API
        const response = await axios.post(
          `${API_URL}/api/document-processor/process-file`,
          { filePath },
          await getAuthConfig(),
        );
        setReportId(response.data.reportId);

        console.log('File processed successfully:', response.data);
      } catch (error) {
        console.error('Error processing file:', error);
        setProcessingError('Failed to process the file. Please try again.');
        setIsProcessing(false);
      }
    };

    processFile();
  }, [filePath, axios, history]);

  return (
    <IonPage className="processing-page">
      <IonContent fullscreen>
        <div className="processing-page__container">
          {/* Header with avatar */}
          <div className="processing-page__header">
            <div className="processing-page__avatar-wrapper">
              <Avatar
                value={firstName || currentUser?.email || ''}
                size="large"
                shape="round"
                testid="processing-user-avatar"
              />
            </div>

            {/* Title section */}
            <div className="processing-page__title">
              <p className="processing-page__subtitle">
                Just a few seconds{firstName && ', ' + firstName}!
              </p>
              <h1 className="processing-page__heading">
                {processingError ? 'Processing Error' : 'Processing Data...'}
              </h1>
              {processingError && <p className="processing-page__error">{processingError}</p>}
            </div>
          </div>

          {/* Animation circle */}
          {isProcessing && (
            <div className="processing-page__animation">
              <div className="processing-page__animation-circle"></div>
            </div>
          )}

          {/* Error state - show retry button */}
          {processingError && (
            <div className="processing-page__error-actions">
              <button
                className="processing-page__retry-btn"
                onClick={() => history.push('/tabs/upload')}
              >
                Try Again
              </button>
            </div>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Processing;
