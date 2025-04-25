import { IonContent, IonPage } from '@ionic/react';
import { useCurrentUser } from '../../common/hooks/useAuth';
import Avatar from '../../common/components/Icon/Avatar';
import { useLocation, useHistory } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
import { useAxios } from '../../common/hooks/useAxios';
import './ProcessingPage.scss';
import { getAuthConfig } from 'common/api/reportService';
import ProcessingError from './components/ProcessingError';
import ProcessingAnimation from './components/ProcessingAnimation';

const API_URL = import.meta.env.VITE_BASE_URL_API || '';

/**
 * Processing page that shows while the system analyzes uploaded documents
 * This page automatically displays after a successful upload
 */
const ProcessingPage: React.FC = () => {
  const currentUser = useCurrentUser();
  const firstName = currentUser?.name?.split(' ')[0];
  const axios = useAxios();
  const history = useHistory();

  // States to track processing
  const [isProcessing, setIsProcessing] = useState(true);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [errorHeading, setErrorHeading] = useState<string | null>(null);
  const statusCheckIntervalRef = useRef<number | null>(null);
  const lastTriggeredTime = useRef<number | null>(null);

  // Get the location state which may contain the reportId (previously filePath)
  const location = useLocation<{ reportId: string }>();
  const reportId = location.state?.reportId;

  const clearStatusCheckInterval = () => {
    if (statusCheckIntervalRef.current) {
      window.clearInterval(statusCheckIntervalRef.current);
      statusCheckIntervalRef.current = null;
    }
  };

  // Check the status of the report processing
  const checkReportStatus = async () => {
    if (!reportId) return;

    const failedHeading = 'Processing Error';
    const failedMessage =
      'There was a problem processing your uploaded file. Please try again or upload another.';

    const missingDataHeading = 'Missing Data';
    const missingDataMessage =
      'The system was unable to extract meaningful health data from your uploaded file. Please try again or upload another.';

    try {
      const response = await axios.get(
        `${API_URL}/api/document-processor/report-status/${reportId}`,
        await getAuthConfig(),
      );

      const data = response.data;

      if (data.isComplete) {
        setIsProcessing(false);
        clearStatusCheckInterval();

        console.log('Processing complete');

        history.push(`/tabs/reports/${reportId}`);
      } else if (data.isMedicalReport === false) {
        setIsProcessing(false);
        clearStatusCheckInterval();
        setErrorHeading(missingDataHeading);
        setProcessingError(missingDataMessage);
      } else if (data.status === 'failed') {
        throw new Error(failedMessage);
      }
    } catch (error) {
      setIsProcessing(false);
      clearStatusCheckInterval();

      setErrorHeading(failedHeading);
      setProcessingError(error instanceof Error ? error.message : failedMessage);
    }
  };

  // Process file function - moved outside useEffect to make it callable from buttons
  const processFile = async () => {
    if (!reportId) {
      return;
    }

    try {
      // Send POST request to backend API
      const response = await axios.post(
        `${API_URL}/api/document-processor/process-file`,
        { reportId },
        await getAuthConfig(),
      );

      const data = response.data;

      if (data.status === 'processed') {
        setIsProcessing(false);

        // Redirect to report detail page
        history.push(`/tabs/reports/${reportId}`);
      }

      // Start checking the status every 2 seconds
      statusCheckIntervalRef.current = window.setInterval(checkReportStatus, 2000);
    } catch (error) {
      console.error('Error processing file:', error);
      setProcessingError('Failed to process the file. Please try again.');
      setIsProcessing(false);
    }
  };

  // Handle retry attempt
  const execute = () => {
    // Reset error state and try processing the same file again
    setProcessingError(null);
    setIsProcessing(true);
    lastTriggeredTime.current = Date.now();
    processFile();
  };

  // Send the API request when component mounts
  useEffect(() => {
    // check last triggered time to prevent multiple calls, if it's within 100ms then ignore
    if ((lastTriggeredTime.current && lastTriggeredTime.current > Date.now() - 100) || !reportId) {
      return;
    }

    execute();

    // Clean up the interval when the component unmounts
    return clearStatusCheckInterval;
  }, [reportId, location.pathname, history]);

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
          </div>

          {/* Processing animation */}
          {isProcessing && <ProcessingAnimation firstName={firstName} />}

          {/* Error state - shows when processing fails */}
          {processingError && errorHeading && (
            <ProcessingError
              errorHeading={errorHeading}
              errorMessage={processingError}
              onRetry={execute}
            />
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ProcessingPage;
