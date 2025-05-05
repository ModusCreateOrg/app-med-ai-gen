import React, { useState } from 'react';
import { IonText } from '@ionic/react';
import AIAssistantModal from '../../../common/components/AIAssistant/AIAssistantModal';
import './AiAssistantNotice.scss';

/**
 * Component to display an AI Assistant notice with a link to open the AI Chat modal.
 */
const AiAssistantNotice: React.FC = () => {
  const [isAIAssistantOpen, setIsAIAssistantOpen] = useState(false);

  const handleOpenAIAssistant = () => {
    setIsAIAssistantOpen(true);
  };

  return (
    <div className="ai-assistant-notice">
      <div className="ai-assistant-notice__content">
        <IonText color="dark" className="clarification-text">
          Still need further clarifications?
        </IonText>

        <div className="assistant-link" onClick={handleOpenAIAssistant}>
          Ask our AI Assistant &gt;
        </div>
      </div>

      <AIAssistantModal
        isOpen={isAIAssistantOpen}
        setIsOpen={setIsAIAssistantOpen}
        testid="report-ai-assistant-modal"
      />
    </div>
  );
};

export default AiAssistantNotice;
