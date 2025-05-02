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
  IonButton,
  IonToast,
  IonModal,
} from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { fetchAllReports, toggleReportBookmark } from 'common/api/reportService';
import { useMarkReportAsRead } from 'common/hooks/useReports';
import ReportItem from 'pages/Home/components/ReportItem/ReportItem';
import NoReportsMessage from 'pages/Home/components/NoReportsMessage/NoReportsMessage';
import { useState, useMemo, useEffect, useRef } from 'react';
import { MedicalReport } from 'common/models/medicalReport';
import sortSvg from 'assets/icons/sort.svg';
import filterOutlineIcon from 'assets/icons/filter-outline.svg';
import reportsIcon from 'assets/icons/reports.svg';
import SvgIcon from 'common/components/Icon/SvgIcon';
import FilterPanel, { CategoryOption } from './components/FilterPanel/FilterPanel';
import CategoryTag from './components/CategoryTag/CategoryTag';
import ReportsFilterEmpty from './components/ReportsFilterEmpty/ReportsFilterEmpty';

import './ReportsListPage.scss';
import { QueryKey } from 'common/utils/constants';

type FilterOption = 'all' | 'bookmarked';
type SortDirection = 'desc' | 'asc';

/**
 * Page component for displaying a list of all medical reports.
 */
const ReportsListPage: React.FC = () => {
  const { t } = useTranslation(['report', 'common']);
  const history = useHistory();
  const location = useLocation();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<FilterOption>('all');
  const [sortDirection, setSortDirection] = useState<SortDirection>('desc'); // Default sort by newest first
  const [showToast, setShowToast] = useState(false);
  const [toastMessage] = useState('');
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const filterModalRef = useRef<HTMLIonModalElement>(null);

  // Define available categories
  const categories: CategoryOption[] = [
    { id: 'general', label: t('category.general', { ns: 'report' }) },
    { id: 'heart', label: t('category.heart', { ns: 'report' }) },
    { id: 'brain', label: t('category.brain', { ns: 'report' }) },
    // Add more categories as needed
  ];

  const {
    data: reports = [],
    isLoading,
    isError,
    refetch,
  } = useQuery({
    queryKey: [QueryKey.Reports],
    queryFn: fetchAllReports,
    refetchOnMount: true,
  });

  // Refetch reports when navigating to this page
  useEffect(() => {
    // This will run when the component mounts or when the location changes
    refetch();
  }, [location.pathname, refetch]);

  const { mutate: markAsRead } = useMarkReportAsRead();

  // Filter and sort reports based on selected filter, categories, and sort direction
  const filteredReports = useMemo(() => {
    // First, filter the reports by bookmark status
    let filtered = filter === 'all' ? reports : reports.filter((report) => report.bookmarked);

    // Then, filter by selected categories if any are selected
    if (selectedCategories.length > 0) {
      filtered = filtered.filter((report) =>
        selectedCategories.includes(report.category.toLowerCase()),
      );
    }

    // Finally, sort the filtered reports by date
    return [...filtered].sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return sortDirection === 'desc' ? dateB - dateA : dateA - dateB;
    });
  }, [reports, filter, sortDirection, selectedCategories]);

  // Check if there are any bookmarked reports
  const hasBookmarkedReports = useMemo(() => {
    return reports.some((report) => report.bookmarked);
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
        return oldReports.map((report) =>
          report.id === updatedReport.id ? updatedReport : report,
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
    const newSortDirection = sortDirection === 'desc' ? 'asc' : 'desc';
    setSortDirection(newSortDirection);
  };

  const handleFilterClick = () => {
    setShowFilterModal(true);
  };

  const handleCloseFilterModal = () => {
    filterModalRef.current?.dismiss();
  };

  const handleApplyFilters = (categories: string[]) => {
    setSelectedCategories(categories);
  };

  const handleRemoveCategory = (categoryId: string) => {
    setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
  };

  const handleClearAllCategories = () => {
    setSelectedCategories([]);
  };

  const getCategoryLabel = (categoryId: string): string => {
    const category = categories.find((cat) => cat.id === categoryId);
    return category ? category.label : categoryId;
  };

  const renderCategoryTags = () => {
    if (selectedCategories.length === 0) return null;

    return (
      <div className="reports-list-page__category-tags">
        {selectedCategories.map((categoryId) => (
          <CategoryTag
            key={categoryId}
            label={getCategoryLabel(categoryId)}
            onRemove={() => handleRemoveCategory(categoryId)}
          />
        ))}
      </div>
    );
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
          <NoReportsMessage onUpload={handleUpload} onRetry={handleRetry} />
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
          ) : selectedCategories.length > 0 ? (
            <ReportsFilterEmpty
              onChangeFilters={handleFilterClick}
              onClearFilters={handleClearAllCategories}
              hasSelectedFilters={selectedCategories.length > 0}
            />
          ) : (
            <NoReportsMessage onUpload={handleUpload} onRetry={handleRetry} />
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
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              alignItems: 'center',
            }}
          >
            <div className="reports-list-page__title-container">
              <div className="reports-list-page__icon-wrapper">
                <SvgIcon
                  src={reportsIcon}
                  alt={t('list.icon', { ns: 'report' })}
                  className="reports-list-page__title-icon"
                  color="#313E4C"
                  width={20}
                  height={20}
                />
              </div>
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

        {/* Display selected category tags */}
        {renderCategoryTags()}

        <div className="reports-list-page__content">
          <IonList className="reports-list-page__list" lines="none">
            {renderReportsList()}
          </IonList>
        </div>
      </IonContent>

      {/* Filter Modal */}
      <IonModal
        ref={filterModalRef}
        isOpen={showFilterModal}
        onDidDismiss={() => setShowFilterModal(false)}
        className="reports-list-page__filter-modal"
        initialBreakpoint={1}
        breakpoints={[0, 0.25, 0.5, 0.75, 1]}
      >
        <FilterPanel
          categories={categories}
          selectedCategories={selectedCategories}
          onApply={handleApplyFilters}
          onClose={handleCloseFilterModal}
        />
      </IonModal>

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
