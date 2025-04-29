import 'vitest';

// Extend the expect interface with testing-library matchers
declare global {
  // Add typings for Vitest global functions
  const describe: typeof import('vitest')['describe'];
  const it: typeof import('vitest')['it'];
  const test: typeof import('vitest')['test'];
  const expect: typeof import('vitest')['expect'];
  const vi: typeof import('vitest')['vi'];
  const beforeEach: typeof import('vitest')['beforeEach'];
  const afterEach: typeof import('vitest')['afterEach'];
  const beforeAll: typeof import('vitest')['beforeAll'];
  const afterAll: typeof import('vitest')['afterAll'];
  
  // Extend the globalThis interface to allow assigning Vitest functions
  interface Window {
    expect: typeof import('vitest')['expect'];
    afterEach: typeof import('vitest')['afterEach'];
    beforeEach: typeof import('vitest')['beforeEach'];
    describe: typeof import('vitest')['describe'];
    it: typeof import('vitest')['it'];
    vi: typeof import('vitest')['vi'];
    beforeAll: typeof import('vitest')['beforeAll'];
    afterAll: typeof import('vitest')['afterAll'];
  }
}