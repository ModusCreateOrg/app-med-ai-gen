import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../common/components/Icon/Icon';
import { LabValue } from '../../../common/models/medicalReport';
import LabValueItem from './LabValueItem';

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
    <div className="report-detail-page__section">
      <div className="report-detail-page__section-header" onClick={onToggle}>
        <div
          className="report-detail-page__section-icon"
          style={{ borderRadius: '50%', backgroundColor: '#f0f0f0' }}
        >
          <Icon icon="vial" size="sm" />
        </div>
        <h3 className="report-detail-page__section-title">
          {t('report.normal-values.title', { ns: 'reportDetail' })}
        </h3>
        <div className="report-detail-page__section-toggle">
          <Icon icon={isExpanded ? 'chevronUp' : 'chevronDown'} size="sm" />
        </div>
      </div>

      {isExpanded && normalValues.map((item, index) => <LabValueItem key={index} item={item} />)}
    </div>
  );
};

export default NormalValuesSection;
