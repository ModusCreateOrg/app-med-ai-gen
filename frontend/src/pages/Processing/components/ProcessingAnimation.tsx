import '../ProcessingPage.scss';

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
      <div className="processing-page__animation">
        <div className="processing-page__animation-circle"></div>
      </div>
    </>
  );
};

export default ProcessingAnimation;
