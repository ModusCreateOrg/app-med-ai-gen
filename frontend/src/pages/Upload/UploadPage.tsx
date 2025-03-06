import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useTranslation } from 'react-i18next';

/**
 * The `UploadPage` component allows users to upload medical documents.
 * @returns JSX
 */
const UploadPage = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.upload.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="ion-padding">
          <h1>{t('pages.upload.subtitle')}</h1>
          <p>{t('pages.upload.description')}</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default UploadPage; 