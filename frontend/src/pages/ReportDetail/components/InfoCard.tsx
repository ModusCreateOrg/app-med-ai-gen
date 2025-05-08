import { FC } from 'react';
import './InfoCard.scss';
import bulbIcon from '../../../assets/icons/bulb.svg';

const InfoCard: FC = () => {
  return (
    <div className="info-card">
      <div className="info-card__icon">
        <img src={bulbIcon} alt="Bulb Icon" />
      </div>
      <div className="info-card__text">
        With all interpretations, these results should be discussed with your doctor.
      </div>
    </div>
  );
};

export default InfoCard;
