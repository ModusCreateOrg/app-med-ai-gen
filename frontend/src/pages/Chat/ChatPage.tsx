import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useState, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import { useHistory } from 'react-router';
import closeIcon from 'assets/icons/close.svg';
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
  const { t } = useTranslation(['common', 'errors']);
  const [messages, setMessages] = useState<ChatMessageData[]>([]);
  const location = useLocation();
  const prevPathRef = useRef(location.pathname);
  const history = useHistory();

  const resetChatState = () => {
    setMessages([]);
  };

  // Handle close button
  const handleClose = () => {
    history.push('/tabs/home');
  };

  // Handle initial setup and cleanup
  useEffect(() => {
    // Create a new session when the component mounts using an IIFE
    (async () => {
      await chatService.resetSession();
      resetChatState();
    })();

    // Reset the chat session when the component unmounts
    return () => {
      // We need to call this synchronously in the cleanup function
      // but we can at least trigger the reset process
      chatService.resetSession();
      resetChatState();
    };
  }, []);

  // Listen for route changes to reset chat when navigating away
  useEffect(() => {
    // If we came back to this page from another route, reset the chat
    if (prevPathRef.current !== location.pathname && location.pathname === '/tabs/chat') {
      // We're returning to the chat page
      (async () => {
        await chatService.resetSession();
        resetChatState();
      })();
    }

    // If we're navigating away, reset chat state
    if (prevPathRef.current === '/tabs/chat' && location.pathname !== '/tabs/chat') {
      chatService.resetSession();
      resetChatState();
    }

    // Update ref for next comparison
    prevPathRef.current = location.pathname;
  }, [location.pathname]);

  const handleSendMessage = async (text: string) => {
    const userMessage = chatService.createUserMessage(text);
    setMessages((prevMessages) => [...prevMessages, userMessage]);

    try {
      // Get AI response
      const responseText = await chatService.sendMessage(text);
      const assistantMessage = chatService.createAssistantMessage(responseText);
      setMessages((prevMessages) => [...prevMessages, assistantMessage]);
    } catch (error) {
      console.error('Error getting AI response:', error);

      // Use i18n directly with the full namespace and key
      const errorMessage = t('chat.general', { ns: 'errors' });

      const assistantErrorMessage = chatService.createAssistantMessage(errorMessage);
      setMessages((prevMessages) => [...prevMessages, assistantErrorMessage]);
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
          <div slot="end">
            <button
              onClick={handleClose}
              style={{ backgroundColor: 'transparent', marginRight: '2em' }}
            >
              <img src={closeIcon} alt="Close" />
            </button>
          </div>
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
