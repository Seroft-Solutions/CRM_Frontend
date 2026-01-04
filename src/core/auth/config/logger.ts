/**
 * NextAuth Logger Configuration
 * Custom logging for authentication events
 */

/**
 * Logger configuration for NextAuth
 */
export const authLogger = {
  error(error: Error) {
    console.error('[NextAuth Error]', error);
  },

  warn(code: string) {
    console.warn(`[NextAuth Warning] ${code}`);
  },

  debug(code: string, metadata?: unknown) {
    if (process.env.NODE_ENV === 'development') {
      console.log(`[NextAuth Debug] ${code}`, metadata);
    }
  },
};
