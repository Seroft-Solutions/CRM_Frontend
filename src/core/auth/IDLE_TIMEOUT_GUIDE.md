# Idle Timeout Feature Documentation

## Overview

The idle timeout feature automatically logs out users after a specified period of inactivity, enhancing security by ensuring that unattended sessions don't remain active.

## Features

- **Configurable timeout duration**: Default 10 minutes, customizable
- **Warning system**: Shows warning 2 minutes before logout (configurable)
- **Activity tracking**: Monitors mouse, keyboard, scroll, and touch events
- **Automatic logout**: Forces logout after timeout with clear messaging
- **Session recovery**: Users can extend their session during the warning period

## Configuration

### Basic Setup (Already Implemented)

The feature is already configured in your protected layout:

```tsx
// src/app/(protected)/layout.tsx
<SessionManagerProvider 
  idleTimeoutMinutes={10} 
  warningBeforeLogoutMinutes={2}
>
  {/* Your app content */}
</SessionManagerProvider>
```

### Configuration Options

- `idleTimeoutMinutes`: Total minutes before logout (default: 10)
- `warningBeforeLogoutMinutes`: Minutes before timeout to show warning (default: 2)

## User Experience

### Timeline Example (10-minute timeout):

1. **0-8 minutes**: User is active, no warnings
2. **8-10 minutes**: Warning modal appears: "Session expiring in 2 minutes"
3. **10+ minutes**: Idle timeout modal appears: "Session expired due to inactivity"
4. **10+ minutes + 30 seconds**: Automatic logout to login page

### Modal Types

1. **Warning Modal** (at 8 minutes):
   - Shows time remaining
   - "Extend Session" button
   - "Dismiss" button

2. **Idle Timeout Modal** (at 10 minutes):
   - Clear message about inactivity
   - "Click to Login Again" button
   - Auto-logout after 30 seconds

## Custom Usage

### Using the useIdleTimeout Hook

```tsx
import { useIdleTimeout } from '@/core/auth';

function MyComponent() {
  const { 
    isIdle, 
    minutesIdle, 
    getActivityStatus,
    getTimeUntilWarning,
    getTimeUntilLogout,
    resetIdleTimer 
  } = useIdleTimeout();

  return (
    <div>
      <p>Status: {getActivityStatus()}</p>
      <p>Idle for: {minutesIdle} minutes</p>
      <p>Warning in: {getTimeUntilWarning()} minutes</p>
      <p>Logout in: {getTimeUntilLogout()} minutes</p>
      
      {isIdle && (
        <button onClick={resetIdleTimer}>
          Reset Activity Timer
        </button>
      )}
    </div>
  );
}
```

### Session Status Component (Development)

For development and testing, you can add the SessionStatus component:

```tsx
import { SessionStatus } from '@/core/auth';

// In your component
<SessionStatus className="fixed bottom-4 right-4" />
```

## Activity Events Tracked

The system tracks these events as user activity:
- `mousedown` - Mouse clicks
- `mousemove` - Mouse movement
- `keypress` - Keyboard input
- `keydown` - Key presses
- `scroll` - Page scrolling
- `touchstart` - Touch interactions
- `click` - Click events
- `resize` - Window resizing

## Security Features

1. **Automatic cleanup**: All timers are cleaned up on component unmount
2. **Force logout**: If re-authentication fails, users are redirected to login
3. **No escape**: The idle timeout modal cannot be dismissed without action
4. **Session invalidation**: Uses NextAuth's signOut for proper session cleanup

## Customization Examples

### Different timeout for different user roles:

```tsx
const getTimeoutForUser = (userRole: string) => {
  switch (userRole) {
    case 'admin': return 30; // 30 minutes for admins
    case 'manager': return 20; // 20 minutes for managers
    default: return 10; // 10 minutes for regular users
  }
};

// In your layout
<SessionManagerProvider 
  idleTimeoutMinutes={getTimeoutForUser(user.role)}
  warningBeforeLogoutMinutes={5}
>
```

### Custom warning thresholds:

```tsx
// Show warning 5 minutes before 15-minute timeout
<SessionManagerProvider 
  idleTimeoutMinutes={15}
  warningBeforeLogoutMinutes={5}
>
```

## Testing

To test the idle timeout feature:

1. **Quick test**: Set `idleTimeoutMinutes={1}` and `warningBeforeLogoutMinutes={0.5}`
2. **Stop interacting** with the page
3. **Watch for warning** at 30 seconds
4. **Watch for logout** at 1 minute

## Security Benefits

- **Prevents unauthorized access** to unattended sessions
- **Reduces risk** of session hijacking
- **Compliance** with security policies requiring automatic logout
- **Data protection** by ensuring sensitive information isn't left visible

## Performance

- **Lightweight**: Minimal impact on application performance
- **Efficient**: Uses single timer system with cleanup
- **Optimized**: Event listeners are properly managed and cleaned up
