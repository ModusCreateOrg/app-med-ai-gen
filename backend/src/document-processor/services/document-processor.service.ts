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
  simplifiedExplanation?: string;
  processingMetadata: {
    processingTimeMs: number;
    fileType: string;
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
   * @param fileType The MIME type of the file (e.g., 'image/jpeg', 'application/pdf')
   * @param userId The authenticated user's ID for rate limiting
   * @returns Processed document result with extracted text, analysis, and simplified explanation
   */
  async processDocument(
    fileBuffer: Buffer,
    fileType: string,
    userId: string,
  ): Promise<ProcessedDocumentResult> {
    try {
      const startTime = Date.now();

      this.logger.log('Starting document processing', {
        fileType,
        fileSize: `${(fileBuffer.length / 1024).toFixed(2)} KB`,
        userId: this.hashIdentifier(userId),
      });

      // Step 1: Extract text from document using AWS Textract
      const extractedText = await this.textractService.extractText(fileBuffer, fileType, userId);

      this.logger.log('Text extraction completed', {
        lineCount: extractedText.lines.length,
        tableCount: extractedText.tables.length,
      });

      // Step 2: Analyze extracted text using AWS Bedrock
      const analysis = await this.bedrockService.analyzeMedicalDocument(
        extractedText.rawText,
        userId,
      );

      // Step 3: Generate simplified explanation using Perplexity
      let simplifiedExplanation: string | undefined;

      try {
        if (analysis.metadata.isMedicalReport && extractedText.rawText) {
          this.logger.log('Generating simplified explanation');
          simplifiedExplanation = await this.perplexityService.explainMedicalText(
            extractedText.rawText,
          );
          this.logger.log('Simplified explanation generated successfully');
        }
      } catch (explanationError) {
        this.logger.error('Error generating simplified explanation', {
          error: explanationError instanceof Error ? explanationError.message : 'Unknown error',
        });
        // We don't want to fail the entire process if explanation fails
        simplifiedExplanation = undefined;
      }

      const processingTime = Date.now() - startTime;

      this.logger.log(`Document processing completed in ${processingTime}ms`, {
        isMedicalReport: analysis.metadata.isMedicalReport,
        confidence: analysis.metadata.confidence,
        keyTermCount: analysis.keyMedicalTerms.length,
        labValueCount: analysis.labValues.length,
        hasExplanation: !!simplifiedExplanation,
      });

      // Return combined result
      return {
        extractedText,
        analysis,
        simplifiedExplanation,
        processingMetadata: {
          processingTimeMs: processingTime,
          fileType,
          fileSize: fileBuffer.length,
        },
      };
    } catch (error: unknown) {
      // Log error securely without exposing sensitive details
      this.logger.error('Error processing document', {
        error: error instanceof Error ? error.message : 'Unknown error',
        fileType,
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
        const result = await this.processDocument(doc.buffer, doc.type, userId);
        results.push(result);
      } catch (error) {
        this.logger.error('Error processing document in batch', {
          error: error instanceof Error ? error.message : 'Unknown error',
          fileType: doc.type,
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
            keyMedicalTerms: [],
            labValues: [],
            diagnoses: [],
            metadata: {
              isMedicalReport: false,
              confidence: 0,
              missingInformation: ['Document processing failed'],
            },
          },
          simplifiedExplanation: undefined,
          processingMetadata: {
            processingTimeMs: 0,
            fileType: doc.type,
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
