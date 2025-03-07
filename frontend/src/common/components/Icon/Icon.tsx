import { ComponentPropsWithoutRef } from 'react';
import { IonText } from '@ionic/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { IconProp } from '@fortawesome/fontawesome-svg-core';
import {
  faBookmark,
  faBuilding,
  faCalendar,
  faCircleInfo,
  faEnvelope,
  faHouse,
  faLink,
  faMapLocationDot,
  faMinus,
  faPenToSquare,
  faPhone,
  faPlus,
  faSignOutAlt,
  faTrash,
  faTriangleExclamation,
  faUser,
  faUserGear,
  faUsers,
  faXmark,
  faArrowUpFromBracket,
  faHome,
  faFileLines as faSolidFileLines,
  faUpload,
  faComment,
  faUserCircle
} from '@fortawesome/free-solid-svg-icons';
import {
  faFileLines as faRegularFileLines,
  faComment as faRegularComment,
  faUser as faRegularUser,
  faBookmark as faRegularBookmark
} from '@fortawesome/free-regular-svg-icons';
import classNames from 'classnames';

import { BaseComponentProps } from '../types';

/**
 * A union type of all Font Awesome icon names (without the `fa-` prefix)
 * used in the applciation.
 */
export type IconStyle = 'solid' | 'regular';

export type IconName =
  | 'arrowUpFromBracket'
  | 'bookmark'
  | 'building'
  | 'calendar'
  | 'circleInfo'
  | 'comment'
  | 'envelope'
  | 'fileLines'
  | 'home'
  | 'house'
  | 'link'
  | 'mapLocationDot'
  | 'minus'
  | 'penToSquare'
  | 'phone'
  | 'plus'
  | 'signOut'
  | 'trash'
  | 'triangleExclamation'
  | 'upload'
  | 'user'
  | 'userCircle'
  | 'users'
  | 'userGear'
  | 'xmark';

/**
 * Properties for the `Icon` component.
 * @see {@link BaseComponentProps}
 * @see {@link FontAwesomeIcon}
 */
export interface IconProps
  extends BaseComponentProps,
    Omit<ComponentPropsWithoutRef<typeof FontAwesomeIcon>, 'color' | 'icon'>,
    Pick<ComponentPropsWithoutRef<typeof IonText>, 'color' | 'slot'> {
  icon: IconName;
  iconStyle?: IconStyle;
}

/**
 * A key/value mapping of every solid icon used in the application.
 */
const solidIcons: Record<IconName, IconProp> = {
  arrowUpFromBracket: faArrowUpFromBracket,
  bookmark: faBookmark,
  building: faBuilding,
  calendar: faCalendar,
  circleInfo: faCircleInfo,
  comment: faComment,
  envelope: faEnvelope,
  fileLines: faSolidFileLines,
  home: faHome,
  house: faHouse,
  link: faLink,
  mapLocationDot: faMapLocationDot,
  minus: faMinus,
  penToSquare: faPenToSquare,
  phone: faPhone,
  plus: faPlus,
  signOut: faSignOutAlt,
  trash: faTrash,
  triangleExclamation: faTriangleExclamation,
  upload: faUpload,
  user: faUser,
  userCircle: faUserCircle,
  userGear: faUserGear,
  users: faUsers,
  xmark: faXmark,
};

/**
 * A key/value mapping of regular icons used in the application.
 * Only includes icons that have regular variants.
 */
const regularIcons: Partial<Record<IconName, IconProp>> = {
  comment: faRegularComment,
  fileLines: faRegularFileLines,
  user: faRegularUser,
  bookmark: faRegularBookmark
};

/**
 * The `Icon` component renders an icon. Wraps the `FontAwesomeIcon` component.
 *
 * @param {IconProps} props - Component properties.
 * @returns {JSX.Element} JSX
 * @see {@link FontAwesomeIcon}
 */
const Icon = ({
  className,
  color,
  icon,
  iconStyle = 'solid',
  slot = '',
  testid = 'icon',
  ...iconProps
}: IconProps): JSX.Element => {
  // Select icon based on style
  const faIcon = iconStyle === 'regular' && regularIcons[icon] 
    ? regularIcons[icon] 
    : solidIcons[icon];

  return (
    <IonText color={color} slot={slot} data-testid={testid}>
      <FontAwesomeIcon
        className={classNames('ls-icon', className)}
        icon={faIcon}
        {...iconProps}
        data-testid={`${testid}-icon`}
      />
    </IonText>
  );
};

export default Icon;
