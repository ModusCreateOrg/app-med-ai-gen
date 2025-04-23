import { IonPage, IonContent } from '@ionic/react';
import { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import './ReportDetailPage.scss';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MedicalReport } from '../../common/models/medicalReport';
import { useTranslation } from 'react-i18next';
import { getAuthConfig } from 'common/api/reportService';

// Import components
import ReportHeader from './components/ReportHeader';
import ReportTabs from './components/ReportTabs';
import OriginalReportTab from './components/OriginalReportTab';
import InfoCard from './components/InfoCard';
import ActionButtons from './components/ActionButtons';
import AiAnalysisTab from './components/AiAnalysisTab';

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

  // Fetch report data using react-query
  const { data, isLoading, error } = useQuery<MedicalReport>({
    queryKey: ['report', reportId],
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
          <div>
            {t('loading.report', { ns: 'errors', errorMessage: (error as Error).message })}
          </div>
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
    history.goBack();
  };

  // Handle action buttons
  const handleDiscard = () => {
    history.goBack();
  };

  const handleNewUpload = () => {
    history.push('/tabs/upload');
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

        {/* Action buttons at the bottom */}
        <ActionButtons onDiscard={handleDiscard} onNewUpload={handleNewUpload} />
      </IonContent>
    </IonPage>
  );
};

export default ReportDetailPage;
