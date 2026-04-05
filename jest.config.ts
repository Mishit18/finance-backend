import type { Config } from 'jest';

const config: Config = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/tests'],
  testMatch: ['**/*.test.ts'],
  setupFilesAfterSetup: [],
  verbose: true,
  forceExit: true,
  clearMocks: true,
  testTimeout: 15000,
};

export default config;
