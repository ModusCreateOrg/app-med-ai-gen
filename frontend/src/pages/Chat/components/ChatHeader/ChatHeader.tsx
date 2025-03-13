import React, { useState } from 'react';
import { IonHeader, IonIcon, IonToolbar, IonAlert } from '@ionic/react';
import { close, expandOutline, contractOutline, trashOutline } from 'ionicons/icons';
import { useChatContext } from '../../hooks/useChatContext';
import './ChatHeader.scss';

interface ChatHeaderProps {
  isExpanded: boolean;
  onClose: () => void;
  onToggleExpand: () => void;
}

/**
 * ChatHeader component displays the title, clear chat button, expand toggle, and close button
 */
const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  isExpanded, 
  onClose, 
  onToggleExpand 
}) => {
  const { clearMessages } = useChatContext();
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  
  const handleClearClick = () => {
    setShowClearConfirm(true);
  };
  
  const handleClearConfirm = () => {
    clearMessages();
    setShowClearConfirm(false);
  };
  
  return (
    <IonHeader className="chat-header">
      <IonToolbar className="chat-header__toolbar">
        <div className="chat-header__title">
          AI Assistant
        </div>
        <div className="chat-header__actions">
          <button 
            className="chat-header__button chat-header__button--clear" 
            onClick={handleClearClick}
            aria-label="Clear chat"
          >
            <IonIcon 
              icon={trashOutline} 
              className="chat-header__icon"
            />
          </button>
          <button 
            className="chat-header__button chat-header__button--expand" 
            onClick={onToggleExpand}
            aria-label={isExpanded ? "Collapse" : "Expand"}
          >
            <IonIcon 
              icon={isExpanded ? contractOutline : expandOutline} 
              className="chat-header__icon"
            />
          </button>
          <button 
            className="chat-header__button chat-header__button--close" 
            onClick={onClose}
            aria-label="Close"
          >
            <IonIcon 
              icon={close} 
              className="chat-header__icon"
            />
          </button>
        </div>
      </IonToolbar>
      
      <IonAlert
        isOpen={showClearConfirm}
        onDidDismiss={() => setShowClearConfirm(false)}
        header="Clear Chat History"
        message="Are you sure you want to clear all messages? This action cannot be undone."
        buttons={[
          {
            text: 'Cancel',
            role: 'cancel',
          },
          {
            text: 'Clear',
            role: 'destructive',
            handler: handleClearConfirm
          }
        ]}
      />
    </IonHeader>
  );
};

export default ChatHeader; 