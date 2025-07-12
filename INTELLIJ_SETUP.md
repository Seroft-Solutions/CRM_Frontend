# IntelliJ IDEA Configuration Guide for CRM Frontend

This guide will help you configure IntelliJ IDEA to properly handle TypeScript path mapping and import resolution for this Next.js project.

## 1. TypeScript Configuration

### Ensure TypeScript Service is Enabled
1. Go to **File → Settings** (Ctrl+Alt+S)
2. Navigate to **Languages & Frameworks → TypeScript**
3. Make sure **TypeScript Language Service** is enabled
4. Set **TypeScript version** to "Use TypeScript from node_modules"

### Configure TypeScript Compiler Options
1. In the same TypeScript settings page
2. Make sure the **tsconfig.json** path points to: `./tsconfig.json`
3. Enable **Use tsconfig.json**

## 2. Path Mapping Configuration

### Verify Path Mapping Recognition
1. Open any file with `@/` imports
2. Ctrl+Click on an import like `@/components/Button`
3. It should navigate to the correct file
4. If not, restart IntelliJ and try again

### Mark Source Root
1. Right-click on the `src` folder in the Project view
2. Select **Mark Directory as → Sources Root**
3. This helps IntelliJ understand the project structure

## 3. Import Optimization Settings

### Configure Import Organization
1. Go to **File → Settings → Editor → Code Style → TypeScript**
2. In the **Imports** tab:
   - Check **Use imports with quotes**
   - Set **Quote style** to "double quotes"
   - Check **Use relative imports**
   - **Important**: Set **Relative import path style** to "Shortest"

### Auto Import Settings
1. Go to **File → Settings → Editor → General → Auto Import**
2. For **TypeScript/JavaScript**:
   - Check **Add unambiguous imports on the fly**
   - Check **Optimize imports on the fly**
   - Set **Insert imports** to "All"

## 4. Refactoring Settings

### Safe Delete and Move
1. Go to **File → Settings → Editor → General**
2. Check **Safe delete (with usage search)**
3. This will search for usages before deleting files

### Refactoring Options
1. When moving files, IntelliJ will show a dialog
2. **Always check** "Update import statements"
3. **Always check** "Search for references and comments"

## 5. Recommended Plugins

Install these plugins for better development experience:
- **Prettier** - Code formatting
- **ESLint** - Linting
- **Tailwind CSS** - If using Tailwind (which this project uses)

## 6. Project Structure Settings

### Configure Node.js Integration
1. Go to **File → Settings → Languages & Frameworks → Node.js**
2. Set **Node interpreter** to your Node.js installation
3. Set **Package manager** to npm

## 7. Troubleshooting

### If Path Resolution Still Doesn't Work:

1. **Invalidate Caches**:
   - Go to **File → Invalidate Caches and Restart**
   - Select "Invalidate and Restart"

2. **Reimport Project**:
   - Close IntelliJ
   - Delete `.idea` folder
   - Reopen the project folder in IntelliJ

3. **Check tsconfig.json**:
   - Ensure the `paths` configuration is correct:
     ```json
     {
       "compilerOptions": {
         "paths": {
           "@/*": ["./src/*"]
         }
       }
     }
     ```

4. **Restart TypeScript Service**:
   - Open any TypeScript file
   - Press **Ctrl+Shift+P** (or **Cmd+Shift+P** on Mac)
   - Type "TypeScript: Restart TS Server"

## 8. Best Practices for This Project

1. **Always use absolute imports** with `@/` for files in the `src` directory
2. **Use relative imports** only for files in the same directory (e.g., `./Button`)
3. **Run the import conversion script** after major refactoring:
   ```bash
   npm run convert-imports
   ```
4. **Test imports** after moving files by checking if Ctrl+Click navigation works

## 9. Moving Files Best Practices

When moving files in IntelliJ:

1. **Use drag and drop** in the Project view (not copy/paste)
2. **Always accept** the "Update import statements" dialog
3. **Run the project** after moving to ensure everything works
4. **Consider running** `npm run convert-imports` if you see import issues

Following this guide should resolve most import path resolution issues in IntelliJ IDEA.
