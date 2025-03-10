import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useTranslation } from 'react-i18next';

/**
 * The `ChatPage` component displays the chat interface.
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
      </IonContent>
    </IonPage>
  );
};

export default ChatPage; 