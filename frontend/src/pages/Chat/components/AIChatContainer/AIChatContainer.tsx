import React, { useState, useEffect, useRef } from 'react';
import AIChat from '../AIChat/AIChat';
import { ChatProvider } from '../../context/ChatContext';
import './AIChatContainer.scss';

interface AIChatContainerProps {
  isVisible: boolean;
  onClose: () => void;
}

/**
 * AIChatContainer manages the AI chat modal state and handles outside clicks
 */
const AIChatContainer: React.FC<AIChatContainerProps> = ({ isVisible, onClose }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  
  const handleClose = () => {
    onClose();
    // Reset to collapsed state when closing
    setIsExpanded(false);
  };
  
  const handleToggleExpand = () => {
    setIsExpanded(prev => !prev);
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
  
  // Reset expanded state when visibility changes
  useEffect(() => {
    if (!isVisible) {
      setIsExpanded(false);
    }
  }, [isVisible]);
  
  return (
    <ChatProvider>
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
    </ChatProvider>
  );
};

export default AIChatContainer; 