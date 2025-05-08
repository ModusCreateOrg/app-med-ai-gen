import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import redAlertIcon from 'assets/icons/red-alert.svg';

const EmergencyAlert: FC = () => {
  const { t } = useTranslation();

  return (
    <div className="report-detail-page__emergency">
      <div className="report-detail-page__emergency-icon">
        <img src={redAlertIcon} width="25" height="25" alt="Emergency Alert" />
      </div>
      <p className="report-detail-page__emergency-text">
        {t('report.emergency.message', { ns: 'reportDetail' })}
      </p>
    </div>
  );
};

export default EmergencyAlert;
