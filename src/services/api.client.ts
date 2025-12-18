/**
 * API Client
 * Base HTTP client with interceptors, error handling, and retry logic
 */

import { getApiUrl, API_CONFIG } from '../config/api.config';
import { ApiResponse, RequestConfig } from '../types/api.types';
import { ApiException, parseApiError, getUserFriendlyError, isNetworkError } from '../utils/errors';
import { tokenStorage, schoolStorage } from '../utils/storage';
import { forceLogout } from '../utils/auth-logout';

/**
 * Request options
 */
interface RequestOptions extends RequestInit {
  timeout?: number;
  retry?: boolean;
  retryAttempts?: number;
}

/**
 * API Client Class
 */
class ApiClient {
  private baseURL: string;
  private defaultHeaders: HeadersInit;

  constructor() {
    this.baseURL = API_CONFIG.baseURL;
    this.defaultHeaders = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    };
  }

  /**
   * Check if endpoint requires school UUID header
   * School UUID should NOT be added to auth endpoints (login, register, etc.)
   */
  private shouldIncludeSchoolUUID(endpoint: string): boolean {
    // List of endpoints that should NOT have X-School-UUID header
    const excludedEndpoints = [
      '/auth/login',
      '/auth/register',
      '/auth/admin-login',
      '/auth/school/register', // School registration doesn't need school UUID yet
      '/auth/school/login', // School login doesn't need school UUID yet (it's used to get school)
      '/auth/logout',
      '/auth/forgot-password',
      '/auth/reset-password',
      '/auth/2fa/verify',
      '/auth/2fa/setup',
      '/auth/resend-otp',
      '/auth/refresh-token',
      '/auth/verify-email',
      '/auth/change-password',
    ];

    // Check if endpoint is in excluded list
    const isExcluded = excludedEndpoints.some(excluded => endpoint.includes(excluded));
    
    return !isExcluded; // Only include school UUID if NOT excluded
  }

  /**
   * Get default headers with auth token
   */
  private getHeaders(customHeaders?: HeadersInit, endpoint?: string): HeadersInit {
    const headers: HeadersInit = {
      ...this.defaultHeaders,
      ...customHeaders,
    };

    // Add auth token if available
    const token = tokenStorage.getAccessToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      
      // Debug: Log token in development
      if (import.meta.env.DEV) {
        console.log('Token added to headers:', {
          hasToken: true,
          tokenPrefix: token.substring(0, 20) + '...',
        });
      }
    } else {
      // Debug: Log missing token
      if (import.meta.env.DEV) {
        console.warn('No token found in storage for API request');
        
        // Try to use session ID if available (for 2FA flow)
        const sessionId = sessionStorage.getItem('auth_session_id');
        const userId = sessionStorage.getItem('auth_user_id');
        if (sessionId && userId) {
          console.log('Using session ID for authentication:', { sessionId, userId });
          // Some backends accept session-based auth - try adding session headers
          (headers as Record<string, string>)['X-Session-ID'] = sessionId;
          (headers as Record<string, string>)['X-User-ID'] = userId;
        }
      }
    }

    // Add school UUID header ONLY if endpoint requires it and schoolId is available
    if (endpoint && this.shouldIncludeSchoolUUID(endpoint)) {
      const schoolId = schoolStorage.getSchoolId();
      if (schoolId) {
        (headers as Record<string, string>)['X-School-UUID'] = schoolId;
        
        // Debug: Log school UUID in development
        if (import.meta.env.DEV) {
          console.log('School UUID added to headers:', schoolId);
        }
      }
    }

    return headers;
  }

  /**
   * Create timeout promise
   */
  private createTimeout(timeout: number): Promise<never> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new ApiException('Request timeout', 408, 'TIMEOUT'));
      }, timeout);
    });
  }

  /**
   * Retry request
   */
  private async retryRequest(
    url: string,
    options: RequestOptions,
    attempts: number
  ): Promise<Response> {
    for (let i = 0; i < attempts; i++) {
      try {
        const response = await this.fetchWithTimeout(url, options);
        
        // Retry on server errors (5xx) or network errors
        if (response.status >= 500 || response.status === 408) {
          if (i < attempts - 1) {
            await this.delay(API_CONFIG.retryDelay * (i + 1));
            continue;
          }
        }
        
        return response;
      } catch (error) {
        if (isNetworkError(error) && i < attempts - 1) {
          await this.delay(API_CONFIG.retryDelay * (i + 1));
          continue;
        }
        throw error;
      }
    }
    
    throw new ApiException('Request failed after retries', 500, 'RETRY_FAILED');
  }

  /**
   * Delay helper
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Fetch with timeout
   */
  private async fetchWithTimeout(
    url: string,
    options: RequestOptions
  ): Promise<Response> {
    const timeout = options.timeout || API_CONFIG.timeout;
    
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const fetchOptions: RequestInit = {
        ...options,
        signal: controller.signal,
        mode: 'cors', // Explicitly set CORS mode
        cache: 'no-cache', // Don't cache requests
      };
      
      // Only add credentials if not already specified
      if (!('credentials' in options)) {
        fetchOptions.credentials = 'omit'; // Use 'omit' to avoid CORS preflight issues, backend should handle auth via headers
      }
      
      // Log request details in development for CORS debugging
      if (import.meta.env.DEV) {
        const customHeaders = (options.headers as Record<string, string>) || {};
        const hasCustomHeaders = Object.keys(customHeaders).some(key => 
          key.startsWith('X-') || key.toLowerCase() === 'authorization'
        );
        
        if (hasCustomHeaders) {
          console.log('🔍 CORS Preflight Trigger:', {
            url,
            method: options.method || 'GET',
            customHeaders: Object.keys(customHeaders),
            note: 'Custom headers trigger CORS preflight. Backend must allow these headers.',
          });
        }
      }
      
      // Make the request
      const response = await fetch(url, fetchOptions);
      clearTimeout(timeoutId);
      
      // Check for CORS errors in response (status 0 usually indicates CORS failure)
      if (!response.ok && response.status === 0) {
        throw new ApiException(
          'CORS error: Backend server is not allowing requests from this origin. Please check backend CORS configuration.',
          0,
          'CORS_ERROR',
          { url }
        );
      }
      
      // Check if response was blocked (CORS preflight failure)
      if (response.type === 'opaque' || response.type === 'opaqueredirect') {
        // Try to get more info from error if available
        const customHeaders = (options.headers as Record<string, string>) || {};
        const customHeaderNames = Object.keys(customHeaders).filter(key => key.startsWith('X-'));
        const lowercaseHeaders = customHeaderNames.map(h => h.toLowerCase());
        
        throw new ApiException(
          `CORS Error: Request blocked by browser CORS policy.\n\nBackend needs to allow these headers in Access-Control-Allow-Headers:\n${lowercaseHeaders.map(h => `- ${h}`).join('\n')}\n\nQuick Fix: Add "${lowercaseHeaders.join('", "')}" to Access-Control-Allow-Headers in backend CORS configuration.`,
          0,
          'CORS_ERROR',
          { 
            url, 
            responseType: response.type,
            customHeaders: customHeaderNames,
            lowercaseHeaders: lowercaseHeaders,
            solution: `Add "${lowercaseHeaders.join('", "')}" to Access-Control-Allow-Headers`
          }
        );
      }
      
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new ApiException('Request timeout', 408, 'TIMEOUT');
      }
      
      // Handle CORS errors specifically
      if (error.message && (error.message.includes('CORS') || error.message.includes('cors'))) {
        const customHeaders = (options.headers as Record<string, string>) || {};
        const customHeaderNames = Object.keys(customHeaders).filter(key => key.startsWith('X-'));
        
        throw new ApiException(
          `CORS Error: Backend server is not allowing requests from this origin.\n\nRequired Headers: ${customHeaderNames.join(', ')}\n\nBackend must configure CORS to allow:\n- Access-Control-Allow-Origin: ${window.location.origin}\n- Access-Control-Allow-Headers: Authorization, Content-Type, X-School-UUID, X-Class-UUID\n- Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS`,
          0,
          'CORS_ERROR',
          { 
            url, 
            error: error.message,
            customHeaders: customHeaderNames,
            solution: 'Backend CORS configuration must include all custom headers in Access-Control-Allow-Headers'
          }
        );
      }
      
      // Handle network errors (which might be CORS)
      if (error.message === 'Failed to fetch' || error.name === 'TypeError' || error.message?.includes('fetch')) {
        // Check if it's a CORS error by checking for CORS-related keywords
        const isCorsError = error.message?.includes('CORS') || 
                           error.message?.includes('cors') || 
                           error.message?.includes('Access-Control') ||
                           error.message?.includes('blocked by CORS policy') ||
                           error.message?.includes('preflight') ||
                           error.message?.includes('not allowed by Access-Control-Allow-Headers') ||
                           error.message?.includes('network error') ||
                           (error.name === 'TypeError' && !error.message);
        
        // Check console for CORS errors (browser logs them separately)
        const consoleError = (window as any).__lastCorsError;
        if (consoleError && consoleError.includes('not allowed by Access-Control-Allow-Headers')) {
          // Extract header name from error
          const headerMatch = consoleError.match(/header field ['"]([^'"]+)['"]/i);
          if (headerMatch) {
            const blockedHeader = headerMatch[1].toLowerCase();
            const customHeaders = (options.headers as Record<string, string>) || {};
            
            throw new ApiException(
              `🚨 CORS Error: Header "${blockedHeader}" is not allowed by backend.\n\n✅ Quick Fix:\nBackend must add "${blockedHeader}" to Access-Control-Allow-Headers.\n\nExample (Express.js):\napp.use(cors({\n  allowedHeaders: ['Content-Type', 'Authorization', '${blockedHeader}']\n}));\n\nExample (NestJS):\napp.enableCors({\n  allowedHeaders: ['Content-Type', 'Authorization', '${blockedHeader}']\n});`,
              0,
              'CORS_ERROR',
              { 
                url, 
                error: error.message,
                blockedHeader: blockedHeader,
                solution: `Add "${blockedHeader}" to Access-Control-Allow-Headers in backend CORS configuration`
              }
            );
          }
        }
        
        if (isCorsError) {
          const customHeaders = (options.headers as Record<string, string>) || {};
          const customHeaderNames = Object.keys(customHeaders).filter(key => key.startsWith('X-'));
          
          // Convert header names to lowercase for CORS (browser sends them lowercase in preflight)
          const lowercaseHeaders = customHeaderNames.map(h => h.toLowerCase());
          
          throw new ApiException(
            `CORS Error: Request blocked by browser CORS policy.\n\n❌ Header "${customHeaderNames[0] || 'x-class-uuid'}" is not allowed by backend.\n\n✅ Backend CORS configuration must include:\n1. Access-Control-Allow-Origin: ${window.location.origin}\n2. Access-Control-Allow-Headers: Authorization, Content-Type, ${lowercaseHeaders.join(', ')}\n3. Access-Control-Allow-Methods: GET, POST, PATCH, DELETE, OPTIONS\n4. Handle OPTIONS preflight requests\n\n⚠️ Note: Header names in Access-Control-Allow-Headers must match exactly (case-sensitive in CORS).`,
            0,
            'CORS_ERROR',
            { 
              url, 
              error: error.message,
              customHeaders: customHeaderNames,
              lowercaseHeaders: lowercaseHeaders,
              solution: `Backend needs to add "${lowercaseHeaders.join('", "')}" to Access-Control-Allow-Headers in CORS configuration. Header names must be lowercase.`
            }
          );
        }
        
        throw new ApiException(
          'Network error: Unable to connect to server. Please check your internet connection and ensure the backend server is running.',
          0,
          'NETWORK_ERROR',
          { url, error: error.message }
        );
      }
      
      throw error;
    }
  }

  /**
   * Handle response
   */
  private async handleResponse<T>(response: Response): Promise<ApiResponse<T>> {
    const contentType = response.headers.get('content-type');
    const isJson = contentType?.includes('application/json');

    let data: any;
    
    try {
      if (isJson) {
        data = await response.json();
      } else {
        const text = await response.text();
        data = text ? { message: text } : {};
      }
    } catch (error) {
      throw new ApiException('Invalid response format', 500, 'INVALID_RESPONSE');
    }

    // Handle non-2xx responses
    if (!response.ok) {
      // Handle 401 Unauthorized - Token expired or invalid
      if (response.status === 401) {
        // Check if this is an auth endpoint (login, register, etc.) - don't logout on those
        const url = response.url || '';
        const isAuthEndpoint = url.includes('/auth/login') || 
                              url.includes('/auth/register') || 
                              url.includes('/auth/forgot-password') ||
                              url.includes('/auth/reset-password') ||
                              url.includes('/auth/2fa/verify') ||
                              url.includes('/auth/resend-otp') ||
                              url.includes('/auth/verify-email');
        
        // Only logout if it's NOT an auth endpoint (means token expired on protected route)
        if (!isAuthEndpoint) {
          // Token expired or invalid - force logout
          console.warn('Token expired or invalid. Logging out user...');
          forceLogout('Your session has expired. Please login again.');
          
          // Throw error to prevent further processing
          throw new ApiException(
            'Your session has expired. Please login again.',
            401,
            'TOKEN_EXPIRED',
            { autoLogout: true }
          );
        }
      }

      // Log error details for debugging
      if (response.status === 400) {
        console.error('Bad Request Error:', {
          status: response.status,
          data,
          url: response.url,
          fullResponse: data,
        });
      }

      // Parse error from response data
      const error = parseApiError({
        response: {
          status: response.status,
          data,
        },
      });
      
      // Enhanced error message extraction
      let errorMessage = error.message || 'Request failed';
      
      // Handle array of error messages (validation errors)
      if (data?.message && Array.isArray(data.message)) {
        errorMessage = data.message.join(', ');
      } else if (data?.message && typeof data.message === 'string') {
        errorMessage = data.message;
      } else if (data?.error && typeof data.error === 'string') {
        errorMessage = data.error;
      }

      // Special handling for 409 Conflict - show detailed message
      if (response.status === 409) {
        // Log the conflict details for debugging
        if (import.meta.env.DEV) {
          console.error('⚠️ 409 Conflict Error:', {
            status: response.status,
            message: errorMessage,
            data: data,
            url: response.url,
            note: 'This usually means a duplicate email or user already exists',
          });
        }
      }

      // Special handling for 403 Forbidden (role/permission errors)
      if (response.status === 403) {
        if (errorMessage.toLowerCase().includes('teacher') || errorMessage.toLowerCase().includes('role')) {
          errorMessage = 'Access denied: Teacher role required. Please login as a teacher to access this feature.';
        } else {
          errorMessage = 'Access denied: You do not have permission to access this resource.';
        }
      }
      
      throw new ApiException(
        errorMessage,
        response.status,
        error.code,
        { ...error.details, originalData: data }
      );
    }

    // Return standardized response
    return {
      success: true,
      data: data.data !== undefined ? data.data : data,
      message: data.message,
      timestamp: data.timestamp || new Date().toISOString(),
    };
  }

  /**
   * Make request
   */
  private async request<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<ApiResponse<T>> {
    const url = getApiUrl(endpoint);
    const {
      timeout,
      retry = false,
      retryAttempts = API_CONFIG.retryAttempts,
      headers,
      ...fetchOptions
    } = options;

    const requestHeaders = this.getHeaders(headers as HeadersInit, endpoint);

    try {
      let response: Response;

      if (retry) {
        response = await this.retryRequest(url, {
          ...fetchOptions,
          headers: requestHeaders,
          timeout,
        }, retryAttempts);
      } else {
        response = await this.fetchWithTimeout(url, {
          ...fetchOptions,
          headers: requestHeaders,
          timeout,
        });
      }

      return await this.handleResponse<T>(response);
    } catch (error: any) {
      if (error instanceof ApiException) {
        // Handle 401 Unauthorized errors (token expired)
        if (error.statusCode === 401 && error.details?.autoLogout !== true) {
          // Check if this is an auth endpoint - don't logout on those
          const isAuthEndpoint = endpoint.includes('/auth/login') || 
                                endpoint.includes('/auth/register') || 
                                endpoint.includes('/auth/forgot-password') ||
                                endpoint.includes('/auth/reset-password') ||
                                endpoint.includes('/auth/2fa/verify') ||
                                endpoint.includes('/auth/resend-otp') ||
                                endpoint.includes('/auth/verify-email');
          
          if (!isAuthEndpoint) {
            console.warn('Token expired or invalid. Logging out user...');
            forceLogout('Your session has expired. Please login again.');
          }
        }
        
        // Log CORS errors with detailed information
        if (error.code === 'CORS_ERROR') {
          console.error('🚨 CORS Error Detected:', {
            endpoint,
            url,
            message: error.message,
            details: error.details,
            solution: 'Backend needs to add X-School-UUID to Access-Control-Allow-Headers. See BACKEND_CORS_CONFIG.md for details.',
          });
        }
        throw error;
      }

      // Handle network errors
      if (isNetworkError(error)) {
        // Check if it might be a CORS error
        const mightBeCors = error.message?.includes('Failed to fetch') || 
                           error.message?.includes('network') ||
                           error.name === 'TypeError';
        
        if (mightBeCors) {
          console.error('🚨 Possible CORS Error:', {
            endpoint,
            url,
            error: error.message,
            solution: 'Backend CORS configuration needs to allow X-School-UUID header. See BACKEND_CORS_CONFIG.md for details.',
          });
        }
        
        throw new ApiException(
          'Network error. Please check your internet connection.',
          0,
          'NETWORK_ERROR',
          undefined,
          error
        );
      }

      // Handle other errors
      const apiError = parseApiError(error);
      throw new ApiException(
        apiError.message || 'An unexpected error occurred',
        apiError.statusCode || 500,
        apiError.code,
        apiError.details,
        error
      );
    }
  }

  /**
   * GET request
   */
  async get<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'GET',
      ...config,
    });
  }

  /**
   * POST request
   */
  async post<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  /**
   * PUT request
   */
  async put<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  /**
   * PATCH request
   */
  async patch<T>(
    endpoint: string,
    data?: any,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
      ...config,
    });
  }

  /**
   * DELETE request
   */
  async delete<T>(
    endpoint: string,
    config?: RequestConfig
  ): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'DELETE',
      ...config,
    });
  }
}

// Export singleton instance
export const apiClient = new ApiClient();

