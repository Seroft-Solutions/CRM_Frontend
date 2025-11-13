'use client';

export const failedCallsDebugLog = (...args: unknown[]) => {
  if (typeof window !== 'undefined') {
    console.debug('[FailedCallsTable]', ...args);
  }
};
