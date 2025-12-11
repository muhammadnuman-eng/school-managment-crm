/**
 * API Client
 * Base HTTP client with interceptors, error handling, and retry logic
 */

import { getApiUrl, API_CONFIG } from '../config/api.config';
import { ApiResponse, RequestConfig } from '../types/api.types';
import { ApiException, parseApiError, getUserFriendlyError, isNetworkError } from '../utils/errors';
import { tokenStorage } from '../utils/storage';

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
   * Get default headers with auth token
   */
  private getHeaders(customHeaders?: HeadersInit): HeadersInit {
    const headers: HeadersInit = {
      ...this.defaultHeaders,
      ...customHeaders,
    };

    // Add auth token if available
    const token = tokenStorage.getAccessToken();
    if (token) {
      (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
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
      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return response;
    } catch (error: any) {
      clearTimeout(timeoutId);
      if (error.name === 'AbortError') {
        throw new ApiException('Request timeout', 408, 'TIMEOUT');
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
      // Log error details for debugging
      if (response.status === 400) {
        console.error('Bad Request Error:', {
          status: response.status,
          data,
          url: response.url,
        });
      }

      const error = parseApiError({
        response: {
          status: response.status,
          data,
        },
      });
      
      throw new ApiException(
        error.message || 'Request failed',
        response.status,
        error.code,
        error.details
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

    const requestHeaders = this.getHeaders(headers as HeadersInit);

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
        throw error;
      }

      // Handle network errors
      if (isNetworkError(error)) {
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

