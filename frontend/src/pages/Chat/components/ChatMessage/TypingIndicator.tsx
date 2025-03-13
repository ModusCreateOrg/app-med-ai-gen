import React from 'react';
import './TypingIndicator.scss';

/**
 * TypingIndicator component displays an animated indicator when the AI is "typing"
 */
const TypingIndicator: React.FC = () => {
  return (
    <div className="typing-indicator" aria-label="AI is typing">
      <div className="typing-indicator__dot"></div>
      <div className="typing-indicator__dot"></div>
      <div className="typing-indicator__dot"></div>
    </div>
  );
};

export default TypingIndicator; 