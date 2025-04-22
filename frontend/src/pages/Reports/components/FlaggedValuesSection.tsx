import React from 'react';
import { useTranslation } from 'react-i18next';
import Icon from '../../../common/components/Icon/Icon';
import { LabValue } from '../../../common/models/medicalReport';
import LabValueItem from './LabValueItem';
import flaggedValuesIcon from '../../../assets/icons/flagged-values.svg';

interface FlaggedValuesSectionProps {
  flaggedValues: LabValue[];
  isExpanded: boolean;
  onToggle: () => void;
}

const FlaggedValuesSection: React.FC<FlaggedValuesSectionProps> = ({
  flaggedValues,
  isExpanded,
  onToggle,
}) => {
  const { t } = useTranslation();

  return (
    <div className="report-detail-page__section">
      <div className="report-detail-page__section-header" onClick={onToggle}>
        <div className="report-detail-page__section-icon">
          <img src={flaggedValuesIcon} alt="Flagged" />
        </div>
        <h3 className="report-detail-page__section-title">
          {t('report.flagged-values.title', { ns: 'reportDetail' })}
        </h3>
        <div className="report-detail-page__section-toggle">
          <Icon icon={isExpanded ? 'chevronUp' : 'chevronDown'} size="sm" />
        </div>
      </div>

      {isExpanded && flaggedValues.map((item, index) => <LabValueItem key={index} item={item} />)}
    </div>
  );
};

export default FlaggedValuesSection;
