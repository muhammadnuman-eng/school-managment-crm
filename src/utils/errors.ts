/**
 * Error Utilities
 * Handles API error formatting and user-friendly error messages
 */

import { ApiError } from '../types/api.types';

/**
 * Custom API Error Class
 */
export class ApiException extends Error {
  public statusCode: number;
  public code?: string;
  public details?: Record<string, any>;
  public originalError?: any;

  constructor(
    message: string,
    statusCode: number = 500,
    code?: string,
    details?: Record<string, any>,
    originalError?: any
  ) {
    super(message);
    this.name = 'ApiException';
    this.statusCode = statusCode;
    this.code = code;
    this.details = details;
    this.originalError = originalError;
    Object.setPrototypeOf(this, ApiException.prototype);
  }
}

/**
 * Parse API error response
 */
export const parseApiError = (error: any): ApiError => {
  if (error instanceof ApiException) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      statusCode: error.statusCode,
    };
  }

  if (error?.response?.data) {
    const data = error.response.data;
    
    // Handle different error response formats
    let errorMessage = 'An error occurred';
    let errorCode: string | undefined;
    let errorDetails: Record<string, any> | undefined;

    // Check for different error formats
    if (data.message) {
      errorMessage = data.message;
    } else if (data.error) {
      if (typeof data.error === 'string') {
        errorMessage = data.error;
      } else if (data.error.message) {
        errorMessage = data.error.message;
      }
    } else if (data.errors && Array.isArray(data.errors) && data.errors.length > 0) {
      // Handle validation errors array
      errorMessage = data.errors[0].msg || data.errors[0].message || data.errors[0];
      errorDetails = { validationErrors: data.errors };
    } else if (data.msg) {
      errorMessage = data.msg;
    }

    errorCode = data.code || data.error?.code || data.errorCode;
    errorDetails = errorDetails || data.details || data.error?.details || data.data;

    return {
      code: errorCode,
      message: errorMessage,
      details: errorDetails,
      statusCode: error.response.status,
    };
  }

  if (error?.message) {
    return {
      message: error.message,
      statusCode: error.status || 500,
    };
  }

  return {
    message: 'An unexpected error occurred. Please try again.',
    statusCode: 500,
  };
}

/**
 * Get user-friendly error message
 */
export const getUserFriendlyError = (error: ApiError): string => {
  // Handle specific error codes
  if (error.code) {
    const errorMessages: Record<string, string> = {
      'INVALID_CREDENTIALS': 'Invalid email or password. Please try again.',
      'USER_NOT_FOUND': 'User not found. Please check your credentials.',
      'ACCOUNT_LOCKED': 'Your account has been locked. Please contact support.',
      'EMAIL_NOT_VERIFIED': 'Please verify your email address before logging in.',
      'INVALID_TOKEN': 'Your session has expired. Please login again.',
      'TOKEN_EXPIRED': 'Your session has expired. Please login again.',
      'INVALID_OTP': 'Invalid OTP code. Please try again.',
      'OTP_EXPIRED': 'OTP code has expired. Please request a new one.',
      'WEAK_PASSWORD': 'Password is too weak. Please use a stronger password.',
      'EMAIL_ALREADY_EXISTS': 'An account with this email already exists.',
      'DUPLICATE_EMAIL': 'An account with this email already exists. Please use a different email.',
      'USER_ALREADY_EXISTS': 'A user with this information already exists.',
      'NETWORK_ERROR': 'Network error. Please check your internet connection.',
      'SERVER_ERROR': 'Server error. Please try again later.',
    };

    if (errorMessages[error.code]) {
      return errorMessages[error.code];
    }
  }

  // Handle HTTP status codes
  if (error.statusCode) {
    const statusMessages: Record<number, string> = {
      400: 'Invalid request. Please check your input.',
      401: 'Unauthorized. Please login again.',
      403: 'Access denied. You don\'t have permission to perform this action.',
      404: 'Resource not found.',
      409: 'Conflict. This resource already exists.',
      422: 'Validation error. Please check your input.',
      429: 'Too many requests. Please try again later.',
      500: 'Server error. Please try again later.',
      502: 'Bad gateway. Please try again later.',
      503: 'Service unavailable. Please try again later.',
    };

    if (statusMessages[error.statusCode]) {
      return statusMessages[error.statusCode];
    }
  }

  // Return the error message or default
  return error.message || 'An unexpected error occurred. Please try again.';
}

/**
 * Check if error is network error
 */
export const isNetworkError = (error: any): boolean => {
  return (
    error?.code === 'NETWORK_ERROR' ||
    error?.message?.includes('Network') ||
    error?.message?.includes('Failed to fetch') ||
    !navigator.onLine
  );
}

/**
 * Check if error is authentication error
 */
export const isAuthError = (error: any): boolean => {
  const statusCode = error?.statusCode || error?.response?.status;
  return statusCode === 401 || statusCode === 403;
}
