import React, { useState, useEffect, useRef } from 'react';
import AIChat from '../AIChat/AIChat';
import './AIChatContainer.scss';

/**
 * AIChatContainer manages the AI chat modal state and handles outside clicks
 */
const AIChatContainer: React.FC = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleClose = () => {
    setIsVisible(false);
    // Reset to collapsed state when closing
    setIsExpanded(false);
  };
  
  const handleToggleExpand = () => {
    setIsExpanded(prev => !prev);
  };
  
  const handleOpen = () => {
    setIsVisible(true);
  };
  
  const handleClickOutside = (event: MouseEvent) => {
    if (
      containerRef.current && 
      !containerRef.current.contains(event.target as Node) &&
      isVisible
    ) {
      handleClose();
    }
  };
  
  useEffect(() => {
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isVisible]);
  
  return (
    <>
      {/* AI Chat toggle button for bottom nav */}
      <div className="ai-chat-container__toggle">
        <button 
          className="ai-chat-container__toggle-button"
          onClick={handleOpen}
          aria-label="Open AI Chat"
        >
          AI
        </button>
      </div>
      
      {/* AI Chat modal */}
      {isVisible && (
        <div className="ai-chat-container" ref={containerRef}>
          <AIChat 
            isExpanded={isExpanded}
            onClose={handleClose}
            onToggleExpand={handleToggleExpand}
          />
        </div>
      )}
    </>
  );
};

export default AIChatContainer; 