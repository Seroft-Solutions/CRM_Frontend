# Entity Form Configuration System

This project uses a **config-driven, modular form architecture** that allows you
to modify form structure, field order, step sequence, and validation rules
purely through configuration files—no code changes required.

## 🎯 Key Benefits

- **Config-Driven**: Change form structure by editing configuration files only
- **Modular Components**: Each step and field type has its own focused component
- **Preserved UX**: All original visual styling, animations, and behaviors are
  maintained
- **Cross-Entity Support**: Full support for creating related entities mid-flow
- **State Persistence**: Automatic form state saving and restoration
- **Responsive Design**: Mobile-first responsive layout maintained
- **Type Safety**: Full TypeScript support with generated schemas

## 📁 Architecture Overview

```
entity/
├── components/
│   ├── entity-form.tsx                 # Main entry point (backward compatible)
│   └── form/                          # Modular form system
│       ├── entity-form-config.ts      # 🔧 CONFIGURATION FILE
│       ├── form-types.ts              # TypeScript definitions
│       ├── entity-form-schema.ts      # Zod validation schemas
│       ├── entity-form-provider.tsx   # React context provider
│       ├── entity-form-wizard.tsx     # Main form orchestrator
│       ├── form-progress-indicator.tsx
│       ├── form-step-renderer.tsx
│       ├── form-navigation.tsx
│       ├── form-state-manager.tsx
│       └── steps/                     # Individual step components
│           ├── basic-info-step.tsx
│           ├── date-time-step.tsx
│           ├── settings-step.tsx
│           ├── geographic-step.tsx
│           ├── user-assignment-step.tsx
│           ├── classification-step.tsx
│           ├── business-relations-step.tsx
│           ├── other-relations-step.tsx
│           └── review-step.tsx
```

## 🔧 Configuration Guide

The main configuration file `entity-form-config.ts` controls all aspects of the
form:

### Form Steps Configuration

```typescript
steps: [
  {
    id: 'basic',
    title: 'Basic Information',
    description: 'Enter essential details',
    fields: ['name', 'description', 'amount'],
    relationships: [],
    validation: {
      mode: 'onChange',
      validateOnNext: true,
    },
  },
  // ... more steps
];
```

### Field Configuration

```typescript
fields: [
  {
    name: 'amount',
    type: 'number',
    label: 'Amount',
    placeholder: 'Enter amount',
    required: true,
    validation: {
      required: true,
      min: 0,
      max: 999999,
    },
    ui: {
      inputType: 'number',
      className: 'font-mono',
    },
  },
];
```

### Relationship Configuration

```typescript
relationships: [
  {
    name: 'party',
    type: 'many-to-one',
    targetEntity: 'Party',
    displayField: 'name',
    required: true,
    multiple: false,
    category: 'business',
    cascadingFilter: {
      parentField: 'state',
      filterField: 'state',
    },
  },
];
```

## 🛠️ Common Customization Tasks

### 1. Reorder Form Steps

Edit the `steps` array in the configuration:

```typescript
// Before: basic → dates → geographic → review
// After: geographic → basic → dates → review
steps: [
  { id: 'geographic', title: 'Location First', ... },
  { id: 'basic', title: 'Basic Information', ... },
  { id: 'dates', title: 'Date & Time', ... },
  { id: 'review', title: 'Review', ... }
]
```

### 2. Move Fields Between Steps

Simply update the `fields` array in the target step:

```typescript
// Move 'priority' from 'classification' to 'basic' step
steps: [
  {
    id: 'basic',
    fields: ['name', 'description', 'priority'], // Added here
    relationships: [],
  },
  {
    id: 'classification',
    fields: [], // Removed from here
    relationships: ['status', 'category'],
  },
];
```

### 3. Add Field Validation

Update the field's validation configuration:

```typescript
fields: [
  {
    name: 'email',
    validation: {
      required: true,
      pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
      // Custom validation message will be generated
    },
  },
];
```

### 4. Configure Cascading Relationships

Set up parent-child relationship dependencies:

```typescript
relationships: [
  {
    name: 'state',
    category: 'geographic',
    // No cascading filter - this is the parent
  },
  {
    name: 'district',
    category: 'geographic',
    cascadingFilter: {
      parentField: 'state', // Clear when state changes
      filterField: 'state', // Filter districts by selected state
    },
  },
];
```

### 5. Customize UI Behavior

Modify the `behavior` section:

```typescript
behavior: {
  autoSave: {
    enabled: true,
    debounceMs: 1000  // Save every 1 second instead of 2
  },
  navigation: {
    confirmOnCancel: true,      // Show confirmation dialog
    allowStepSkipping: true,    // Allow clicking on step indicators
    validateOnNext: false       // Don't validate when moving to next step
  }
}
```

### 6. Responsive Layout Adjustments

Update the `ui.responsive` configuration:

```typescript
ui: {
  responsive: {
    mobile: 'grid-cols-1',        // 1 column on mobile
    tablet: 'md:grid-cols-3',     // 3 columns on tablet
    desktop: 'xl:grid-cols-4'     // 4 columns on desktop
  }
}
```

### 7. Add Conditional Steps

Use the `conditionalRender` feature:

```typescript
steps: [
  {
    id: 'advanced',
    title: 'Advanced Options',
    conditionalRender: {
      field: 'type',
      operator: 'equals',
      value: 'premium',
    },
  },
];
```

## 🔄 Regeneration Process

After modifying templates:

1. Update the generator templates in
   `codgen/nextjs/templates/entity/components/form/`
2. Run the generator: `npm run generate` or `npm run generate EntityName`
3. The configuration files will be regenerated with your changes
4. All forms will automatically use the new structure

## 🧪 Testing Changes

1. **Visual Regression**: Compare before/after screenshots
2. **Functionality**: Test all navigation, validation, and submission flows
3. **Cross-Entity**: Verify related entity creation still works
4. **State Persistence**: Test form restoration after page refresh
5. **Mobile**: Check responsive behavior on different screen sizes

## 🚨 Migration Notes

- The main `entity-form.tsx` file now acts as a simple wrapper
- All original functionality is preserved through the modular system
- Existing imports and component usage remain unchanged
- Form state persistence and cross-entity flows work identically

## 🎨 Styling Customization

UI styling can be configured through the `ui` section:

```typescript
ui: {
  animations: {
    stepTransition: 'transition-all duration-500',
    fieldFocus: 'transition-colors focus:ring-2'
  },
  spacing: {
    stepGap: 'space-y-8',
    fieldGap: 'gap-6 sm:gap-8',
    sectionGap: 'space-y-6'
  }
}
```

## 📝 Best Practices

1. **Step Organization**: Group related fields logically
2. **Validation**: Set validation rules in configuration rather than components
3. **Relationships**: Use meaningful categories for automatic grouping
4. **Testing**: Always test the full form flow after configuration changes
5. **Performance**: Consider step count and field distribution for optimal UX

## 🔍 Troubleshooting

### Form Not Rendering

- Check that step IDs match between configuration and step renderer
- Verify all required imports are present in generated files

### Validation Not Working

- Ensure field names match between configuration and schema
- Check that validation rules are properly formatted

### Cascading Filters Broken

- Verify parent field names are correct
- Check that relationship categories are properly set

### State Persistence Issues

- Confirm session storage keys are unique
- Check that persistence is enabled in behavior configuration

---

**Need Help?** Check the generated configuration file for your entity - it
contains extensive inline documentation and examples.
