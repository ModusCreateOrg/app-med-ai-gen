# AWS Textract Integration

This document describes the AWS Textract integration for extracting text from medical lab reports in image or PDF formats.

## Overview

The AWS Textract service is used to extract text from medical lab reports, including tables, forms, and key-value pairs. The service supports both image files (JPEG, PNG, HEIC) and PDF documents.

## Implementation Details

The Textract integration consists of the following components:

1. **AwsTextractService**: Service that interacts with AWS Textract API
2. **TextractModule**: NestJS module that registers the service

For image files, the service uses the `AnalyzeDocument` API with the `TABLES` and `FORMS` feature types to extract structured information. For PDF documents, a similar approach is used, but future enhancements may involve the asynchronous job-based APIs for multi-page PDFs.

The service implements rate limiting to prevent excessive API calls to AWS Textract.

## Error Handling

The service handles various error cases:
- File validation errors (unsupported format, size limits)
- Rate limiting errors
- AWS API errors

All errors are properly logged and returned as HTTP 400 responses with descriptive error messages.

## Security Considerations

The service implements several security measures:
- Input validation and sanitization
- File type and size validation
- Rate limiting
- Secure credential handling

## Future Enhancements

Planned future enhancements:
- Support for multi-page PDF processing using async APIs
- Enhanced lab report detection and categorization
- Integration with medical terminology databases
- OCR preprocessing for low-quality images 