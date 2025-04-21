import { IonPage, IonContent } from '@ionic/react';
import { useState } from 'react';
import { useHistory, useParams } from 'react-router-dom';
import Icon from '../../common/components/Icon/Icon';
import './ReportDetailPage.scss';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { MedicalReport, LabValue } from '../../common/models/medicalReport';
import { useTranslation } from 'react-i18next';
import { getAuthConfig } from 'common/api/reportService';
import { format } from 'date-fns';

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
        {/* Header section */}
        <div className="report-detail-page__header">
          <div className="report-detail-page__title-container">
            <h1 className="report-detail-page__title">Results Analysis</h1>
            <button className="report-detail-page__close-button" onClick={handleClose}>
              <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M18 6L6 18"
                  stroke="#435FF0"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M6 6L18 18"
                  stroke="#435FF0"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </div>

          {/* Category & Title */}
          <div className="report-detail-page__category-wrapper">
            <span className="report-detail-page__category">
              {t(`list.${reportData.category}Category`, { ns: 'report' })}
            </span>
            <button className="report-detail-page__bookmark-button">
              <Icon icon="bookmark" iconStyle="regular" />
            </button>
          </div>
          <h2 className="report-detail-page__subtitle">{reportData.title}</h2>
        </div>

        {/* Tab selector for AI Insights vs Original Report */}
        <div className="report-detail-page__tabs">
          <div
            className={`report-detail-page__tab ${
              activeTab === 'ai' ? 'report-detail-page__tab--active' : ''
            }`}
            onClick={() => handleTabChange('ai')}
          >
            <svg
              className="report-detail-page__tab-icon-chevron"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M18.5 14.75L12 8.25L5.5 14.75"
                stroke="#435FF0"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            AI Insights
          </div>
          <div
            className={`report-detail-page__tab ${
              activeTab === 'original' ? 'report-detail-page__tab--active' : ''
            }`}
            onClick={() => handleTabChange('original')}
          >
            Original Report
          </div>
        </div>

        {/* Content based on active tab */}
        {activeTab === 'ai' ? (
          <>
            {/* Emergency alert if needed */}
            {hasEmergency && (
              <div className="report-detail-page__emergency">
                <div className="report-detail-page__emergency-icon">
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      d="M9.25736 3.99072C9.52536 3.5167 10.1999 3.5167 10.4679 3.99072L17.8891 16.5347C18.1571 17.0087 17.8199 17.5999 17.2839 17.5999H2.44132C1.90536 17.5999 1.56816 17.0087 1.83616 16.5347L9.25736 3.99072Z"
                      stroke="#C93A54"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9.8623 7.20001V11.2"
                      stroke="#C93A54"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    <path
                      d="M9.8623 14.4H9.87027"
                      stroke="#C93A54"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
                <p className="report-detail-page__emergency-text">
                  {t('report.emergency.message', { ns: 'reportDetail' })}
                </p>
              </div>
            )}

            {/* Flagged values section */}
            <div className="report-detail-page__section">
              <div className="report-detail-page__section-header" onClick={toggleFlaggedValues}>
                <div className="report-detail-page__section-icon">
                  <Icon icon="flag" size="sm" style={{ color: '#c93a54' }} />
                </div>
                <h3 className="report-detail-page__section-title">
                  {t('report.flagged-values.title', { ns: 'reportDetail' })}
                </h3>
                <div className="report-detail-page__section-toggle">
                  <Icon icon={flaggedValuesExpanded ? 'chevronUp' : 'chevronDown'} size="sm" />
                </div>
              </div>

              {flaggedValuesExpanded &&
                flaggedValues.map((item: LabValue, index) => (
                  <div key={index} className="report-detail-page__item">
                    <div
                      className={`report-detail-page__item-header report-detail-page__item-header--${item.status.toLowerCase()}`}
                    >
                      <div className="report-detail-page__item-name">{item.name}</div>
                      <div
                        className={`report-detail-page__item-level report-detail-page__item-level--${item.status.toLowerCase()}`}
                      >
                        {item.status}
                      </div>
                      <div className="report-detail-page__item-value">
                        {item.value} {item.unit}
                      </div>
                    </div>
                    <div className="report-detail-page__item-details">
                      <div className="report-detail-page__item-section">
                        <h4>{t('report.conclusion.title', { ns: 'reportDetail' })}:</h4>
                        <p>{item.conclusion}</p>
                      </div>
                      <div className="report-detail-page__item-section">
                        <h4>{t('report.suggestions.title', { ns: 'reportDetail' })}:</h4>
                        <p>{item.suggestions}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Normal values section */}
            <div className="report-detail-page__section">
              <div className="report-detail-page__section-header" onClick={toggleNormalValues}>
                <div
                  className="report-detail-page__section-icon"
                  style={{ borderRadius: '50%', backgroundColor: '#f0f0f0' }}
                >
                  <Icon icon="vial" size="sm" />
                </div>
                <h3 className="report-detail-page__section-title">
                  {t('report.normal-values.title', { ns: 'reportDetail' })}
                </h3>
                <div className="report-detail-page__section-toggle">
                  <Icon icon={normalValuesExpanded ? 'chevronUp' : 'chevronDown'} size="sm" />
                </div>
              </div>

              {normalValuesExpanded &&
                normalValues.map((item: LabValue, index) => (
                  <div key={index} className="report-detail-page__item">
                    <div className="report-detail-page__item-header">
                      <div className="report-detail-page__item-name">{item.name}</div>
                      <div className="report-detail-page__item-value">
                        {item.value} {item.unit}
                      </div>
                    </div>
                    <div className="report-detail-page__item-details">
                      <div className="report-detail-page__item-section">
                        <h4>{t('report.conclusion.title', { ns: 'reportDetail' })}:</h4>
                        <p>{item.conclusion}</p>
                      </div>
                      <div className="report-detail-page__item-section">
                        <h4>{t('report.suggestions.title', { ns: 'reportDetail' })}:</h4>
                        <p>{item.suggestions}</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>
          </>
        ) : (
          /* Original Report Tab Content */
          <div className="report-detail-page__original-report">
            {/* Test results table */}
            <div className="report-detail-page__results-table">
              <div className="report-detail-page__results-header">
                <div className="report-detail-page__results-cell report-detail-page__results-cell--test">
                  Test
                </div>
                <div className="report-detail-page__results-cell report-detail-page__results-cell--value">
                  Results
                </div>
                <div className="report-detail-page__results-cell report-detail-page__results-cell--ref">
                  Ref.
                </div>
              </div>

              {/* Test Results Rows */}
              {reportData.labValues.map((labValue, index) => (
                <div
                  key={index}
                  className={`report-detail-page__results-row ${
                    labValue.status !== 'normal' ? 'report-detail-page__results-row--flagged' : ''
                  }`}
                >
                  <div className="report-detail-page__results-cell report-detail-page__results-cell--test">
                    {labValue.name}
                  </div>
                  <div className="report-detail-page__results-cell report-detail-page__results-cell--value">
                    {labValue.value} {labValue.unit}
                  </div>
                  <div className="report-detail-page__results-cell report-detail-page__results-cell--ref">
                    {labValue.normalRange}
                  </div>
                </div>
              ))}
            </div>

            {/* Uploaded File Section */}
            <div className="report-detail-page__uploaded-file">
              <h4 className="report-detail-page__uploaded-file-title">Uploaded file</h4>
              <div className="report-detail-page__file-container">
                <div className="report-detail-page__file-icon">
                  <Icon icon="filePdf" />
                </div>
                <div className="report-detail-page__file-details">
                  <div className="report-detail-page__file-name">
                    {reportData.filePath.split('/').pop() || 'Exam_11_01_2024.pdf'}
                  </div>
                  <div className="report-detail-page__file-info">
                    <span className="report-detail-page__file-size">92 kb</span>
                    <span className="report-detail-page__file-separator">•</span>
                    <span className="report-detail-page__file-date">
                      Uploaded ({format(new Date(reportData.createdAt), 'MM/dd/yyyy')})
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Doctor information note */}
        <div className="report-detail-page__info-card">
          <div className="report-detail-page__info-icon">
            <Icon icon="circleInfo" />
          </div>
          <div className="report-detail-page__info-text">
            {t('report.doctor-note', { ns: 'reportDetail' })}
          </div>
        </div>

        {/* Action buttons at the bottom */}
        <div className="report-detail-page__actions">
          <button
            className="report-detail-page__action-button report-detail-page__action-button--discard"
            onClick={handleDiscard}
          >
            {t('report.action.discard', { ns: 'reportDetail' })}
          </button>
          <button
            className="report-detail-page__action-button report-detail-page__action-button--upload"
            onClick={handleNewUpload}
          >
            {t('report.action.new-upload', { ns: 'reportDetail' })}
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ReportDetailPage;
