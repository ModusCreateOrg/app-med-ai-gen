import { IonItem, IonLabel } from '@ionic/react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { MedicalReport, ReportStatus } from 'common/models/medicalReport';
import Icon from 'common/components/Icon/Icon';
import './ReportItem.scss';

interface ReportItemProps {
  report: MedicalReport;
  onClick?: () => void;
}

/**
 * Component to display a single medical report item.
 */
const ReportItem: React.FC<ReportItemProps> = ({ report, onClick }) => {
  const { t } = useTranslation();
  const { title, category, date, status } = report;
  const isUnread = status === ReportStatus.UNREAD;
  
  // Format the date from ISO string to MM/DD/YYYY
  const formattedDate = format(new Date(date), 'MM/dd/yyyy');
  
  // Get the appropriate icon based on report category
  const getCategoryIcon = () => {
    switch (category) {
      case 'General':
        return <div className="report-item__icon report-item__icon--general"><Icon icon="user" iconStyle="regular" /></div>;
      case 'Neurological':
        return <div className="report-item__icon report-item__icon--neurological"><Icon icon="circleInfo" /></div>;
      case 'Oftalmological':
        return <div className="report-item__icon report-item__icon--oftalmological"><Icon icon="circleInfo" /></div>;
      case 'Heart':
        return <div className="report-item__icon report-item__icon--heart"><Icon icon="circleInfo" /></div>;
      case 'Gastroenterology':
        return <div className="report-item__icon report-item__icon--gastro"><Icon icon="circleInfo" /></div>;
      case 'Orthopedic':
        return <div className="report-item__icon report-item__icon--orthopedic"><Icon icon="circleInfo" /></div>;
      default:
        return <div className="report-item__icon report-item__icon--other"><Icon icon="fileLines" iconStyle="regular" /></div>;
    }
  };

  return (
    <IonItem 
      className={`report-item ${isUnread ? 'report-item--unread' : ''}`}
      onClick={onClick}
      lines="full"
    >
      {getCategoryIcon()}
      
      <IonLabel>
        <div className="report-item__category">{category}</div>
        <div className="report-item__title">{title}</div>
        <div className="report-item__date">
        {t('reports.uploadDate')} • {formattedDate}
        </div>
      </IonLabel>
      
      <div className="report-item__bookmark">
        {isUnread ? 
          <Icon icon="bookmark" /> :
          <Icon icon="bookmark" className="report-item__bookmark--inactive" />
        }
      </div>
    </IonItem>
  );
};

export default ReportItem; 