import React from 'react';
import { useTranslation } from 'react-i18next';
import { LabValue } from '../../../common/models/medicalReport';
import classNames from 'classnames';

interface LabValueItemProps {
  item: LabValue;
}

const LabValueItem: React.FC<LabValueItemProps> = ({ item }) => {
  const { t } = useTranslation();

  // Parse suggestions into bullet points more intelligently
  const getSuggestionsList = (suggestions: string): string[] => {
    if (!suggestions) return [];

    // Handle case where the text is already separated by bullet points
    if (suggestions.includes('•')) {
      return suggestions
        .split('•')
        .filter(Boolean)
        .map((item) => item.trim());
    }

    // Handle case where items are separated by hyphens
    if (suggestions.includes('-')) {
      return suggestions
        .split('-')
        .filter(Boolean)
        .map((item) => item.trim());
    }

    // Handle case with numbered lists (1., 2., etc.)
    if (/\d+\.\s/.test(suggestions)) {
      return suggestions
        .split(/\d+\.\s/)
        .filter(Boolean)
        .map((item) => item.trim());
    }

    // Split by periods if it seems like sentences
    if (suggestions.includes('.')) {
      // Don't split on decimal points in numbers (e.g. "10.5")
      const sentences = suggestions
        .replace(/(\d+)\.(\d+)/g, '$1@$2')
        .split('.')
        .map((s) => s.replace(/@/g, '.').trim())
        .filter(Boolean);
      return sentences;
    }

    // If we can't detect a pattern, return the whole string as one item
    return [suggestions];
  };

  const suggestionItems = getSuggestionsList(item.suggestions);

  // Determine classes and text for status label based on status
  const getStatusInfo = () => {
    if (item.status === 'high') {
      return {
        className: 'report-detail-page__item-level--high',
        text: t('report.high', { ns: 'reportDetail', defaultValue: 'High' }),
      };
    } else if (item.status === 'low') {
      return {
        className: 'report-detail-page__item-level--low',
        text: t('report.low', { ns: 'reportDetail', defaultValue: 'Low' }),
      };
    }
    return { className: '', text: '' };
  };

  const statusInfo = getStatusInfo();
  const isFlagged = item.status !== 'normal';
  const statusClass = item.status.toLowerCase(); // 'high' or 'low'

  // Handle potential parenthesis in the name (e.g., "Low Hemoglobin (10.1 g/dL)")
  const itemName = item.name;

  return (
    <div
      className={classNames('lab-value-item', { [`lab-value-item--${statusClass}`]: isFlagged })}
    >
      <div className="lab-value-item__header">
        <div className="lab-value-item__name">{itemName}</div>
        <div className="lab-value-item__status-value">
          {item.status !== 'normal' && (
            <div className={`lab-value-item__status ${statusInfo.className}`}>
              {statusInfo.text}
            </div>
          )}
          <div className="lab-value-item__value">
            {item.value} {item.unit}
          </div>
        </div>
      </div>
      <div className="lab-value-item__details">
        <div className="lab-value-item__section">
          <h4>
            {t('report.conclusion.title', { ns: 'reportDetail', defaultValue: 'Conclusion' })}:
          </h4>
          <p>{item.conclusion}</p>
        </div>
        <div className="lab-value-item__section">
          <h4>
            {t('report.suggestions.title', { ns: 'reportDetail', defaultValue: 'Suggestions' })}:
          </h4>
          {suggestionItems.length > 0 ? (
            <ul className="lab-value-item__list">
              {suggestionItems.map((suggestion, index) => (
                <li key={index}>{suggestion}</li>
              ))}
            </ul>
          ) : (
            <p>{item.suggestions}</p>
          )}
        </div>
      </div>
    </div>
  );
};

export default LabValueItem;
