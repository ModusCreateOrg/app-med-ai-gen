import React from 'react';

interface ReportTabsProps {
  activeTab: 'ai' | 'original';
  onTabChange: (tab: 'ai' | 'original') => void;
}

const ReportTabs: React.FC<ReportTabsProps> = ({ activeTab, onTabChange }) => {
  return (
    <div className="report-detail-page__tabs">
      <div
        className={`report-detail-page__tab ${
          activeTab === 'ai' ? 'report-detail-page__tab--active' : ''
        }`}
        onClick={() => onTabChange('ai')}
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
        onClick={() => onTabChange('original')}
      >
        Original Report
      </div>
    </div>
  );
};

export default ReportTabs;
