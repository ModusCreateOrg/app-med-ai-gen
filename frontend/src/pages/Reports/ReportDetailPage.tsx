import {
  IonBackButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonPage,
  IonTitle,
  IonToolbar,
  IonSegment,
  IonSegmentButton,
  IonLabel,
  IonCard,
  IonCardContent,
  IonText,
  IonButton,
  IonIcon
} from '@ionic/react';
import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { bookmarkOutline } from 'ionicons/icons';
import { MedicalReport } from 'common/models/medicalReport';
import { useQuery } from '@tanstack/react-query';
import { fetchAllReports } from 'common/api/reportService';

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
  const { t } = useTranslation();
  const { reportId } = useParams<ReportDetailParams>();
  const [selectedSegment, setSelectedSegment] = useState<'aiInsights' | 'testResults'>('aiInsights');
  const [report, setReport] = useState<MedicalReport | null>(null);

  // Fetch all reports and find the one we need
  const { data: reports = [] } = useQuery({
    queryKey: ['reports'],
    queryFn: fetchAllReports
  });

  // Mock blood test data based on the screenshot
  const bloodTestData: BloodTestData = {
    results: [
      { name: t('report.detail.hemoglobin', { ns: 'report' }), value: '10.1 g/dL', range: '12-15.5 mg/dL', isOutOfRange: true },
      { name: t('report.detail.ldl', { ns: 'report' }), value: '165 mg/dL', range: '< 130 mg/dL', isOutOfRange: true },
      { name: t('report.detail.glucose', { ns: 'report' }), value: '110 mg/dL', range: '70 - 99 mg/dL', isOutOfRange: true },
      { name: t('report.detail.alt', { ns: 'report' }), value: '12.5 g/dL', range: '7-35 U/L' },
      { name: t('report.detail.wbc', { ns: 'report' }), value: '6,800 /μL', range: '4-10×10⁹/L' },
      { name: t('report.detail.vitaminD', { ns: 'report' }), value: '35 ng/dL', range: '30-50 mg/dL' },
      { name: t('report.detail.cholesterol', { ns: 'report' }), value: '210 mg/dL', range: '> 200 mg/dL', isOutOfRange: true }
    ],
    comments: t('report.detail.hemoglobinComment', { ns: 'report' })
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
        <IonHeader>
          <IonToolbar>
            <IonButtons slot="start">
              <IonBackButton defaultHref="/tabs/home" />
            </IonButtons>
            <IonTitle>{t('report.detail.loading', { ns: 'report' })}</IonTitle>
          </IonToolbar>
        </IonHeader>
        <IonContent>
          <div className="ion-padding">
            <IonText>{t('report.detail.loading', { ns: 'report' })}</IonText>
          </div>
        </IonContent>
      </IonPage>
    );
  }

  return (
    <IonPage className="report-detail-page">
      <IonHeader>
        <IonToolbar>
          <IonButtons slot="start">
            <IonBackButton defaultHref="/tabs/home" />
          </IonButtons>
          <IonTitle>{t('report.detail.title', { ns: 'report' })}</IonTitle>
          <IonButtons slot="end">
            <IonButton>
              <IonIcon slot="icon-only" icon={bookmarkOutline} />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="report-detail-page__header">
          <div className="ion-padding">
            <div className="report-category">{report.category}</div>
            <h1 className="report-title">{report.title}</h1>
          </div>
        </div>

        <IonCard className="report-content-card">
          <IonSegment value={selectedSegment} onIonChange={handleSegmentChange} className="report-segment">
            <IonSegmentButton value="aiInsights">
              <IonLabel>{t('report.detail.aiInsights', { ns: 'report' })}</IonLabel>
            </IonSegmentButton>
            <IonSegmentButton value="testResults">
              <IonLabel>{t('report.detail.testResults', { ns: 'report' })}</IonLabel>
            </IonSegmentButton>
          </IonSegment>

          <IonCardContent>
            {selectedSegment === 'aiInsights' && (
              <div className="ai-insights">
                <p>
                  {t('report.detail.aiInsightsContent', { ns: 'report' })}
                </p>
                <ul className="insight-list">
                  <li>
                    <strong>{t('report.detail.insight1Title', { ns: 'report' })}</strong>: {t('report.detail.insight1Content', { ns: 'report' })}
                  </li>
                  <li>
                    <strong>{t('report.detail.insight2Title', { ns: 'report' })}</strong>: {t('report.detail.insight2Content', { ns: 'report' })}
                  </li>
                  <li>
                    <strong>{t('report.detail.insight3Title', { ns: 'report' })}</strong>: {t('report.detail.insight3Content', { ns: 'report' })}
                  </li>
                </ul>
              </div>
            )}

            {selectedSegment === 'testResults' && (
              <div className="test-results">
                <table className="results-table">
                  <thead>
                    <tr>
                      <th>{t('report.detail.test', { ns: 'report' })}</th>
                      <th>{t('report.detail.results', { ns: 'report' })}</th>
                      <th>{t('report.detail.refRange', { ns: 'report' })}</th>
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
                    <h3>{t('report.detail.medicalComments', { ns: 'report' })}</h3>
                    <p>{bloodTestData.comments}</p>
                  </div>
                )}
              </div>
            )}
          </IonCardContent>
        </IonCard>

        <div className="ion-padding">
          <IonText color="medium" className="report-metadata">
            {t('report.detail.reportDate', { ns: 'report' })}: {report.date ? format(new Date(report.date), 'MM/dd/yyyy') : 'N/A'}
          </IonText>
          {report.doctor && (
            <IonText color="medium" className="report-metadata">
              <div>{t('report.detail.doctor', { ns: 'report' })}: {report.doctor}</div>
            </IonText>
          )}
          {report.facility && (
            <IonText color="medium" className="report-metadata">
              <div>{t('report.detail.facility', { ns: 'report' })}: {report.facility}</div>
            </IonText>
          )}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ReportDetailPage;
