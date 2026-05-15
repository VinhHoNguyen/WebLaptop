// Auto-declared minimal Vitest/Jest-like globals to satisfy TypeScript in editor
// when devDependencies for vitest are not yet installed.
declare function describe(name: string, fn: () => void): void;
declare function it(name: string, fn: () => void): void;
declare function test(name: string, fn: () => void): void;
declare function beforeEach(fn: () => void): void;
declare function afterEach(fn: () => void): void;
declare const expect: any;
declare const vi: any;

export {};
