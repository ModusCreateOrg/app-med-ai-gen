import { IonButton } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import './NoReportsMessage.scss';
import Icon from 'common/components/Icon/Icon';

interface NoReportsMessageProps {
  onUpload?: () => void;
  onRetry?: () => void;
}

/**
 * Component to display when no reports are available.
 */
const NoReportsMessage: React.FC<NoReportsMessageProps> = ({ onUpload, onRetry }) => {
  const { t } = useTranslation('home');

  return (
    <div className="no-reports">
      <div className="no-reports__icon-container">
        <Icon icon="fileLines" iconStyle="regular" className="no-reports__icon" size="4x" />
      </div>
      
      <h2 className="no-reports__title">{t('reports.noReports.title')}</h2>
      <p className="no-reports__message">{t('reports.noReports.message')}</p>
      
      <div className="no-reports__actions">
        <IonButton 
          expand="block" 
          onClick={onUpload}
          className="no-reports__button"
        >
          {t('reports.noReports.uploadButton')}
        </IonButton>
        
        {onRetry && (
          <IonButton 
            expand="block" 
            fill="outline" 
            onClick={onRetry}
            className="no-reports__button no-reports__button--secondary"
          >
            {t('common:label.tryAgain')}
          </IonButton>
        )}
      </div>
    </div>
  );
};

export default NoReportsMessage; 