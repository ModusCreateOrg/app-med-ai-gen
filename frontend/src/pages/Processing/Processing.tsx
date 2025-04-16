import { IonContent, IonPage } from '@ionic/react';
import { useCurrentUser } from '../../common/hooks/useAuth';
import Avatar from '../../common/components/Icon/Avatar';
import './Processing.scss';

/**
 * Processing page that shows while the system analyzes uploaded documents
 * This page automatically displays after a successful upload
 */
const Processing: React.FC = () => {
  const currentUser = useCurrentUser();
  const firstName = currentUser?.firstName || currentUser?.name?.split(' ')[0] || 'Wesley';

  return (
    <IonPage className="processing-page">
      <IonContent fullscreen>
        <div className="processing-page__container">
          {/* Header with avatar */}
          <div className="processing-page__header">
            <div className="processing-page__avatar-wrapper">
              <Avatar 
                value={currentUser?.name || currentUser?.email || ''}
                size="large"
                shape="round"
                testid="processing-user-avatar"
              />
            </div>
            
            {/* Title section */}
            <div className="processing-page__title">
              <p className="processing-page__subtitle">
                Just a few seconds, {firstName}!
              </p>
              <h1 className="processing-page__heading">Processing Data...</h1>
            </div>
          </div>
          
          {/* Animation circle */}
          <div className="processing-page__animation">
            <div className="processing-page__animation-circle"></div>
          </div>
          
          {/* We don't need to include the tab bar here since it's global */}
        </div>
      </IonContent>
    </IonPage>
  );
};

export default Processing;