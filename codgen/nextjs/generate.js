#!/usr/bin/env node

/**
 * CLI script to generate Next.js components for CRUD operations
 */
const path = require('path');

// Register ts-node to run TypeScript directly
require('ts-node').register({
  transpileOnly: true
});

// Get the absolute path to the generator file
const generatorPath = path.resolve(__dirname, './generator.ts');

// Run the generator
console.log(`Running generator from: ${generatorPath}`);
require(generatorPath);
