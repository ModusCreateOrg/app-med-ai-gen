import React from 'react';
import { IonIcon } from '@ionic/react';
import { sunny, moon, contrast } from 'ionicons/icons';
import { useTheme } from '../../context/ThemeContext';
import './ThemeToggle.scss';

/**
 * ThemeToggle component allows switching between light, dark, and system themes
 */
const ThemeToggle: React.FC = () => {
  const { mode, setMode } = useTheme();
  
  const getIcon = () => {
    switch (mode) {
      case 'light':
        return sunny;
      case 'dark':
        return moon;
      case 'system':
        return contrast;
      default:
        return sunny;
    }
  };
  
  const getLabel = () => {
    switch (mode) {
      case 'light':
        return 'Light Theme';
      case 'dark':
        return 'Dark Theme';
      case 'system':
        return 'System Theme';
      default:
        return 'Light Theme';
    }
  };
  
  const toggleTheme = () => {
    switch (mode) {
      case 'light':
        setMode('dark');
        break;
      case 'dark':
        setMode('system');
        break;
      case 'system':
        setMode('light');
        break;
      default:
        setMode('light');
    }
  };
  
  return (
    <button 
      className="theme-toggle" 
      onClick={toggleTheme}
      aria-label={`Toggle theme, current: ${getLabel()}`}
    >
      <IonIcon icon={getIcon()} className="theme-toggle__icon" />
    </button>
  );
};

export default ThemeToggle; 