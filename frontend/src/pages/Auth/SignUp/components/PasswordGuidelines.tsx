import React from 'react';
import { IonIcon } from '@ionic/react';
import { checkmarkCircle, closeCircle } from 'ionicons/icons';
import { useTranslation } from 'react-i18next';
import './PasswordGuidelines.scss';

interface PasswordGuidelinesProps {
  password: string;
}

/**
 * Password guidelines component
 */
const PasswordGuidelines: React.FC<PasswordGuidelinesProps> = ({ password }) => {
  const { t } = useTranslation();

  const hasMinLength = password.length >= 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);

  const renderGuideline = (isValid: boolean, text: string) => {
    const statusClass = isValid ? 'valid' : 'invalid';
    const icon = isValid ? checkmarkCircle : closeCircle;

    return (
      <div className={`ls-signup-form__password-guidelines-item ls-signup-form__password-guidelines-item-${statusClass}`}>
        <IonIcon
          icon={icon}
          className="ls-signup-form__password-guidelines-item-icon"
          size="small"
        />
        <span>{text}</span>
      </div>
    );
  };

  return (
    <div className="ls-signup-form__password-guidelines">
      <div className="ls-signup-form__password-guidelines-header">
        {t('password-requirements', { ns: 'auth', defaultValue: 'Password Requirements:' })}
      </div>
      {renderGuideline(
        hasMinLength,
        t('validation.min-length', { length: 8, ns: 'auth', defaultValue: 'At least 8 characters long' })
      )}
      {renderGuideline(
        hasUppercase,
        t('validation.uppercase', { ns: 'auth', defaultValue: 'At least one uppercase letter' })
      )}
      {renderGuideline(
        hasLowercase,
        t('validation.lowercase', { ns: 'auth', defaultValue: 'At least one lowercase letter' })
      )}
      {renderGuideline(
        hasNumbers,
        t('validation.number', { ns: 'auth', defaultValue: 'At least one number' })
      )}
      {renderGuideline(
        hasSpecialChars,
        t('validation.special-char', { ns: 'auth', defaultValue: 'At least one special character' })
      )}
    </div>
  );
};

export default PasswordGuidelines; 