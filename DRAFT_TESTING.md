# Testing the Draft Functionality

## What's Been Implemented ✅

1. **Draft Dialog on Navigation**: Shows when navigating away from forms with unsaved changes
2. **Draft Restoration Dialog**: Shows available drafts when starting new forms  
3. **Drafts Management Page**: Dedicated page to view, restore, and delete all drafts
4. **Cross-Form Navigation Integration**: Draft-aware navigation for relationship creation

## How to Test

### 1. Test Draft Creation and Navigation Dialog

1. Go to `/calls/new`
2. Fill out some form fields (make the form "dirty")
3. Click the "+" button next to Customer field
4. **Expected**: Draft dialog should appear with options:
   - "Save as Draft" 
   - "Discard Changes"
   - "Cancel"

### 2. Test Draft Restoration Dialog

1. Create a draft using step 1 above
2. Go back to `/calls/new` 
3. **Expected**: Restoration dialog should appear showing your saved draft with option to restore or start fresh

### 3. Test Drafts Management Page

1. Navigate to `/drafts` from the sidebar
2. **Expected**: See all your saved drafts across all entity types
3. Click "Restore" on any draft
4. **Expected**: Navigate to appropriate form with draft data restored
5. Click delete (trash icon) on any draft
6. **Expected**: Confirmation dialog, then draft is deleted

## Configuration

### Enable/Disable Drafts
In any form config (e.g., `call-form-config.ts`):
```typescript
behavior: {
  drafts: {
    enabled: true/false,    // Master switch
    confirmDialog: true,    // Show save dialog
    autoSave: false,       // Auto-save as user types
    maxDrafts: 5,          // Max drafts per entity
  }
}
```

### Navigation Integration
- Updated to use `navigateWithDraftCheck` instead of `navigateToCreateEntity`
- Automatically checks for dirty forms before navigation
- Shows appropriate dialogs based on configuration

## Architecture

- **useEntityDrafts**: Core hook for draft operations
- **SaveDraftDialog**: Dialog for saving drafts on navigation
- **DraftRestorationDialog**: Dialog for restoring drafts
- **Cross-Form Navigation**: Draft-aware navigation context
- **Drafts Page**: Centralized draft management

## Entity Route Mapping
The drafts page supports these entity types:
- Call → `/calls/new`
- Customer → `/customers/new`  
- Meeting → `/meetings/new`
- Source → `/sources/new`
- Priority → `/priorities/new`
- And more...

Add new mappings in `ENTITY_ROUTES` object in drafts page.
