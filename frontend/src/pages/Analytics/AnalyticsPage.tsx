import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useTranslation } from 'react-i18next';

/**
 * The `AnalyticsPage` component displays analytics data.
 * @returns JSX
 */
const AnalyticsPage = (): JSX.Element => {
  const { t } = useTranslation();

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.analytics.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
        <div className="ion-padding">
          <h1>{t('pages.analytics.subtitle')}</h1>
          <p>{t('pages.analytics.description')}</p>
        </div>
      </IonContent>
    </IonPage>
  );
};

export default AnalyticsPage;
