export async function fetchAccessToken(): Promise<string | null> {
  try {
    if (typeof window !== 'undefined') {
      try {
        const response = await fetch('/api/auth/session');
        if (response.ok) {
          const session = await response.json();
          if (session?.access_token) {
            return session.access_token as string;
          }
        }
      } catch (error) {
        console.warn('Auth session fetch failed:', error);
      }
      const { tokenStorage } = await import('@/lib/token-storage');
      return tokenStorage.getToken() || tokenStorage.getTokenSession();
    }
    const { getAccessToken } = await import('@/lib/dal');
    const token = await getAccessToken();
    return token;
  } catch (error) {
    console.error('Error getting access token:', error);
    return null;
  }
}
