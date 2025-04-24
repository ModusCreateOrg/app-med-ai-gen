import { IonContent, IonHeader, IonPage, IonTitle, IonToolbar } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { useEffect, useState } from 'react';
import { useHistory, useLocation } from 'react-router-dom';
import UploadModal from 'common/components/Upload/UploadModal';

/**
 * The `UploadPage` component allows users to upload medical documents.
 * @returns JSX
 */
const UploadPage = (): JSX.Element => {
  const { t } = useTranslation();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const history = useHistory();
  const location = useLocation();

  const handleUploadComplete = () => setIsModalOpen(false);

  const handleCloseComplete = () => {
    setIsModalOpen(false);
    history.push('/tabs/home');
  };

  useEffect(() => {
    setIsModalOpen(true);

    // Cleanup function to close the modal when the component unmounts
    return () => {
      setIsModalOpen(false);
    };
  }, [location.pathname]);

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
          onClose={handleCloseComplete}
          onUploadComplete={handleUploadComplete}
        />
      </IonContent>
    </IonPage>
  );
};

export default UploadPage;
