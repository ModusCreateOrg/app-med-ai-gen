import React from 'react';
import { IonButton, IonModal } from '@ionic/react';
import './ConfirmationModal.scss';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmText: string;
  cancelText: string;
  onConfirm: () => void;
  onCancel: () => void;
  itemName?: string;
  testid?: string;
}

/**
 * A reusable confirmation modal component that presents as a bottom sheet
 * Used for confirming destructive actions like deleting or discarding items
 */
const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmText,
  cancelText,
  onConfirm,
  onCancel,
  itemName,
  testid = 'confirmation-modal',
}) => {
  // Replace placeholder with actual item name if provided
  const formattedMessage = itemName ? message.replace('{itemName}', `"${itemName}"`) : message;

  return (
    <IonModal
      isOpen={isOpen}
      onDidDismiss={onCancel}
      className="confirmation-modal"
      data-testid={testid}
    >
      <div className="confirmation-modal__container">
        <h2 className="confirmation-modal__title">{title}</h2>

        <p className="confirmation-modal__message">{formattedMessage}</p>

        <div className="confirmation-modal__actions">
          <IonButton
            expand="block"
            fill="outline"
            className="confirmation-modal__button confirmation-modal__button--cancel"
            onClick={onCancel}
            data-testid={`${testid}-cancel`}
          >
            {cancelText}
          </IonButton>

          <IonButton
            expand="block"
            fill="outline"
            className="confirmation-modal__button confirmation-modal__button--confirm"
            onClick={onConfirm}
            data-testid={`${testid}-confirm`}
          >
            {confirmText}
          </IonButton>
        </div>
      </div>
    </IonModal>
  );
};

export default ConfirmationModal;
