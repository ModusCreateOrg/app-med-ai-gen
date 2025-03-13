import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import AIChatContainer from './components/AIChatContainer/AIChatContainer';

/**
 * The `ChatPage` component displays the chat interface.
 * This page can be accessed from the tab navigation and serves as the full
 * page version of the AI chat functionality.
 * @returns JSX
 */
const ChatPage = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.chat.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="ion-padding">
          <h1>{t('pages.chat.subtitle')}</h1>
          <p>{t('pages.chat.description')}</p>
        </div>
        
        {/* 
          We're using the same AIChatContainer component here
          This demonstrates how we can reuse the component across different views
        */}
        <AIChatContainer />
      </IonContent>
    </IonPage>
  );
};

export default ChatPage; 