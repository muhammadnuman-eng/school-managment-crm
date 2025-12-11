/**
 * API Types
 * TypeScript types for API requests and responses
 */

/**
 * Standard API Response Structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: ApiError;
  timestamp?: string;
}

/**
 * API Error Structure
 */
export interface ApiError {
  code?: string;
  message: string;
  details?: Record<string, any>;
  statusCode?: number;
}

/**
 * Pagination Response
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Request Headers
 */
export interface RequestHeaders {
  [key: string]: string;
}

/**
 * Request Config
 */
export interface RequestConfig {
  headers?: RequestHeaders;
  timeout?: number;
  retry?: boolean;
  retryAttempts?: number;
}
