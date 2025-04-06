# AWS Bedrock Test Controller

This controller provides a testing interface for the AWS Bedrock medical image analysis service, bypassing authentication for easy testing and debugging.

## Features

- Extracts medical information from images using AWS Bedrock AI service
- Handles image uploads via a simple HTML interface
- Processes JPEG, PNG, and HEIC/HEIF images
- Automatic image compression for files over 2MB
- No authentication required (for testing purposes only)

## How to Use

### Web Interface

1. Start your NestJS server
2. Visit `http://localhost:YOUR_PORT/api/test-bedrock` in your browser
3. Upload a medical image using the provided form
4. Click "Analyze Medical Image" to process the image
5. View the JSON response with extracted medical information

### File Size Limits

- **Maximum file size**: 2MB
- Images larger than 2MB will be automatically compressed:
  - First by reducing image quality
  - Then by reducing dimensions if needed
  - Converted to WebP format for better compression

### API Endpoint

You can also directly call the API endpoint programmatically:

```bash
curl -X POST http://localhost:YOUR_PORT/api/test-bedrock/extract-medical-info \
  -H "Content-Type: application/json" \
  -d '{
    "base64Image": "YOUR_BASE64_ENCODED_IMAGE_HERE",
    "contentType": "image/jpeg",
    "filename": "optional_filename.jpg"
  }'
```

## Response Format

The API returns a structured JSON response with the following sections:

- `keyMedicalTerms`: Array of medical terms and their definitions
- `labValues`: Array of lab values with units and normal ranges
- `diagnoses`: Array of diagnoses with details and recommendations
- `metadata`: Information about the confidence and any missing information

## Security Considerations

This controller is intended for **testing purposes only** and bypasses authentication mechanisms. Do not use in production environments without proper security measures.

## Troubleshooting

### Common Errors

#### "Request entity too large"

This error occurs when the request body exceeds the server's size limit. To resolve:

1. Use the web interface which automatically compresses large images
2. Manually compress your image to under 2MB before uploading
3. Use lower resolution images that contain clear text
4. Convert to WebP format for better compression ratio

#### "File content appears to be encrypted or compressed"

This error occurs when AWS Bedrock cannot properly process the image format. To resolve:

1. Try a different image format (PNG often works better than JPEG)
2. Ensure the image is not encrypted or password protected
3. Take a new photo with better lighting and clarity
4. Avoid screenshots of PDFs - use the original document
5. Make sure the image is not heavily compressed

#### General Tips

- Ensure your AWS Bedrock credentials are properly configured
- Use clear, high-quality images of medical documents
- Check that uploaded images are in supported formats (JPEG, PNG, HEIC/HEIF)
- Verify the image contains medical information (lab reports, prescriptions, etc.)
- Make sure text is readable in the image
- Avoid cropped or partial images 