import React from 'react';
import { format } from 'date-fns';
import Icon from '../../../common/components/Icon/Icon';
import { MedicalReport } from '../../../common/models/medicalReport';

interface OriginalReportProps {
  reportData: MedicalReport;
}

const OriginalReport: React.FC<OriginalReportProps> = ({ reportData }) => {
  // Function to format file size in KB or MB
  const formatFileSize = (bytes: number): string => {
    if (bytes < 1024) return bytes + ' B';
    else if (bytes < 1048576) return Math.round(bytes / 1024) + ' KB';
    else return (bytes / 1048576).toFixed(1) + ' MB';
  };

  // Get filename from originalFilename or fall back to file path
  const filename =
    reportData.originalFilename || reportData.filePath.split('/').pop() || 'Unknown file';

  // Format file size if available
  const fileSize = reportData.fileSize ? formatFileSize(reportData.fileSize) : 'Unknown size';

  return (
    <div className="report-detail-page__original-report">
      {/* Test results table */}
      <div className="report-detail-page__results-table">
        <div className="report-detail-page__results-header">
          <div className="report-detail-page__results-cell report-detail-page__results-cell--test">
            Test
          </div>
          <div className="report-detail-page__results-cell report-detail-page__results-cell--value">
            Results
          </div>
          <div className="report-detail-page__results-cell report-detail-page__results-cell--ref">
            Ref.
          </div>
        </div>

        {/* Test Results Rows */}
        {reportData.labValues.map((labValue, index) => (
          <div
            key={index}
            className={`report-detail-page__results-row ${
              labValue.status !== 'normal' ? 'report-detail-page__results-row--flagged' : ''
            }`}
          >
            <div className="report-detail-page__results-cell report-detail-page__results-cell--test">
              {labValue.name}
            </div>
            <div className="report-detail-page__results-cell report-detail-page__results-cell--value">
              {labValue.value} {labValue.unit}
            </div>
            <div className="report-detail-page__results-cell report-detail-page__results-cell--ref">
              {labValue.normalRange}
            </div>
          </div>
        ))}
      </div>

      {/* Medical Comments Section */}
      <div className="report-detail-page__comments-section">
        <h4 className="report-detail-page__comments-title">Medical Comments:</h4>
        <div className="report-detail-page__comments-text">{reportData.summary}</div>
      </div>

      {/* Uploaded File Section */}
      <div className="report-detail-page__uploaded-file">
        <h4 className="report-detail-page__uploaded-file-title">Uploaded file</h4>
        <div className="report-detail-page__file-container">
          <div className="report-detail-page__file-icon">
            <Icon icon="filePdf" />
          </div>
          <div className="report-detail-page__file-details">
            <div className="report-detail-page__file-name">{filename}</div>
            <div className="report-detail-page__file-info">
              <span className="report-detail-page__file-size">{fileSize}</span>
              <span className="report-detail-page__file-separator">•</span>
              <span className="report-detail-page__file-date">
                Uploaded ({format(new Date(reportData.createdAt), 'MM/dd/yyyy')})
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OriginalReport;
