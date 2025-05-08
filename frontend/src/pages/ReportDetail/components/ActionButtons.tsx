import { FC, useState } from 'react';
import { useTranslation } from 'react-i18next';
import ConfirmationModal from '../../../common/components/Modal/ConfirmationModal';
import { useToasts } from 'common/hooks/useToasts';
import { useQueryClient } from '@tanstack/react-query';
import { useHistory } from 'react-router';
import axios from 'axios';
import { QueryKey } from 'common/utils/constants';
import { getAuthConfig } from 'common/api/reportService';

const API_URL = import.meta.env.VITE_BASE_URL_API || '';

interface ActionButtonsProps {
  reportId: string;
  reportTitle: string;
  setIsUploadModalOpen: (isOpen: boolean) => void;
}

const ActionButtons: FC<ActionButtonsProps> = ({ reportId, reportTitle, setIsUploadModalOpen }) => {
  const { t } = useTranslation(['reportDetail', 'common']);
  const { createToast } = useToasts();
  const history = useHistory();
  const queryClient = useQueryClient();
  const [showConfirmDiscard, setShowConfirmDiscard] = useState(false);
  const [showConfirmNewUpload, setShowConfirmNewUpload] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDiscardClick = () => {
    setShowConfirmDiscard(true);
  };

  const handleConfirmDiscard = async () => {
    setShowConfirmDiscard(false);

    await handleDiscard();
  };

  const handleCancelDiscard = () => {
    setShowConfirmDiscard(false);
  };

  const handleNewUploadClick = () => {
    setShowConfirmNewUpload(true);
  };

  const handleConfirmNewUpload = async () => {
    setShowConfirmNewUpload(false);

    await handleNewUpload();
  };

  const handleCancelNewUpload = () => {
    setShowConfirmNewUpload(false);
  };

  // Handle action buttons
  const handleDiscard = async () => {
    try {
      setIsProcessing(true);
      await axios.delete(`${API_URL}/api/reports/${reportId}`, await getAuthConfig());
      setIsProcessing(false);

      // Show toast notification
      createToast({
        message: t('report.discard.success', {
          ns: 'reportDetail',
          defaultValue: 'Report deleted successfully',
        }),
        duration: 2000,
      });

      await queryClient.invalidateQueries({ queryKey: [QueryKey.Reports] });
      await queryClient.invalidateQueries({ queryKey: [QueryKey.LatestReports] });
      await queryClient.invalidateQueries({ queryKey: [QueryKey.ReportDetail, reportId] });

      // Navigate back
      history.push('/tabs/home');
    } catch (error) {
      setIsProcessing(false);

      console.error('Error discarding report:', error);
      createToast({
        message: t('report.discard.error', {
          ns: 'reportDetail',
          defaultValue: 'Failed to delete report',
        }),
        duration: 2000,
        color: 'danger',
      });
    }
  };

  const handleNewUpload = async () => {
    try {
      setIsProcessing(true);
      await axios.delete(`${API_URL}/api/reports/${reportId}`, await getAuthConfig());
      setIsProcessing(false);

      await queryClient.invalidateQueries({ queryKey: [QueryKey.Reports] });
      await queryClient.invalidateQueries({ queryKey: [QueryKey.LatestReports] });
      await queryClient.invalidateQueries({ queryKey: [QueryKey.ReportDetail, reportId] });

      setIsUploadModalOpen(true);
    } catch (error) {
      setIsProcessing(false);
      console.error('Error deleting report before new upload:', error);
    }
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
