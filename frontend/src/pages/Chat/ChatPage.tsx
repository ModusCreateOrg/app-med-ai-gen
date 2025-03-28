import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from 'react';
import ChatContainer from '../../common/components/Chat/ChatContainer';
import ChatInput from '../../common/components/Chat/ChatInput';
import { chatService } from '../../common/services/ChatService';
import { ChatMessageData } from '../../common/components/Chat/ChatMessage';
import aiIcon from '../../assets/img/ai-icon.svg';
import { faRobot } from '@fortawesome/free-solid-svg-icons';
import './ChatPage.scss';

/**
 * The `ChatPage` component displays the chat interface.
 * @returns JSX
 */
const ChatPage = (): JSX.Element => {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessageData[]>([]);

  // Reset chat session when component unmounts
  useEffect(() => {
    // Create a new session when the component mounts
    chatService.resetSession();
    
    // Reset the chat session when the component unmounts
    return () => {
      chatService.resetSession();
      // We don't need to clear messages array since the component is unmounting
    };
  }, []);

  const handleSendMessage = async (text: string) => {
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
    <IonPage>
      <IonHeader>
        <IonToolbar className="chat-page-toolbar">
          <IonTitle className="chat-page-title">
            <div className="title-container">
              <img src={aiIcon} alt="AI Assistant Icon" className="ai-assistant-title-icon" />
              <span>{t('pages.chat.title', 'AI Assistant')}</span>
            </div>
          </IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent className="chat-page-content">
        <ChatContainer
          messages={messages}
          robotIcon={faRobot}
          testid="chat-page-container"
          className="chat-page-container"
        />
      </IonContent>

      <div className="chat-page-footer">
        <ChatInput
          onSendMessage={handleSendMessage}
          testid="chat-page-input"
          className="chat-page-input"
        />
      </div>
    </IonPage>
  );
};

export default ChatPage; 