import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import SuggestedPrompts from '../SuggestedPrompts';

describe('SuggestedPrompts', () => {
  it('renders correctly with title and prompt buttons', () => {
    render(<SuggestedPrompts onSelectPrompt={() => {}} />);
    
    // Check title
    expect(screen.getByText('Try asking')).toBeInTheDocument();
    
    // Check that all suggested prompts are rendered
    expect(screen.getByText("What does elevated cholesterol mean?")).toBeInTheDocument();
    expect(screen.getByText("Explain what 'CBC' stands for in my lab results")).toBeInTheDocument();
    expect(screen.getByText("What are normal blood pressure readings?")).toBeInTheDocument();
    expect(screen.getByText("What do my liver enzyme results mean?")).toBeInTheDocument();
    expect(screen.getByText("Explain what an 'elevated white blood cell count' indicates")).toBeInTheDocument();
    expect(screen.getByText("What is a thyroid function test?")).toBeInTheDocument();
  });

  it('calls onSelectPrompt when a prompt button is clicked', () => {
    const mockOnSelectPrompt = vi.fn();
    render(<SuggestedPrompts onSelectPrompt={mockOnSelectPrompt} />);
    
    // Click the first prompt button
    const promptButton = screen.getByText("What does elevated cholesterol mean?");
    fireEvent.click(promptButton);
    
    // Verify callback was called with the correct prompt
    expect(mockOnSelectPrompt).toHaveBeenCalledWith("What does elevated cholesterol mean?");
  });

  it('has the correct styles applied', () => {
    render(<SuggestedPrompts onSelectPrompt={() => {}} />);
    
    // Check the container has the correct class
    const container = screen.getByText('Try asking').parentElement;
    expect(container).toHaveClass('suggested-prompts');
    
    // Check that the list container has the correct class
    const promptsContainer = screen.getAllByRole('button')[0].parentElement;
    expect(promptsContainer).toHaveClass('suggested-prompts__list');
    
    // Check that buttons have the correct class
    const promptButtons = screen.getAllByRole('button');
    promptButtons.forEach(button => {
      expect(button).toHaveClass('suggested-prompts__item');
    });
  });
}); 