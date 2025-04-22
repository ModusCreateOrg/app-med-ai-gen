import React from 'react';
import Icon from '../../../common/components/Icon/Icon';
import { useTranslation } from 'react-i18next';
import { MedicalReport } from '../../../common/models/medicalReport';

interface ReportHeaderProps {
  reportData: MedicalReport;
  onClose: () => void;
}

const ReportHeader: React.FC<ReportHeaderProps> = ({ reportData, onClose }) => {
  const { t } = useTranslation();

  return (
    <div className="report-detail-page__header">
      <div className="report-detail-page__title-container">
        <h1 className="report-detail-page__title">Results Analysis</h1>
        <button className="report-detail-page__close-button" onClick={onClose}>
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
  );
};

export default ReportHeader;
