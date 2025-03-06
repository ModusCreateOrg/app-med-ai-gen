import {
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonItem,
  IonLabel,
  IonSkeletonText,
  IonButton,
  IonRow,
  IonCol,
  IonCard,
  IonCardContent,
  IonIcon,
  IonText,
  IonRouterLink,
  IonAvatar,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useGetLatestReports, useMarkReportAsRead } from 'common/hooks/useReports';
import ReportItem from './components/ReportItem/ReportItem';
import NoReportsMessage from './components/NoReportsMessage/NoReportsMessage';
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

  const handleReportClick = (reportId: string) => {
    // Mark the report as read
    markAsRead(reportId);
    
    // Navigate to the report detail page
    history.push(`/reports/${reportId}`);
  };

  const handleUpload = () => {
    history.push('/upload');
  };

  const handleConnect = () => {
    history.push('/connect');
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
        <IonItem lines="none">
          <IonLabel className="ion-text-center">
            <IonText color="danger">{t('reports.error')}</IonText>
          </IonLabel>
        </IonItem>
      );
    }

    if (!reports || reports.length === 0) {
      return <NoReportsMessage onUpload={handleUpload} onConnect={handleConnect} />;
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
    <IonPage>
      <IonContent>
        <div className="home-page ion-padding">
          <div className="home-page__greeting">
            <div className="home-page__greeting-container">
              <div className="home-page__avatar">
                <IonAvatar>
                  <img src="https://ionicframework.com/docs/img/demos/avatar.svg" alt="User avatar" />
                </IonAvatar>
              </div>
              <div className="home-page__greeting-text">
                <h1 className="home-page__greeting-title">
                  {t('pages.home.greeting', { name: 'Wesley' })}
                </h1>
                <h2 className="home-page__greeting-subtitle">{t('pages.home.howAreYou')}</h2>
              </div>
            </div>
          </div>

          <IonCard className="home-page__ai-card">
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
