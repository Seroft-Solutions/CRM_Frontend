# Core Utils Module

This directory contains utility functions and services that are used throughout the application.

## EventBus

The EventBus is a global event mediator that allows different modules to communicate without direct dependencies. This follows the Mediator pattern and enables loose coupling between modules while maintaining separation of concerns.

### Usage

```typescript
import { eventBus, EventNames } from '@/core/common/utils/eventBus';

// Emit an event
eventBus.emit(EventNames.AUTH.TOKEN_EXPIRED, {
  source: 'token_refresh',
  error,
});

// Subscribe to an event
const unsubscribe = eventBus.on(EventNames.AUTH.TOKEN_EXPIRED, data => {
  console.log('Token expired:', data);
});

// Unsubscribe from an event
unsubscribe();

// Subscribe to an event once
eventBus.once(EventNames.AUTH.LOGIN_SUCCESS, data => {
  console.log('Login successful:', data);
});
```

### Event Names

The `EventNames` object contains constants for all event names in the application. This ensures type safety and consistency across the application.

### Feature-First Architecture Benefits

The EventBus approach supports our feature-first architecture by:

1. **Decoupling Modules**: Features can communicate without direct dependencies
2. **Single Responsibility**: Each module handles only its own concerns
3. **Maintainability**: Changes to one module don't require changes to other modules
4. **Testability**: Each module can be tested in isolation

### Example: Auth and API Communication

The auth module emits events when auth-related actions occur (login, logout, token expiry), and the API module listens for these events to update its behavior accordingly. Similarly, the API module emits events when API calls fail due to auth issues, and the auth module listens for these events to handle user redirection.

This approach ensures that the API module doesn't need to know about routing or UI concerns, and the auth module doesn't need to know about API implementation details.
