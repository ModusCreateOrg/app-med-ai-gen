import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useAIChat } from 'common/providers/AIChatProvider';
import { useEffect } from 'react';

/**
 * The `ChatPage` component displays the chat interface.
 * This page can be accessed from the tab navigation and serves as the full
 * page version of the AI chat functionality.
 * @returns JSX
 */
const ChatPage = (): JSX.Element => {
  const { t } = useTranslation();
  const { openChat } = useAIChat();

  // Automatically open the chat when navigating to this page
  useEffect(() => {
    openChat();
  }, [openChat]);

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
          
          <IonButton 
            expand="block" 
            onClick={openChat}
          >
            {t('pages.chat.openButton')}
          </IonButton>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default ChatPage; 