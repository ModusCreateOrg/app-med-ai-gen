import {
  Body,
  Controller,
  Post,
  HttpException,
  HttpStatus,
  Logger,
  Req,
  Get,
  Res,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { AwsBedrockService } from '../../services/aws-bedrock.service';
import { UploadMedicalImageDto, ExtractedMedicalInfoResponseDto } from './bedrock.dto';

/**
 * Controller for testing AWS Bedrock medical image extraction
 * This controller does not require authentication (for testing purposes only)
 */
@Controller('test-bedrock')
export class BedrockTestController {
  private readonly logger = new Logger(BedrockTestController.name);
  // Maximum allowed request size in bytes (2MB)
  private readonly MAX_FILE_SIZE = 2 * 1024 * 1024;

  constructor(private readonly bedrockService: AwsBedrockService) {
    // Log the controller initialization to verify it's being registered
    this.logger.log('BedrockTestController initialized');
  }

  /**
   * Serves the HTML test page
   */
  @Get()
  serveTestPage(@Res() res: Response) {
    this.logger.log('Serving inline HTML test page');

    // Send HTML directly
    res.setHeader('Content-Type', 'text/html');
    res.send(`<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AWS Bedrock Medical Image Analysis Test</title>
  <style>
    body {
      font-family: Arial, sans-serif;
      max-width: 800px;
      margin: 0 auto;
      padding: 20px;
    }
    .container {
      border: 1px solid #ddd;
      padding: 20px;
      border-radius: 5px;
    }
    .form-group {
      margin-bottom: 15px;
    }
    label {
      display: block;
      margin-bottom: 5px;
      font-weight: bold;
    }
    button {
      background-color: #4CAF50;
      color: white;
      padding: 10px 15px;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-size: 16px;
    }
    button:hover {
      background-color: #45a049;
    }
    button:disabled {
      background-color: #cccccc;
      cursor: not-allowed;
    }
    #preview {
      max-width: 100%;
      max-height: 300px;
      margin-top: 10px;
      display: none;
    }
    #result {
      margin-top: 20px;
      white-space: pre-wrap;
      background-color: #f5f5f5;
      padding: 15px;
      border-radius: 5px;
      display: none;
    }
    .error {
      background-color: #ffebee;
      color: #c62828;
      border-left: 4px solid #c62828;
    }
    .success {
      background-color: #e8f5e9;
      border-left: 4px solid #4CAF50;
    }
    .tips {
      margin-top: 20px;
      background-color: #e3f2fd;
      padding: 15px;
      border-radius: 5px;
      border-left: 4px solid #2196F3;
    }
    .warning {
      background-color: #fff3e0;
      padding: 15px;
      border-radius: 5px;
      border-left: 4px solid #ff9800;
      margin-bottom: 15px;
    }
    .file-info {
      font-size: 14px;
      color: #555;
      margin-top: 5px;
    }
    .spinner {
      border: 4px solid #f3f3f3;
      border-top: 4px solid #3498db;
      border-radius: 50%;
      width: 30px;
      height: 30px;
      animation: spin 2s linear infinite;
      display: none;
      margin: 20px auto;
    }
    @keyframes spin {
      0% { transform: rotate(0deg); }
      100% { transform: rotate(360deg); }
    }
    .format-selector {
      margin: 10px 0;
      display: flex;
      flex-wrap: wrap;
      gap: 10px;
    }
    .format-selector label {
      display: inline-flex;
      align-items: center;
      font-weight: normal;
      padding: 5px 10px;
      border: 1px solid #ddd;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.2s;
    }
    .format-selector label:hover {
      background-color: #f5f5f5;
    }
    .format-selector input[type="radio"] {
      margin-right: 5px;
    }
    .format-info {
      margin-top: 5px;
      font-size: 13px;
      color: #666;
    }
    .provider-section {
      margin-bottom: 1.5rem;
      border: 1px solid #ddd;
      border-radius: 5px;
      padding: 1rem;
    }
    .provider-section h3 {
      margin-top: 0;
      color: #2c3e50;
    }
    .model-list {
      list-style: none;
      padding: 0;
    }
    .model-item {
      display: flex;
      margin-bottom: 0.7rem;
      padding: 0.7rem;
      border: 1px solid #eee;
      border-radius: 4px;
      align-items: center;
    }
    .model-item:hover {
      background-color: #f9f9f9;
    }
    .model-item.selected {
      background-color: #e8f4ff;
      border-color: #4a90e2;
    }
    .model-item.supports-images {
      border-left: 3px solid #4caf50;
    }
    .select-model-btn {
      margin-right: 1rem;
      padding: 0.3rem 0.8rem;
      background-color: #4a90e2;
      color: white;
      border: none;
      border-radius: 3px;
      cursor: pointer;
    }
    .select-model-btn:hover:not([disabled]) {
      background-color: #3a7bc8;
    }
    .select-model-btn[disabled] {
      background-color: #cccccc;
      cursor: not-allowed;
      opacity: 0.7;
    }
  </style>
</head>
<body>
  <h1>AWS Bedrock Medical Image Analysis Test</h1>
  <div class="container">
    <div class="warning">
      <strong>File Size Limit:</strong> Images must be under 2MB. Larger files will be automatically compressed.
    </div>
    
    <div class="form-group">
      <label for="imageInput">Upload Medical Image:</label>
      <input type="file" id="imageInput" accept="image/jpeg,image/png,image/heic,image/heif">
      <div class="format-selector">
        <label><input type="radio" name="format" value="original" checked> Use original format</label>
        <label><input type="radio" name="format" value="png"> Convert to PNG</label>
        <label><input type="radio" name="format" value="webp"> Convert to WebP</label>
      </div>
      <div class="format-info">
        <strong>❗ Recommendation:</strong> PNG format tends to work best with AWS Bedrock. If your image isn't processing correctly, try converting to PNG.
      </div>
      <div id="fileInfo" class="file-info"></div>
    </div>
    <img id="preview" alt="Image preview">
    <button id="submit-btn">Analyze Medical Image</button>
    <button id="test-btn" class="btn">Test AWS Bedrock Connection</button>
    <button id="list-models-btn" class="btn">List Available Models</button>
    <div id="spinner" style="display: none;">Processing... <div class="loader"></div></div>
    <pre id="result" style="display: none;"></pre>
    
    <h3>Model Access</h3>
    <p>Current model: <span id="current-model">Loading...</span></p>
    <p>Recommended models for image analysis:</p>
    <ul>
      <li><code>amazon.titan-image-generator-v1:0</code> - Amazon's Titan model for image analysis</li>
      <li><code>amazon.nova-pro-v1:0</code> - Amazon's Nova Pro model with multimodal capabilities</li>
      <li><code>meta.llama3-2-90b-instruct-v1:0</code> - Meta's Llama model with image understanding</li>
    </ul>
    
    <h2>Available Models</h2>
    <div id="models-container"></div>
    
    <div class="tips">
      <h3>Troubleshooting Tips:</h3>
      <ul>
        <li><strong>Format Issues:</strong> If you see "encrypted or compressed" errors, try:
          <ul>
            <li>The <strong>Convert to PNG</strong> option above - this works best for most users</li>
            <li>Take a photo with better lighting</li>
            <li>Use a scanner app instead of your camera</li>
          </ul>
        </li>
        <li><strong>File Size:</strong> Images must be under 2MB to avoid "request entity too large" errors</li>
        <li><strong>Image Quality:</strong> Clear, well-lit images work best; avoid glare and shadows</li>
        <li><strong>Text Clarity:</strong> Make sure all text in the document is clearly visible</li>
        <li><strong>Document Type:</strong> Complete pages work better than cropped sections</li>
        <li><strong>Model Access:</strong> You must have permission to access AWS Bedrock models. Use the "List Available Models" button to check access. Recommended models:
          <ul>
            <li><code>amazon.titan-image-generator-v1</code> - Amazon's Titan model for image analysis</li>
            <li><code>anthropic.claude-3-haiku-20240307-v1:0</code> - Claude 3 Haiku (less powerful but accessible)</li>
            <li><code>anthropic.claude-3-sonnet-20240229-v1:0</code> - Claude 3 Sonnet (better quality)</li>
          </ul>
        </li>
      </ul>
    </div>
  </div>

  <script>
    document.addEventListener('DOMContentLoaded', () => {
      const fileInput = document.getElementById('imageInput');
      const formatRadios = document.querySelectorAll('input[name="format"]');
      const imagePreview = document.getElementById('preview');
      const submitBtn = document.getElementById('submit-btn');
      const testBtn = document.getElementById('test-btn');
      const listModelsBtn = document.getElementById('list-models-btn');
      const result = document.getElementById('result');
      const spinner = document.getElementById('spinner');
      const fileInfo = document.getElementById('fileInfo');
      const currentModel = document.getElementById('current-model');
      const modelsContainer = document.getElementById('models-container');
      
      // Verify all elements exist
      if (!fileInput) console.error("Element not found: imageInput");
      if (!imagePreview) console.error("Element not found: preview");
      if (!submitBtn) console.error("Element not found: submit-btn");
      if (!testBtn) console.error("Element not found: test-btn");
      if (!listModelsBtn) console.error("Element not found: list-models-btn");
      if (!result) console.error("Element not found: result");
      if (!spinner) console.error("Element not found: spinner");
      if (!fileInfo) console.error("Element not found: fileInfo");
      if (!currentModel) console.error("Element not found: current-model");
      if (!modelsContainer) console.error("Element not found: models-container");
      if (formatRadios.length === 0) console.error("No format radio buttons found");
      
      // Log element existence to console
      console.log("DOM Elements:", {
        imageInput: !!fileInput,
        preview: !!imagePreview,
        submitBtn: !!submitBtn,
        testBtn: !!testBtn,
        listModelsBtn: !!listModelsBtn,
        result: !!result,
        spinner: !!spinner,
        fileInfo: !!fileInfo,
        currentModel: !!currentModel,
        modelsContainer: !!modelsContainer,
        formatRadios: formatRadios.length
      });
      
      // Maximum file size in bytes (2MB)
      const MAX_FILE_SIZE = 2 * 1024 * 1024;
      let compressedImageData = null;
      let selectedFormat = "original";
      
      // Handle format selection changes
      formatRadios.forEach(radio => {
        radio.addEventListener("change", function() {
          selectedFormat = this.value;
          
          // If we have a file selected, reprocess it with the new format
          if (imageInput.files && imageInput.files[0]) {
            processSelectedImage(imageInput.files[0]);
          }
        });
      });
      
      // Display image preview when a file is selected
      imageInput.addEventListener("change", function() {
        const file = this.files[0];
        if (file) {
          processSelectedImage(file);
        }
      });
      
      // Process the selected image
      function processSelectedImage(file) {
        // Display file information
        const fileSizeInKB = (file.size / 1024).toFixed(2);
        fileInfo.textContent = "File: " + file.name + " (" + fileSizeInKB + " KB)";
        fileInfo.style.color = file.size > MAX_FILE_SIZE ? "#c62828" : "#555";
        
        if (file.size > MAX_FILE_SIZE) {
          fileInfo.textContent += " - Will be compressed";
        }
        
        // Clear previous results
        result.style.display = "none";
        result.className = "";
        compressedImageData = null;
        
        // Show preview
        const reader = new FileReader();
        reader.onload = function(e) {
          preview.src = e.target.result;
          preview.style.display = "block";
          
          // Convert format if needed
          if (selectedFormat !== "original" || file.size > MAX_FILE_SIZE) {
            processImageWithCanvas(e.target.result, file);
          }
        };
        reader.readAsDataURL(file);
        
        // Log file information
        console.log("File selected:", {
          name: file.name,
          type: file.type,
          size: fileSizeInKB + " KB"
        });
      }
      
      // Process image with canvas to handle format conversion and compression
      function processImageWithCanvas(dataUrl, file) {
        const img = new Image();
        
        img.onload = function() {
          // Create canvas
          const canvas = document.createElement("canvas");
          const ctx = canvas.getContext("2d");
          
          // Set initial dimensions
          let width = img.width;
          let height = img.height;
          canvas.width = width;
          canvas.height = height;
          
          // Draw with white background
          ctx.fillStyle = "#FFFFFF";
          ctx.fillRect(0, 0, width, height);
          ctx.drawImage(img, 0, 0, width, height);
          
          // Determine target format
          let targetFormat = file.type; // Default to original
          if (selectedFormat === "png") {
            targetFormat = "image/png";
          } else if (selectedFormat === "webp") {
            targetFormat = "image/webp";
          } else if (file.size > MAX_FILE_SIZE) {
            // Use WebP for compression if no specific format selected
            targetFormat = "image/webp";
          }
          
          let resultDataUrl;
          let resultSize;
          
          // Handle compression for large files
          if (file.size > MAX_FILE_SIZE) {
            // Try different quality levels
            let quality = 0.7;
            let isSmallEnough = false;
            
            while (quality > 0.1 && !isSmallEnough) {
              resultDataUrl = canvas.toDataURL(targetFormat, quality);
              const prefix = "data:" + targetFormat + ";base64,";
              resultSize = Math.round((resultDataUrl.length - prefix.length) * 0.75);
              
              console.log("Trying quality: " + quality + ", size: " + (resultSize / 1024).toFixed(2) + " KB");
              
              if (resultSize < MAX_FILE_SIZE) {
                isSmallEnough = true;
              } else {
                quality -= 0.1;
              }
            }
            
            // If still too large, reduce dimensions
            if (!isSmallEnough) {
              console.log("Reducing dimensions for further compression");
              
              // Calculate new dimensions
              const scale = Math.sqrt(MAX_FILE_SIZE / (width * height * 4));
              width = Math.floor(width * scale);
              height = Math.floor(height * scale);
              
              // Resize canvas
              canvas.width = width;
              canvas.height = height;
              
              // Redraw image
              ctx.fillStyle = "#FFFFFF";
              ctx.fillRect(0, 0, width, height);
              ctx.drawImage(img, 0, 0, width, height);
              
              // Try again with lower quality
              resultDataUrl = canvas.toDataURL(targetFormat, 0.6);
              const prefix = "data:" + targetFormat + ";base64,";
              resultSize = Math.round((resultDataUrl.length - prefix.length) * 0.75);
            }
            
            // Update UI to show compression result
            const resultSizeKB = (resultSize / 1024).toFixed(2);
            fileInfo.textContent += " → Compressed to " + resultSizeKB + " KB";
            
            console.log("Image processed:", {
              originalType: file.type,
              newType: targetFormat,
              originalSize: (file.size / 1024).toFixed(2) + " KB",
              newSize: resultSizeKB + " KB",
              dimensions: width + "x" + height
            });
          } 
          // Simple format conversion without compression
          else if (selectedFormat !== "original") {
            resultDataUrl = canvas.toDataURL(targetFormat, 0.9);
            const prefix = "data:" + targetFormat + ";base64,";
            resultSize = Math.round((resultDataUrl.length - prefix.length) * 0.75);
            
            // Update UI to show conversion
            fileInfo.textContent += " → Converted to " + selectedFormat.toUpperCase();
            
            console.log("Image converted:", {
              from: file.type,
              to: targetFormat,
              size: (resultSize / 1024).toFixed(2) + " KB"
            });
          }
          
          // Save processed image
          compressedImageData = resultDataUrl;
        };
        
        img.src = dataUrl;
      }
      
      // Handle analyze button click
      submitBtn.addEventListener("click", async function() {
        const file = imageInput.files[0];
        if (!file) {
          alert("Please select an image file first");
          return;
        }
        
        // Show loading spinner
        spinner.style.display = "block";
        submitBtn.disabled = true;
        result.style.display = "none";
        
        try {
          // Validate file type
          if (!["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"].includes(file.type)) {
            throw new Error("Unsupported file format. Please use JPEG, PNG, or HEIC/HEIF images.");
          }
          
          // Determine which image data to use
          let base64Image;
          let contentType;
          
          if (compressedImageData && (file.size > MAX_FILE_SIZE || selectedFormat !== "original")) {
            // Use converted/compressed image
            base64Image = compressedImageData;
            
            // Set the correct content type based on format and data
            if (selectedFormat === "png") {
              contentType = "image/png";
            } else if (selectedFormat === "webp") {
              contentType = "image/webp";
            } else if (base64Image.startsWith("data:image/png;")) {
              contentType = "image/png";
            } else if (base64Image.startsWith("data:image/webp;")) {
              contentType = "image/webp";
            } else {
              contentType = file.type;
            }
            
            console.log("Using " + (selectedFormat !== "original" ? "converted" : "compressed") + " image for submission: " + contentType);
          } else {
            // Use original image
            base64Image = await fileToBase64(file);
            contentType = file.type;
            console.log("Using original image for submission");
          }
          
          // Extract base64 data without prefix
          const base64WithoutPrefix = base64Image.split(",")[1];
          
          // Log image info for debugging
          console.log("Processing image:", {
            type: contentType,
            size: ((base64WithoutPrefix.length * 0.75) / 1024).toFixed(2) + " KB",
            name: file.name
          });
          
          // Prepare request data
          const requestData = {
            base64Image: base64WithoutPrefix,
            contentType: contentType,
            filename: file.name
          };
          
          // Debug log before fetch
          console.log("About to send request to: /api/test-bedrock/extract-medical-info");
          
          // Send request to API
          const response = await fetch("/api/test-bedrock/extract-medical-info", {
            method: "POST",
            headers: {
              "Content-Type": "application/json"
            },
            body: JSON.stringify(requestData)
          }).catch(fetchError => {
            console.error("Network error:", fetchError);
            throw new Error("Failed to connect to the server. Please check your network connection.");
          });
          
          // Debug log after fetch
          console.log("Received response:", response.status, response.statusText);
          
          // Process response
          const contentTypeHeader = response.headers.get("content-type");
          
          if (!response.ok) {
            let errorMessage = "";
            
            if (contentTypeHeader && contentTypeHeader.includes("application/json")) {
              const errorData = await response.json();
              errorMessage = errorData.message || "Error " + response.status + ": " + response.statusText;
              
              // Provide more helpful messages for common errors
              if (errorMessage.includes("encrypted or compressed")) {
                errorMessage = "The image format is not recognized or may be corrupted. Please try: \\n" +
                  "1. Use a different image format (try PNG instead of JPEG)\\n" +
                  "2. Ensure the image is not encrypted or password protected\\n" +
                  "3. Take a new photo of the document with better lighting";
              } else if (response.status === 413 || errorMessage.includes("request entity too large")) {
                errorMessage = "The image is too large. Please: \\n" +
                  "1. Use an image under 2MB in size\\n" +
                  "2. Reduce the image resolution or compress it\\n" +
                  "3. Try using the provided compression by selecting a smaller image";
              }
            } else {
              errorMessage = await response.text() || "API Error (" + response.status + "): " + response.statusText;
              
              if (response.status === 413) {
                errorMessage = "Request entity too large: The image file is too large. Please reduce the image size to under 2MB.";
              }
            }
            
            throw new Error(errorMessage);
          }
          
          const data = await response.json();
          
          // Display result
          result.textContent = JSON.stringify(data, null, 2);
          result.className = "success";
          result.style.display = "block";
        } catch (error) {
          console.error("Error:", error);
          result.textContent = "Error: " + (error.message || "Unknown error");
          result.className = "error";
          result.style.display = "block";
        } finally {
          // Hide spinner
          spinner.style.display = "none";
          submitBtn.disabled = false;
        }
      });
      
      // Test connection button click handler
      testBtn.addEventListener("click", async function() {
        result.innerHTML = '';
        result.className = '';
        result.style.display = "none";
        spinner.style.display = "block";
        
        try {
          const response = await fetch("/api/test-bedrock/health");
          const data = await response.json();
          
          result.textContent = JSON.stringify(data, null, 2);
          result.className = 'success';
          result.style.display = "block";
        } catch (error) {
          result.textContent = "Error: " + (error.message || "Unknown error");
          result.className = 'error';
          result.style.display = "block";
        } finally {
          spinner.style.display = "none";
        }
      });
      
      // List models button click handler
      listModelsBtn.addEventListener("click", async function() {
        result.innerHTML = '';
        result.className = '';
        result.style.display = "none";
        spinner.style.display = "block";
        modelsContainer.innerHTML = '';
        
        try {
          const response = await fetch("/api/test-bedrock/list-models");
          const data = await response.json();
          
          // Display the full JSON response in the result area
          result.textContent = JSON.stringify(data, null, 2);
          result.className = 'success';
          result.style.display = "block";
          
          // Update the current model display if available in the response
          if (data.currentModel && data.currentModel.modelId) {
            currentModel.textContent = data.currentModel.modelId;
            if (data.currentModel.inferenceProfileArn) {
              currentModel.textContent += " (using inference profile)";
            }
          }
          
          // Also create a more user-friendly display of models
          if (data.models && data.models.length > 0) {
            const modelsByProvider = data.models.reduce((acc, model) => {
              if (!acc[model.providerName]) {
                acc[model.providerName] = [];
              }
              acc[model.providerName].push(model);
              return acc;
            }, {});
            
            // Create sections for each provider
            Object.keys(modelsByProvider).sort().forEach(provider => {
              const providerDiv = document.createElement('div');
              providerDiv.className = 'provider-section';
              
              const providerHeader = document.createElement('h3');
              providerHeader.textContent = provider;
              providerDiv.appendChild(providerHeader);
              
              const modelList = document.createElement('ul');
              modelList.className = 'model-list';
              
              // Add models for this provider
              modelsByProvider[provider]
                .sort((a, b) => a.modelName.localeCompare(b.modelName))
                .forEach(model => {
                  const modelItem = document.createElement('li');
                  modelItem.className = 'model-item';
                  
                  // Check if model supports image input
                  const supportsImages = model.inputModalities.includes('IMAGE');
                  if (supportsImages) {
                    modelItem.classList.add('supports-images');
                  }
                  
                  // Model info
                  const modelInfo = document.createElement('div');
                  modelInfo.innerHTML = 
                    "<strong>" + model.modelName + "</strong> (" + model.modelId + ")<br>" +
                    "Input: " + model.inputModalities.join(', ') + "<br>" +
                    "Output: " + model.outputModalities.join(', ');
                  
                  modelItem.appendChild(modelInfo);
                  modelList.appendChild(modelItem);
                });
              
              providerDiv.appendChild(modelList);
              modelsContainer.appendChild(providerDiv);
            });
          }
        } catch (error) {
          result.textContent = "Error listing models: " + (error.message || "Unknown error");
          result.className = 'error';
          result.style.display = "block";
        } finally {
          spinner.style.display = "none";
        }
      });
      
      // Debug log to verify event listeners are attached
      console.log("Event listeners attached to buttons");

      // Load current model info when page loads
      fetchCurrentModelInfo();
      
      // Function to fetch and display current model info
      async function fetchCurrentModelInfo() {
        try {
          const response = await fetch("/api/test-bedrock/list-models");
          const data = await response.json();
          
          // Update the current model display if available
          if (data.currentModel && data.currentModel.modelId) {
            currentModel.textContent = data.currentModel.modelId;
            if (data.currentModel.inferenceProfileArn) {
              currentModel.textContent += " (using inference profile)";
            }
          } else {
            currentModel.textContent = "Not configured";
          }
        } catch (error) {
          console.error("Error fetching current model:", error);
          currentModel.textContent = "Error fetching model info";
        }
      }
    });
    
    // Helper function to convert file to base64
    function fileToBase64(file) {
      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
      });
    }
  </script>
</body>
</html>`);
  }

  /**
   * Lists available models in AWS Bedrock
   */
  @Get('list-models')
  async listAvailableModels() {
    this.logger.log('Listing available AWS Bedrock models');
    try {
      const models = await this.bedrockService.listAvailableModels();

      // Get current model information directly from the service instance
      const currentModel = {
        modelId: this.bedrockService['modelId'], // Access the modelId property
        inferenceProfileArn: this.bedrockService['inferenceProfileArn'], // Access the inferenceProfileArn property if it exists
      };

      return {
        status: 'success',
        currentModel,
        models,
      };
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      this.logger.error('Failed to list AWS Bedrock models: ' + errorMessage);
      throw new HttpException(
        'Failed to list AWS Bedrock models: ' + errorMessage,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  /**
   * Debug endpoint to verify the controller is working
   */
  @Get('health')
  healthCheck() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }

  /**
   * Extracts medical information from an uploaded image
   *
   * @param dto The DTO containing the base64 encoded image and content type
   * @param req The request object (for extracting client IP)
   * @returns Extracted medical information
   */
  @Post('extract-medical-info')
  async extractMedicalInfo(
    @Body() dto: UploadMedicalImageDto,
    @Req() req: Request,
  ): Promise<ExtractedMedicalInfoResponseDto> {
    this.logger.log(
      'Processing image extraction request: ' +
        (dto.filename || 'unnamed') +
        ', type: ' +
        dto.contentType,
    );

    try {
      // Check the base64 string size
      const estimatedSizeInBytes = dto.base64Image.length * 0.75;
      if (estimatedSizeInBytes > this.MAX_FILE_SIZE) {
        this.logger.warn(
          `Image size exceeds limit: ${(estimatedSizeInBytes / 1024 / 1024).toFixed(2)}MB, max: ${(this.MAX_FILE_SIZE / 1024 / 1024).toFixed(2)}MB`,
        );
        throw new HttpException(
          'Image size exceeds maximum allowed (2MB). Please compress or resize the image.',
          HttpStatus.PAYLOAD_TOO_LARGE,
        );
      }

      // Convert base64 to buffer
      const imageBuffer = Buffer.from(dto.base64Image, 'base64');

      // Log the image size for debugging
      this.logger.log(
        `Image size: ${(imageBuffer.length / 1024).toFixed(2)} KB, Content type: ${dto.contentType}`,
      );

      // Basic image validation (check first bytes for expected patterns)
      // This can help detect corrupted images early
      this.validateImageBuffer(imageBuffer, dto.contentType);

      // Get client IP for rate limiting
      const clientIp = req.ip || req.connection.remoteAddress;
      this.logger.log(`Client IP: ${clientIp}`);

      // Call the service method
      const result = await this.bedrockService.extractMedicalInfo(
        imageBuffer,
        dto.contentType,
        clientIp,
      );

      this.logger.log('Successfully processed image extraction request');
      return result;
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';

      // Log detailed error information
      this.logger.error('Failed to extract medical information: ' + errorMessage, {
        contentType: dto.contentType,
        filename: dto.filename || 'unnamed',
        imageSize: dto.base64Image
          ? ((dto.base64Image.length * 0.75) / 1024).toFixed(2) + ' KB'
          : 'unknown',
      });

      // Handle specific error cases with better user messages
      if (errorMessage.includes('encrypted or compressed')) {
        throw new HttpException(
          'File content appears to be encrypted or compressed. Try using PNG format and ensure the image is not corrupted.',
          HttpStatus.BAD_REQUEST,
        );
      } else if (errorMessage.includes('Invalid image format')) {
        throw new HttpException(
          'Invalid image format. Please use JPEG, PNG, or HEIC/HEIF formats',
          HttpStatus.BAD_REQUEST,
        );
      }

      if (error instanceof HttpException) {
        throw error;
      }

      throw new HttpException(
        errorMessage || 'Failed to extract medical information from image',
        HttpStatus.BAD_REQUEST,
      );
    }
  }

  /**
   * Validates that the image buffer contains valid image data for the given content type
   * This helps catch corrupted images before sending to AWS Bedrock
   */
  private validateImageBuffer(buffer: Buffer, contentType: string): void {
    // Check if buffer is large enough to contain a valid image header
    if (buffer.length < 4) {
      throw new HttpException('Image data is too small to be valid', HttpStatus.BAD_REQUEST);
    }

    // Check file signatures based on content type
    switch (contentType) {
      case 'image/jpeg':
        // JPEG files start with FF D8 FF
        if (buffer[0] !== 0xff || buffer[1] !== 0xd8 || buffer[2] !== 0xff) {
          this.logger.warn('Invalid JPEG header detected');
          throw new HttpException(
            'Invalid JPEG format detected. Try saving as PNG instead.',
            HttpStatus.BAD_REQUEST,
          );
        }
        break;

      case 'image/png':
        // PNG files start with 89 50 4E 47 0D 0A 1A 0A (in hex)
        if (buffer[0] !== 0x89 || buffer[1] !== 0x50 || buffer[2] !== 0x4e || buffer[3] !== 0x47) {
          this.logger.warn('Invalid PNG header detected');
          throw new HttpException(
            'Invalid PNG format detected. The image may be corrupted.',
            HttpStatus.BAD_REQUEST,
          );
        }
        break;

      case 'image/webp':
        // Basic validation for WebP (check for RIFF header)
        const headerStr = buffer.slice(0, 4).toString('ascii');
        if (headerStr !== 'RIFF') {
          this.logger.warn('Invalid WebP header detected');
          throw new HttpException(
            'Invalid WebP format detected. Try using PNG format instead.',
            HttpStatus.BAD_REQUEST,
          );
        }
        break;

      // HEIC/HEIF validation is more complex and skipped for simplicity
    }
  }
}
