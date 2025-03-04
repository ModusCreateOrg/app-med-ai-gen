import config from 'config';

/**
 * This interface defines the environment variables
 */
export interface Env {
  nodeEnv: string;
  prefix: string;
  port: number;
}

/**
 * This function validates the required environment variables
 */
export function validate() {
  if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV environment variable is required');
  }
  if (!process.env.APP_NAME) {
    throw new Error('APP_NAME environment variable is required');
  }
  if (!process.env.PORT) {
    throw new Error('PORT environment variable is required');
  }
}

/**
 * This function returns the environment variables
 * @returns environment variables
 */
export function get(): Env {
  validate(); // should trigger errors if env is not correctly defined
  return {
    nodeEnv: process.env.NODE_ENV!,
    prefix: process.env.APP_NAME!,
    port: parseInt(process.env.PORT!),
  };
}

/**
 * This function returns the name of the resource
 * @param name name of the resource
 * @returns name of the resource
 */
export function nameIt(name: string): string {
  const { nodeEnv, prefix } = get();
  return `${prefix}-${name}-${nodeEnv}`;
}

/**
 * This function returns the message from the configuration
 * @returns message from the configuration
 */
export function getMessage(): string {
  return config.get('message');
}
