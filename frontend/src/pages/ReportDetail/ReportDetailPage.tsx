import { IonPage, IonContent } from '@ionic/react';
import { FC, useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import './ReportDetailPage.scss';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MedicalReport } from '../../common/models/medicalReport';
import { useTranslation } from 'react-i18next';
import { getAuthConfig } from 'common/api/reportService';
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

/**
 * Page component for displaying detailed medical report analysis.
 * This shows AI insights and original report data with flagged values.
 */
const ReportDetailPage: FC = () => {
  const { reportId } = useParams<{ reportId: string }>();
  const history = useHistory();
  const { t } = useTranslation();
  const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'ai' | 'original'>('ai');

  const handleUploadComplete = () => {
    setIsUploadModalOpen(false);
    history.push('/tabs/home');
  };

  // Handle tab selection
  const handleTabChange = (tab: 'ai' | 'original') => {
    setActiveTab(tab);
  };

  // Function to fetch report by ID
  const fetchReportById = async (id: string): Promise<MedicalReport> => {
    const response = await axios.get<MedicalReport>(
      `${API_URL}/api/reports/${id}`,
      await getAuthConfig(),
    );
    return response.data;
  };

  // Fetch report data using react-query
  const {
    data: reportData,
    isLoading,
    error,
  } = useQuery<MedicalReport>({
    queryKey: [QueryKey.ReportDetail, reportId],
    queryFn: () => fetchReportById(reportId!),
    enabled: !!reportId,
  });

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

  if (!reportData) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div>{t('no-report-data', { ns: 'errors' })}</div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="report-detail-page">
      <IonContent fullscreen>
        {/* Header component */}
        <ReportHeader reportData={reportData} />

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
          reportId={reportId}
          reportTitle={reportData.title}
          setIsUploadModalOpen={setIsUploadModalOpen}
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
