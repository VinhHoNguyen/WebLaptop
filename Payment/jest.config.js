module.exports = {
    testEnvironment: 'node',
    coveragePathIgnorePatterns: ['/node_modules/'],
    testMatch: ['**/tests/**/*.test.js'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup.js'],
    collectCoverageFrom: [
        'controllers/**/*.js',
        'routes/**/*.js',
        'models/**/*.js',
        '!**/node_modules/**',
        '!**/tests/**'
    ],
    coverageDirectory: 'coverage',
    verbose: true,
    testTimeout: 10000,
    forceExit: true,
    clearMocks: true,
    resetMocks: true,
    restoreMocks: true
};
