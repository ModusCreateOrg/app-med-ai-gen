import React from 'react';
import './AIChatBanner.scss';

interface AIChatBannerProps {
  onClick: () => void;
}

/**
 * AIChatBanner component displays a banner on the home screen for accessing the AI chat
 */
const AIChatBanner: React.FC<AIChatBannerProps> = ({ onClick }) => {
  return (
    <div className="ai-chat-banner" onClick={onClick}>
      <div className="ai-chat-banner__content">
        <div className="ai-chat-banner__icon">
          <span className="ai-chat-banner__icon-symbol">✨</span>
        </div>
        <div className="ai-chat-banner__text">
          <div className="ai-chat-banner__title">
            MedReport AI is with you!
          </div>
          <div className="ai-chat-banner__subtitle">
            Ask Questions
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIChatBanner; 