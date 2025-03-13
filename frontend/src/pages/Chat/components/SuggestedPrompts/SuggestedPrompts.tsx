import React from 'react';
import './SuggestedPrompts.scss';

interface SuggestedPromptsProps {
  onSelectPrompt: (prompt: string) => void;
}

// List of common medical questions that users might want to ask
const SUGGESTED_PROMPTS = [
  "What does elevated cholesterol mean?",
  "Explain what 'CBC' stands for in my lab results",
  "What are normal blood pressure readings?",
  "What do my liver enzyme results mean?",
  "Explain what an 'elevated white blood cell count' indicates",
  "What is a thyroid function test?",
];

/**
 * SuggestedPrompts component displays quick prompt buttons for common questions
 */
const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onSelectPrompt }) => {
  return (
    <div className="suggested-prompts">
      <h3 className="suggested-prompts__title">Try asking</h3>
      <div className="suggested-prompts__list">
        {SUGGESTED_PROMPTS.map((prompt, index) => (
          <button
            key={index}
            className="suggested-prompts__item"
            onClick={() => onSelectPrompt(prompt)}
          >
            {prompt}
          </button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedPrompts; 