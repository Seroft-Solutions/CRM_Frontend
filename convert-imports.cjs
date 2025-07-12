const fs = require('fs');
const path = require('path');

/**
 * Script to convert relative imports to absolute imports using @ alias
 * This will make refactoring much easier and solve path resolution issues
 */

const srcDir = path.join(__dirname, 'src');

// Function to convert relative imports to absolute imports
function convertImports(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Get the relative path from src directory
  const relativeFromSrc = path.relative(srcDir, path.dirname(filePath));
  const depth = relativeFromSrc === '' ? 0 : relativeFromSrc.split(path.sep).length;
  
  // Convert relative imports to absolute imports
  const importRegex = /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*{[^}]*})?\s*from\s+['"](\.[^'"]*)['"]/g;
  
  content = content.replace(importRegex, (match, importPath) => {
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
      // Calculate the absolute path
      const absolutePath = path.resolve(path.dirname(filePath), importPath);
      const relativeToSrc = path.relative(srcDir, absolutePath);
      
      // Convert to @ alias format
      const aliasPath = '@/' + relativeToSrc.replace(/\\/g, '/');
      
      // Replace the import
      const newImport = match.replace(/['"]([^'"]*)['"]/g, `"${aliasPath}"`);
      hasChanges = true;
      console.log(`  ${importPath} → ${aliasPath}`);
      return newImport;
    }
    return match;
  });
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  return false;
}

// Function to recursively process files
function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);
  let totalChanges = 0;
  
  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory()) {
      // Skip node_modules and other build directories
      if (!['node_modules', '.next', 'dist', 'out', '.git'].includes(file)) {
        totalChanges += processDirectory(fullPath);
      }
    } else if (file.endsWith('.ts') || file.endsWith('.tsx') || file.endsWith('.js') || file.endsWith('.jsx')) {
      console.log(`Processing: ${fullPath}`);
      if (convertImports(fullPath)) {
        totalChanges++;
      }
    }
  }
  
  return totalChanges;
}

// Run the conversion
console.log('Converting relative imports to absolute imports...\n');
const changedFiles = processDirectory(srcDir);
console.log(`\nConversion complete! ${changedFiles} files updated.`);
console.log('\nBenefits:');
console.log('- Easier refactoring when moving files');
console.log('- Better IDE support for path resolution');
console.log('- More consistent import style across the project');
