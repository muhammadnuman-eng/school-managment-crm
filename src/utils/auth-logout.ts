/**
 * Authentication Logout Utility
 * Handles automatic logout when token expires or is invalid
 */

import { tokenStorage, userStorage, schoolStorage, pageStorage, clearAuthData } from './storage';
import { authService } from '../services/auth.service';

/**
 * Force logout - clears all auth data and redirects to login
 * This is called automatically when token expires or API returns 401
 */
export const forceLogout = (reason?: string): void => {
  try {
    // Clear all authentication data
    clearAuthData();
    schoolStorage.clearSchoolId();
    pageStorage.clearCurrentPage();
    pageStorage.clearUserType();
    
    // Clear session storage items
    sessionStorage.removeItem('auth_session_id');
    sessionStorage.removeItem('auth_user_id');
    sessionStorage.removeItem('auth_temp_token');
    sessionStorage.removeItem('auth_remember_me');
    
    // Try to call logout API (but don't wait for it - clear local state immediately)
    // This is a fire-and-forget call to invalidate server-side session
    authService.logout().catch(() => {
      // Ignore errors - we're logging out anyway
    });
    
    // Show message to user if reason provided
    if (reason && typeof window !== 'undefined') {
      // Use a small delay to ensure message is shown before redirect
      setTimeout(() => {
        // Store logout reason in sessionStorage temporarily for display
        sessionStorage.setItem('logout_reason', reason);
      }, 100);
    }
    
    // Redirect to login page
    // Use window.location instead of navigate to ensure complete page reload
    // This clears any React state and ensures clean logout
    if (typeof window !== 'undefined') {
      // Get current path to determine which login page to redirect to
      const currentPath = window.location.pathname;
      
      // Determine login page based on current route
      let loginPath = '/admin/login';
      if (currentPath.includes('/admin/school-login') || currentPath.includes('/admin/school/')) {
        loginPath = '/admin/school-login';
      }
      
      // Redirect to login page
      window.location.href = loginPath;
    }
  } catch (error) {
    console.error('Error during force logout:', error);
    // Even if there's an error, try to redirect
    if (typeof window !== 'undefined') {
      window.location.href = '/admin/login';
    }
  }
};

/**
 * Check if logout was due to token expiration
 */
export const getLogoutReason = (): string | null => {
  if (typeof window === 'undefined') return null;
  const reason = sessionStorage.getItem('logout_reason');
  if (reason) {
    // Clear it after reading
    sessionStorage.removeItem('logout_reason');
    return reason;
  }
  return null;
};

