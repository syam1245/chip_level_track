/**
 * Jest configuration for an ES Module project.
 */
export default {
    testEnvironment: "node",

    // FIXED: Removed extensionsToTreatAsEsm: [".js"] 
    // It is redundant and causes errors when "type": "module" is in package.json
    transform: {},

    // Where tests live
    testMatch: [
        "**/src/__tests__/**/*.test.js",
    ],

    // Coverage — run with --coverage flag
    collectCoverageFrom: [
        "src/modules/**/*.js",
        "src/core/**/*.js",
        "!src/core/config/seed.js",
        "!src/**/*.routes.js",
    ],

    // FIXED: Changed "coverageThresholds" to "coverageThreshold" (singular)
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },

    // Suppress noisy console output from the app during tests
    silent: false,

    // Timeout — integration tests hit a real (in-memory) MongoDB
    testTimeout: 15000,
};