import { describe, expect, it, vi } from 'vitest';
import userEvent from '@testing-library/user-event';
import { Form, Formik } from 'formik';
import { waitFor } from '@testing-library/react';
import { ReactNode } from 'react';

import { render, screen } from 'test/test-utils';

// Mock IonCheckbox to better simulate its behavior in tests
vi.mock('@ionic/react', async () => {
  const actual = await vi.importActual('@ionic/react');
  return {
    ...actual,
    IonCheckbox: ({
      children,
      onIonChange,
      checked,
      value,
      'data-testid': testId,
      className,
      name,
    }: {
      children?: ReactNode;
      onIonChange?: (event: { detail: { checked: boolean; value?: string } }) => void;
      checked?: boolean | string;
      value?: string;
      'data-testid'?: string;
      className?: string;
      name?: string;
    }) => {
      const handleChange = () => {
        const newChecked = typeof checked === 'string' ? checked === 'false' : !checked;
        const detailObj = {
          checked: newChecked,
          value,
        };
        onIonChange?.({ detail: detailObj });
      };

      const checkedValue = String(checked);
      const ariaChecked = checkedValue === 'true' ? 'true' : 'false';

      return (
        <div
          onClick={handleChange}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === ' ') {
              e.preventDefault();
              handleChange();
            }
          }}
          role="checkbox"
          tabIndex={0}
          className={`ion-checkbox ${className || ''}`}
          data-testid={testId}
          aria-checked={ariaChecked as 'false' | 'true'}
          data-checked={checkedValue}
          data-name={name}
          data-value={value}
        >
          {children}
        </div>
      );
    },
  };
});

import CheckboxInput from '../CheckboxInput';

describe('CheckboxInput', () => {
  it('should render successfully', async () => {
    // ARRANGE
    render(
      <Formik initialValues={{ checkboxField: false }} onSubmit={() => {}}>
        <Form>
          <CheckboxInput name="checkboxField" testid="input">
            MyCheckbox
          </CheckboxInput>
        </Form>
      </Formik>,
    );
    await screen.findByTestId('input');

    // ASSERT
    expect(screen.getByTestId('input')).toBeDefined();
  });

  it('should not be checked', async () => {
    // ARRANGE
    render(
      <Formik initialValues={{ checkboxField: false }} onSubmit={() => {}}>
        <Form>
          <CheckboxInput name="checkboxField" testid="input">
            MyCheckbox
          </CheckboxInput>
        </Form>
      </Formik>,
    );
    await screen.findByTestId('input');

    // ASSERT
    expect(screen.getByTestId('input')).toBeDefined();
    expect(screen.getByTestId('input')).toHaveAttribute('data-checked', 'false');
  });

  it('should be checked', async () => {
    // ARRANGE
    render(
      <Formik initialValues={{ checkboxField: true }} onSubmit={() => {}}>
        <Form>
          <CheckboxInput name="checkboxField" testid="input">
            MyCheckbox
          </CheckboxInput>
        </Form>
      </Formik>,
    );
    await screen.findByTestId('input');

    // ASSERT
    expect(screen.getByTestId('input')).toBeDefined();
    expect(screen.getByTestId('input')).toHaveAttribute('data-checked', 'true');
  });

  it('should change boolean value', async () => {
    // ARRANGE
    const user = userEvent.setup();
    render(
      <Formik initialValues={{ checkboxField: false }} onSubmit={() => {}}>
        <Form>
          <CheckboxInput name="checkboxField" testid="input">
            MyCheckbox
          </CheckboxInput>
        </Form>
      </Formik>,
    );
    await screen.findByTestId('input');
    expect(screen.getByTestId('input')).toHaveAttribute('data-checked', 'false');

    // ACT
    await user.click(screen.getByTestId('input'));

    // ASSERT
    await waitFor(
      () => {
        expect(screen.getByTestId('input')).toBeDefined();
        expect(screen.getByTestId('input')).toHaveAttribute('data-checked', 'true');
      },
      { timeout: 1000 },
    );
  });

  it('should change array value', async () => {
    // ARRANGE
    const user = userEvent.setup();
    render(
      <Formik initialValues={{ checkboxField: [] }} onSubmit={() => {}}>
        <Form>
          <CheckboxInput name="checkboxField" value="One" testid="one">
            CheckboxOne
          </CheckboxInput>
          <CheckboxInput name="checkboxField" value="Two" testid="two">
            CheckboxTwo
          </CheckboxInput>
        </Form>
      </Formik>,
    );
    await screen.findByTestId('one');
    expect(screen.getByTestId('one')).toHaveAttribute('data-checked', 'false');
    expect(screen.getByTestId('two')).toHaveAttribute('data-checked', 'false');

    // ACT
    await user.click(screen.getByTestId('one'));

    // ASSERT
    await waitFor(
      () => {
        expect(screen.getByTestId('one')).toHaveAttribute('data-checked', 'true');
        expect(screen.getByTestId('two')).toHaveAttribute('data-checked', 'false');
      },
      { timeout: 1000 },
    );

    // ACT
    await user.click(screen.getByTestId('one'));

    // ASSERT
    await waitFor(
      () => {
        expect(screen.getByTestId('one')).toHaveAttribute('data-checked', 'false');
        expect(screen.getByTestId('two')).toHaveAttribute('data-checked', 'false');
      },
      { timeout: 1000 },
    );
  });

  it('should call onChange function', async () => {
    // ARRANGE
    const user = userEvent.setup();
    const onChange = vi.fn();

    render(
      <Formik initialValues={{ checkboxField: false }} onSubmit={() => {}}>
        <Form>
          <CheckboxInput name="checkboxField" onIonChange={onChange} testid="input">
            MyCheckbox
          </CheckboxInput>
        </Form>
      </Formik>,
    );
    await screen.findByTestId('input');

    // ACT
    await user.click(screen.getByTestId('input'));

    // ASSERT
    await waitFor(
      () => {
        expect(onChange).toHaveBeenCalledTimes(1);
        expect(screen.getByTestId('input')).toHaveAttribute('data-checked', 'true');
      },
      { timeout: 1000 },
    );
  });
});
