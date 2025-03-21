import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import { useHistory } from 'react-router-dom';
import UploadModal from 'common/components/Upload/UploadModal';

/**
 * The `UploadPage` component allows users to upload medical documents.
 * @returns JSX
 */
const UploadPage = (): JSX.Element => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const history = useHistory();

  const handleUploadComplete = () => {
    // Close the modal
    setIsModalOpen(false);
    
    // Navigate to home page to see the newly uploaded report
    history.push('/tabs/home');
  };

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
          
          <IonButton
            expand="block"
            className="ion-margin-top"
            onClick={() => setIsModalOpen(true)}
          >
            {t('upload.selectFile')}
          </IonButton>
        </div>

        <UploadModal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          onUploadComplete={handleUploadComplete}
        />
      </IonContent>
    </IonPage>
  );
};

export default UploadPage; 