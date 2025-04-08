import {
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
  Body,
  BadRequestException,
  Logger,
  Get,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  DocumentProcessorService,
  ProcessedDocumentResult,
} from '../services/document-processor.service';
import { Express } from 'express';
import { Response } from 'express';

@Controller('document-processor')
export class DocumentProcessorController {
  private readonly logger = new Logger(DocumentProcessorController.name);

  constructor(private readonly documentProcessorService: DocumentProcessorService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  async processDocument(
    @UploadedFile() file: Express.Multer.File,
    @Body('userId') userId: string,
    @Body('debug') debug?: string,
  ): Promise<ProcessedDocumentResult | any> {
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    // Validate file type
    const validMimeTypes = ['image/jpeg', 'image/png', 'image/tiff', 'application/pdf'];

    if (!validMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        `Invalid file type: ${file.mimetype}. Supported types: JPEG, PNG, TIFF, and PDF.`,
      );
    }

    // Validate file size (10MB max)
    const maxSizeBytes = 10 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      throw new BadRequestException(`File size exceeds maximum allowed (10MB)`);
    }

    // Use test userId if not provided
    const effectiveUserId = userId || 'test-user-id';

    // Check if debug mode is enabled
    const debugMode = debug === 'true';

    this.logger.log(
      `Processing document: ${file.originalname} (${file.mimetype})${debugMode ? ' with DEBUG enabled' : ''}`,
    );

