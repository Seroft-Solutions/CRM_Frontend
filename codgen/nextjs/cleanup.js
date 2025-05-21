#!/usr/bin/env node

/**
 * Cleanup script for removing incorrectly generated Next.js components
 * and directories with improper pluralization
 */
const fs = require('fs');
const path = require('path');

// Define project path
const projectRoot = 'D:\\code\\CRMCup\\CRM_Frontend';
const outputDir = path.join(projectRoot, 'src');
const protectedDir = path.join(outputDir, 'app', '(protected)');

/**
 * Remove directories with incorrect pluralization
 */
function cleanupIncorrectDirectories() {
  if (!fs.existsSync(protectedDir)) {
    console.log(`Protected directory not found: ${protectedDir}`);
    return;
  }

  const dirs = fs.readdirSync(protectedDir);
  
  // Known incorrect plurals to look for
  const problematicDirs = [
    'call-categorys',
    'call-statuss',
    'citys',
    'partys',
    'prioritys'
  ];
  
  for (const dir of dirs) {
    if (problematicDirs.includes(dir)) {
      const dirToRemove = path.join(protectedDir, dir);
      console.log(`Removing incorrectly named directory: ${dirToRemove}`);
      try {
        fs.rmSync(dirToRemove, { recursive: true, force: true });
        console.log(`Successfully removed: ${dirToRemove}`);
      } catch (error) {
        console.error(`Error removing directory ${dirToRemove}:`, error);
      }
    }
  }
}

// Run the cleanup
console.log('Starting cleanup of incorrectly named directories...');
cleanupIncorrectDirectories();
console.log('Cleanup complete.');
