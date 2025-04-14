# Document Processor Service

This service integrates AWS Textract for text extraction and AWS Bedrock for medical analysis to process medical documents.

## Overview

The Document Processor Service provides a unified interface for processing medical documents through a two-step approach:

1. Extract text from medical documents (images or PDFs) using AWS Textract
2. Analyze the extracted text using AWS Bedrock (Claude) to provide structured medical information

## Components

The integration consists of the following components:

1. **DocumentProcessorService**: Main service that orchestrates the document processing workflow
2. **AwsTextractService**: Extracts text, tables, and form data from medical documents 
3. **AwsBedrockService**: Analyzes medical text using Claude model to extract structured information
4. **DocumentProcessorController**: Exposes HTTP endpoints for document upload and processing

## Data Models

### ProcessedDocumentResult

The result of document processing includes:

```typescript
export interface ProcessedDocumentResult {
  extractedText: ExtractedTextResult;
  analysis: MedicalDocumentAnalysis;
  processingMetadata: {
    processingTimeMs: number;
    fileSize: number;
  };
}
```

### ExtractedTextResult

The raw text extraction from Textract:

```typescript
export interface ExtractedTextResult {
  rawText: string;
  lines: string[];
  tables: Array<{
    rows: string[][];
  }>;
  keyValuePairs: Array<{
    key: string;
    value: string;
  }>;
}
```

### MedicalDocumentAnalysis

The structured medical information from Bedrock:

```typescript
export interface MedicalDocumentAnalysis {
  keyMedicalTerms: Array<{ term: string; definition: string }>;
  labValues: Array<{
    name: string;
    value: string;
    unit: string;
    normalRange: string;
    isAbnormal: boolean;
  }>;
  diagnoses: Array<{ condition: string; details: string; recommendations: string }>;
  metadata: {
    isMedicalReport: boolean;
    confidence: number;
    missingInformation: string[];
  };
}
```

## API Endpoints

### Process a Document

```
POST /api/document-processor/analyze
```

**Request Format:**
- Content-Type: `multipart/form-data`
- Body: Form with a file upload field named `file`
- Authorization: Bearer token required

**Example Request:**
```bash
curl -X POST \
  "http://localhost:3000/api/document-processor/analyze" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: multipart/form-data" \
  -F "file=@/path/to/medical_report.pdf"
```

**Response:**
```json
{
  "extractedText": {
    "rawText": "BLOOD TEST RESULTS\nPatient: John Doe\nHemoglobin: 14.2 g/dL (Normal: 13.5-17.5)",
    "lines": ["BLOOD TEST RESULTS", "Patient: John Doe", "Hemoglobin: 14.2 g/dL (Normal: 13.5-17.5)"],
    "tables": [],
    "keyValuePairs": [
      { "key": "Patient", "value": "John Doe" },
      { "key": "Hemoglobin", "value": "14.2 g/dL (Normal: 13.5-17.5)" }
    ]
  },
  "analysis": {
    "keyMedicalTerms": [
      { "term": "Hemoglobin", "definition": "Oxygen-carrying protein in red blood cells" }
    ],
    "labValues": [
      {
        "name": "Hemoglobin",
        "value": "14.2",
        "unit": "g/dL",
        "normalRange": "13.5-17.5",
        "isAbnormal": false
      }
    ],
    "diagnoses": [],
    "metadata": {
      "isMedicalReport": true,
      "confidence": 0.95,
      "missingInformation": []
    }
  },
  "processingMetadata": {
    "processingTimeMs": 2345,
    "fileSize": 12345
  }
}
```

## Usage from Code

```typescript
// Inject the service
constructor(private readonly documentProcessorService: DocumentProcessorService) {}

// Process a document
async processReport(fileBuffer: Buffer, userId: string) {
  try {
    const result = await this.documentProcessorService.processDocument(
      fileBuffer,
      userId
    );
    
    // Use the structured medical data
    const labValues = result.analysis.labValues;
    const abnormalValues = labValues.filter(lab => lab.isAbnormal);
    
    return result;
  } catch (error) {
    console.error('Error processing medical document:', error);
    throw error;
  }
}
```

## Rate Limiting

Both services implement rate limiting based on user ID:
- AWS Textract: 20 document requests per minute by default (configurable)
- AWS Bedrock: 20 model invocations per minute by default (configurable)

## Batch Processing

The service supports batch processing of multiple documents:

```typescript
const results = await documentProcessorService.processBatch(
  [
    { buffer: fileBuffer1 },
    { buffer: fileBuffer2 }
  ],
  userId
);
```

## Configuration

Configure the services through environment variables:

```bash
# AWS Region
AWS_REGION=us-east-1

# AWS Credentials (if not using IAM roles)
AWS_ACCESS_KEY_ID=your-access-key
AWS_SECRET_ACCESS_KEY=your-secret-key

# AWS Bedrock 
AWS_BEDROCK_MODEL=us.anthropic.claude-3-7-sonnet-20250219-v1:0
AWS_BEDROCK_MAX_TOKENS=2048
AWS_BEDROCK_REQUESTS_PER_MINUTE=20

# AWS Textract
AWS_TEXTRACT_MAX_BATCH_SIZE=10
AWS_TEXTRACT_DOCS_PER_MINUTE=10
```

## Future Enhancements

Planned future enhancements:
- Support for multi-page PDF processing using async APIs
- Enhanced lab report detection and categorization
- Integration with medical terminology databases
- OCR preprocessing for low-quality images 