import React from 'react';
import { IonIcon } from '@ionic/react';
import { close } from 'ionicons/icons';
import './CategoryTag.scss';

interface CategoryTagProps {
  label: string;
  onRemove: () => void;
}

const CategoryTag: React.FC<CategoryTagProps> = ({ label, onRemove }) => {
  return (
    <div className="category-tag">
      <span className="category-tag__label">{label}</span>
      <button
        className="category-tag__remove-button"
        onClick={onRemove}
        aria-label={`Remove ${label} filter`}
      >
        <IonIcon icon={close} className="category-tag__remove-icon" />
      </button>
    </div>
  );
};

export default CategoryTag;
