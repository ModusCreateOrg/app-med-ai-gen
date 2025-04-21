import React from 'react';
import { format } from 'date-fns';
import Icon from '../../../common/components/Icon/Icon';
import { MedicalReport } from '../../../common/models/medicalReport';

interface OriginalReportProps {
  reportData: MedicalReport;
}

const OriginalReport: React.FC<OriginalReportProps> = ({ reportData }) => {
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

      {/* Uploaded File Section */}
      <div className="report-detail-page__uploaded-file">
        <h4 className="report-detail-page__uploaded-file-title">Uploaded file</h4>
        <div className="report-detail-page__file-container">
          <div className="report-detail-page__file-icon">
            <Icon icon="filePdf" />
          </div>
          <div className="report-detail-page__file-details">
            <div className="report-detail-page__file-name">
              {reportData.filePath.split('/').pop() || 'Exam_11_01_2024.pdf'}
            </div>
            <div className="report-detail-page__file-info">
              <span className="report-detail-page__file-size">92 kb</span>
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
