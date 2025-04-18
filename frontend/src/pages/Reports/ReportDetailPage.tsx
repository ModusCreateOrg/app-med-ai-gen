import { IonPage, IonContent, IonButton } from '@ionic/react';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import Icon from '../../common/components/Icon/Icon';
import './ReportDetailPage.scss';

/**
 * Page component for displaying detailed medical report analysis.
 * This shows AI insights and original report data with flagged values.
 */
const ReportDetailPage: React.FC = () => {
//   const { reportId } = useParams<{ reportId: string }>();
  const history = useHistory();

  // State to track expanded sections
  const [flaggedValuesExpanded, setFlaggedValuesExpanded] = useState(true);
  const [normalValuesExpanded, setNormalValuesExpanded] = useState(true);
  const [activeTab, setActiveTab] = useState<'ai' | 'original'>('ai');

  // Toggle expanded state of sections
  const toggleFlaggedValues = () => setFlaggedValuesExpanded(!flaggedValuesExpanded);
  const toggleNormalValues = () => setNormalValuesExpanded(!normalValuesExpanded);

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

  // Hardcoded data for now, will be replaced with real API data later
  const reportData = {
    title: 'Blood Test',
    category: 'General',
    flaggedValues: [
      {
        name: 'High LDL Cholesterol',
        level: 'High',
        value: '165 mg/dL',
        conclusion: 'Elevated LDL (bad cholesterol) increases your risk of cardiovascular disease',
        suggestions: [
          'Consider a heart-healthy diet (e.g., Mediterranean).',
          'Increase physical activity.',
          'Visit the nearest emergency room.',
        ],
      },
      {
        name: 'Low Hemoglobin (10.1 g/dL)',
        level: 'Low',
        value: '10.1 g/dL',
        conclusion: 'This level suggests anemia, which may cause fatigue and weakness.',
        suggestions: [
          'Test for iron, B12, and folate deficiency.',
          'Consider iron-rich foods or supplements after medical consultation.already on one.',
        ],
      },
    ],
    normalValues: [
      {
        name: 'White Blood Cell Count',
        value: '6,800 /µL',
        conclusion: 'Normal WBC count; your immune system is functioning well',
        suggestions: ['Keep up a balanced diet, manage stress, and get adequate rest.'],
      },
      {
        name: 'Vitamin D',
        value: '35 ng/mL',
        conclusion: 'Adequate levels for bone health and immunity.',
        suggestions: ['Maintain outdoor exposure and dietary intake.'],
      },
    ],
    hasEmergency: true,
  };

  return (
    <IonPage className="report-detail-page">
      <IonContent fullscreen>
        {/* Header section */}
        <div className="report-detail-page__header">
          <div className="report-detail-page__title-container">
            <h1>Results Analysis</h1>
            <div className="report-detail-page__header-actions">
              <IonButton fill="clear" className="close-button" onClick={handleClose}>
                <Icon icon="xmark" size="lg" />
              </IonButton>
            </div>
          </div>

          {/* Category & Title */}
          <div className="report-detail-page__category">
            <span className="report-detail-page__category-text">{reportData.category}</span>
            <div className="report-detail-page__bookmark-container">
              <Icon icon="bookmark" iconStyle="regular" />
            </div>
          </div>
          <h2 className="report-detail-page__report-title">{reportData.title}</h2>
        </div>

        {/* Tab selector for AI Insights vs Original Report */}
        <div className="report-detail-page__tabs">
          <div
            className={`report-detail-page__tab ${
              activeTab === 'ai' ? 'report-detail-page__tab--active' : ''
            }`}
            onClick={() => handleTabChange('ai')}
          >
            <span className="report-detail-page__tab-icon report-detail-page__tab-icon--ai">
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3 12L8 4L13 12"
                  stroke="#4765ff"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
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

        {/* Emergency alert if needed */}
        {reportData.hasEmergency && (
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
              Please contact your doctor or seek emergency care immediately.
            </p>
          </div>
        )}

        {/* Flagged values section */}
        <div className="report-detail-page__section">
          <div className="report-detail-page__section-header" onClick={toggleFlaggedValues}>
            <div className="report-detail-page__section-icon">
              <Icon icon="flag" size="sm" style={{ color: '#c93a54' }} />
            </div>
            <h3 className="report-detail-page__section-title">Flagged values</h3>
            <div className="report-detail-page__section-toggle">
              <Icon icon={flaggedValuesExpanded ? 'chevronUp' : 'chevronDown'} size="sm" />
            </div>
          </div>

          {flaggedValuesExpanded &&
            reportData.flaggedValues.map((item, index) => (
              <div key={index} className="report-detail-page__item">
                <div
                  className={`report-detail-page__item-header report-detail-page__item-header--${item.level.toLowerCase()}`}
                >
                  <div className="report-detail-page__item-name">{item.name}</div>
                  <div
                    className={`report-detail-page__item-level report-detail-page__item-level--${item.level.toLowerCase()}`}
                  >
                    {item.level}
                  </div>
                  <div className="report-detail-page__item-value">{item.value}</div>
                </div>
                <div className="report-detail-page__item-details">
                  <div className="report-detail-page__item-section">
                    <h4>Conclusion:</h4>
                    <p>{item.conclusion}</p>
                  </div>
                  <div className="report-detail-page__item-section">
                    <h4>Suggestions:</h4>
                    <ul className="report-detail-page__item-list">
                      {item.suggestions.map((suggestion, idx) => (
                        <li key={idx}>{suggestion}</li>
                      ))}
                    </ul>
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
            <h3 className="report-detail-page__section-title">Normal values</h3>
            <div className="report-detail-page__section-toggle">
              <Icon icon={normalValuesExpanded ? 'chevronUp' : 'chevronDown'} size="sm" />
            </div>
          </div>

          {normalValuesExpanded &&
            reportData.normalValues.map((item, index) => (
              <div key={index} className="report-detail-page__item">
                <div className="report-detail-page__item-header">
                  <div className="report-detail-page__item-name">{item.name}</div>
                  <div className="report-detail-page__item-value">{item.value}</div>
                </div>
                <div className="report-detail-page__item-details">
                  <div className="report-detail-page__item-section">
                    <h4>Conclusion:</h4>
                    <p>{item.conclusion}</p>
                  </div>
                  <div className="report-detail-page__item-section">
                    <h4>Suggestions:</h4>
                    <ul className="report-detail-page__item-list">
                      {item.suggestions.map((suggestion, idx) => (
                        <li key={idx}>{suggestion}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
        </div>

        {/* Doctor information note */}
        <div className="report-detail-page__info-card">
          <div className="report-detail-page__info-icon">
            <Icon icon="circleInfo" />
          </div>
          <div className="report-detail-page__info-text">
            With all interpretations, these results should be discussed with your doctor.
          </div>
        </div>

        {/* AI Assistant help section */}
        <div className="report-detail-page__ai-help">
          <div className="report-detail-page__ai-help-title">
            Still need further clarifications?
          </div>
          <div className="report-detail-page__ai-help-action">Ask our AI Assistant &gt;</div>
        </div>

        {/* Action buttons at the bottom */}
        <div className="report-detail-page__actions">
          <button
            className="report-detail-page__action-button report-detail-page__action-button--discard"
            onClick={handleDiscard}
          >
            Discard
          </button>
          <button
            className="report-detail-page__action-button report-detail-page__action-button--upload"
            onClick={handleNewUpload}
          >
            New Upload
          </button>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ReportDetailPage;