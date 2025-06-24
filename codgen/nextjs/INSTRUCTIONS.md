# Instructions for Using the Next.js CRUD Generator

## Installation

1. First, install the required dependencies:
   ```bash
   cd D:\code\CRMCup\CRM_Frontend\codgen\nextjs
   npm install ejs
   ```

## Running the Generator

You can run the generator in one of two ways:

### Option 1: Direct execution (recommended)

1. Navigate to the generator directory:

   ```bash
   cd D:\code\CRMCup\CRM_Frontend\codgen\nextjs
   ```

2. Run the simple test generator to verify it's working:

   ```bash
   node simple-generator.js
   ```

3. When the test generator works, run the full generator:

   ```bash
   # For all entities:
   node generator.js

   # For a specific entity:
   node generator.js Party
   ```

### Option 2: Using npm scripts

1. In your project's main package.json, we've added two scripts:

   ```json
   "generate-nextjs": "cd codgen/nextjs && npm run generate",
   "generate-nextjs:entity": "cd codgen/nextjs && npm run generate:entity"
   ```

2. Run the generator:
   ```bash
   npm run generate-nextjs
   ```

## Troubleshooting

If you encounter any issues:

1. Make sure all paths in the generator script are correct
2. Check if the entity JSON files in the .jhipster directory are valid
3. Verify that the template files exist in the templates directory

## Expected Output

The generator will create Next.js components in the following structure:

```
src/app/(protected)/(features)/[entity-name]s/
├── components/
│   ├── [entity-name]-table.tsx
│   ├── [entity-name]-form.tsx
│   └── [entity-name]-details.tsx
├── new/
│   └── page.tsx
├── [id]/
│   ├── page.tsx
│   └── edit/
│       └── page.tsx
└── page.tsx
```
