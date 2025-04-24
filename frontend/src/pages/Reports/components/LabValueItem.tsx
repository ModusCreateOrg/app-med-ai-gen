import React from 'react';
import { useTranslation } from 'react-i18next';
import { LabValue } from '../../../common/models/medicalReport';

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

  return (
    <div className="report-detail-page__item">
      <div
        className={`report-detail-page__item-header ${
          item.status !== 'normal'
            ? `report-detail-page__item-header--${item.status.toLowerCase()}`
            : ''
        }`}
      >
        <div className="report-detail-page__item-name">{item.name}</div>
        {item.status !== 'normal' && (
          <div className={`report-detail-page__item-level ${statusInfo.className}`}>
            {statusInfo.text}
          </div>
        )}
        <div className="report-detail-page__item-value">
          {item.value} {item.unit}
        </div>
      </div>
      <div className="report-detail-page__item-details">
        <div className="report-detail-page__item-section">
          <h4>
            {t('report.conclusion.title', { ns: 'reportDetail', defaultValue: 'Conclusion' })}:
          </h4>
          <p>{item.conclusion}</p>
        </div>
        <div className="report-detail-page__item-section">
          <h4>
            {t('report.suggestions.title', { ns: 'reportDetail', defaultValue: 'Suggestions' })}:
          </h4>
          {suggestionItems.length > 0 ? (
            <ul className="report-detail-page__item-list">
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
