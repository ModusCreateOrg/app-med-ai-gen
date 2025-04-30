import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { createHash } from 'crypto';
import { AwsTextractService, ExtractedTextResult } from './aws-textract.service';
import { AwsBedrockService, MedicalDocumentAnalysis } from './aws-bedrock.service';
import { PerplexityService } from '../../services/perplexity.service';

/**
 * Result interface for processed medical documents
 */
export interface ProcessedDocumentResult {
  extractedText: ExtractedTextResult;
  analysis: MedicalDocumentAnalysis;
  processingMetadata: {
    processingTimeMs: number;
    fileSize: number;
  };
}

/**
 * Service for processing medical documents using AWS Textract for text extraction
 * and AWS Bedrock for medical document analysis
 */
@Injectable()
export class DocumentProcessorService {
  private readonly logger = new Logger(DocumentProcessorService.name);

  constructor(
    private readonly textractService: AwsTextractService,
    private readonly bedrockService: AwsBedrockService,
    private readonly perplexityService: PerplexityService,
  ) {}

  /**
   * Process a medical document by extracting text and performing analysis
   * @param fileBuffer The file buffer containing the image or PDF
   * @param userId The authenticated user's ID for rate limiting
   * @returns Processed document result with extracted text, analysis, and simplified explanation
   */
  async processDocument(fileBuffer: Buffer, userId: string): Promise<ProcessedDocumentResult> {
    try {
      const startTime = Date.now();

      this.logger.log('Starting document processing', {
        fileSize: `${(fileBuffer.length / 1024).toFixed(2)} KB`,
        userId: this.hashIdentifier(userId),
      });

      // Step 1: Extract text from document using AWS Textract
      const extractedText = await this.textractService.extractText(fileBuffer, userId);

      this.logger.log('Text extraction completed', {
        lineCount: extractedText.lines.length,
        tableCount: extractedText.tables.length,
      });

      // Step 2: Analyze extracted text using AWS Bedrock
      const analysis = await this.bedrockService.analyzeMedicalDocument(
        extractedText.rawText,
        userId,
      );

      // Step 3: Review and verify analysis using Perplexity
      this.logger.log('Reviewing medical analysis with Perplexity');

      try {
        const verifiedLabValues = await this.perplexityService.reviewLabValuesAnalysis(
          analysis.labValues,
          extractedText.rawText,
        );
        analysis.labValues = verifiedLabValues;

        this.logger.log('Analysis verified and possibly corrected by Perplexity');
      } catch (reviewError) {
        this.logger.error('Error reviewing analysis with Perplexity', {
          error: reviewError instanceof Error ? reviewError.message : 'Unknown error',
        });
      }

      const processingTime = Date.now() - startTime;

      this.logger.log(`Document processing completed in ${processingTime}ms`, {
        isMedicalReport: analysis.metadata.isMedicalReport,
        confidence: analysis.metadata.confidence,
        labValueCount: analysis.labValues.length,
      });

      // Return combined result
      return {
        extractedText,
        analysis,
        processingMetadata: {
          processingTimeMs: processingTime,
          fileSize: fileBuffer.length,
        },
      };
    } catch (error: unknown) {
      // Log error securely without exposing sensitive details
      this.logger.error('Error processing document', {
        error: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        userId: this.hashIdentifier(userId),
      });

      if (error instanceof BadRequestException) {
        throw error;
      }

      throw new BadRequestException(
        `Failed to process medical document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Process multiple documents in batch
   * @param documents Array of document buffers with their types
   * @param userId The authenticated user's ID for rate limiting
   * @returns Array of processed document results
   */
  async processBatch(
    documents: Array<{ buffer: Buffer; type: string }>,
    userId: string,
  ): Promise<ProcessedDocumentResult[]> {
    // Validate batch size (using the same limit as Textract service)
    if (documents.length > 10) {
      throw new BadRequestException('Batch size exceeds maximum limit of 10 documents');
    }

    // Process each document sequentially
    const results: ProcessedDocumentResult[] = [];

    for (const doc of documents) {
      try {
        const result = await this.processDocument(doc.buffer, userId);
        results.push(result);
      } catch (error) {
        this.logger.error('Error processing document in batch', {
          error: error instanceof Error ? error.message : 'Unknown error',
          fileSize: doc.buffer.length,
        });

        // Add a placeholder for failed documents
        results.push({
          extractedText: {
            rawText: '',
            lines: [],
            tables: [],
            keyValuePairs: [],
          },
          analysis: {
            title: 'Failed Document',
            category: 'general',
            labValues: [],
            medicalComments: '',
            metadata: {
              isMedicalReport: false,
              confidence: 0,
              missingInformation: ['Document processing failed'],
            },
          },
          processingMetadata: {
            processingTimeMs: 0,
            fileSize: doc.buffer.length,
          },
        });
      }
    }

    return results;
  }

  /**
   * Hash a string identifier for logging purposes
   */
  private hashIdentifier(identifier: string): string {
    return createHash('sha256').update(identifier).digest('hex');
  }
}
