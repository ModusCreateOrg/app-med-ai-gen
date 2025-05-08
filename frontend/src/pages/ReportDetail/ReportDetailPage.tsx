import { IonPage, IonContent } from '@ionic/react';
import { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import './ReportDetailPage.scss';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { MedicalReport } from '../../common/models/medicalReport';
import { useTranslation } from 'react-i18next';
import { getAuthConfig } from 'common/api/reportService';
import { useToasts } from 'common/hooks/useToasts';
import AiAssistantNotice from './components/AiAssistantNotice';
import ReportHeader from './components/ReportHeader';
import ReportTabs from './components/ReportTabs';
import OriginalReportTab from './components/OriginalReportTab';
import InfoCard from './components/InfoCard';
import ActionButtons from './components/ActionButtons';
import AiAnalysisTab from './components/AiAnalysisTab';
import UploadModal from 'common/components/Upload/UploadModal';
import { QueryKey } from 'common/utils/constants';

const API_URL = import.meta.env.VITE_BASE_URL_API || '';

// Function to fetch report by ID
const fetchReportById = async (id: string): Promise<MedicalReport> => {
  const response = await axios.get<MedicalReport>(
    `${API_URL}/api/reports/${id}`,
    await getAuthConfig(),
  );
  return response.data;
};

/**
 * Page component for displaying detailed medical report analysis.
 * This shows AI insights and original report data with flagged values.
 */
const ReportDetailPage: React.FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const history = useHistory();
  const { t } = useTranslation();
  const { createToast } = useToasts();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleUploadComplete = () => {
    setIsUploadModalOpen(false);
    history.push('/tabs/home');
  };

  // Fetch report data using react-query
  const { data, isLoading, error } = useQuery<MedicalReport>({
    queryKey: [QueryKey.ReportDetail, reportId],
    queryFn: () => fetchReportById(reportId!),
    enabled: !!reportId,
  });

  // State to track expanded sections
  const [activeTab, setActiveTab] = useState<'ai' | 'original'>('ai');

  // Handle loading and error states
  if (isLoading) {
    return <IonPage></IonPage>;
  }

  if (error) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div>{t('loading.report', { ns: 'errors', errorMessage: (error as Error).message })}</div>
        </IonContent>
      </IonPage>
    );
  }

  if (!data) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div>{t('no-report-data', { ns: 'errors' })}</div>
        </IonContent>
      </IonPage>
    );
  }

  const reportData = data;

  // Handle tab selection
  const handleTabChange = (tab: 'ai' | 'original') => {
    setActiveTab(tab);
  };

  // Handle close button
  const handleClose = () => {
    history.push('/tabs/home');
  };

  // Handle action buttons
  const handleDiscard = async (setIsProcessing: (isProcessing: boolean) => void) => {
    try {
      setIsProcessing(true);
      await axios.delete(`${API_URL}/api/reports/${reportId}`, await getAuthConfig());
      setIsProcessing(false);

      // Show toast notification
      createToast({
        message: t('report.discard.success', {
          ns: 'reportDetail',
          defaultValue: 'Report deleted successfully',
        }),
        duration: 2000,
      });

      await queryClient.invalidateQueries({ queryKey: [QueryKey.Reports] });
      await queryClient.invalidateQueries({ queryKey: [QueryKey.LatestReports] });
      await queryClient.invalidateQueries({ queryKey: [QueryKey.ReportDetail, reportId] });

      // Navigate back
      history.push('/tabs/home');
    } catch (error) {
      setIsProcessing(false);

      console.error('Error discarding report:', error);
      createToast({
        message: t('report.discard.error', {
          ns: 'reportDetail',
          defaultValue: 'Failed to delete report',
        }),
        duration: 2000,
        color: 'danger',
      });
    }
  };

  const handleNewUpload = async (setIsProcessing: (isProcessing: boolean) => void) => {
    try {
      setIsProcessing(true);
      await axios.delete(`${API_URL}/api/reports/${reportId}`, await getAuthConfig());
      setIsProcessing(false);

      await queryClient.invalidateQueries({ queryKey: [QueryKey.Reports] });
      await queryClient.invalidateQueries({ queryKey: [QueryKey.LatestReports] });
      await queryClient.invalidateQueries({ queryKey: [QueryKey.ReportDetail, reportId] });

      setIsUploadModalOpen(true);
    } catch (error) {
      setIsProcessing(false);
      console.error('Error deleting report before new upload:', error);
    }
  };

  return (
    <IonPage className="report-detail-page">
      <IonContent fullscreen>
        {/* Header component */}
        <ReportHeader reportData={reportData} onClose={handleClose} />

        {/* Tab selector for AI Insights vs Original Report */}
        <ReportTabs activeTab={activeTab} onTabChange={handleTabChange} />

        {/* Content based on active tab */}
        {activeTab === 'ai' ? (
          <AiAnalysisTab reportData={reportData} />
        ) : (
          /* Original Report Tab Content */
          <OriginalReportTab reportData={reportData} />
        )}

        {/* Doctor information note */}
        <InfoCard />

        {/* AI Assistant Notice */}
        {activeTab === 'ai' && <AiAssistantNotice />}

        {/* Action buttons at the bottom */}
        <ActionButtons
          onDiscard={handleDiscard}
          onNewUpload={handleNewUpload}
          reportTitle={reportData.title}
        />

        <UploadModal
          isOpen={isUploadModalOpen}
          onClose={handleUploadComplete}
          onUploadComplete={handleUploadComplete}
        />
      </IonContent>
    </IonPage>
  );
};

export default ReportDetailPage;
