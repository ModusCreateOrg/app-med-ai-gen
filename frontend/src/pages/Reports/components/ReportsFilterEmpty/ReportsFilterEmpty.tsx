import React from 'react';
import { IonButton, IonIcon } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import { searchOutline } from 'ionicons/icons';
import './ReportsFilterEmpty.scss';

interface ReportsFilterEmptyProps {
  onChangeFilters: () => void;
  onClearFilters: () => void;
  showClearButton?: boolean;
  hasSelectedFilters?: boolean;
}

/**
 * Component to display when no reports match the current filter criteria
 */
const ReportsFilterEmpty: React.FC<ReportsFilterEmptyProps> = ({
  onChangeFilters,
  onClearFilters,
  showClearButton = true,
  hasSelectedFilters = true,
}) => {
  const { t } = useTranslation(['report', 'common']);

  return (
    <div className="reports-filter-empty">
      <div className="reports-filter-empty__icon-container">
        <IonIcon icon={searchOutline} className="reports-filter-empty__icon" />
      </div>

      <h3 className="reports-filter-empty__title">{t('list.noMatchesTitle', { ns: 'report' })}</h3>

      <p className="reports-filter-empty__message">
        {t('list.noMatchesMessage', { ns: 'report' })}
      </p>

      <div className="reports-filter-empty__buttons">
        <IonButton
          expand="block"
          className="reports-filter-empty__button reports-filter-empty__button--primary"
          onClick={onChangeFilters}
        >
          {t('list.changeFilters', { ns: 'report' })}
        </IonButton>

        {showClearButton && hasSelectedFilters && (
          <IonButton
            expand="block"
            fill="outline"
            className="reports-filter-empty__button reports-filter-empty__button--secondary"
            onClick={onClearFilters}
          >
            {t('list.clearFilters', { ns: 'report' })}
          </IonButton>
        )}
      </div>
    </div>
  );
};

export default ReportsFilterEmpty;
