import { IonIcon } from '@ionic/react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { MedicalReport, ReportCategory } from 'common/models/medicalReport';
import { bookmark, bookmarkOutline } from 'ionicons/icons';
import './ReportItem.scss';

interface ReportItemProps {
  report: MedicalReport;
  onClick?: () => void;
  onToggleBookmark?: () => void;
  showBookmarkButton?: boolean;
}

/**
 * Component to display a single medical report item.
 */
const ReportItem: React.FC<ReportItemProps> = ({
  report,
  onClick,
  onToggleBookmark,
  showBookmarkButton = false
}) => {
  const { t } = useTranslation(['common', 'report']);
  const { title, category, createdAt, status, bookmarked } = report;
  console.log(status)

  // Treat category as string
  const categoryStr = category.toString();

  // Format the createdAt from ISO string to MM/DD/YYYY
  const formattedDate = format(new Date(createdAt), 'MM/dd/yyyy');

  // Get category translation key based on category value
  const getCategoryTranslationKey = () => {
    if (categoryStr === ReportCategory.GENERAL) {
      return 'list.categoryGeneral';
    } else if (categoryStr === ReportCategory.NEUROLOGICAL) {
      return 'list.categoryBrain';
    } else if (categoryStr === ReportCategory.HEART) {
      return 'list.categoryHeart';
    }
    return category;
  };

  // Get the appropriate icon for the category
  const getCategoryIcon = () => {
    return (
      <div className={`report-item__icon report-item__icon--${categoryStr.toLowerCase()}`}>
        {renderIconForCategory(categoryStr)}
      </div>
    );
  };

  // Render the appropriate icon SVG based on category
  const renderIconForCategory = (category: string) => {
    if (category === ReportCategory.GENERAL) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M11.9999 13.8C13.9329 13.8 15.4999 12.233 15.4999 10.3C15.4999 8.36701 13.9329 6.8 11.9999 6.8C10.0669 6.8 8.49994 8.36701 8.49994 10.3C8.49994 12.233 10.0669 13.8 11.9999 13.8Z" stroke="white" strokeWidth="1.5"/>
          <path d="M6 19.5C6 17.0147 8.68629 15 12 15C15.3137 15 18 17.0147 18 19.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    } else if (category === ReportCategory.NEUROLOGICAL || category === 'Brain') {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 19.5V18M12 18V16.5M12 18H15.5M12 18H8.5M19 14C19 16.7614 15.866 19 12 19C8.13401 19 5 16.7614 5 14C5 11.2386 8.13401 9 12 9C15.866 9 19 11.2386 19 14Z" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
          <path d="M12 9V4.5" stroke="white" strokeWidth="1.5" strokeLinecap="round"/>
        </svg>
      );
    } else if (category === ReportCategory.HEART) {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M12 20L4.3314 12.2814C3.35233 11.2964 2.80543 9.98048 2.80543 8.60933C2.80543 7.23819 3.35233 5.92224 4.3314 4.93733V4.93733C6.36547 2.89068 9.63454 2.89068 11.6686 4.93733L12 5.27027L12.3314 4.93733C14.3655 2.89068 17.6345 2.89068 19.6686 4.93733V4.93733C20.6477 5.92224 21.1946 7.23819 21.1946 8.60933C21.1946 9.98048 20.6477 11.2964 19.6686 12.2814L12 20Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
        </svg>
      );
    } else {
      return (
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19 3H5C3.89543 3 3 3.89543 3 5V19C3 20.1046 3.89543 21 5 21H19C20.1046 21 21 20.1046 21 19V5C21 3.89543 20.1046 3 19 3Z" stroke="white" strokeWidth="1.5" strokeLinejoin="round"/>
          <path d="M7 7H17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 12H17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          <path d="M7 17H17" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      );
    }
  };

  const handleBookmarkClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onToggleBookmark) {
      onToggleBookmark();
    }
  };

  return (
    <div className="report-item" onClick={onClick}>
      {getCategoryIcon()}

      <div className="report-item__content">
        <div className="report-item__category-label">
          {t(`report:${getCategoryTranslationKey()}`, { ns: 'report' })}
        </div>
        <div className="report-item__title">{title}</div>
        <div className="report-item__date">
          {t('reports.uploadDate', { ns: 'common' })} • {formattedDate}
        </div>
      </div>

      {showBookmarkButton && (
        <div className="report-item__bookmark" onClick={handleBookmarkClick}>
          <IonIcon
            icon={bookmarked ? bookmark : bookmarkOutline}
            className={`report-item__bookmark-icon ${bookmarked ? 'report-item__bookmark-icon--active' : ''}`}
          />
        </div>
      )}
    </div>
  );
};

export default ReportItem;
