import { Logger } from '@nestjs/common';

/**
 * Rate limiting implementation using a rolling window
 * Uses authenticated user IDs to track request frequency
 */
export class RateLimiter {
  private requests: Map<string, number[]> = new Map();
  private readonly windowMs: number;
  private readonly maxRequests: number;
  private readonly cleanupThreshold: number = 10000;
  private readonly logger: Logger;

  /**
   * Creates a new RateLimiter instance
   * @param windowMs The time window in milliseconds for rate limiting (default: 60000)
   * @param maxRequests The maximum number of requests allowed in the time window (default: 20)
   * @param loggerName Optional name for the logger (default: RateLimiter)
   */
  constructor(windowMs = 60000, maxRequests = 20, loggerName = 'RateLimiter') {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    this.logger = new Logger(loggerName);
  }

  /**
   * Attempts to register a new request for the given user ID
   * @param userId The authenticated user's unique identifier
   * @returns boolean True if the request is allowed, false if rate limit exceeded
   */
  public tryRequest(userId: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or initialize request timestamps for this user
    let timestamps = this.requests.get(userId) || [];

    // Remove old timestamps outside the current window
    timestamps = timestamps.filter(time => time > windowStart);

    // Check if limit is reached
    if (timestamps.length >= this.maxRequests) {
      this.logger.warn(
        `Rate limit exceeded for user ${userId}: ${timestamps.length} requests in ${this.windowMs}ms`,
      );
      return false;
    }

    // Add new request timestamp
    timestamps.push(now);
    this.requests.set(userId, timestamps);

    // Clean up old entries if the map has grown too large
    this.cleanupOldEntries(now);

    return true;
  }

  /**
   * Checks if a user would exceed their rate limit without incrementing the counter
   * @param userId The authenticated user's unique identifier
   * @returns boolean True if the request would be allowed, false if rate limit would be exceeded
   */
  public wouldExceedLimit(userId: string): boolean {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or initialize request timestamps for this user
    const timestamps = this.requests.get(userId) || [];

    // Count the number of timestamps within the current window
    const activeRequestCount = timestamps.filter(time => time > windowStart).length;

    // Check if limit would be reached
    return activeRequestCount >= this.maxRequests;
  }

  /**
   * Gets the number of remaining requests allowed for a user
   * @param userId The authenticated user's unique identifier
   * @returns number The number of requests remaining in the current time window
   */
  public getRemainingRequests(userId: string): number {
    const now = Date.now();
    const windowStart = now - this.windowMs;

    // Get or initialize request timestamps for this user
    const timestamps = this.requests.get(userId) || [];

    // Count the number of timestamps within the current window
    const activeRequestCount = timestamps.filter(time => time > windowStart).length;

    // Calculate remaining requests
    return Math.max(0, this.maxRequests - activeRequestCount);
  }

  /**
   * Resets the rate limit for a specific user
   * @param userId The authenticated user's unique identifier
   */
  public resetLimit(userId: string): void {
    this.requests.delete(userId);
    this.logger.log(`Rate limit reset for user ${userId}`);
  }

  /**
   * Cleans up old entries from the requests map when total size exceeds threshold
   * @param currentTime The current timestamp to calculate window
   */
  private cleanupOldEntries(currentTime: number): void {
    if (this.requests.size >= this.cleanupThreshold) {
      const windowStart = currentTime - this.windowMs;
      let cleanedEntries = 0;

      // Identify users with no recent requests
      const usersToRemove: string[] = [];

      this.requests.forEach((timestamps, userId) => {
        // Filter to only keep timestamps within the window
        const activeTimestamps = timestamps.filter(time => time > windowStart);

        if (activeTimestamps.length === 0) {
          // If no active timestamps remain, mark this user for removal
          usersToRemove.push(userId);
          cleanedEntries++;
        } else if (activeTimestamps.length !== timestamps.length) {
          // If we filtered some timestamps, update the array
          this.requests.set(userId, activeTimestamps);
          cleanedEntries++;
        }
      });

      // Remove entries for users with no recent activity
      usersToRemove.forEach(userId => {
        this.requests.delete(userId);
      });

      if (cleanedEntries > 0) {
        this.logger.log(`Cleaned up ${cleanedEntries} rate limit entries`);
      }
    }
  }
}
