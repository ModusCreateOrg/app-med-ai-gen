import React from 'react';
import { MedicalReport, LabValue } from '../../../common/models/medicalReport';
import EmergencyAlert from './EmergencyAlert';
import FlaggedValuesSection from './FlaggedValuesSection';
import NormalValuesSection from './NormalValuesSection';
import LowConfidenceNotice from './LowConfidenceNotice';

interface AiAnalysisTabProps {
  reportData: MedicalReport;
  isEmergencyAlertVisible?: boolean;
}

const AiAnalysisTab: React.FC<AiAnalysisTabProps> = ({
  reportData,
  isEmergencyAlertVisible = true,
}) => {
  // State to track expanded sections
  const [flaggedValuesExpanded, setFlaggedValuesExpanded] = React.useState(true);
  const [normalValuesExpanded, setNormalValuesExpanded] = React.useState(true);

  // Toggle expanded state of sections
  const toggleFlaggedValues = () => setFlaggedValuesExpanded(!flaggedValuesExpanded);
  const toggleNormalValues = () => setNormalValuesExpanded(!normalValuesExpanded);

  // Process lab values data
  const hasEmergency = reportData.labValues.some((value) => value.isCritical);
  const flaggedValues: LabValue[] = reportData.labValues.filter(
    (value) => value.status !== 'normal',
  );
  const normalValues: LabValue[] = reportData.labValues.filter(
    (value) => value.status === 'normal',
  );

  // Format confidence score for display
  const confidenceScore = reportData.confidence;

  const isLowConfidence = confidenceScore < 0.75;

  return (
    <div className="ai-analysis-tab">
      {/* Emergency alert if needed */}
      {isEmergencyAlertVisible && hasEmergency && <EmergencyAlert />}

      {/* Low confidence notice */}
      {isLowConfidence && <LowConfidenceNotice />}

      {/* Flagged values section */}
      <FlaggedValuesSection
        flaggedValues={flaggedValues}
        isExpanded={flaggedValuesExpanded}
        onToggle={toggleFlaggedValues}
      />

      {/* Normal values section */}
      <NormalValuesSection
        normalValues={normalValues}
        isExpanded={normalValuesExpanded}
        onToggle={toggleNormalValues}
      />
    </div>
  );
};

export default AiAnalysisTab;
