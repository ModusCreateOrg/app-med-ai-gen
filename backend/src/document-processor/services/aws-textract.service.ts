import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { TextractClient, AnalyzeDocumentCommand, Block } from '@aws-sdk/client-textract';
import { validateFileSecurely, RateLimiter } from '../../utils/security.utils';
import { createHash } from 'crypto';

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

/**
 * Service for extracting text from medical lab reports using AWS Textract
 */
@Injectable()
export class AwsTextractService {
  private readonly logger = new Logger(AwsTextractService.name);
  private readonly client: TextractClient;
  private readonly rateLimiter: RateLimiter;

  constructor(private readonly configService: ConfigService) {
    try {
      this.client = this.createTextractClient();

      // Initialize rate limiter (10 requests per minute per IP by default)
      const requestsPerMinute =
        this.configService.get<number>('aws.textract.documentRequestsPerMinute') || 10;
      this.rateLimiter = new RateLimiter(60000, requestsPerMinute);
    } catch (error) {
      // Handle initialization errors without crashing
      this.logger.error('Failed to initialize AWS Textract client', {
        error: error instanceof Error ? error.message : 'Unknown error',
      });

      // Create a stub client for testing
      this.client = {} as TextractClient;
      this.rateLimiter = new RateLimiter(60000, 10);
    }
  }

  /**
   * Creates and configures the AWS Textract client
   * @returns Configured TextractClient instance
   */
  private createTextractClient(): TextractClient {
    const region = this.configService.get<string>('aws.region') || 'us-east-1';
    const accessKeyId = this.configService.get<string>('aws.aws.accessKeyId');
    const secretAccessKey = this.configService.get<string>('aws.aws.secretAccessKey');
    const sessionToken = this.configService.get<string>('aws.aws.sessionToken');

    // Create client config with required region
    const clientConfig: any = { region };

    // Only add credentials if explicitly provided
    if (accessKeyId && secretAccessKey) {
      clientConfig.credentials = {
        accessKeyId,
        secretAccessKey,
        ...(sessionToken && { sessionToken }),
      };
    }

    // Initialize AWS Textract client with more robust config
    const client = new TextractClient(clientConfig);

    // Log credential configuration for debugging (without exposing actual credentials)
    this.logger.log(
      `AWS Textract client initialized with region ${region} and credentials ${accessKeyId ? '(provided)' : '(missing)'}, session token ${sessionToken ? '(provided)' : '(not provided)'}`,
    );

    return client;
  }

