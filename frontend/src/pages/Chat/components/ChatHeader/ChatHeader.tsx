import React from 'react';
import { IonHeader, IonIcon, IonToolbar } from '@ionic/react';
import { close, expandOutline, contractOutline } from 'ionicons/icons';
import './ChatHeader.scss';

interface ChatHeaderProps {
  isExpanded: boolean;
  onClose: () => void;
  onToggleExpand: () => void;
}

/**
 * ChatHeader component displays the title, close button, and expand toggle
 */
const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  isExpanded, 
  onClose, 
  onToggleExpand 
}) => {
  return (
    <IonHeader className="chat-header">
      <IonToolbar className="chat-header__toolbar">
        <div className="chat-header__title">
          AI Assistant
        </div>
        <div className="chat-header__actions">
          <button 
            className="chat-header__button chat-header__button--expand" 
            onClick={onToggleExpand}
          >
            <IonIcon 
              icon={isExpanded ? contractOutline : expandOutline} 
              className="chat-header__icon"
            />
          </button>
          <button 
            className="chat-header__button chat-header__button--close" 
            onClick={onClose}
          >
            <IonIcon 
              icon={close} 
              className="chat-header__icon"
            />
          </button>
        </div>
      </IonToolbar>
    </IonHeader>
  );
};

export default ChatHeader; 