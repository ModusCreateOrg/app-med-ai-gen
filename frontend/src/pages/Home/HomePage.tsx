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
import { useGetLatestReports, useMarkReportAsRead } from 'common/hooks/useReports';
import { useCurrentUser } from 'common/hooks/useAuth';
import Avatar from 'common/components/Icon/Avatar';
import ReportItem from './components/ReportItem/ReportItem';
import NoReportsMessage from './components/NoReportsMessage/NoReportsMessage';
import AIChatBanner from 'pages/Chat/components/AIChatBanner/AIChatBanner';
import { useAIChat } from 'common/providers/AIChatProvider';
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
  const { openChat } = useAIChat();
  
  // Get user display name from token data
  const userName = currentUser?.name || currentUser?.email || 'User';
  
  const handleReportClick = (reportId: string) => {
    markAsRead(reportId);
    history.push(`/reports/${reportId}`);
  };
  
  const handleUpload = () => {
    history.push('/upload');
  };
  
  const handleRetry = () => {
    window.location.reload();
  };
  
  const handleAICardClick = () => {
    openChat();
  };
  
  const renderReportsList = () => {
    if (isLoading) {
      return (
        <>
          {[...Array(3)].map((_, index) => (
            <IonItem key={`skeleton-${index}`}>
              <IonLabel>
                <IonSkeletonText animated style={{ width: '70%' }} />
                <IonSkeletonText animated style={{ width: '40%' }} />
              </IonLabel>
            </IonItem>
          ))}
        </>
      );
    }
    
    if (isError) {
      return <NoReportsMessage onUpload={handleUpload} onRetry={handleRetry} />;
    }
    
    if (!reports || reports.length === 0) {
      return <NoReportsMessage onUpload={handleUpload} />;
    }
    
    return (
      <>
        {reports.map((report) => (
          <ReportItem
            key={report.id}
            report={report}
            onClick={() => handleReportClick(report.id)}
          />
        ))}
      </>
    );
  };
  
  return (
    <IonPage data-testid="page-home">
      <IonContent>
        <div className="home-page ion-padding">
          <div className="home-page__greeting">
            <div>
              <h1 className="home-page__title">{t('greeting.title', { name: userName })}</h1>
              <p className="home-page__subtitle">{t('greeting.subtitle')}</p>
            </div>
            <div className="home-page__avatar">
              <Avatar value={userName} />
            </div>
          </div>

          {/* AI Chat Banner */}
          <AIChatBanner onClick={openChat} />

          <IonCard className="home-page__ai-card" onClick={handleAICardClick}>
            <IonCardContent className="home-page__ai-card-content">
              <div className="home-page__ai-card-icon">
                <img src={healthcareImage} alt="Healthcare AI" />
              </div>
              <div className="home-page__ai-card-text">
                <h2>{t('aiCard.title')}</h2>
                <p>{t('aiCard.description')}</p>
              </div>
            </IonCardContent>
          </IonCard>

          <div className="home-page__reports-header">
            <h2 className="home-page__section-title">{t('reports.recentTitle')}</h2>
            <IonRouterLink routerLink="/reports" className="home-page__reports-link">
              {t('reports.seeAll')}
            </IonRouterLink>
          </div>

          <IonList className="home-page__reports-list">
            {renderReportsList()}
          </IonList>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default HomePage;
