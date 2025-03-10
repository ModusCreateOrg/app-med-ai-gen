import { describe, expect, it } from 'vitest';
import { render as defaultRender, screen } from '@testing-library/react';
import WelcomeBlock from '../WelcomeBlock';
import WithMinimalProviders from 'test/wrappers/WithMinimalProviders';

// Use a custom render that uses our minimal providers
const render = (ui: React.ReactElement) => {
  return defaultRender(ui, { wrapper: WithMinimalProviders });
};

describe('WelcomeBlock', () => {
  it('should render successfully', async () => {
    // ARRANGE
    render(<WelcomeBlock />);

    // ASSERT
    expect(screen.getByTestId('block-welcome')).toBeDefined();
  });

  it('should use custom testid when provided', async () => {
    // ARRANGE
    render(<WelcomeBlock testid="custom-testid" />);
    
    // ASSERT
    expect(screen.getByTestId('custom-testid')).toBeDefined();
  });

  it('should apply custom className when provided', async () => {
    // ARRANGE
    const { container } = render(<WelcomeBlock className="custom-class" />);
    
    // ASSERT
    expect(container.querySelector('.custom-class')).not.toBeNull();
  });
});
