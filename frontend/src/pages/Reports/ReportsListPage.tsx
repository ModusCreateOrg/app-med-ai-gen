import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonList,
  IonSkeletonText,
  IonItem,
  IonLabel,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { fetchAllReports } from 'common/api/reportService';
import { useMarkReportAsRead } from 'common/hooks/useReports';
import ReportItem from 'pages/Home/components/ReportItem/ReportItem';
import NoReportsMessage from 'pages/Home/components/NoReportsMessage/NoReportsMessage';

import './ReportsListPage.scss';

/**
 * Page component for displaying a list of all medical reports.
 */
const ReportsListPage: React.FC = () => {
  const { t } = useTranslation();
  const history = useHistory();
  const { data: reports = [], isLoading, isError } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchAllReports
  });
  const { mutate: markAsRead } = useMarkReportAsRead();

  const handleReportClick = (reportId: string) => {
    // Mark the report as read
    markAsRead(reportId);

    // Navigate to the report detail page
    history.push(`/tabs/reports/${reportId}`);
  };

  const handleUpload = () => {
    history.push('/tabs/upload');
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const renderReportsList = () => {
    if (isLoading) {
      return Array(5)
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
        <div className="reports-list-page__empty-state">
          <NoReportsMessage
            onUpload={handleUpload}
            onRetry={handleRetry}
          />
        </div>
      );
    }

    if (!reports || reports.length === 0) {
      return (
        <div className="reports-list-page__empty-state">
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
    <IonPage className="reports-list-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/home" />
          </IonButtons>
          <IonTitle>{t('report.list.title', { ns: 'report' })}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="reports-list-page__content">
          <IonList className="reports-list-page__list">
            {renderReportsList()}
          </IonList>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ReportsListPage;
