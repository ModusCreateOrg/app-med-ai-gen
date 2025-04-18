import { IonContent, IonPage } from '@ionic/react';
import { useCurrentUser } from '../../common/hooks/useAuth';
import Avatar from '../../common/components/Icon/Avatar';
import { useLocation, useHistory } from 'react-router-dom';
import { useEffect, useState, useRef } from 'react';
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
  const statusCheckIntervalRef = useRef<number | null>(null);

  // Get the location state which may contain the reportId (previously filePath)
  const location = useLocation<{ reportId: string }>();
  const reportId = location.state?.reportId;
  const [isFetching, setIsFetching] = useState(false);

  // Check the status of the report processing
  const checkReportStatus = async () => {
    if (!reportId) return;

    try {
      const response = await axios.get(
        `${API_URL}/api/document-processor/report-status/${reportId}`,
        await getAuthConfig(),
      );

      console.log('Report status:', response.data);

      // If processing is complete, clear the interval and redirect to the report page
      if (response.data.isComplete) {
        setIsProcessing(false);

        // Clear the interval
        if (statusCheckIntervalRef.current) {
          window.clearInterval(statusCheckIntervalRef.current);
          statusCheckIntervalRef.current = null;
        }

        console.log('Processing complete');

        // Redirect to report detail page
        history.push(`/tabs/reports/${reportId}`);
      }
    } catch (error) {
      console.error('Error checking report status:', error);
      setProcessingError('Failed to check the status of the report. Please try again.');
      setIsProcessing(false);

      // Clear the interval on error
      if (statusCheckIntervalRef.current) {
        window.clearInterval(statusCheckIntervalRef.current);
        statusCheckIntervalRef.current = null;
      }
    }
  };

  // Send the API request when component mounts
  useEffect(() => {
    if (!reportId) {
      setProcessingError('No report ID provided');
      setIsProcessing(false);
      return;
    }

    if (isFetching) {
      return;
    }

    const processFile = async () => {
      setIsFetching(true);

      try {
        // Send POST request to backend API
        const response = await axios.post(
          `${API_URL}/api/document-processor/process-file`,
          { reportId },
          await getAuthConfig(),
        );

        console.log('File processing started:', response.data);

        // Start checking the status every 5 seconds
        statusCheckIntervalRef.current = window.setInterval(checkReportStatus, 5000);

        // Run the first status check immediately
        checkReportStatus();
      } catch (error) {
        console.error('Error processing file:', error);
        setProcessingError('Failed to process the file. Please try again.');
        setIsProcessing(false);
      }
    };

    processFile();

    // Clean up the interval when the component unmounts
    return () => {
      if (statusCheckIntervalRef.current) {
        window.clearInterval(statusCheckIntervalRef.current);
      }
    };
  }, [reportId, axios, history]);

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
