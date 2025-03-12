import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import LoaderSpinner from '../LoaderSpinner';

describe('LoaderSpinner', () => {
  it('should render successfully', () => {
    // ARRANGE
    render(<LoaderSpinner />);

    // ASSERT
    const loaderElement = screen.getByTestId('loader-spinner');
    expect(loaderElement).toBeDefined();
  });
});
