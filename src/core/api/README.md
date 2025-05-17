# API Integration

This directory contains the API integration layer for the CMS Frontend application. It uses Orval to generate type-safe React Query hooks from the OpenAPI specification.

## Directory Structure

- `client/`: Contains the API client implementation (axios, fetch)
- `config/`: API configuration constants
- `generated/`: Auto-generated API clients and types (DO NOT MODIFY MANUALLY)
- `hooks/`: Custom hooks for API interaction
- `providers/`: React Query provider components
- `setup/`: API setup utilities (interceptors, initialization)
- `utils/`: Utility functions for API operations

## Usage

### Generating API Clients

To generate or update the API clients from the OpenAPI specification:

```bash
# Generate API clients
yarn generate-api

# Generate API clients and watch for changes
yarn generate-api:watch

# Start development server with API generation
yarn dev:with-api
```

### Using API Hooks in Components

```tsx
import { useGetCourses, useCreateCourse } from '@/core/api/generated';
import { useApiQuery, useApiMutation } from '@/core/api/hooks';

function CoursesPage() {
  // Basic usage
  const coursesQuery = useGetCourses();

  // Enhanced usage with error handling
  const enhancedQuery = useApiQuery(coursesQuery, {
    errorMessage: 'Failed to load courses',
    showErrorToast: true,
  });

  // Mutation with success/error handling
  const createCourseMutation = useCreateCourse();
  const enhancedMutation = useApiMutation(createCourseMutation, {
    successMessage: 'Course created successfully',
    errorMessage: 'Failed to create course',
  });

  const { data: courses, isLoading, error } = enhancedQuery;

  // Component implementation...
}
```

### Working with Zod Schemas

```tsx
import { CourseSchema } from '@/core';

// Validate data
function validateCourse(data: unknown) {
  try {
    const validatedCourse = CourseSchema.parse(data);
    return { success: true, data: validatedCourse };
  } catch (error) {
    return { success: false, error };
  }
}
```

## Best Practices

1. Always use the generated types for API requests and responses
2. Use the enhanced hooks (`useApiQuery`, `useApiMutation`) for better error handling
3. Keep business logic separate from API calls
4. Use React Query's caching capabilities to avoid unnecessary API calls
5. Follow the feature-first organization principle when importing API hooks
