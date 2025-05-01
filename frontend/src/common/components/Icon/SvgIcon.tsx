import React from 'react';
import { IonText } from '@ionic/react';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';

import './SvgIcon.scss';
import { BaseComponentProps } from '../types';

/**
 * Properties for the `SvgIcon` component.
 * @see {@link BaseComponentProps}
 */
export interface SvgIconProps extends BaseComponentProps {
  /** The SVG icon source */
  src: string;

  /** Alt text for accessibility */
  alt?: string;

  /** Whether the icon is active/selected */
  active?: boolean;

  /** Optional color override */
  color?: string;

  /** Optional width */
  width?: number | string;

  /** Optional height */
  height?: number | string;
}

/**
 * The `SvgIcon` component renders an SVG icon.
 *
 * @param {SvgIconProps} props - Component properties.
 * @returns {JSX.Element} JSX
 */
const SvgIcon = ({
  className,
  src,
  alt = '',
  active = false,
  color = '#ABBCCD',
  width = 24,
  height = 24,
  testid = 'svg-icon',
  ...props
}: SvgIconProps): JSX.Element => {
  const { t } = useTranslation();

  const altText = alt || t('icon.alt', { ns: 'common', defaultValue: 'Icon' });

  // Determine the appropriate filter based on active state and color
  const getImageStyle = () => {
    if (active) {
      // Pink color #FD7BF4 - let the CSS handle it
      return undefined;
    } else if (color && color !== '#ABBCCD') {
      // For custom colors other than the default
      return { filter: `brightness(0) saturate(100%) ${generateFilterForHexColor(color)}` };
    }
    return undefined; // Use the default CSS filter
  };

  // Helper function to generate CSS filter for a hex color
  // This is a simplified approach and might not be perfect for all colors
  const generateFilterForHexColor = (hex: string) => {
    // For demonstration purposes - in a real implementation, you would
    // use a more sophisticated algorithm to convert hex to filter values
    return `drop-shadow(0 0 0 ${hex})`;
  };

  return (
    <IonText
      className={classNames('ls-svg-icon', { 'ls-svg-icon--active': active }, className)}
      data-testid={testid}
      {...props}
    >
      <img
        src={src}
        alt={altText}
        width={width}
        height={height}
        style={getImageStyle()}
        data-testid={`${testid}-img`}
      />
    </IonText>
  );
};

export default SvgIcon;
