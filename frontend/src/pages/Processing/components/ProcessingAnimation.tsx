import '../ProcessingPage.scss';
import aiIcon from '../../../assets/icons/ai.svg';

interface ProcessingAnimationProps {
  firstName?: string;
}

/**
 * Component that displays processing animation and message
 */
const ProcessingAnimation: React.FC<ProcessingAnimationProps> = ({ firstName }) => {
  return (
    <>
      <div className="processing-page__title">
        <p className="processing-page__subtitle">
          Just a few seconds{firstName && ', ' + firstName}!
        </p>
        <h1 className="processing-page__heading">Processing Data...</h1>
      </div>
      <div className="processing-page__animation-container">
        <img src={aiIcon} alt="AI Icon" className="processing-page__ai-icon" />
      </div>
    </>
  );
};

export default ProcessingAnimation;
