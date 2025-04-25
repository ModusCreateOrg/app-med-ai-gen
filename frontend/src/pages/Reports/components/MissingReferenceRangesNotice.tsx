import React from 'react';
import { useTranslation } from 'react-i18next';
import info from '../../../assets/icons/info.svg';

/**
 * Component to display a notice when reference ranges are missing from the report
 */
const MissingReferenceRangesNotice: React.FC = () => {
  const { t } = useTranslation();

  return (
    <div className="low-confidence-notice">
      <div className="notice-icon">
        <img src={info} alt="Information Icon" />
      </div>
      <div className="notice-text">
        {t('reports.missingReferenceRanges', {
          ns: 'reportDetail',
          defaultValue:
            'Reference ranges were not available on this report. The analysis may be limited without this information. Please consult with your healthcare provider for a complete interpretation.',
        })}
      </div>
    </div>
  );
};

export default MissingReferenceRangesNotice; 