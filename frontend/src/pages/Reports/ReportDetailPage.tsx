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
  IonToast,
} from '@ionic/react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { bookmark, bookmarkOutline, warningOutline, chevronDown, chevronUp } from 'ionicons/icons';
import { MedicalReport } from 'common/models/medicalReport';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { fetchReportById, toggleReportBookmark } from 'common/api/reportService';

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

interface FlaggedValue {
  id: string;
  title: string;
  value: string;
  units: string;
  severity: 'High' | 'Low' | 'Normal';
  conclusion: string;
  suggestions: string[];
}

/**
 * Page component for displaying detailed information about a medical report.
 * Shows both AI insights and actual test results.
 */
const ReportDetailPage: React.FC = () => {
  const { t } = useTranslation('report');
  const { reportId } = useParams<ReportDetailParams>();
  const [selectedSegment, setSelectedSegment] = useState<'aiInsights' | 'testResults'>('aiInsights');
  const [showBookmarkToast, setShowBookmarkToast] = useState(false);
  const [bookmarkToastMessage, setBookmarkToastMessage] = useState('');
  const [flaggedValuesExpanded, setFlaggedValuesExpanded] = useState(true);
  const queryClient = useQueryClient();

  // Fetch the specific report by ID
  const { data: report, isLoading, isError } = useQuery({
    queryKey: ['report', reportId],
    queryFn: () => fetchReportById(reportId),
    enabled: !!reportId
  });

  // Toggle bookmark mutation
  const { mutate: toggleBookmark } = useMutation({
    mutationFn: ({ reportId, isBookmarked }: { reportId: string; isBookmarked: boolean }) => {
      return toggleReportBookmark(reportId, isBookmarked);
    },
    onSuccess: (updatedReport) => {
      // Update the reports query cache
      queryClient.setQueryData(['report', reportId], updatedReport);

      // Also update the reports list if it exists in the cache
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

  // Mock flagged values data for AI insights
  const flaggedValues: FlaggedValue[] = [
    {
      id: 'ldl',
      title: t('detail.highLdl'),
      value: '165',
      units: 'mg/dL',
      severity: 'High',
      conclusion: t('detail.ldlConclusion'),
      suggestions: [
        t('detail.ldlSuggestion1'),
        t('detail.ldlSuggestion2'),
        t('detail.ldlSuggestion3')
      ]
    },
    {
      id: 'hemoglobin',
      title: t('detail.lowHemoglobin'),
      value: '10.1',
      units: 'g/dL',
      severity: 'Low',
      conclusion: t('detail.hemoglobinConclusion'),
      suggestions: [
        t('detail.hemoglobinSuggestion1'),
        t('detail.hemoglobinSuggestion2')
      ]
    }
  ];

  // Handle segment change
  const handleSegmentChange = (e: CustomEvent) => {
    setSelectedSegment(e.detail.value);
  };

  // Toggle flagged values section
  const toggleFlaggedValues = () => {
    setFlaggedValuesExpanded(!flaggedValuesExpanded);
  };

  if (isLoading || !report) {
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

  if (isError) {
    return (
      <IonPage className="report-detail-page">
        <IonContent>
          <div className="report-detail-page__header report-detail-page__header--error">
            <div className="ion-padding">
              <div className="report-detail-page__back-button">
                <IonBackButton defaultHref="/tabs/home" text="" />
              </div>
              <IonText>{t('detail.errorLoading')}</IonText>
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
                <div className="warning-alert">
                  <IonIcon icon={warningOutline} />
                  <p>{t('detail.emergencyWarning')}</p>
                </div>

                <div className="flagged-values-section">
                  <div className="flagged-values-header" onClick={toggleFlaggedValues}>
                    <div className="flagged-values-title">
                      <IonIcon icon="flag-outline" />
                      <h3>{t('detail.flaggedValues')}</h3>
                    </div>
                    <IonIcon icon={flaggedValuesExpanded ? chevronUp : chevronDown} />
                  </div>

                  {flaggedValuesExpanded && (
                    <div className="flagged-values-content">
                      {flaggedValues.map((value) => (
                        <div key={value.id} className="flagged-value-item">
                          <div className="flagged-value-title">
                            <span>{value.title}</span>
                            <div className={`severity-badge severity-${value.severity.toLowerCase()}`}>
                              {value.severity}
                            </div>
                            <span className="value-with-units">{value.value} {value.units}</span>
                          </div>
                          <div className="flagged-value-details">
                            <div className="conclusion">
                              <h4>{t('detail.conclusion')}</h4>
                              <p>{value.conclusion}</p>
                            </div>
                            <div className="suggestions">
                              <h4>{t('detail.suggestions')}</h4>
                              <ul>
                                {value.suggestions.map((suggestion, index) => (
                                  <li key={index}>{suggestion}</li>
                                ))}
                              </ul>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
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
                      <tr key={index}>
                        <td>{result.name}</td>
                        <td className="result-value">
                          {result.value}
                        </td>
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
