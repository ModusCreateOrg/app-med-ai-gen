import React from 'react';
import { useTranslation } from 'react-i18next';

interface ActionButtonsProps {
  onDiscard: () => void;
  onNewUpload: () => void;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onDiscard, onNewUpload }) => {
  const { t } = useTranslation();

  return (
    <div className="report-detail-page__actions">
      <button
        className="report-detail-page__action-button report-detail-page__action-button--discard"
        onClick={onDiscard}
      >
        {t('report.action.discard', { ns: 'reportDetail' })}
      </button>
      <button
        className="report-detail-page__action-button report-detail-page__action-button--upload"
        onClick={onNewUpload}
      >
        {t('report.action.new-upload', { ns: 'reportDetail' })}
      </button>
    </div>
  );
};

export default ActionButtons;
