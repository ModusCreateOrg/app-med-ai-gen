import React from 'react';
import { IonButton } from '@ionic/react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

/**
 * Component displayed when the uploaded document is not a medical report
 */
const ProcessingMedicalReport: React.FC = () => {
  const history = useHistory();
  const { t } = useTranslation();

  return (
    <div className="processing-error">
      <h2>{t('error.not_medical_report', { ns: 'processing' })}</h2>
      <p>{t('error.not_medical_report_message', { ns: 'processing' })}</p>
      <IonButton onClick={() => history.push('/tabs/upload')} className="retry-button">
        {t('button.try_another', { ns: 'common' })}
      </IonButton>
    </div>
  );
};

export default ProcessingMedicalReport;
