#!/usr/bin/env node

/**
 * Authentication Migration Script
 * Updates import statements to use the new centralized auth module
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Migration patterns
const IMPORT_MIGRATIONS = [
  // Components
  {
    from: "import { rolesManager } from '@/components/auth/roles-manager'",
    to: "import { rolesManager } from '@/core/auth'"
  },
  {
    from: "import { PermissionGuard } from '@/components/auth/permission-guard'",
    to: "import { PermissionGuard } from '@/core/auth'"
  },
  {
    from: "import { InlinePermissionGuard } from '@/components/auth/permission-guard'",
    to: "import { InlinePermissionGuard } from '@/core/auth'"
  },
  {
    from: "import { UnauthorizedPage } from '@/components/auth/unauthorized-page'",
    to: "import { UnauthorizedPage } from '@/core/auth'"
  },
  {
    from: "import { SessionExpiredModal } from '@/components/auth/session-expired-modal'",
    to: "import { SessionExpiredModal } from '@/core/auth'"
  },
  
  // Hooks
  {
    from: "import { useSessionMonitor } from '@/hooks/use-session-monitor'",
    to: "import { useSessionMonitor } from '@/core/auth'"
  },
  {
    from: "import { useActivityTracker } from '@/hooks/use-activity-tracker'",
    to: "import { useActivityTracker } from '@/core/auth'"
  },
  
  // Providers
  {
    from: "import { useAuth } from '@/providers/session-provider'",
    to: "import { useAuth } from '@/core/auth'"
  },
  {
    from: "import { AppSessionProvider } from '@/providers/session-provider'",
    to: "import { AppSessionProvider } from '@/core/auth'"
  },
  {
    from: "import { useSessionManager } from '@/providers/session-manager'",
    to: "import { useSessionManager } from '@/core/auth'"
  },
  {
    from: "import { SessionManagerProvider } from '@/providers/session-manager'",
    to: "import { SessionManagerProvider } from '@/core/auth'"
  },
  
  // Lib utilities
  {
    from: "import { logout, silentLogout } from '@/lib/auth-utils'",
    to: "import { logout, silentLogout } from '@/core/auth'"
  },
  {
    from: "import { logoutAction } from '@/lib/auth-actions'",
    to: "import { logoutAction } from '@/core/auth'"
  },
  {
    from: "import { fetchAccessToken } from '@/lib/auth-token'",
    to: "import { fetchAccessToken } from '@/core/auth'"
  },
  {
    from: "import { refreshKeycloakToken } from '@/lib/token-refresh'",
    to: "import { refreshKeycloakToken } from '@/core/auth'"
  },
  {
    from: "import { tokenStorage } from '@/lib/token-storage'",
    to: "import { tokenStorage } from '@/core/auth'"
  },
  {
    from: "import { TokenCache } from '@/lib/token-cache'",
    to: "import { TokenCache } from '@/core/auth'"
  },
  {
    from: "import { useSessionEvents } from '@/lib/session-events'",
    to: "import { useSessionEvents } from '@/core/auth'"
  }
];

function findFilesToUpdate(dir, extensions = ['.ts', '.tsx', '.js', '.jsx']) {
  const files = [];
  
  function scan(currentDir) {
    const items = fs.readdirSync(currentDir);
    
    for (const item of items) {
      const fullPath = path.join(currentDir, item);
      const stat = fs.statSync(fullPath);
      
      if (stat.isDirectory()) {
        // Skip node_modules and .next directories
        if (!['node_modules', '.next', 'dist', 'build'].includes(item)) {
          scan(fullPath);
        }
      } else if (extensions.some(ext => item.endsWith(ext))) {
        files.push(fullPath);
      }
    }
  }
  
  scan(dir);
  return files;
}

function updateFileImports(filePath) {
  try {
    let content = fs.readFileSync(filePath, 'utf8');
    let updated = false;
    
    // Apply each migration pattern
    for (const migration of IMPORT_MIGRATIONS) {
      if (content.includes(migration.from)) {
        content = content.replace(new RegExp(escapeRegExp(migration.from), 'g'), migration.to);
        updated = true;
        console.log(`✅ Updated import in ${filePath}`);
      }
    }
    
    // Handle multi-line imports and destructuring
    const multiLinePatterns = [
      {
        regex: /import\s*{\s*([^}]*)\s*}\s*from\s*['"]@\/components\/auth\/([^'"]*)['"]/g,
        replacement: (match, imports, file) => {
          return `import { ${imports.trim()} } from '@/core/auth'`;
        }
      },
      {
        regex: /import\s*{\s*([^}]*)\s*}\s*from\s*['"]@\/hooks\/(use-session-monitor|use-activity-tracker)['"]/g,
        replacement: (match, imports) => {
          return `import { ${imports.trim()} } from '@/core/auth'`;
        }
      },
      {
        regex: /import\s*{\s*([^}]*)\s*}\s*from\s*['"]@\/lib\/(auth-utils|auth-actions|auth-token|token-refresh|token-storage|token-cache|session-events)['"]/g,
        replacement: (match, imports) => {
          return `import { ${imports.trim()} } from '@/core/auth'`;
        }
      },
      {
        regex: /import\s*{\s*([^}]*)\s*}\s*from\s*['"]@\/providers\/(session-provider|session-manager)['"]/g,
        replacement: (match, imports) => {
          return `import { ${imports.trim()} } from '@/core/auth'`;
        }
      }
    ];
    
    for (const pattern of multiLinePatterns) {
      const newContent = content.replace(pattern.regex, pattern.replacement);
      if (newContent !== content) {
        content = newContent;
        updated = true;
        console.log(`✅ Updated multi-line import in ${filePath}`);
      }
    }
    
    if (updated) {
      fs.writeFileSync(filePath, content, 'utf8');
      return true;
    }
    
    return false;
  } catch (error) {
    console.error(`❌ Error updating ${filePath}:`, error.message);
    return false;
  }
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
  const projectRoot = process.cwd();
  const srcDir = path.join(projectRoot, 'src');
  
  if (!fs.existsSync(srcDir)) {
    console.error('❌ src directory not found. Please run this script from the project root.');
    process.exit(1);
  }
  
  console.log('🔄 Starting authentication import migration...');
  console.log(`📁 Scanning directory: ${srcDir}`);
  
  const files = findFilesToUpdate(srcDir);
  console.log(`📋 Found ${files.length} files to check`);
  
  let updatedCount = 0;
  
  for (const file of files) {
    // Skip the core auth directory itself
    if (file.includes('src/core/auth') || file.includes('src\\core\\auth')) {
      continue;
    }
    
    if (updateFileImports(file)) {
      updatedCount++;
    }
  }
  
  console.log(`\n✨ Migration complete!`);
  console.log(`📊 Updated ${updatedCount} files`);
  
  if (updatedCount > 0) {
    console.log('\n🚀 Next steps:');
    console.log('1. Remove old authentication files from:');
    console.log('   - src/components/auth/');
    console.log('   - src/hooks/use-session-monitor.ts');
    console.log('   - src/hooks/use-activity-tracker.ts');
    console.log('   - src/lib/auth-*.ts');
    console.log('   - src/lib/token-*.ts');
    console.log('   - src/lib/session-events.ts');
    console.log('   - src/providers/session-*.tsx');
    console.log('2. Test the application thoroughly');
    console.log('3. Update any remaining manual imports');
  }
}

main();
