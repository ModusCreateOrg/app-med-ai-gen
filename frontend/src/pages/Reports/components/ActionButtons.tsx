import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from '../../../common/components/Modal/ConfirmationModal';

interface ActionButtonsProps {
  onDiscard: () => void;
  onNewUpload: () => void;
  reportTitle?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onDiscard, onNewUpload, reportTitle = "" }) => {
  const { t } = useTranslation();
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);

  const handleDiscardClick = () => {
    setShowConfirmDiscard(true);
  };

  const handleConfirmDiscard = () => {
    setShowConfirmDiscard(false);
    onDiscard();
  };

  const handleCancelDiscard = () => {
    setShowConfirmDiscard(false);
  };

  return (
    <>
      <div className="report-detail-page__actions">
        <button
          className="report-detail-page__action-button report-detail-page__action-button--discard"
          onClick={handleDiscardClick}
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

      <ConfirmationModal 
        isOpen={showConfirmDiscard}
        title={t('report.discard.title', { ns: 'reportDetail', defaultValue: 'Discard report?' })}
        message={t('report.discard.message', { 
          ns: 'reportDetail', 
          defaultValue: '{itemName} will be discarded and not be saved to your reports archive. Are you sure?' 
        })}
        confirmText={t('common:yes')}
        cancelText={t('common:no')}
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
        itemName={reportTitle}
        testid="discard-report-confirmation"
      />
    </>
  );
};

export default ActionButtons;
