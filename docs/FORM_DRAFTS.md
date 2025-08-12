# Form Drafts Functionality

This document explains the new form drafts functionality that allows users to
save their form progress when navigating away from forms.

## Overview

The drafts functionality allows users to:

- Save form data as drafts when navigating away from a form
- Restore previous drafts when starting a new form
- Manage multiple drafts per entity type
- Auto-save drafts (when enabled)

## How It Works

### 1. Draft Dialog on Navigation

When a user attempts to navigate away from a form with unsaved changes (e.g.,
clicking to add a customer), a dialog appears with three options:

- **Save as Draft**: Saves the current form data to the server and proceeds with
  navigation
- **Discard Changes**: Discards all changes and proceeds with navigation
- **Cancel**: Stays on the current form

### 2. Draft Restoration

When starting a new form, if drafts exist for that entity type, a restoration
dialog appears showing:

- List of available drafts with timestamps and step information
- Option to restore a specific draft
- Option to delete unwanted drafts
- Option to start fresh (ignoring existing drafts)

### 3. API Integration

Drafts are stored using the UserDrafts API:

- **Entity Type**: The entity name (e.g., "Call", "Customer")
- **JSON Payload**: Serialized form data including current step and metadata
- **User Context**: Automatically associated with the current user

## Configuration

### Form-Level Configuration

Each entity form can configure drafts behavior in the form config:

```typescript
behavior: {
  drafts: {
    enabled: true,                    // Enable/disable drafts
    saveBehavior: 'onNavigation',     // 'onNavigation' | 'onUnload' | 'both'
    confirmDialog: true,              // Show confirmation dialog
    autoSave: false,                  // Auto-save drafts on form changes
    maxDrafts: 5,                     // Maximum drafts per entity per user
    showRestorationDialog: true,      // Show restoration dialog on form start
  }
}
```

### Configuration Options

- **enabled**: Master switch for draft functionality
- **saveBehavior**: When to trigger draft saves
  - `onNavigation`: Only when navigating to other forms (cross-entity
    navigation)
  - `onUnload`: On page unload/refresh
  - `both`: Both scenarios
- **confirmDialog**: Whether to show the save draft confirmation dialog
- **autoSave**: Automatically save drafts as user types (debounced)
- **maxDrafts**: Limit number of drafts stored per entity type per user
- **showRestorationDialog**: Show draft restoration dialog when starting new
  forms

## Usage Examples

### Basic Usage

The drafts functionality is automatically enabled for all generated forms when
`drafts.enabled: true` is set in the form configuration.

### Customizing Behavior

To disable drafts for a specific entity:

```typescript
// In entity-form-config.ts
behavior: {
  drafts: {
    enabled: false,  // Disable drafts for this entity
  }
}
```

To enable auto-save:

```typescript
behavior: {
  drafts: {
    enabled: true,
    autoSave: true,     // Enable auto-save
    saveBehavior: 'both', // Save on navigation and unload
  }
}
```

## Technical Implementation

### Components

- **SaveDraftDialog**: Dialog for asking user about saving drafts
- **DraftRestorationDialog**: Dialog for restoring existing drafts
- **useEntityDrafts**: Hook for managing draft operations

### API Integration

- Uses existing UserDrafts API endpoints
- Stores form data as JSON in `jsonPayload` field
- Automatically manages user context and timestamps

### Cross-Form Navigation

- Integrates with existing cross-form navigation system
- Shows draft dialog before navigation when form is dirty
- Supports both keyboard and mouse navigation triggers

## Benefits

1. **Better User Experience**: Users don't lose their work when navigating away
2. **Productivity**: Users can save partial work and continue later
3. **Flexibility**: Configurable per entity type
4. **Server-Side Storage**: Drafts persist across browser sessions
5. **Automatic Cleanup**: Old drafts are automatically cleaned up

## Migration Notes

- Existing forms automatically get draft functionality when regenerated
- No breaking changes to existing form behavior
- LocalStorage persistence is still available for cross-entity navigation
- Draft functionality is additive - existing features continue to work

## Testing

To test the draft functionality:

1. Start creating a new call
2. Fill out some form fields
3. Click to add a customer (cross-entity navigation)
4. Verify the draft dialog appears
5. Choose "Save as Draft"
6. Return to the calls form
7. Start a new call
8. Verify the restoration dialog appears with your saved draft

## Troubleshooting

- **Drafts not saving**: Check that `drafts.enabled: true` in form config
- **Dialog not appearing**: Verify `confirmDialog: true` and form has changes
- **Restoration dialog not showing**: Check `showRestorationDialog: true`
- **API errors**: Verify UserDrafts API endpoints are accessible

## Future Enhancements

- Draft preview functionality
- Draft sharing between users (with permissions)
- Draft templates for common scenarios
- Enhanced draft metadata (tags, descriptions)
- Draft conflict resolution for concurrent editing
