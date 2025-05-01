// This declaration file adds the global types for Vitest testing functions
// that TypeScript cannot find automatically

import 'vitest';
import type { TestContext } from 'vitest';

declare global {
  // Declare global testing functions
  const describe: (typeof import('vitest'))['describe'];
  const it: (typeof import('vitest'))['it'];
  const test: (typeof import('vitest'))['test'];
  const expect: (typeof import('vitest'))['expect'];
  const beforeEach: (fn: (context: TestContext) => void) => void;
  const afterEach: (fn: (context: TestContext) => void) => void;
  const beforeAll: (fn: (context: TestContext) => void) => void;
  const afterAll: (fn: (context: TestContext) => void) => void;
  const vi: (typeof import('vitest'))['vi'];
}
