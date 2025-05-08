import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import closeIcon from '../../../assets/icons/close.svg';
import backIcon from '../../../assets/icons/back.svg';
import bookmarkIcon from '../../../assets/icons/bookmark.svg';
import bookmarkFilledIcon from '../../../assets/icons/bookmark-filled.svg';
import { MedicalReport } from '../../../common/models/medicalReport';
import { useHistory, useLocation } from 'react-router';

interface ReportHeaderProps {
  reportData: MedicalReport;
}

const ReportHeader: FC<ReportHeaderProps> = ({ reportData }) => {
  const { t } = useTranslation();
  const location = useLocation<{ from?: string }>();
  const history = useHistory();

  // Handle back button
  const handleBack = () => {
    history.goBack();
  };

  // Handle close button
  const handleClose = () => {
    history.push('/tabs/home');
  };

  return (
    <div className="report-detail-page__header">
      {/* Header component - only show if previous path was /tabs/processing */}
      {location.state?.from === '/tabs/processing' && (
        <>
          <div className="report-detail-page__title-container">
            <h1 className="report-detail-page__title">Results Analysis</h1>
            <button className="report-detail-page__close-button" onClick={handleClose}>
              <img src={closeIcon} alt="Close" />
            </button>
          </div>

          <hr
            style={{ backgroundColor: '#D7DBEC', height: '1px', width: '100%', marginTop: '25px' }}
          />
        </>
      )}

      {/* Category & Title */}
      <div className="report-detail-page__category-wrapper">
        {/* Back button */}
        {location.state?.from !== '/tabs/processing' && (
          <>
            <button className="report-detail-page__back-button" onClick={handleBack}>
              <img src={backIcon} alt="Back" />
            </button>
          </>
        )}

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
