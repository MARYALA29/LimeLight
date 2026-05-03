/**
 * Jest config for smoke tests that hit the deployed HTTPS API.
 *
 * Run via `npm run test:smoke`. Set SMOKE_BASE_URL to point at a
 * different deployment.
 */
const nextJest = require("next/jest");

const createJestConfig = nextJest({ dir: "./" });

module.exports = createJestConfig({
  testEnvironment: "node",
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
  },
  testMatch: ["<rootDir>/src/__smoke__/**/*.smoke.test.[jt]s?(x)"],
  testPathIgnorePatterns: ["/node_modules/", "<rootDir>/.claude/"],
  // Disable coverage thresholds — smoke tests don't reflect code coverage.
  collectCoverage: false,
  // No setup file — smoke tests don't mock anything.
});
