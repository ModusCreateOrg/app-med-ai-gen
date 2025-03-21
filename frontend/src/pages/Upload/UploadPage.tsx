import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar, IonButton } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useState } from 'react';
import UploadModal from 'common/components/Upload/UploadModal';

/**
 * The `UploadPage` component allows users to upload medical documents.
 * @returns JSX
 */
const UploadPage = (): JSX.Element => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleUpload = async (file: File): Promise<void> => {
    // This would be replaced with actual API call
    console.log('File upload requested from page:', file.name);
    
    // Simulate upload delay
    await new Promise(resolve => setTimeout(resolve, 2000));
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
          onUpload={handleUpload}
        />
      </IonContent>
    </IonPage>
  );
};

export default UploadPage; 