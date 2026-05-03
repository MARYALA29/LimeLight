const nextJest = require("next/jest");

const createJestConfig = nextJest({
  dir: "./",
});

const customJestConfig = {
  setupFilesAfterEnv: ["<rootDir>/jest.setup.js"],
  testEnvironment: "jest-environment-jsdom",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: [
    "**/__tests__/**/*.[jt]s?(x)",
    "**/?(*.)+(spec|test).[jt]s?(x)",
  ],
  collectCoverageFrom: [
    "src/**/*.{js,jsx,ts,tsx}",
    // Exclude test files themselves from coverage stats
    "!src/__tests__/**",
    // Exclude config files (tooling configuration, not app code)
    "!**/*.config.{ts,js}",
    // Exclude TypeScript declaration-only files
    "!**/*.d.ts",
    // Exclude generated/migration files outside src (Prisma)
    "!prisma/**",
    // Exclude Next.js build output
    "!.next/**",
    // Exclude Jest setup file (testing infrastructure, not app code)
    "!jest.setup.js",
    // Re-export barrel files contain no executable logic worth measuring
    "!src/**/index.ts",
  ],
  coverageReporters: ["text", "lcov", "json-summary", "json"],
  // Coverage gate enforced in CI. Current baseline is ~35% across all four
  // metrics; thresholds are set to the floor (rounded down to nearest 5%)
  // per the ratchet strategy in issue #6. Follow-up issue tracks raising
  // these to 80% as more pages/API routes get test coverage.
  coverageThreshold: {
    global: {
      branches: 35,
      functions: 35,
      lines: 35,
      statements: 35,
    },
  },
};

module.exports = createJestConfig(customJestConfig);
