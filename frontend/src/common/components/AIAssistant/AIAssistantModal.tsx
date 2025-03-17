import {
  IonButton,
  IonButtons,
  IonContent,
  IonHeader,
  IonIcon,
  IonModal,
  IonToolbar,
  IonFooter,
} from '@ionic/react';
import { useState, useRef } from 'react';
import { closeOutline, expandOutline, contractOutline } from 'ionicons/icons';
import iconOnly from '../../../assets/img/icon-only.png';
import ChatContainer from '../Chat/ChatContainer';
import ChatInput from '../Chat/ChatInput';
import { chatService } from '../../services/ChatService';
import { ChatMessageData } from '../Chat/ChatMessage';
import './AIAssistantModal.scss';

interface AIAssistantModalProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  testid?: string;
}

const AIAssistantModal: React.FC<AIAssistantModalProps> = ({ 
  isOpen, 
  setIsOpen,
  testid = 'ai-assistant-modal'
}) => {
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const modalRef = useRef<HTMLIonModalElement>(null);

  const handleClose = () => {
    setIsOpen(false);
    setIsExpanded(false);
  };

  const handleExpand = () => {
    setIsExpanded(!isExpanded);
  };

  const handleSendMessage = async (text: string) => {
    // If this is the first message, expand the modal automatically
    if (messages.length === 0 && !isExpanded) {
      setIsExpanded(true);
    }
    
    const userMessage = chatService.createUserMessage(text);
    setMessages(prevMessages => [...prevMessages, userMessage]);

    try {
      // Get AI response
      const responseText = await chatService.sendMessage(text);
      const assistantMessage = chatService.createAssistantMessage(responseText);
      setMessages(prevMessages => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);
      // You could add error handling here, like showing an error message
    }
  };

  return (
    <IonModal 
      isOpen={isOpen}
      onDidDismiss={() => setIsOpen(false)}
      ref={modalRef}
      className={`ai-assistant-modal ${isExpanded ? 'expanded' : ''}`}
      data-testid={testid}
      aria-labelledby="ai-assistant-title"
    >
      <IonHeader className="ai-assistant-header">
        <IonToolbar className="ai-assistant-toolbar">
          <div className="ai-assistant-title-container">
            <img src={iconOnly} alt="AI Assistant Icon" className="ai-assistant-title-icon" />
            <span className="ai-assistant-title-text">AI Assistant</span>
          </div>
          <IonButtons slot="end">
            <IonButton 
              onClick={handleExpand}
              aria-label={isExpanded ? "Collapse chat" : "Expand chat"}
              data-testid={`${testid}-expand-button`}
            >
              <IonIcon icon={isExpanded ? contractOutline : expandOutline} aria-hidden="true" />
            </IonButton>
            <IonButton 
              onClick={handleClose}
              aria-label="Close AI Assistant"
              data-testid={`${testid}-close-button`}
            >
              <IonIcon icon={closeOutline} aria-hidden="true" />
            </IonButton>
          </IonButtons>
        </IonToolbar>
      </IonHeader>
      
      <IonContent className="ai-assistant-content">
        <ChatContainer
          messages={messages}
          aiIconSrc={iconOnly}
          testid={`${testid}-chat-container`}
        />
      </IonContent>

      <IonFooter className="ai-assistant-footer">
        <ChatInput
          onSendMessage={handleSendMessage}
          testid={`${testid}-input`}
        />
      </IonFooter>
    </IonModal>
  );
};

export default AIAssistantModal; 