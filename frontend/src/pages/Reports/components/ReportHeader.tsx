import React from 'react';
import { useTranslation } from 'react-i18next';
import closeIcon from '../../../assets/icons/close.svg';
import bookmarkIcon from '../../../assets/icons/bookmark.svg';
import bookmarkFilledIcon from '../../../assets/icons/bookmark-filled.svg';
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
          <img src={closeIcon} alt="Close" />
        </button>
      </div>

      {/* Category & Title */}
      <div className="report-detail-page__category-wrapper">
        <span className="report-detail-page__category">
          {reportData.category && t(`list.${reportData.category}Category`, { ns: 'reportDetail' })}
          <h2 className="report-detail-page__subtitle">{reportData.title}</h2>
        </span>
        <button className="report-detail-page__bookmark-button">
          {reportData.bookmarked ? (
            <img src={bookmarkFilledIcon} alt="Bookmarked" />
          ) : (
            <img src={bookmarkIcon} alt="Not Bookmarked" />
          )}
        </button>
      </div>
    </div>
  );
};

export default ReportHeader;
