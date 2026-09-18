module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  testMatch: ['**/*.test.ts'],
  moduleFileExtensions: ['ts', 'js', 'json'],
  transform: {
    '^.+\\.ts$': ['ts-jest', {
      tsconfig: {
        target: 'ES2022',
        module: 'CommonJS',
        moduleResolution: 'Node',
        esModuleInterop: true,
      }
    }]
  },
  verbose: true,
  moduleNameMapper: {
    '^archiver$': '<rootDir>/src/__mocks__/archiver.js',
  },
  testTimeout: 30000
};
