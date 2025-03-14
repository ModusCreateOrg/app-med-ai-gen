import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import '@testing-library/jest-dom/vitest';
import ThemeToggle from '../ThemeToggle';
import { useTheme } from '../../../context/ThemeContext';

// Mock the ThemeContext
vi.mock('../../../context/ThemeContext', () => ({
  useTheme: vi.fn()
}));

// Mock IonIcon
vi.mock('@ionic/react', () => ({
  IonIcon: ({ icon, className }: { icon: string, className: string }) => 
    <div data-testid="theme-icon" className={className}>{icon}</div>
}));

describe('ThemeToggle', () => {
  it('renders with light theme', () => {
    const mockSetMode = vi.fn();
    vi.mocked(useTheme).mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDarkMode: false
    });
    
    render(<ThemeToggle />);
    
    // Check button exists with correct label
    const button = screen.getByRole('button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveAttribute('aria-label', 'Toggle theme, current: Light Theme');
    
    // Check icon exists
    expect(screen.getByTestId('theme-icon')).toBeInTheDocument();
  });
  
  it('renders with dark theme', () => {
    const mockSetMode = vi.fn();
    vi.mocked(useTheme).mockReturnValue({
      mode: 'dark',
      setMode: mockSetMode,
      isDarkMode: true
    });
    
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Toggle theme, current: Dark Theme');
  });
  
  it('renders with system theme', () => {
    const mockSetMode = vi.fn();
    vi.mocked(useTheme).mockReturnValue({
      mode: 'system',
      setMode: mockSetMode,
      isDarkMode: false
    });
    
    render(<ThemeToggle />);
    expect(screen.getByRole('button')).toHaveAttribute('aria-label', 'Toggle theme, current: System Theme');
  });
  
  it('cycles through themes when clicked', () => {
    const mockSetMode = vi.fn();
    
    // Start with light theme
    vi.mocked(useTheme).mockReturnValue({
      mode: 'light',
      setMode: mockSetMode,
      isDarkMode: false
    });
    
    const { rerender } = render(<ThemeToggle />);
    const button = screen.getByRole('button');
    
    // Click to go from light to dark
    fireEvent.click(button);
    expect(mockSetMode).toHaveBeenCalledWith('dark');
    
    // Update mode to dark and rerender
    vi.mocked(useTheme).mockReturnValue({
      mode: 'dark',
      setMode: mockSetMode,
      isDarkMode: true
    });
    rerender(<ThemeToggle />);
    
    // Click to go from dark to system
    fireEvent.click(button);
    expect(mockSetMode).toHaveBeenCalledWith('system');
    
    // Update mode to system and rerender
    vi.mocked(useTheme).mockReturnValue({
      mode: 'system',
      setMode: mockSetMode,
      isDarkMode: false
    });
    rerender(<ThemeToggle />);
    
    // Click to go from system to light
    fireEvent.click(button);
    expect(mockSetMode).toHaveBeenCalledWith('light');
  });
}); 