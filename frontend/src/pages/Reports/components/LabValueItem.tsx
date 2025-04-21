import React from 'react';
import { useTranslation } from 'react-i18next';
import { LabValue } from '../../../common/models/medicalReport';

interface LabValueItemProps {
  item: LabValue;
}

const LabValueItem: React.FC<LabValueItemProps> = ({ item }) => {
  const { t } = useTranslation();

  return (
    <div className="report-detail-page__item">
      <div
        className={`report-detail-page__item-header ${
          item.status !== 'normal'
            ? `report-detail-page__item-header--${item.status.toLowerCase()}`
            : ''
        }`}
      >
        <div className="report-detail-page__item-name">{item.name}</div>
        {item.status !== 'normal' && (
          <div
            className={`report-detail-page__item-level report-detail-page__item-level--${item.status.toLowerCase()}`}
          >
            {item.status}
          </div>
        )}
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
  );
};

export default LabValueItem;
