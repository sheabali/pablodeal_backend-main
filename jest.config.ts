import type { Config } from "jest";

const config: Config = {
  preset: "ts-jest/presets/default-esm",
  testEnvironment: "node",

  extensionsToTreatAsEsm: [".ts"],

  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
      },
    ],
  },

  // Allow ESM packages inside node_modules to be transformed
  transformIgnorePatterns: ["node_modules/(?!jose)"],

  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "^@/prisma/(.*)$": "<rootDir>/prisma/generated/prisma/$1",
    "^(\\.{1,2}/.*)\\.js$": "$1",
  },

  setupFiles: ["<rootDir>/jest.setup.ts"],

  clearMocks: true,
  collectCoverage: false,
  coverageProvider: "v8",

  verbose: true,
};

export default config;
