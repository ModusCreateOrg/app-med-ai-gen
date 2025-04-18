import {
  IonContent,
  IonHeader,
  IonPage,
  IonToolbar,
  IonList,
  IonSkeletonText,
  IonItem,
  IonLabel,
  IonSegment,
  IonSegmentButton,
  IonIcon,
  IonButton,
  IonToast,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useHistory } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAllReports, toggleReportBookmark } from 'common/api/reportService';
import { useMarkReportAsRead } from 'common/hooks/useReports';
import ReportItem from 'pages/Home/components/ReportItem/ReportItem';
import NoReportsMessage from 'pages/Home/components/NoReportsMessage/NoReportsMessage';
import { useState, useMemo, useEffect } from 'react';
import { MedicalReport } from 'common/models/medicalReport';
import { documentTextOutline } from 'ionicons/icons';
import sortSvg from 'assets/icons/sort.svg';
import filterOutlineIcon from 'assets/icons/filter-outline.svg';

import './ReportsListPage.scss';

type FilterOption = 'all' | 'bookmarked';

/**
 * Page component for displaying a list of all medical reports.
 */
const ReportsListPage: React.FC = () => {
  const { t } = useTranslation(['report', 'common']);
  const history = useHistory();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterOption>('all');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');

  const { data: reports = [], isLoading, isError } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchAllReports
  });

  const { mutate: markAsRead } = useMarkReportAsRead();

  // Filter reports based on selected filter
  const filteredReports = useMemo(() => {
    if (filter === 'all') return reports;
    return reports.filter(report => report.bookmarked);
  }, [reports, filter]);

  // Check if there are any bookmarked reports
  const hasBookmarkedReports = useMemo(() => {
    return reports.some(report => report.bookmarked);
  }, [reports]);

  // Reset to 'all' filter if no bookmarked reports and current filter is 'bookmarked'
  useEffect(() => {
    if (!hasBookmarkedReports && filter === 'bookmarked') {
      setFilter('all');
    }
  }, [hasBookmarkedReports, filter]);

  const handleSegmentChange = (e: CustomEvent) => {
    setFilter(e.detail.value as FilterOption);
  };

  const handleReportClick = (reportId: string) => {
    // Mark the report as read
    markAsRead(reportId);

    // Navigate to the report detail page
    history.push(`/tabs/reports/${reportId}`);
  };

  const handleToggleBookmark = async (reportId: string, isCurrentlyBookmarked: boolean) => {
    try {
      // Toggle the bookmark status
      const updatedReport = await toggleReportBookmark(reportId, !isCurrentlyBookmarked);

      // Update the reports in the cache
      queryClient.setQueryData<MedicalReport[]>(['reports'], (oldReports) => {
        if (!oldReports) return [];
        return oldReports.map(report =>
          report.id === updatedReport.id ? updatedReport : report
        );
      });
    } catch (error) {
      console.error('Failed to toggle bookmark:', error);
    }
  };

  const handleUpload = () => {
    history.push('/tabs/upload');
  };

  const handleRetry = () => {
    window.location.reload();
  };

  const handleSortClick = () => {
    setToastMessage(t('list.sortButton', { ns: 'report' }));
    setShowToast(true);
  };

  const handleFilterClick = () => {
    setToastMessage(t('list.filterButton', { ns: 'report' }));
    setShowToast(true);
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

    if (filteredReports.length === 0) {
      return (
        <div className="reports-list-page__empty-state">
          {filter === 'bookmarked' ? (
            <div className="reports-list-page__no-bookmarks">
              <h3>{t('list.noBookmarksTitle', { ns: 'report' })}</h3>
              <p>{t('list.noBookmarksMessage', { ns: 'report' })}</p>
            </div>
          ) : (
            <NoReportsMessage
              onUpload={handleUpload}
              onRetry={handleRetry}
            />
          )}
        </div>
      );
    }

    return filteredReports.map((report) => (
      <ReportItem
        key={report.id}
        report={report}
        onClick={() => handleReportClick(report.id)}
        onToggleBookmark={() => handleToggleBookmark(report.id, report.bookmarked)}
        showBookmarkButton
      />
    ));
  };

  return (
    <IonPage className="reports-list-page">
      <IonHeader className="reports-list-page__header">
        <IonToolbar>
          <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
            <div className="reports-list-page__title-container">
              <IonIcon icon={documentTextOutline} className="reports-list-page__title-icon" />
              <h1 className="reports-list-page__title">{t('list.title', { ns: 'report' })}</h1>
            </div>
            <div className="reports-list-page__actions">
              <IonButton
                fill="clear"
                className="reports-list-page__sort-button"
                onClick={handleSortClick}
                aria-label={t('list.sortButton', { ns: 'report' })}
              >
                <div className="custom-icon-wrapper">
                  <img
                    src={sortSvg}
                    alt={t('list.sortButton', { ns: 'report' })}
                    className="custom-icon"
                  />
                </div>
              </IonButton>
              <IonButton
                fill="clear"
                className="reports-list-page__filter-button"
                onClick={handleFilterClick}
                aria-label={t('list.filterButton', { ns: 'report' })}
              >
                <div className="custom-icon-wrapper">
                  <img
                    src={filterOutlineIcon}
                    alt={t('list.filterButton', { ns: 'report' })}
                    className="custom-icon"
                  />
                </div>
              </IonButton>
            </div>
          </div>
        </IonToolbar>
      </IonHeader>
      <IonContent className="reports-list-page__content-container">
        {!isLoading && !isError && reports.length > 0 && hasBookmarkedReports && (
          <div className="reports-list-page__filter">
            <div className="reports-list-page__segment-wrapper">
              <IonSegment value={filter} onIonChange={handleSegmentChange} mode="ios">
                <IonSegmentButton value="all">
                  <IonLabel>{t('list.filterAll', { ns: 'report' })}</IonLabel>
                </IonSegmentButton>
                <IonSegmentButton value="bookmarked">
                  <IonLabel>{t('list.filterBookmarked', { ns: 'report' })}</IonLabel>
                </IonSegmentButton>
              </IonSegment>
            </div>
          </div>
        )}
        <div className="reports-list-page__content">
          <IonList className="reports-list-page__list" lines="none">
            {renderReportsList()}
          </IonList>
        </div>
      </IonContent>

      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
      />
    </IonPage>
  );
};

export default ReportsListPage;
