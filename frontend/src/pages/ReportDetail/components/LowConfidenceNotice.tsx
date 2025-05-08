import { FC } from 'react';
import { useTranslation } from 'react-i18next';
import info from '../../../assets/icons/info.svg';

/**
 * Component to display a notice when the confidence level is low
 */
const LowConfidenceNotice: FC = () => {
  const { t } = useTranslation();

  return (
    <div className="low-confidence-notice">
      <div className="notice-icon">
        <img src={info} alt="Information Icon" />
      </div>
      <div className="notice-text">
        {t('reports.lowConfidence.message', {
          defaultValue:
            'Please note that this diagnosis is uncertain due to an incomplete report. For a more accurate interpretation, we recommend uploading another report for processing.',
        })}
      </div>
    </div>
  );
};

export default LowConfidenceNotice;
