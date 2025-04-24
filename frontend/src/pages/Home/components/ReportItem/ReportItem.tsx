import { IonIcon } from '@ionic/react';
import { format } from 'date-fns';
import { useTranslation } from 'react-i18next';
import { MedicalReport, ReportCategory } from 'common/models/medicalReport';
import { bookmarkOutline } from 'ionicons/icons';
import './ReportItem.scss';

// Import SVG icons
import healthIcon from 'assets/icons/health.svg';
import brainIcon from 'assets/icons/brain.svg';
import heartIcon from 'assets/icons/heart.svg';

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
  showBookmarkButton = false,
}) => {
  const { t } = useTranslation(['common', 'report']);
  const { title, category, createdAt, status, bookmarked } = report;
  console.log('status', status);

  // Treat category as string
  const categoryStr = category.toString().toLowerCase();

  // Format the createdAt from ISO string to MM/DD/YYYY
  const formattedDate = format(new Date(createdAt), 'MM/dd/yyyy');

  // Get category translation key based on category value
  const getCategoryTranslationKey = () => {
    if (categoryStr === ReportCategory.GENERAL.toLowerCase()) {
      return 'category.general';
    } else if (categoryStr === ReportCategory.BRAIN.toLowerCase()) {
      return 'category.brain';
    } else if (categoryStr === ReportCategory.HEART.toLowerCase()) {
      return 'category.heart';
    }
    return 'category.general'; // Default to general if not found
  };

  // Get the appropriate icon for the category
  const getCategoryIcon = () => {
    return (
      <div className={`report-item__icon report-item__icon--${categoryStr}`}>
        <img
          src={getCategoryIconSrc(categoryStr)}
          alt={t(getCategoryTranslationKey(), { ns: 'report' })}
          width="28"
          height="28"
        />
      </div>
    );
  };

  // Get the appropriate icon source based on category
  const getCategoryIconSrc = (category: string) => {
    if (category === ReportCategory.GENERAL.toLowerCase()) {
      return healthIcon;
    } else if (category === ReportCategory.BRAIN.toLowerCase()) {
      return brainIcon;
    } else if (category === ReportCategory.HEART.toLowerCase()) {
      return heartIcon;
    }
    // Default to health icon for other categories
    return healthIcon;
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
          {t(getCategoryTranslationKey(), { ns: 'report' })}
        </div>
        <div className="report-item__title">{title}</div>
        <div className="report-item__date">
          {t('reports.uploadDate', { ns: 'common' })} • {formattedDate}
        </div>
      </div>

      {showBookmarkButton && (
        <div className="report-item__bookmark" onClick={handleBookmarkClick}>
          <IonIcon
            icon={bookmarkOutline}
            className={`report-item__bookmark-icon ${
              bookmarked ? 'report-item__bookmark-icon--active' : ''
            }`}
          />
        </div>
      )}
    </div>
  );
};

export default ReportItem;
