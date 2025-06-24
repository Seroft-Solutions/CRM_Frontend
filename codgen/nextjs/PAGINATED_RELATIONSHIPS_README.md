# Paginated Relationship Combobox Implementation

## Overview

Successfully implemented paginated/infinite query support for relationship
fields in the Next.js code generator templates. This allows handling large
datasets in relationship dropdowns with search functionality and infinite
scrolling.

## Changes Made

### 1. New Component: `PaginatedRelationshipCombobox`

- **Location**:
  `templates/entity/components/paginated-relationship-combobox.tsx.ejs`
- **Features**:
  - ✅ Infinite query support with pagination
  - ✅ Search functionality with debounced input (300ms)
  - ✅ Both single and multiple selection support
  - ✅ Loading states and infinite scroll
  - ✅ Proper error handling
  - ✅ Unique keys to prevent React warnings

### 2. Updated Entity Form Template

- **Location**: `templates/entity/components/entity-form.tsx.ejs`
- **Changes**:
  - ✅ Replaced static `RelationshipCombobox` with
    `PaginatedRelationshipCombobox`
  - ✅ Added infinite query hook imports (`useGetAll[Entity]Infinite`,
    `useSearch[Entity]Infinite`)
  - ✅ Fixed TextBlob field rendering (now uses `<Textarea>` instead of
    `<Input>`)
  - ✅ Added proper error handling for built-in user relationships

### 3. Updated Generator

- **Location**: `generator.ts`
- **Changes**:
  - ✅ Added automatic generation of `paginated-relationship-combobox.tsx` for
    entities with relationships
  - ✅ Only generates the component when there are persistable relationships

## Key Features

### Infinite Query Support

```typescript
const infiniteQuery = useInfiniteQueryHook(
  shouldUseSearch ? {} : { size: 20 },
  {
    query: {
      enabled: !shouldUseSearch,
      getNextPageParam: (lastPage, allPages) => {
        // Smart pagination logic that handles both array and paginated responses
      },
    },
  }
);
```

### Search with Debouncing

```typescript
// 300ms debounced search
React.useEffect(() => {
  const timer = setTimeout(() => {
    setDeferredSearchQuery(searchQuery);
  }, 300);
  return () => clearTimeout(timer);
}, [searchQuery]);
```

### Smart Data Handling

The component automatically handles different API response formats:

- Direct arrays: `[{id: 1, name: "Item 1"}, ...]`
- Paginated responses: `{content: [{id: 1, name: "Item 1"}], ...}`

### Usage Example

```tsx
<PaginatedRelationshipCombobox
  value={field.value}
  onValueChange={field.onChange}
  displayField="name"
  placeholder="Select city"
  multiple={false}
  useInfiniteQueryHook={useGetAllCitiesInfinite}
  searchHook={useSearchCitiesInfinite}
  entityName="Cities"
  searchField="name"
/>
```

## API Integration

### Required Infinite Query Hooks

The generated endpoints provide these hooks automatically:

- `useGetAll[Entity]Infinite` - For paginated loading
- `useSearch[Entity]Infinite` - For search functionality

### Parameters Supported

- **Pagination**: `page`, `size`
- **Search**: `query` parameter
- **Filtering**: Entity-specific filters (e.g., `name.contains`)

## Benefits

1. **Performance**: Only loads data as needed, reducing initial load time
2. **User Experience**: Smooth infinite scrolling with search
3. **Scalability**: Handles large datasets (1000+ items) efficiently
4. **Flexibility**: Works with both single and multiple selections
5. **Error Handling**: Proper loading states and error messages

## Generated Files Structure

```
src/app/(protected)/[entity-plural]/
├── components/
│   ├── [entity]-form.tsx                    # Updated to use paginated combobox
│   ├── paginated-relationship-combobox.tsx # New paginated component
│   └── ... (other components)
```

## Testing

- ✅ Generated Party form with City relationship
- ✅ Generated City form with District relationship
- ✅ Fixed React key warnings
- ✅ Fixed TextBlob field rendering
- ✅ Proper API integration

## Browser Console Error Fixes

- Fixed "children with same key" error by using unique keys:
  `${entityName}-${option.id}`
- Enhanced data structure handling for different API response formats
- Added proper loading states and error boundaries

The implementation is now ready for production use and provides a smooth,
scalable solution for handling relationships in forms.
