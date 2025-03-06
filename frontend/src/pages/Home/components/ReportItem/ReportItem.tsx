import { IonIcon, IonItem, IonLabel } from '@ionic/react';
import { format } from 'date-fns';
import { MedicalReport, ReportStatus } from 'common/models/medicalReport';
import './ReportItem.scss';

interface ReportItemProps {
  report: MedicalReport;
  onClick?: () => void;
}

/**
 * Component to display a single medical report item.
 */
const ReportItem: React.FC<ReportItemProps> = ({ report, onClick }) => {
  const { title, category, date, status } = report;
  const isUnread = status === ReportStatus.UNREAD;
  
  // Format the date from ISO string to DD/MM/YYYY
  const formattedDate = format(new Date(date), 'dd/MM/yyyy');
  
  // Get the appropriate icon based on report category
  const getCategoryIcon = () => {
    switch (category) {
      case 'General':
        return <div className="report-icon general"><IonIcon icon="person" /></div>;
      case 'Neurological':
        return <div className="report-icon neurological"><IonIcon icon="brain" /></div>;
      case 'Oftalmological':
        return <div className="report-icon oftalmological"><IonIcon icon="eye" /></div>;
      case 'Heart':
        return <div className="report-icon heart"><IonIcon icon="heart" /></div>;
      case 'Gastroenterology':
        return <div className="report-icon gastro"><IonIcon icon="medical" /></div>;
      case 'Orthopedic':
        return <div className="report-icon orthopedic"><IonIcon icon="body" /></div>;
      default:
        return <div className="report-icon other"><IonIcon icon="document" /></div>;
    }
  };

  return (
    <IonItem 
      className={`report-item ${isUnread ? 'report-item--unread' : ''}`}
      detail={true}
      onClick={onClick}
      lines="full"
      button
    >
      {getCategoryIcon()}
      
      <IonLabel>
        <div className="report-item__category">{category}</div>
        <h2 className="report-item__title">{title}</h2>
        <div className="report-item__date">
          {isUnread && <span className="report-item__unread-dot"></span>}
          {formattedDate}
        </div>
      </IonLabel>
      
      <div className="report-item__bookmark">
        <IonIcon icon="bookmark" />
      </div>
    </IonItem>
  );
};

export default ReportItem; 