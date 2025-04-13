import {
  IonBackButton,
  IonContent,
  IonPage,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardContent,
  IonText,
  IonButton,
  IonIcon,
  IonToast
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { bookmark, bookmarkOutline } from 'ionicons/icons';
import { MedicalReport } from 'common/models/medicalReport';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchAllReports, toggleReportBookmark } from 'common/api/reportService';

import './ReportDetailPage.scss';

interface ReportDetailParams {
  reportId: string;
}

interface TestResult {
  name: string;
  value: string;
  range: string;
  isOutOfRange?: boolean;
}

interface BloodTestData {
  results: TestResult[];
  comments?: string;
}

/**
 * Page component for displaying detailed information about a medical report.
 * Shows both AI insights and actual test results.
 */
const ReportDetailPage: React.FC = () => {
  const { t } = useTranslation('report');
  const { reportId } = useParams<ReportDetailParams>();
  const [selectedSegment, setSelectedSegment] = useState<'aiInsights' | 'testResults'>('aiInsights');
  const [report, setReport] = useState<MedicalReport | null>(null);
  const [showBookmarkToast, setShowBookmarkToast] = useState(false);
  const [bookmarkToastMessage, setBookmarkToastMessage] = useState('');
  const queryClient = useQueryClient();

  // Fetch all reports and find the one we need
  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchAllReports
  });

  // Toggle bookmark mutation
  const { mutate: toggleBookmark } = useMutation({
    mutationFn: ({ reportId, isBookmarked }: { reportId: string; isBookmarked: boolean }) => {
      return toggleReportBookmark(reportId, isBookmarked);
    },
    onSuccess: (updatedReport) => {
      // Update the report state with the updated bookmarked status
      setReport(updatedReport);

      // Update the reports query cache
      queryClient.setQueryData(['reports'], (oldData: MedicalReport[] | undefined) => {
        if (!oldData) return [];
        return oldData.map(oldReport =>
          oldReport.id === updatedReport.id ? updatedReport : oldReport
        );
      });

      // Show toast notification
      setBookmarkToastMessage(updatedReport.bookmarked ?
        t('detail.bookmarkAdded') :
        t('detail.bookmarkRemoved')
      );
      setShowBookmarkToast(true);
    }
  });

  // Handle bookmark click
  const handleBookmarkClick = () => {
    if (report) {
      toggleBookmark({
        reportId: report.id,
        isBookmarked: !report.bookmarked
      });
    }
  };

  // Mock blood test data based on the screenshot
  const bloodTestData: BloodTestData = {
    results: [
      { name: t('detail.hemoglobin'), value: '10.1 g/dL', range: '12-15.5 mg/dL', isOutOfRange: true },
      { name: t('detail.ldl'), value: '165 mg/dL', range: '< 130 mg/dL', isOutOfRange: true },
      { name: t('detail.glucose'), value: '110 mg/dL', range: '70 - 99 mg/dL', isOutOfRange: true },
      { name: t('detail.alt'), value: '12.5 g/dL', range: '7-35 U/L' },
      { name: t('detail.wbc'), value: '6,800 /μL', range: '4-10×10⁹/L' },
      { name: t('detail.vitaminD'), value: '35 ng/dL', range: '30-50 mg/dL' },
      { name: t('detail.cholesterol'), value: '210 mg/dL', range: '> 200 mg/dL', isOutOfRange: true }
    ],
    comments: t('detail.hemoglobinComment')
  };

  // Find the report from the list
  useEffect(() => {
    if (reports.length > 0 && reportId) {
      const foundReport = reports.find((r) => r.id === reportId);
      if (foundReport) {
        setReport(foundReport);
        // Mark report as read if necessary
        // markReportAsRead(reportId);
      }
    }
  }, [reports, reportId]);

  // Handle segment change
  const handleSegmentChange = (e: CustomEvent) => {
    setSelectedSegment(e.detail.value);
  };

  if (!report) {
    return (
      <IonPage className="report-detail-page">
        <IonContent>
          <div className="report-detail-page__header report-detail-page__header--loading">
            <div className="ion-padding">
              <div className="report-detail-page__back-button">
                <IonBackButton defaultHref="/tabs/home" text="" />
              </div>
              <IonText>{t('detail.loading')}</IonText>
            </div>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="report-detail-page">
      <IonContent>
        <div className="report-detail-page__header">
          <div className="ion-padding">
            <div className="report-detail-page__top">
              <div className="report-detail-page__back-button">
                <IonBackButton defaultHref="/tabs/home" text="" />
              </div>
            </div>

            <div className="report-category">{report.category}</div>

            <div className="report-detail-page__title-row">
              <h1 className="report-title">{report.title}</h1>
              <IonButton
                fill="clear"
                className={`bookmark-button ${report.bookmarked ? 'bookmark-button--active' : 'bookmark-button--inactive'}`}
                onClick={handleBookmarkClick}
              >
                <IonIcon slot="icon-only" icon={report.bookmarked ? bookmark : bookmarkOutline} />
              </IonButton>
            </div>
          </div>
        </div>

        <IonCard className="report-content-card">
          <IonSegment value={selectedSegment} onIonChange={handleSegmentChange} className="report-segment">
            <IonSegmentButton value="aiInsights">
              <IonLabel>{t('detail.aiInsights')}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="testResults">
              <IonLabel>{t('detail.testResults')}</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          <IonCardContent>
            {selectedSegment === 'aiInsights' && (
              <div className="ai-insights">
                <p>
                  {t('detail.aiInsightsContent')}
                </p>
                <ul className="insight-list">
                  <li>
                    <strong>{t('detail.insight1Title')}</strong>: {t('detail.insight1Content')}
                  </li>
                  <li>
                    <strong>{t('detail.insight2Title')}</strong>: {t('detail.insight2Content')}
                  </li>
                  <li>
                    <strong>{t('detail.insight3Title')}</strong>: {t('detail.insight3Content')}
                  </li>
                </ul>
              </div>
            )}

            {selectedSegment === 'testResults' && (
              <div className="test-results">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>{t('detail.test')}</th>
                      <th>{t('detail.results')}</th>
                      <th>{t('detail.refRange')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {bloodTestData.results.map((result, index) => (
                      <tr key={index} className={result.isOutOfRange ? 'out-of-range' : ''}>
                        <td>{result.name}</td>
                        <td className="result-value">{result.value}</td>
                        <td className="result-range">{result.range}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                {bloodTestData.comments && (
                  <div className="medical-comments">
                    <h3>{t('detail.medicalComments')}</h3>
                    <p>{bloodTestData.comments}</p>
                  </div>
                )}
              </div>
            )}
          </IonCardContent>
        </IonCard>

        <IonToast
          isOpen={showBookmarkToast}
          onDidDismiss={() => setShowBookmarkToast(false)}
          message={bookmarkToastMessage}
          duration={2000}
          position="bottom"
          color="primary"
        />
      </IonContent>
    </IonPage>
  );
};

export default ReportDetailPage;
