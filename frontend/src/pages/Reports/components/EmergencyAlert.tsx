import React from 'react';
import { useTranslation } from 'react-i18next';

const EmergencyAlert: React.FC = () => {
  const { t } = useTranslation();

  return (
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
  );
};

export default EmergencyAlert;
