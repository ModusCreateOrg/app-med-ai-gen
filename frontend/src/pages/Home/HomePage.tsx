import {
  IonContent,
  IonPage,
  IonList,
  IonItem,
  IonLabel,
  IonSkeletonText,
  IonCard,
  IonCardContent,
  IonRouterLink,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useState } from 'react';
import { useGetLatestReports, useMarkReportAsRead } from 'common/hooks/useReports';
import { useCurrentUser } from 'common/hooks/useAuth';
import Avatar from 'common/components/Icon/Avatar';
import ReportItem from './components/ReportItem/ReportItem';
import NoReportsMessage from './components/NoReportsMessage/NoReportsMessage';
import AIAssistantModal from 'common/components/AIAssistant/AIAssistantModal';
import healthcareImage from '../../assets/img/healthcare.svg';
import './HomePage.scss';

/**
 * The HomePage component displays the main dashboard for the application.
 */
const HomePage: React.FC = () => {
  const { t } = useTranslation('home');
  const history = useHistory();
  const { data: reports, isLoading, isError } = useGetLatestReports(3);
  const { mutate: markAsRead } = useMarkReportAsRead();
  const currentUser = useCurrentUser();
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState<boolean>(false);

  // Get user display name from token data
  const displayName = currentUser?.firstName || currentUser?.name?.split(' ')[0] || 'User';

  const handleReportClick = (reportId: string) => {
    // Mark the report as read
    markAsRead(reportId);

    // Navigate to the report detail page
    history.push(`/tabs/reports/${reportId}`);
  };

  const handleUpload = () => {
    history.push('/upload');
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleOpenAIAssistant = () => {
    setIsAIAssistantOpen(true);
  };

  const renderReportsList = () => {
    if (isLoading) {
      return Array(3)
        .fill(0)
        .map((_, index) => (
          <IonItem key={`skeleton-${index}`}>
            <div className="report-icon skeleton"></div>
            <IonLabel>
              <IonSkeletonText animated style={{ width: '40%' }} />
              <IonSkeletonText animated style={{ width: '70%' }} />
              <IonSkeletonText animated style={{ width: '30%' }} />
            </IonLabel>
          </IonItem>
        ));
    }

    if (isError) {
      return (
        <div className="home-page__empty-state">
          <NoReportsMessage
            onUpload={handleUpload}
            onRetry={handleRetry}
          />
        </div>
      );
    }

    if (!reports || reports.length === 0) {
      return (
        <div className="home-page__empty-state">
          <NoReportsMessage
            onUpload={handleUpload}
            onRetry={handleRetry}
          />
        </div>
      );
    }

    return reports.map((report) => (
      <ReportItem
        key={report.id}
        report={report}
        onClick={() => handleReportClick(report.id)}
      />
    ));
  };

  return (
    <IonPage data-testid="page-home">
      <IonContent>
        <div className="home-page ion-padding">
          <div className="home-page__greeting">
            <div className="home-page__greeting-container">
              <div className="home-page__avatar">
                <Avatar
                  value={currentUser?.name || currentUser?.email || ''}
                  size="large"
                  shape="round"
                  testid="home-user-avatar"
                />
              </div>
              <div className="home-page__greeting-text">
                <h1 className="home-page__greeting-title">
                  {t('pages.home.greeting', {
                    name: displayName
                  })}
                </h1>
                <h2 className="home-page__greeting-subtitle">{t('pages.home.howAreYou')}</h2>
              </div>
            </div>
          </div>

          <IonCard className="home-page__ai-card" onClick={handleOpenAIAssistant}>
            <div className="home-page__ai-card-decoration home-page__ai-card-decoration--star1"></div>
            <div className="home-page__ai-card-decoration home-page__ai-card-decoration--star2"></div>
            <div className="home-page__ai-card-decoration home-page__ai-card-decoration--circle1"></div>
            <div className="home-page__ai-card-decoration home-page__ai-card-decoration--circle2"></div>
            <IonCardContent>
              <div className="home-page__ai-card-content">
                <div className="home-page__ai-card-image-container">
                  <img src={healthcareImage} alt="Healthcare illustration" className="home-page__ai-card-image" />
                </div>
                <div className="home-page__ai-card-text-container">
                  <h3 className="home-page__ai-card-title">{t('pages.home.aiAssistant.title')}</h3>
                  <div className="home-page__ai-card-button-inline">
                    <span className="home-page__ai-card-button-inline">{t('pages.home.aiAssistant.button')}</span>
                  </div>
                </div>
              </div>
            </IonCardContent>
          </IonCard>

          <div className="home-page__reports-header">
            <h3 className="home-page__reports-title">{t('reports.latestTitle')}</h3>
            <IonRouterLink routerLink="/tabs/reports" className="home-page__reports-link">
              {t('reports.seeAll')}
            </IonRouterLink>
          </div>

          <IonList className="home-page__reports-list">
            {renderReportsList()}
          </IonList>
        </div>
      </IonContent>

      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        setIsOpen={setIsAIAssistantOpen}
      />
    </IonPage>
  );
};

export default HomePage;
