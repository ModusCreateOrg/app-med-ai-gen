import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../common/components/Icon/Icon';
import { LabValue } from '../../../common/models/medicalReport';
import LabValueItem from './LabValueItem';
import normalValuesIcon from '../../../assets/icons/normal-values.svg';
import noValuesIcon from '../../../assets/icons/no-values.svg';

interface NormalValuesSectionProps {
  normalValues: LabValue[];
  isExpanded: boolean;
  onToggle: () => void;
}

const NormalValuesSection: React.FC<NormalValuesSectionProps> = ({
  normalValues,
  isExpanded,
  onToggle,
}) => {
  const { t } = useTranslation();

  return (
    <div className="report-detail-page__section normal-values-section">
      <div className="report-detail-page__section-header" onClick={onToggle}>
        <div
          className="report-detail-page__section-icon"
          style={{ borderRadius: '50%', backgroundColor: '#f0f0f0' }}
        >
          <img src={normalValuesIcon} alt="Normal Values Icon" />
        </div>
        <h3 className="report-detail-page__section-title">
          {t('report.normal-values.title', { ns: 'reportDetail' })}
        </h3>
        <div className="report-detail-page__section-toggle">
          <Icon icon={isExpanded ? 'chevronUp' : 'chevronDown'} size="sm" />
        </div>
      </div>

      {isExpanded && normalValues.length === 0 && (
        <div className="report-detail-page__section-empty">
          <div className="report-detail-page__section-empty-content">
            <img src={noValuesIcon} alt="No Values Icon" style={{ marginBottom: '2rem' }} />
            <h3 className="report-detail-page__section-empty-title">
              {t('report.normal-values.empty', { ns: 'reportDetail' })}
            </h3>
            <p className="report-detail-page__section-empty-description">
              {t('report.normal-values.empty-description', { ns: 'reportDetail' })}
            </p>
          </div>
        </div>
      )}

      {isExpanded &&
        normalValues.length > 0 && (
          <div className="normal-values-content">
            {normalValues.map((item, index) => <LabValueItem key={index} item={item} />)}
          </div>
        )}
    </div>
  );
};

export default NormalValuesSection;
