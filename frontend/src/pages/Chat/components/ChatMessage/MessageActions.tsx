import React, { useState } from 'react';
import { IonIcon, IonToast } from '@ionic/react';
import { copy, checkmark, thumbsUp, thumbsDown, shareOutline } from 'ionicons/icons';
import './MessageActions.scss';

interface MessageActionsProps {
  text: string;
}

/**
 * MessageActions component displays actions for a chat message (copy, feedback)
 */
const MessageActions: React.FC<MessageActionsProps> = ({ text }) => {
  const [copied, setCopied] = useState(false);
  const [feedback, setFeedback] = useState<'positive' | 'negative' | null>(null);
  const [showToast, setShowToast] = useState(false);
  
  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setShowToast(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };
  
  const handleFeedback = (type: 'positive' | 'negative') => {
    if (feedback === type) {
      setFeedback(null); // Unselect if already selected
      // TODO: Send feedback removal to backend
    } else {
      setFeedback(type);
      // TODO: Send feedback to backend
      console.log(`User gave ${type} feedback for message`);
    }
  };
  
  const handleShare = () => {
    // For simplicity, we'll just use the native share API if available
    // Otherwise, we'll copy the text to clipboard
    if (navigator.share) {
      navigator.share({
        title: 'MedAI Chat Response',
        text: text,
        url: window.location.href
      }).catch(err => {
        console.error('Error sharing:', err);
        handleCopy(); // Fallback to copy
      });
    } else {
      handleCopy(); // Fallback to copy
    }
  };
  
  return (
    <>
      <div className="message-actions">
        <button 
          className={`message-actions__button ${copied ? 'message-actions__button--active' : ''}`}
          onClick={handleCopy}
          aria-label={copied ? "Copied" : "Copy text"}
        >
          <IonIcon icon={copied ? checkmark : copy} />
        </button>
        
        <button 
          className="message-actions__button"
          onClick={handleShare}
          aria-label="Share"
        >
          <IonIcon icon={shareOutline} />
        </button>
        
        <div className="message-actions__feedback">
          <button 
            className={`message-actions__button ${feedback === 'positive' ? 'message-actions__button--positive' : ''}`}
            onClick={() => handleFeedback('positive')}
            aria-label="Helpful"
          >
            <IonIcon icon={thumbsUp} />
          </button>
          
          <button 
            className={`message-actions__button ${feedback === 'negative' ? 'message-actions__button--negative' : ''}`}
            onClick={() => handleFeedback('negative')}
            aria-label="Not helpful"
          >
            <IonIcon icon={thumbsDown} />
          </button>
        </div>
      </div>
      
      <IonToast
        isOpen={showToast}
        onDidDismiss={() => setShowToast(false)}
        message="Text copied to clipboard"
        duration={2000}
        position="bottom"
      />
    </>
  );
};

export default MessageActions; 