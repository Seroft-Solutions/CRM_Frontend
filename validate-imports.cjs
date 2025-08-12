const fs = require('fs');
const path = require('path');

/**
 * Script to validate imports and detect potential issues
 */

const srcDir = path.join(__dirname, 'src');
const issues = [];

function validateImports(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const lines = content.split('\n');

  lines.forEach((line, index) => {
    const lineNumber = index + 1;

    // Check for import statements
    const importMatch = line.match(
      /import\s+(?:{[^}]*}|\*\s+as\s+\w+|\w+)?\s*(?:,\s*{[^}]*})?\s*from\s+['"]([^'"]*)['"]/
    );

    if (importMatch) {
      const importPath = importMatch[1];

      // Check for relative imports (these should be converted to absolute)
      if (importPath.startsWith('../') || importPath.startsWith('./')) {
        // Calculate what the absolute path should be
        const absolutePath = path.resolve(path.dirname(filePath), importPath);
        const relativeToSrc = path.relative(srcDir, absolutePath);
        const suggestedAlias = '@/' + relativeToSrc.replace(/\\/g, '/');

        issues.push({
          type: 'relative-import',
          file: filePath,
          line: lineNumber,
          current: importPath,
          suggested: suggestedAlias,
          lineContent: line.trim(),
        });
      }

      // Check for @ imports that might be broken
      if (importPath.startsWith('@/')) {
        const targetPath = path.join(srcDir, importPath.substring(2));
        const extensions = [
          '',
          '.ts',
          '.tsx',
          '.js',
          '.jsx',
          '/index.ts',
          '/index.tsx',
          '/index.js',
          '/index.jsx',
        ];

        let exists = false;
        for (const ext of extensions) {
          if (fs.existsSync(targetPath + ext)) {
            exists = true;
            break;
          }
        }

        if (!exists) {
          issues.push({
            type: 'broken-alias',
            file: filePath,
            line: lineNumber,
            current: importPath,
            lineContent: line.trim(),
          });
        }
      }
    }
  });
}

function processDirectory(dirPath) {
  const files = fs.readdirSync(dirPath);

  for (const file of files) {
    const fullPath = path.join(dirPath, file);
    const stat = fs.statSync(fullPath);

    if (stat.isDirectory()) {
      if (!['node_modules', '.next', 'dist', 'out', '.git'].includes(file)) {
        processDirectory(fullPath);
      }
    } else if (
      file.endsWith('.ts') ||
      file.endsWith('.tsx') ||
      file.endsWith('.js') ||
      file.endsWith('.jsx')
    ) {
      validateImports(fullPath);
    }
  }
}

// Run validation
console.log('Validating imports...\n');
processDirectory(srcDir);

// Report results
if (issues.length === 0) {
  console.log('✅ All imports look good!');
} else {
  console.log(`❌ Found ${issues.length} import issues:\n`);

  const relativeImports = issues.filter((issue) => issue.type === 'relative-import');
  const brokenAliases = issues.filter((issue) => issue.type === 'broken-alias');

  if (relativeImports.length > 0) {
    console.log(`📁 Relative imports that should be converted (${relativeImports.length}):`);
    relativeImports.forEach((issue) => {
      console.log(`  ${path.relative(__dirname, issue.file)}:${issue.line}`);
      console.log(`    ${issue.current} → ${issue.suggested}`);
      console.log(`    ${issue.lineContent}\n`);
    });
  }

  if (brokenAliases.length > 0) {
    console.log(`🔗 Broken alias imports (${brokenAliases.length}):`);
    brokenAliases.forEach((issue) => {
      console.log(`  ${path.relative(__dirname, issue.file)}:${issue.line}`);
      console.log(`    ${issue.current}`);
      console.log(`    ${issue.lineContent}\n`);
    });
  }

  console.log('🔧 To fix relative imports, run: npm run convert-imports');
}
