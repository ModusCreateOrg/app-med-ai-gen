import { IonPage, IonContent } from '@ionic/react';
import { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import './ReportDetailPage.scss';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MedicalReport, LabValue } from '../../common/models/medicalReport';
import { useTranslation } from 'react-i18next';
import { getAuthConfig } from 'common/api/reportService';

// Import components
import ReportHeader from './components/ReportHeader';
import ReportTabs from './components/ReportTabs';
import EmergencyAlert from './components/EmergencyAlert';
import FlaggedValuesSection from './components/FlaggedValuesSection';
import NormalValuesSection from './components/NormalValuesSection';
import OriginalReport from './components/OriginalReport';
import InfoCard from './components/InfoCard';
import ActionButtons from './components/ActionButtons';

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
  const [flaggedValuesExpanded, setFlaggedValuesExpanded] = useState(true);
  const [normalValuesExpanded, setNormalValuesExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'ai' | 'original'>('ai');

  // Toggle expanded state of sections
  const toggleFlaggedValues = () => setFlaggedValuesExpanded(!flaggedValuesExpanded);
  const toggleNormalValues = () => setNormalValuesExpanded(!normalValuesExpanded);

  // Handle loading and error states
  if (isLoading) {
    return <IonPage></IonPage>;
  }

  if (error) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div>
            {t('error.loading.report', { ns: 'errors', errorMessage: (error as Error).message })}
          </div>
        </IonContent>
      </IonPage>
    );
  }

  if (!data) {
    return (
      <IonPage>
        <IonContent className="ion-padding">
          <div>{t('error.no-report-data', { ns: 'errors' })}</div>
        </IonContent>
      </IonPage>
    );
  }

  const reportData = data;

  // Process lab values data
  const hasEmergency = reportData.labValues.some((value) => value.isCritical);
  const flaggedValues: LabValue[] = reportData.labValues.filter(
    (value) => value.status !== 'normal',
  );
  const normalValues: LabValue[] = reportData.labValues.filter(
    (value) => value.status === 'normal',
  );

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
          <>
            {/* Emergency alert if needed */}
            {hasEmergency && <EmergencyAlert />}

            {/* Flagged values section */}
            <FlaggedValuesSection
              flaggedValues={flaggedValues}
              isExpanded={flaggedValuesExpanded}
              onToggle={toggleFlaggedValues}
            />

            {/* Normal values section */}
            <NormalValuesSection
              normalValues={normalValues}
              isExpanded={normalValuesExpanded}
              onToggle={toggleNormalValues}
            />
          </>
        ) : (
          /* Original Report Tab Content */
          <OriginalReport reportData={reportData} />
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