  /**
   * Extract text from a medical lab report image or PDF
   * @param fileBuffer The file buffer containing the image or PDF
   * @param fileType The MIME type of the file (e.g., 'image/jpeg', 'application/pdf')
   * @param userId The authenticated user's ID for rate limiting
   * @returns Extracted text result with structured information
   */
  async extractText(
    fileBuffer: Buffer,
    fileType: string,
    userId: string,
  ): Promise<ExtractedTextResult> {
    try {
      const startTime = Date.now();

      // 1. Rate limiting check
      if (!this.rateLimiter.tryRequest(userId)) {
        throw new BadRequestException('Too many requests. Please try again later.');
      }

      // 2. Validate file securely
      validateFileSecurely(fileBuffer, fileType);

      // Add diagnostic information about the document being processed
      this.logger.debug('Processing document', {
        fileType,
        fileSize: `${(fileBuffer.length / 1024).toFixed(2)} KB`,
        contentHashPrefix: createHash('sha256').update(fileBuffer).digest('hex').substring(0, 10),
      });

      // 3. Process document
      const result = await this.processDocument(fileBuffer, fileType);

      // 4. Calculate processing time
      const processingTime = Date.now() - startTime;

      this.logger.log(`Document processed in ${processingTime}ms`, {
        lineCount: result.lines.length,
        tableCount: result.tables.length,
        keyValuePairCount: result.keyValuePairs.length,
      });

      return result;
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
        `Failed to extract text from document: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
    }
  }

  /**
   * Process a document (image or PDF)
   */
  private async processDocument(
    documentBuffer: Buffer,
    documentType: string,
  ): Promise<ExtractedTextResult> {
    this.logger.log(
      `Processing ${documentType === 'application/pdf' ? 'PDF document' : 'single image'} with Textract`,
    );

    // Use Analyze Document API for more comprehensive analysis
    const command = new AnalyzeDocumentCommand({
      Document: {
        Bytes: documentBuffer,
      },
      FeatureTypes: ['TABLES', 'FORMS'],
    });

    const response = await this.client.send(command);

    return this.parseTextractResponse(response);
  }

  /**
   * Parse the response from AWS Textract into a structured result
   */
  private parseTextractResponse(response: any): ExtractedTextResult {
    if (!response || !response.Blocks || response.Blocks.length === 0) {
      throw new Error('Empty response from Textract');
    }

    // Initialize result structure
    const result: ExtractedTextResult = {
      rawText: '',
      lines: [],
      tables: [],
      keyValuePairs: [],
    };

    // Extract lines of text
    const lineBlocks = response.Blocks.filter((block: Block) => block.BlockType === 'LINE');
    result.lines = lineBlocks.map((block: Block) => block.Text || '');

    // Combine all line text to create raw text
    result.rawText = result.lines.join('\n');

    // Extract tables
    result.tables = this.extractTables(response.Blocks);

    // Extract key-value pairs from FORM analysis
    result.keyValuePairs = this.extractKeyValuePairs(response.Blocks);

    return result;
  }

  /**
   * Extract tables from Textract response
   */
  private extractTables(blocks: Block[]): Array<{ rows: string[][] }> {
    const tables: Array<{ rows: string[][] }> = [];

    // Find table blocks
    const tableBlocks = blocks.filter((block: Block) => block.BlockType === 'TABLE');

    for (const tableBlock of tableBlocks) {
      const tableId = tableBlock.Id;
      const cellBlocks = blocks.filter(
        (block: Block) =>
          block.BlockType === 'CELL' &&
          block.Relationships?.some(
            rel => rel.Type === 'CHILD' && rel.Ids?.includes(tableId || ''),
          ),
      );

      // Group cells by row
      const rows: { [key: string]: { [key: string]: string } } = {};

      for (const cell of cellBlocks) {
        if (cell.RowIndex === undefined || cell.ColumnIndex === undefined) continue;

        const rowIndex = cell.RowIndex;
        const columnIndex = cell.ColumnIndex;

        if (!rows[rowIndex]) {
          rows[rowIndex] = {};
        }

        // Get text from this cell
        const cellText = this.getCellText(cell, blocks);
        rows[rowIndex][columnIndex] = cellText;
      }

      // Convert to array of arrays
      const tableRows: string[][] = [];
      const rowIndices = Object.keys(rows).sort((a, b) => parseInt(a) - parseInt(b));

      for (const rowIndex of rowIndices) {
        const row = rows[rowIndex];
        const columnIndices = Object.keys(row).sort((a, b) => parseInt(a) - parseInt(b));
        const tableRow: string[] = columnIndices.map(colIndex => row[colIndex]);
        tableRows.push(tableRow);
      }

      tables.push({ rows: tableRows });
    }

    return tables;
  }

  /**
   * Extract text from a table cell
   */
  private getCellText(cellBlock: Block, blocks: Block[]): string {
    if (!cellBlock.Relationships) {
      return '';
    }

    const textBlockIds = cellBlock.Relationships.filter(rel => rel.Type === 'CHILD').flatMap(
      rel => rel.Ids || [],
    );

    const textBlocks = blocks.filter(
      block =>
        textBlockIds.includes(block.Id || '') &&
        (block.BlockType === 'WORD' || block.BlockType === 'LINE'),
    );

    return textBlocks.map(block => block.Text || '').join(' ');
  }

  /**
   * Extract key-value pairs from FORM analysis
   */
  private extractKeyValuePairs(blocks: Block[]): Array<{ key: string; value: string }> {
    const keyValuePairs: Array<{ key: string; value: string }> = [];

    // Find key-value set blocks
    const kvBlocks = blocks.filter((block: Block) => block.BlockType === 'KEY_VALUE_SET');

    // Process each key-value set
    for (const kvBlock of kvBlocks) {
      // Only process if this is a KEY type
      if (kvBlock.EntityTypes?.includes('KEY')) {
        const keyText = this.getEntityText(kvBlock, blocks);
        const valueBlock = this.findRelatedValueBlock(kvBlock, blocks);

        if (valueBlock) {
          const valueText = this.getEntityText(valueBlock, blocks);
          keyValuePairs.push({
            key: keyText,
            value: valueText,
          });
        }
      }
    }

    return keyValuePairs;
  }

  /**
   * Find the value block related to a key block
   */
  private findRelatedValueBlock(keyBlock: Block, blocks: Block[]): Block | null {
    if (!keyBlock.Relationships) {
      return null;
    }

    const valueRelationship = keyBlock.Relationships.find(rel => rel.Type === 'VALUE');
    if (!valueRelationship || !valueRelationship.Ids || valueRelationship.Ids.length === 0) {
      return null;
    }

    const valueId = valueRelationship.Ids[0];
    return blocks.find(block => block.Id === valueId) || null;
  }

  /**
   * Get text for an entity (key or value)
   */
  private getEntityText(entityBlock: Block, blocks: Block[]): string {
    if (!entityBlock.Relationships) {
      return '';
    }

    const wordRelationship = entityBlock.Relationships.find(rel => rel.Type === 'CHILD');
    if (!wordRelationship || !wordRelationship.Ids) {
      return '';
    }

    const wordBlocks = blocks.filter(
      block => wordRelationship.Ids?.includes(block.Id || '') && block.BlockType === 'WORD',
    );

    return wordBlocks.map(block => block.Text || '').join(' ');
  }

  /**
   * Hash a string identifier for logging purposes
   */
  private hashIdentifier(identifier: string): string {
    return createHash('sha256').update(identifier).digest('hex');
  }

  /**
   * Process multiple documents in batch
   * @param documents Array of document buffers with their types
   * @param userId The authenticated user's ID for rate limiting
   * @returns Array of extracted text results
   */
  async processBatch(
    documents: Array<{ buffer: Buffer; type: string }>,
    userId: string,
  ): Promise<ExtractedTextResult[]> {
    // Validate batch size
    if (documents.length > 10) {
      throw new BadRequestException('Batch size exceeds maximum limit of 10 documents');
    }

    // Process each document sequentially
    // In a production system, this could be parallelized with proper rate limiting
    const results: ExtractedTextResult[] = [];

    for (const doc of documents) {
      try {
        const result = await this.extractText(doc.buffer, doc.type, userId);
        results.push(result);
      } catch (error) {
        this.logger.error('Error processing document in batch', {
          error: error instanceof Error ? error.message : 'Unknown error',
          fileType: doc.type,
          fileSize: doc.buffer.length,
        });

        // Add a placeholder for failed documents
        results.push({
          rawText: '',
          lines: [],
          tables: [],
          keyValuePairs: [],
        });
      }
    }

    return results;
  }
}
