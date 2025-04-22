import { useHistory } from 'react-router-dom';
import '../ProcessingPage.scss';

interface ProcessingErrorProps {
  errorMessage: string;
  onRetry: () => void;
}

/**
 * Component that displays processing error information and actions
 */
const ProcessingError: React.FC<ProcessingErrorProps> = ({ errorMessage, onRetry }) => {
  const history = useHistory();

  return (
    <div className="processing-page__error-container">
      <div className="processing-page__error-header">
        <p className="processing-page__error-oops">Oops! ...</p>
        <h2 className="processing-page__error-title">Problem detected</h2>
      </div>

      <div className="processing-page__error-icon">
        <div className="processing-page__error-icon-circle">
          <svg
            width="48"
            height="48"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M24 4C12.96 4 4 12.96 4 24C4 35.04 12.96 44 24 44C35.04 44 44 35.04 44 24C44 12.96 35.04 4 24 4ZM26 34H22V30H26V34ZM26 26H22V14H26V26Z"
              fill="#C41E3A"
            />
          </svg>
        </div>
      </div>

      <h3 className="processing-page__error-subheading">Processing Error</h3>

      <p className="processing-page__error-message">
        {errorMessage ||
          'There was a problem processing your uploaded file. Please try again or upload another.'}
      </p>

      <div className="processing-page__error-actions">
        <button className="processing-page__retry-btn" onClick={onRetry}>
          Try again
        </button>

        <button
          className="processing-page__upload-btn"
          onClick={() => history.push('/tabs/upload')}
        >
          New Upload
        </button>
      </div>
    </div>
  );
};

export default ProcessingError;
