# Next.js CRUD Generator for JHipster Entities

This tool generates Next.js CRUD components with shadcn UI for JHipster entity
definitions.

## Correct Paths

The generator now uses these hardcoded paths for clarity:

- JHipster entity definitions: `D:\code\CRMCup\CRM_Frontend\.jhipster`
- Template files: `D:\code\CRMCup\CRM_Frontend\codgen\nextjs\templates`
- Output directory: `D:\code\CRMCup\CRM_Frontend\src\app\(protected)`

## Usage

1. First, make sure you're in the correct directory:

   ```bash
   cd D:\code\CRMCup\CRM_Frontend\codgen\nextjs
   ```

2. Install dependencies if you haven't already:

   ```bash
   npm install
   ```

3. Test the generator with a simple test:

   ```bash
   node simple-generator.js
   ```

4. Run the full generator:

   ```bash
   # For all entities
   npx ts-node generator.ts

   # For a specific entity
   npx ts-node generator.ts Party
   ```

## Troubleshooting

If you encounter any issues:

- Make sure the paths in the scripts match your actual directory structure
- Verify that all JHipster entity JSON files exist in the `.jhipster` directory
- Check that the template files exist in the `templates` directory

## Generated Components

The generator will create the following structure for each entity:

```
src/app/(protected)/[entity-name-plural]/
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

## Features

- Modern Next.js App Router components
- shadcn UI components
- React Hook Form with Zod validation
- Integration with React Query hooks
- Pagination, sorting, and filtering
