import React, { useState } from 'react';
import { 
  IonModal, 
  IonHeader, 
  IonToolbar, 
  IonTitle, 
  IonContent, 
  IonButtons, 
  IonButton,
  IonItem,
  IonLabel,
  IonInput,
  IonIcon,
  IonToast
} from '@ionic/react';
import { closeOutline, copy, mailOutline } from 'ionicons/icons';
import './ShareModal.scss';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  messageText: string;
}

/**
 * ShareModal component allows users to share chat responses via different methods
 */
const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose, messageText }) => {
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  
  // Create shareable link (this is a mock implementation)
  const shareableLink = `https://medai.app/share/${btoa(messageText.substring(0, 50))}`;
  
  const handleCopyLink = () => {
    navigator.clipboard.writeText(shareableLink).then(() => {
      setToastMessage('Link copied to clipboard');
      setShowToast(true);
    });
  };
  
  const handleCopyText = () => {
    navigator.clipboard.writeText(messageText).then(() => {
      setToastMessage('Text copied to clipboard');
      setShowToast(true);
    });
  };
  
  const handleEmailShare = () => {
    const subject = encodeURIComponent('MedAI Chat Response');
    const body = encodeURIComponent(`Here's a helpful medical AI response:\n\n${messageText}\n\nShared from MedAI App`);
    window.open(`mailto:?subject=${subject}&body=${body}`);
  };
  
  return (
    <>
      <IonModal isOpen={isOpen} onDidDismiss={onClose} className="share-modal">
        <IonHeader>
          <IonToolbar>
            <IonTitle>Share Response</IonTitle>
            <IonButtons slot="end">
              <IonButton onClick={onClose}>
                <IonIcon icon={closeOutline} />
              </IonButton>
            </IonButtons>
          </IonToolbar>
        </IonHeader>
        
        <IonContent className="share-modal__content">
          <div className="share-modal__message">
            <h3>Share this AI response</h3>
            <p className="share-modal__preview">{messageText.substring(0, 150)}...</p>
          </div>
          
          <div className="share-modal__actions">
            <IonItem button detail={false} onClick={handleCopyLink} className="share-modal__action-item">
              <IonIcon icon={copy} slot="start" className="share-modal__action-icon" />
              <IonLabel>Copy Link</IonLabel>
            </IonItem>
            
            <IonItem button detail={false} onClick={handleCopyText} className="share-modal__action-item">
              <IonIcon icon={copy} slot="start" className="share-modal__action-icon" />
              <IonLabel>Copy Full Text</IonLabel>
            </IonItem>
            
            <IonItem button detail={false} onClick={handleEmailShare} className="share-modal__action-item">
              <IonIcon icon={mailOutline} slot="start" className="share-modal__action-icon" />
              <IonLabel>Share via Email</IonLabel>
            </IonItem>
          </div>
          
          <div className="share-modal__link-section">
            <IonItem className="share-modal__link-input">
              <IonInput value={shareableLink} readonly />
              <IonButton slot="end" fill="clear" onClick={handleCopyLink}>
                <IonIcon icon={copy} />
              </IonButton>
            </IonItem>
          </div>
        </IonContent>
      </IonModal>
      
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message={toastMessage}
        duration={2000}
        position="bottom"
      />
    </>
  );
};

export default ShareModal; 