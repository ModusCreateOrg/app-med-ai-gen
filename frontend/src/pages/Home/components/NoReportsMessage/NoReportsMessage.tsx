import { IonButton, IonIcon } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import './NoReportsMessage.scss';

interface NoReportsMessageProps {
  onUpload?: () => void;
  onConnect?: () => void;
}

/**
 * Component to display when no reports are available.
 */
const NoReportsMessage: React.FC<NoReportsMessageProps> = ({ onUpload, onConnect }) => {
  const { t } = useTranslation();

  return (
    <div className="no-reports">
      <div className="no-reports__icon">
        <IonIcon icon="document-text" />
      </div>
      
      <h2 className="no-reports__title">{t('reports.noReports.title')}</h2>
      <p className="no-reports__message">{t('reports.noReports.message')}</p>
      
      <div className="no-reports__actions">
        <IonButton 
          expand="block" 
          onClick={onUpload}
          className="no-reports__button"
        >
          <IonIcon slot="start" icon="cloud-upload" />
          {t('reports.noReports.uploadButton')}
        </IonButton>
        
        <IonButton 
          expand="block" 
          fill="outline" 
          onClick={onConnect}
          className="no-reports__button"
        >
          <IonIcon slot="start" icon="link" />
          {t('reports.noReports.connectButton')}
        </IonButton>
      </div>
    </div>
  );
};

export default NoReportsMessage; 