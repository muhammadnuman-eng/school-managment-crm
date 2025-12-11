/**
 * Storage Utilities
 * Handles localStorage and sessionStorage operations for tokens and user data
 */

const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_KEY = 'auth_user';
const REMEMBER_ME_KEY = 'auth_remember_me';

/**
 * Storage type
 */
type StorageType = 'localStorage' | 'sessionStorage';

/**
 * Get storage instance
 */
const getStorage = (type: StorageType = 'localStorage'): Storage => {
  return type === 'localStorage' ? localStorage : sessionStorage;
};

/**
 * Token Storage
 */
export const tokenStorage = {
  /**
   * Save access token
   */
  setAccessToken: (token: string, rememberMe: boolean = false): void => {
    const storage = getStorage(rememberMe ? 'localStorage' : 'sessionStorage');
    storage.setItem(TOKEN_KEY, token);
    storage.setItem(REMEMBER_ME_KEY, rememberMe.toString());
  },

  /**
   * Get access token
   */
  getAccessToken: (): string | null => {
    // Try localStorage first
    const localToken = localStorage.getItem(TOKEN_KEY);
    if (localToken) return localToken;
    
    // Fallback to sessionStorage
    return sessionStorage.getItem(TOKEN_KEY);
  },

  /**
   * Save refresh token
   */
  setRefreshToken: (token: string, rememberMe: boolean = false): void => {
    const storage = getStorage(rememberMe ? 'localStorage' : 'sessionStorage');
    storage.setItem(REFRESH_TOKEN_KEY, token);
  },

  /**
   * Get refresh token
   */
  getRefreshToken: (): string | null => {
    const localToken = localStorage.getItem(REFRESH_TOKEN_KEY);
    if (localToken) return localToken;
    return sessionStorage.getItem(REFRESH_TOKEN_KEY);
  },

  /**
   * Save tokens
   */
  setTokens: (tokens: { accessToken: string; refreshToken: string }, rememberMe: boolean = false): void => {
    tokenStorage.setAccessToken(tokens.accessToken, rememberMe);
    tokenStorage.setRefreshToken(tokens.refreshToken, rememberMe);
  },

  /**
   * Clear all tokens
   */
  clearTokens: (): void => {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    sessionStorage.removeItem(TOKEN_KEY);
    sessionStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(REMEMBER_ME_KEY);
  },

  /**
   * Check if tokens exist
   */
  hasTokens: (): boolean => {
    return !!tokenStorage.getAccessToken() && !!tokenStorage.getRefreshToken();
  },
};

/**
 * User Storage
 */
export const userStorage = {
  /**
   * Save user data
   */
  setUser: (user: any, rememberMe: boolean = false): void => {
    const storage = getStorage(rememberMe ? 'localStorage' : 'sessionStorage');
    storage.setItem(USER_KEY, JSON.stringify(user));
  },

  /**
   * Get user data
   */
  getUser: (): any | null => {
    const localUser = localStorage.getItem(USER_KEY);
    if (localUser) {
      try {
        return JSON.parse(localUser);
      } catch {
        return null;
      }
    }
    
    const sessionUser = sessionStorage.getItem(USER_KEY);
    if (sessionUser) {
      try {
        return JSON.parse(sessionUser);
      } catch {
        return null;
      }
    }
    
    return null;
  },

  /**
   * Clear user data
   */
  clearUser: (): void => {
    localStorage.removeItem(USER_KEY);
    sessionStorage.removeItem(USER_KEY);
  },
};

/**
 * Clear all auth data
 */
export const clearAuthData = (): void => {
  tokenStorage.clearTokens();
  userStorage.clearUser();
};

/**
 * Check if user is authenticated
 */
export const isAuthenticated = (): boolean => {
  return tokenStorage.hasTokens() && !!userStorage.getUser();
};

/**
 * Page Navigation Storage
 */
const CURRENT_PAGE_KEY = 'app_current_page';
const USER_TYPE_KEY = 'app_user_type';

export const pageStorage = {
  /**
   * Save current page
   */
  setCurrentPage: (page: string): void => {
    try {
      sessionStorage.setItem(CURRENT_PAGE_KEY, page);
    } catch (error) {
      console.error('Failed to save current page:', error);
    }
  },

  /**
   * Get current page
   */
  getCurrentPage: (): string | null => {
    try {
      return sessionStorage.getItem(CURRENT_PAGE_KEY);
    } catch (error) {
      console.error('Failed to get current page:', error);
      return null;
    }
  },

  /**
   * Clear current page
   */
  clearCurrentPage: (): void => {
    try {
      sessionStorage.removeItem(CURRENT_PAGE_KEY);
    } catch (error) {
      console.error('Failed to clear current page:', error);
    }
  },

  /**
   * Save user type
   */
  setUserType: (userType: string): void => {
    try {
      sessionStorage.setItem(USER_TYPE_KEY, userType);
    } catch (error) {
      console.error('Failed to save user type:', error);
    }
  },

  /**
   * Get user type
   */
  getUserType: (): string | null => {
    try {
      return sessionStorage.getItem(USER_TYPE_KEY);
    } catch (error) {
      console.error('Failed to get user type:', error);
      return null;
    }
  },

  /**
   * Clear user type
   */
  clearUserType: (): void => {
    try {
      sessionStorage.removeItem(USER_TYPE_KEY);
    } catch (error) {
      console.error('Failed to clear user type:', error);
    }
  },
};
