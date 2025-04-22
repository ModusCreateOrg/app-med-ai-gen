import React, { useState } from 'react';
import { IonButton, IonList, IonItem, IonLabel, IonCheckbox } from '@ionic/react';
import { useTranslation } from 'react-i18next';
import './FilterPanel.scss';

export interface CategoryOption {
  id: string;
  label: string;
}

interface FilterPanelProps {
  categories: CategoryOption[];
  selectedCategories: string[];
  onApply: (selectedCategories: string[]) => void;
  onClose: () => void;
}

const FilterPanel: React.FC<FilterPanelProps> = ({
  categories,
  selectedCategories: initialSelectedCategories,
  onApply,
  onClose,
}) => {
  const { t } = useTranslation(['report', 'common']);
  const [selectedCategories, setSelectedCategories] = useState<string[]>(initialSelectedCategories);

  const handleCategoryToggle = (categoryId: string) => {
    setSelectedCategories((prev) => {
      if (prev.includes(categoryId)) {
        return prev.filter((id) => id !== categoryId);
      } else {
        return [...prev, categoryId];
      }
    });
  };

  const handleApply = () => {
    onApply(selectedCategories);
    onClose();
  };

  return (
    <div className="filter-panel">
      <h2 className="filter-panel__title">{t('filter.title', { ns: 'report' })}</h2>

      <div className="filter-panel__category-section">
        <h3 className="filter-panel__category-title">{t('filter.category', { ns: 'report' })}</h3>
        <IonList className="filter-panel__category-list">
          {categories.map((category) => (
            <IonItem key={category.id} className="filter-panel__category-item">
              <IonLabel>{category.label}</IonLabel>
              <IonCheckbox
                slot="end"
                checked={selectedCategories.includes(category.id)}
                onIonChange={() => handleCategoryToggle(category.id)}
              />
            </IonItem>
          ))}
        </IonList>
      </div>

      <div className="filter-panel__actions">
        <IonButton
          expand="block"
          onClick={handleApply}
          className="filter-panel__apply-button"
        >
          {t('filter.apply', { ns: 'report' })}
        </IonButton>
      </div>
    </div>
  );
};

export default FilterPanel;
