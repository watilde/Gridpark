module.exports = {
  // Test environment
  testEnvironment: 'jsdom',
  
  // Preset for ts-jest
  preset: 'ts-jest',

  // ts-jest configuration
  transform: {
    '^.+\\.tsx?$': ['ts-jest', {
      diagnostics: false,
    }],
  },
  
  // Setup files
  setupFilesAfterEnv: ['<rootDir>/src/test/setup.ts'],
  
  // File extensions
  moduleFileExtensions: ['ts', 'tsx', 'js', 'jsx', 'json'],
  
  // Test match patterns
  testMatch: [
    '<rootDir>/src/**/__tests__/**/*.(ts|tsx|js)',
    '<rootDir>/src/**/*.(test|spec).(ts|tsx|js)',
  ],
  
  // Coverage configuration
  collectCoverageFrom: [
    'src/**/*.{ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.tsx',
    '!src/test/**/*',
    '!src/index.ts',
    '!src/preload.ts',
  ],
  
  // Coverage thresholds
  coverageThreshold: {
    global: {
      branches: 70,
      functions: 70,
      lines: 70,
      statements: 70,
    },
  },
  
  // Ignore patterns
  testPathIgnorePatterns: [
    '<rootDir>/node_modules/',
    '<rootDir>/.webpack/',
    '<rootDir>/out/',
    '<rootDir>/src/features/spreadsheet/hooks/__tests__/performanceDemoData.ts',
  ],
  
  // Module name mapping (e.g., Vite ?worker imports, ESM-only packages)
  moduleNameMapper: {
    '\\?worker$': '<rootDir>/src/test/__mocks__/worker.js',
    '^monaco-editor(.*)$': '<rootDir>/src/test/__mocks__/monaco-editor.js',
  },

  // Module paths to ignore for transforming
  transformIgnorePatterns: [
    'node_modules/(?!(@mui/joy|@emotion|@babel/runtime)/)',
  ],
  
  // Clear mocks between tests
  clearMocks: true,
  
  // Verbose output
  verbose: true,
};