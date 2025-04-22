import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../common/components/Icon/Icon';

const InfoCard: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="report-detail-page__info-card">
      <div className="report-detail-page__info-icon">
        <Icon icon="circleInfo" />
      </div>
      <div className="report-detail-page__info-text">
        {t('report.doctor-note', { ns: 'reportDetail' })}
      </div>
    </div>
  );
};

export default InfoCard;
