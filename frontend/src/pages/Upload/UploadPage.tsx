import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import UploadModal from 'common/components/Upload/UploadModal';

/**
 * The `UploadPage` component allows users to upload medical documents.
 * @returns JSX
 */
const UploadPage = (): JSX.Element => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(true);
  const history = useHistory();

  const handleUploadComplete = () => {
    // Close the modal
    setIsModalOpen(false);

    // Navigate to home page to see the newly uploaded report
    history.push('/tabs/home');
  };

  useEffect(() => {
    // Automatically open the upload modal when the component mounts
    setIsModalOpen(true);

    // Cleanup function to close the modal when the component unmounts
    return () => {
      setIsModalOpen(false);
    };
  }, []);

  return (
    <IonPage>
      <IonHeader>
        <IonToolbar>
          <IonTitle>{t('pages.upload.title')}</IonTitle>
        </IonToolbar>
      </IonHeader>
      <IonContent>
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
