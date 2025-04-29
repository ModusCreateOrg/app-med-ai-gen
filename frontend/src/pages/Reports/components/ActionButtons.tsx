import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import axios from 'axios';
import { getAuthConfig } from 'common/api/reportService';
import ConfirmationModal from '../../../common/components/Modal/ConfirmationModal';

const API_URL = import.meta.env.VITE_BASE_URL_API || '';

interface ActionButtonsProps {
  onDiscard: () => void;
  onNewUpload: () => void;
  reportTitle?: string;
  reportId?: string;
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onDiscard,
  onNewUpload,
  reportTitle = '',
  reportId,
}) => {
  const { t } = useTranslation();
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const [showConfirmNewUpload, setShowConfirmNewUpload] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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

  const handleNewUploadClick = () => {
    setShowConfirmNewUpload(true);
  };

  const handleConfirmNewUpload = async () => {
    setShowConfirmNewUpload(false);

    // If we have a reportId, delete the current report before going to upload screen
    if (reportId) {
      try {
        setIsDeleting(true);
        await axios.delete(`${API_URL}/api/reports/${reportId}`, await getAuthConfig());
      } catch (error) {
        console.error('Error deleting report before new upload:', error);
      } finally {
        setIsDeleting(false);
        // Even if delete failed, still go to upload screen
        onNewUpload();
      }
    } else {
      // If no reportId, just navigate to upload
      onNewUpload();
    }
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
          disabled={isDeleting}
        >
          {t('report.action.discard', { ns: 'reportDetail' })}
        </button>
        <button
          className="report-detail-page__action-button report-detail-page__action-button--upload"
          onClick={handleNewUploadClick}
          disabled={isDeleting}
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
