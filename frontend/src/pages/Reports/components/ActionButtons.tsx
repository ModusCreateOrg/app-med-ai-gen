import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from '../../../common/components/Modal/ConfirmationModal';

interface ActionButtonsProps {
  onDiscard: (setIsProcessing: (isProcessing: boolean) => void) => Promise<void>;
  onNewUpload: (setIsProcessing: (isProcessing: boolean) => void) => Promise<void>;
  reportTitle?: string;
  reportId?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({ onDiscard, onNewUpload, reportTitle }) => {
  const { t } = useTranslation();
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const [showConfirmNewUpload, setShowConfirmNewUpload] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDiscardClick = () => {
    setShowConfirmDiscard(true);
  };

  const handleConfirmDiscard = async () => {
    setShowConfirmDiscard(false);

    await onDiscard(setIsProcessing);
  };

  const handleCancelDiscard = () => {
    setShowConfirmDiscard(false);
  };

  const handleNewUploadClick = () => {
    setShowConfirmNewUpload(true);
  };

  const handleConfirmNewUpload = async () => {
    setShowConfirmNewUpload(false);

    await onNewUpload(setIsProcessing);
  };

  const handleCancelNewUpload = () => {
    setShowConfirmNewUpload(false);
  };

  return (
    <>
      <div className="report-detail-page__actions">
        <button
          className="report-detail-page__action-button report-detail-page__action-button--discard"
          onClick={handleDiscardClick}
          disabled={isProcessing}
        >
          {t('report.action.discard', { ns: 'reportDetail' })}
        </button>
        <button
          className="report-detail-page__action-button report-detail-page__action-button--upload"
          onClick={handleNewUploadClick}
          disabled={isProcessing}
        >
          {t('report.action.new-upload', { ns: 'reportDetail' })}
        </button>
      </div>

      <ConfirmationModal
        isOpen={showConfirmDiscard}
        title={t('report.discard.title', { ns: 'reportDetail', defaultValue: 'Discard report?' })}
        message={t('report.discard.message', {
          ns: 'reportDetail',
          defaultValue:
            '{itemName} will be discarded and not be saved to your reports archive. Are you sure?',
        })}
        confirmText={t('common:yes')}
        cancelText={t('common:no')}
        onConfirm={handleConfirmDiscard}
        onCancel={handleCancelDiscard}
        itemName={reportTitle}
        testid="discard-report-confirmation"
      />

      <ConfirmationModal
        isOpen={showConfirmNewUpload}
        title={t('report.new-upload.title', {
          ns: 'reportDetail',
          defaultValue: 'Upload new report?',
        })}
        message={t('report.new-upload.message', {
          ns: 'reportDetail',
          defaultValue:
            "You've chosen to upload a new report. This will replace your current one. Do you still want to proceed?",
        })}
        confirmText={t('common:yes')}
        cancelText={t('common:no')}
        onConfirm={handleConfirmNewUpload}
        onCancel={handleCancelNewUpload}
        testid="new-upload-confirmation"
      />
    </>
  );
};

export default ActionButtons;
