import React from 'react';
import aiInsightIcon from '../../../assets/icons/ai-insight.svg';

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
        <img src={aiInsightIcon} alt="AI Insights" style={{ marginRight: '8px' }} />
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