    try {
      // Process the document
      const result = await this.documentProcessorService.processDocument(
        file.buffer,
        file.mimetype,
        effectiveUserId,
      );

      // If debug mode is enabled, include the raw responses from AWS services
      if (debugMode) {
        this.logger.debug('DEBUG: Document processing result', {
          extractedTextRaw: result.extractedText,
          analysisRaw: result.analysis,
        });

        // For debugging purposes, return the complete raw result
        return {
          ...result,
          _debug: {
            timestamp: new Date().toISOString(),
            rawExtractedText: result.extractedText,
            rawAnalysis: result.analysis,
          },
        };
      }

      return result.analysis;
    } catch (error: unknown) {
      this.logger.error(
        `Error processing document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      throw error;
    }
  }

  @Get('test')
  getTestStatus(): { status: string } {
    return { status: 'DocumentProcessorController is working' };
  }

  @Get('test-form')
  getUploadForm(@Res() res: Response): void {
    const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Medical Document Processor Test</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1 {
          color: #333;
        }
        .form-group {
          margin-bottom: 15px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: bold;
        }
        input[type="file"] {
          display: block;
          margin-bottom: 10px;
        }
        input[type="text"] {
          width: 300px;
          padding: 8px;
        }
        .checkbox-container {
          display: flex;
          align-items: center;
          margin-top: 5px;
        }
        .checkbox-container label {
          display: inline;
          margin-left: 8px;
          font-weight: normal;
        }
        input[type="checkbox"] {
          transform: scale(1.2);
        }
        .debug-info {
          color: #666;
          font-size: 0.9em;
          margin-top: 5px;
          margin-left: 25px;
        }
        button {
          background-color: #4CAF50;
          color: white;
          padding: 10px 15px;
          border: none;
          border-radius: 4px;
          cursor: pointer;
        }
        button:hover {
          background-color: #45a049;
        }
        #result {
          margin-top: 20px;
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 4px;
          background-color: #f9f9f9;
          display: none;
        }
        .loading {
          display: none;
          margin-top: 15px;
        }
        #filePreview {
          margin-top: 20px;
          display: none;
          border: 1px solid #ddd;
          padding: 15px;
          border-radius: 4px;
          background-color: #f5f5f5;
        }
        #imagePreview {
          max-width: 100%;
          max-height: 300px;
          display: block;
          margin: 0 auto;
        }
        .fileInfo {
          margin-top: 10px;
        }
        .pdfIcon {
          width: 64px;
          height: 64px;
          margin-right: 15px;
          vertical-align: middle;
        }
        pre {
          white-space: pre-wrap;
          word-wrap: break-word;
          max-height: 400px;
          overflow-y: auto;
          background-color: #f0f0f0;
          padding: 10px;
          border-radius: 4px;
        }
        .debug-section {
          margin-top: 20px;
          border-top: 1px dashed #999;
          padding-top: 10px;
        }
        .debug-toggle {
          cursor: pointer;
          color: #0066cc;
          margin-bottom: 10px;
          user-select: none;
        }
        .debug-content {
          display: none;
        }
      </style>
    </head>
    <body>
      <h1>Medical Document Processor Test</h1>
      <p>Upload a medical document (PDF or image) to see the extracted text and analysis.</p>
      
      <form id="uploadForm" enctype="multipart/form-data">
        <div class="form-group">
          <label for="file">Select File (PDF, JPEG, PNG, TIFF):</label>
          <input type="file" id="file" name="file" accept=".pdf,.jpg,.jpeg,.png,.tiff">
        </div>
        
        <div id="filePreview"></div>
        
        <div class="form-group">
          <label for="userId">User ID (optional):</label>
          <input type="text" id="userId" name="userId" placeholder="test-user-id">
        </div>
        
        <div class="form-group">
          <label>Debugging:</label>
          <div class="checkbox-container">
            <input type="checkbox" id="debug" name="debug">
            <label for="debug">Enable debug mode</label>
          </div>
          <div class="debug-info">
            When enabled, the response will include the complete raw output from both AWS Textract and Bedrock services.
            This is useful for troubleshooting but will produce a much larger response.
          </div>
        </div>
        
        <button type="submit">Process Document</button>
      </form>
      
      <div class="loading" id="loading">Processing document... This may take a minute.</div>
      
      <div id="result">
        <h2>Result</h2>
        <div id="resultContent"></div>
      </div>
      
      <script>
        // PDF icon as base64 - simple document icon
        const pdfIconBase64 = 'data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA1MTIgNTEyIj48cGF0aCBkPSJNNDU2IDEzNC4xTDM1NS45IDM0Yy04LjgtOC44LTIwLjctMTMuOS0zMy4xLTEzLjlIMTM2Yy0yNi41IDAtNDggMjEuNS00OCA0OHYzNjhjMCAyNi41IDIxLjUgNDggNDggNDhoMjQwYzI2LjUgMCA0OC0yMS41IDQ4LTQ4VjE2Ny4xYzAtMTIuNC01LjEtMjQuMy0xMy45LTMzek0zMjQgNTEuOUwzOTcuNSAxMjVIMzI0VjUxLjl6TTQwOCA0NjRjMCA4LjgtNy4yIDE2LTE2IDE2SDE2MGMtOC44IDAtMTYtNy4yLTE2LTE2VjQ4YzAtOC44IDcuMi0xNiAxNi0xNmgxNDh2MTA0YzAgMTMuMyAxMC43IDI0IDI0IDI0aDEwNHYzMDR6Ii8+PC9zdmc+';
        
        // Function to format file size
        function formatFileSize(bytes) {
          if (bytes < 1024) return bytes + ' bytes';
          else if (bytes < 1048576) return (bytes / 1024).toFixed(1) + ' KB';
          else return (bytes / 1048576).toFixed(1) + ' MB';
        }
        
        // Format debug sections with toggles
        function formatDebugResult(result) {
          const resultContainer = document.getElementById('resultContent');
          resultContainer.innerHTML = '';
          
          // Create the main result section
          const mainSection = document.createElement('div');
          
          // Format the regular result (excluding _debug)
          const { _debug, ...regularResult } = result;
          const regularPre = document.createElement('pre');
          regularPre.textContent = JSON.stringify(regularResult, null, 2);
          mainSection.appendChild(regularPre);
          
          // Create debug section if available
          if (_debug) {
            const debugSection = document.createElement('div');
            debugSection.className = 'debug-section';
            
            // Textract Debug Toggle
            const textractToggle = document.createElement('div');
            textractToggle.className = 'debug-toggle';
            textractToggle.textContent = '▶ Show Raw Textract Response';
            textractToggle.onclick = function() {
              const content = this.nextElementSibling;
              if (content.style.display === 'block') {
                content.style.display = 'none';
                this.textContent = '▶ Show Raw Textract Response';
              } else {
                content.style.display = 'block';
                this.textContent = '▼ Hide Raw Textract Response';
              }
            };
            
            // Textract Debug Content
            const textractContent = document.createElement('div');
            textractContent.className = 'debug-content';
            const textractPre = document.createElement('pre');
            textractPre.textContent = JSON.stringify(_debug.rawExtractedText, null, 2);
            textractContent.appendChild(textractPre);
            
            // Bedrock Debug Toggle
            const bedrockToggle = document.createElement('div');
            bedrockToggle.className = 'debug-toggle';
            bedrockToggle.textContent = '▶ Show Raw Bedrock Response';
            bedrockToggle.onclick = function() {
              const content = this.nextElementSibling;
              if (content.style.display === 'block') {
                content.style.display = 'none';
                this.textContent = '▶ Show Raw Bedrock Response';
              } else {
                content.style.display = 'block';
                this.textContent = '▼ Hide Raw Bedrock Response';
              }
            };
            
            // Bedrock Debug Content
            const bedrockContent = document.createElement('div');
            bedrockContent.className = 'debug-content';
            const bedrockPre = document.createElement('pre');
            bedrockPre.textContent = JSON.stringify(_debug.rawAnalysis, null, 2);
            bedrockContent.appendChild(bedrockPre);
            
            // Add all debug elements
            debugSection.appendChild(document.createElement('h3')).textContent = 'Debug Information';
            debugSection.appendChild(textractToggle);
            debugSection.appendChild(textractContent);
            debugSection.appendChild(bedrockToggle);
            debugSection.appendChild(bedrockContent);
            
            mainSection.appendChild(debugSection);
          }
          
          resultContainer.appendChild(mainSection);
        }
        
        // Show file preview when a file is selected
        document.getElementById('file').addEventListener('change', (e) => {
          const fileInput = e.target;
          const previewContainer = document.getElementById('filePreview');
          
          if (fileInput.files && fileInput.files[0]) {
            const file = fileInput.files[0];
            const fileType = file.type;
            
            previewContainer.innerHTML = '';
            previewContainer.style.display = 'block';
            
            // Common file information
            const fileInfo = document.createElement('div');
            fileInfo.className = 'fileInfo';
            fileInfo.innerHTML = \`<strong>Name:</strong> \${file.name}<br><strong>Size:</strong> \${formatFileSize(file.size)}\`;
            
            if (fileType.startsWith('image/')) {
              // Image preview
              const img = document.createElement('img');
              img.id = 'imagePreview';
              img.src = URL.createObjectURL(file);
              img.onload = function() {
                URL.revokeObjectURL(this.src);
              }
              
              previewContainer.appendChild(img);
              previewContainer.appendChild(fileInfo);
            } else if (fileType === 'application/pdf') {
              // PDF preview (just show icon and file info)
              const container = document.createElement('div');
              container.style.display = 'flex';
              container.style.alignItems = 'center';
              
              const icon = document.createElement('img');
              icon.className = 'pdfIcon';
              icon.src = pdfIconBase64;
              
              const pdfInfo = document.createElement('div');
              pdfInfo.innerHTML = \`<strong>PDF Document</strong><br>\${file.name}<br>\${formatFileSize(file.size)}\`;
              
              container.appendChild(icon);
              container.appendChild(pdfInfo);
              previewContainer.appendChild(container);
            }
          } else {
            previewContainer.style.display = 'none';
            previewContainer.innerHTML = '';
          }
        });
        
        document.getElementById('uploadForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const fileInput = document.getElementById('file');
          const userId = document.getElementById('userId').value;
          const debug = document.getElementById('debug').checked;
          
          if (!fileInput.files[0]) {
            alert('Please select a file');
            return;
          }
          
          const formData = new FormData();
          formData.append('file', fileInput.files[0]);
          if (userId) {
            formData.append('userId', userId);
          }
          if (debug) {
            formData.append('debug', 'true');
          }
          
          document.getElementById('loading').style.display = 'block';
          document.getElementById('result').style.display = 'none';
          
          try {
            const response = await fetch('/api/document-processor/upload', {
              method: 'POST',
              body: formData
            });
            
            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.message || 'Error processing the document');
            }
            
            const result = await response.json();
            
            if (debug) {
              formatDebugResult(result);
            } else {
              document.getElementById('resultContent').innerHTML = '<pre>' + JSON.stringify(result, null, 2) + '</pre>';
            }
            
            document.getElementById('result').style.display = 'block';
          } catch (error) {
            alert('Error: ' + (error.message || 'Failed to process document'));
          } finally {
            document.getElementById('loading').style.display = 'none';
          }
        });
      </script>
    </body>
    </html>
    `;

    res.type('text/html').send(html);
  }
}
