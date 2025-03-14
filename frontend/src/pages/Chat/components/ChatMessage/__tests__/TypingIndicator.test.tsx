import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import '@testing-library/jest-dom/vitest';
import TypingIndicator from '../TypingIndicator';

describe('TypingIndicator', () => {
  it('renders correctly', () => {
    render(<TypingIndicator />);
    
    // Check that the component is in the document
    const indicator = screen.getByLabelText('AI is typing');
    expect(indicator).toBeInTheDocument();
    
    // Check that it has 3 dots
    const dots = indicator.querySelectorAll('.typing-indicator__dot');
    expect(dots.length).toBe(3);
  });

  it('has appropriate styling', () => {
    render(<TypingIndicator />);
    
    const indicator = screen.getByLabelText('AI is typing');
    
    // Check that the container has the correct class
    expect(indicator).toHaveClass('typing-indicator');
    
    // Get the dots
    const dots = indicator.querySelectorAll('.typing-indicator__dot');
    
    // Check each dot has the right class
    dots.forEach(dot => {
      expect(dot).toHaveClass('typing-indicator__dot');
    });
  });
}); 