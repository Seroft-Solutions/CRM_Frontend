# Troubleshooting the Entity Generator

## Common Issues and Solutions

### 1. "Export useSearchXXX doesn't exist in target module"

**Problem:** The generated code tries to import a function like `useSearchcities` with a lowercase character after "Search", but the actual exported function in the Orval-generated code has a capital letter (e.g., `useSearchCities`).

**Solution:** This is fixed by ensuring proper case handling in the generator script:

- In `entity-metadata.ts`: Make sure to use `toPascalCase` when generating search hook names
- In `generate-entities.js`: Ensure consistent casing in imports and function references

### 2. "Module not found: Can't resolve '@/components/ui/spinner'"

**Problem:** The generator references UI components that don't exist in your project.

**Solution:** Create the missing components:

```tsx
// src/components/ui/spinner/index.tsx
'use client';

import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

interface SpinnerProps {
  className?: string;
  size?: number;
}

export function Spinner({ className, size = 24 }: SpinnerProps) {
  return (
    <Loader2
      className={cn('h-6 w-6 animate-spin', className)}
      size={size}
      aria-hidden="true"
    />
  );
}

export default Spinner;
```

### 3. "Type errors in generated code"

**Problem:** The generated code might have TypeScript errors due to mismatches between the expected types and the actual types in your project.

**Solution:** 

- Check the imported DTOs and API hooks
- Update the template files to match your project's types
- Adjust type definitions in the generator script

### 4. "Generated code uses incorrect path for imports"

**Problem:** Imports in the generated code point to incorrect paths.

**Solution:**

- Update the base paths in the generator configuration
- Adjust import paths in the template files
- Fix paths in the generator script

### 5. "ReferenceError: otherEntityPascal is not defined"

**Problem:** This error occurs when the generator tries to use a variable that hasn't been defined in the current scope.

**Solution:** 

- Make sure all variables are properly defined before they're used
- In relationship mapping, ensure that `otherEntityPascal` is defined within the mapping function
- Check for variable scope issues in the generator script

```javascript
// Fixed code for relationships mapping
const relationships = entity.relationships
  .filter(rel => rel.relationshipType === 'many-to-one')
  .map(rel => {
    const otherEntityPlural = pluralize(rel.otherEntityName);
    const otherEntityPascal = toPascalCase(rel.otherEntityName); // Define this here
    const displayField = rel.otherEntityField || 'name';
    // Use otherEntityPascal later...
  });
```

### 6. "Error: toPascalCase is not defined"

**Problem:** This runtime error occurs because the function `toPascalCase` is used in the generated code but isn't defined in the client-side context.

**Solution:**

- Include the `toPascalCase` function definition in each generated metadata file:

```javascript
// In your generated metadata file
// PascalCase conversion helper function
const toPascalCase = (str) => {
  return str
    .replace(/[-_](\w)/g, (_, c) => c.toUpperCase())
    .replace(/^\w/, c => c.toUpperCase());
};

// Then use it in your code
```

- Alternatively, centralize utility functions in a shared module and import them where needed
- Ensure any helper functions used in runtime code are properly defined or imported

### 7. "Export useSearchCitys doesn't exist in target module"

**Problem:** This error occurs due to incorrect pluralization of entity names in search hook imports, especially for irregular plurals like "city" → "cities".

**Solution:**

- Add special handling for irregular plurals in your generator and template files:

```javascript
// Check for irregular plurals like 'city' → 'cities'
const searchHookName = entityName === 'city' 
  ? 'useSearchCities' 
  : `useSearch${pascalEntityName}s`;
```

- Update both import statements and function references to use the correct plural forms
- Consider implementing a more robust pluralization function that handles English irregular plurals correctly

## Running with Debug Logging

To get more information about what's happening during generation, run the script with the DEBUG environment variable:

```bash
DEBUG=entity-generator:* npm run generate-entities
```

## Manually Fixing Generated Files

If you encounter persistent issues with specific entities, you can:

1. Generate just the problematic entity using the `--entity` parameter
2. Manually fix the generated files
3. Use the `--overwrite` parameter with caution to avoid overwriting your manual fixes

## Reporting Issues

If you encounter persistent issues with the generator, please file an issue with:

1. The specific error message
2. The entity definition that caused the problem
3. Steps to reproduce
