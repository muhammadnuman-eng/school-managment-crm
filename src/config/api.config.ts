/**
 * API Configuration
 * Centralized configuration for API endpoints and settings
 */

export const API_CONFIG = {
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:3000',
  apiPrefix: import.meta.env.VITE_API_PREFIX || 'v1',
  timeout: 30000, // 30 seconds
  retryAttempts: 3,
  retryDelay: 1000, // 1 second
} as const;

/**
 * Get full API URL with prefix
 */
export const getApiUrl = (endpoint: string): string => {
  const baseUrl = API_CONFIG.baseURL.replace(/\/$/, ''); // Remove trailing slash
  const prefix = API_CONFIG.apiPrefix.replace(/^\//, '').replace(/\/$/, ''); // Clean prefix
  const cleanEndpoint = endpoint.startsWith('/') ? endpoint : `/${endpoint}`;
  
  return `${baseUrl}/${prefix}${cleanEndpoint}`;
};

/**
 * API Endpoints
 */
export const API_ENDPOINTS = {
  // Authentication
  auth: {
    login: '/auth/login',
    register: '/auth/register',
    logout: '/auth/logout',
    forgotPassword: '/auth/forgot-password',
    resetPassword: '/auth/reset-password',
    verify2FA: '/auth/2fa/verify',
    setup2FA: '/auth/2fa/setup',
    resendOTP: '/auth/resend-otp',
    refreshToken: '/auth/refresh-token',
    verifyEmail: '/auth/verify-email',
    changePassword: '/auth/change-password',
  },
  // Admin
  admin: {
    dashboardStats: '/admin/dashboard/stats',
    students: '/admin/students',
    classes: '/admin/classes',
    sections: '/admin/sections',
    addClass: '/admin/classes/academic-years',
    teachers: '/admin/teachers',
  },
} as const;

