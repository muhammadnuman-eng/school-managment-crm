/**
 * Authentication Service
 * Handles all authentication-related API calls
 */

import { apiClient } from './api.client';
import { API_ENDPOINTS } from '../config/api.config';
import {
  LoginRequest,
  AdminLoginRequest,
  TeacherLoginRequest,
  StudentLoginRequest,
  ParentLoginRequest,
  RegisterRequest,
  Verify2FARequest,
  Setup2FARequest,
  Setup2FAResponse,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  ChangePasswordRequest,
  VerifyEmailRequest,
  RefreshTokenRequest,
  LogoutRequest,
  LoginResponse,
  RegisterResponse,
  RefreshTokenResponse,
  User,
} from '../types/auth.types';
import { ApiResponse } from '../types/api.types';
import { tokenStorage, userStorage } from '../utils/storage';

/**
 * Authentication Service Class
 */
class AuthService {
  /**
   * Admin Login
   */
  async adminLogin(request: AdminLoginRequest): Promise<LoginResponse> {
    // Prepare request body - ensure all fields are properly formatted
    const requestBody: any = {
      email: request.email.trim(),
      password: request.password,
    };

    // Add optional fields only if they exist
    if (request.rememberMe !== undefined) {
      requestBody.rememberMe = request.rememberMe;
    }

    if (request.deviceInfo) {
      requestBody.deviceInfo = request.deviceInfo;
    }

    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.auth.login,
      requestBody
    );

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    // Extract login data - handle different response structures
    const loginData = response.data;
    
    // Debug: Log the full response to understand structure
    if (import.meta.env.DEV) {
      console.log('Login Response Structure:', {
        fullResponse: response,
        data: loginData,
        dataKeys: Object.keys(loginData || {}),
      });
    }
    
    // Extract sessionId and userId from various possible locations
    // Backend might return them in different formats:
    // 1. Directly in response.data
    // 2. In response.data.data
    // 3. In response.data.user
    // 4. As separate fields
    const sessionId = 
      (loginData as any).sessionId || 
      (loginData as any).data?.sessionId || 
      (loginData as any).session?.id ||
      (response as any).sessionId;
      
    const userId = 
      (loginData as any).userId || 
      (loginData as any).data?.userId || 
      loginData.user?.id || 
      (loginData as any).user?.userId ||
      (response as any).userId;

    // Add sessionId and userId to response if found
    if (sessionId) {
      (loginData as any).sessionId = String(sessionId);
    }
    if (userId) {
      (loginData as any).userId = String(userId);
    }

    // Log extracted values for debugging
    if (import.meta.env.DEV) {
      console.log('Extracted Session Info:', {
        sessionId,
        userId,
        hasSessionId: !!sessionId,
        hasUserId: !!userId,
      });
    }

    // Don't save tokens here - will be saved after OTP verification
    // First login always requires OTP verification
    // If not first login and remember me is checked, tokens will be saved after OTP

    return loginData;
  }

  /**
   * Setup 2FA (Enable/Disable)
   */
  async setup2FA(request: Setup2FARequest): Promise<ApiResponse<Setup2FAResponse>> {
    const requestBody: any = {
      email: request.email.trim(),
      enabled: request.enabled,
    };

    // Add password if provided (for validation)
    if (request.password) {
      requestBody.password = request.password;
    }

    const response = await apiClient.post<Setup2FAResponse>(
      API_ENDPOINTS.auth.setup2FA,
      requestBody
    );

    return response;
  }

  /**
   * Teacher Login
   */
  async teacherLogin(request: TeacherLoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.auth.login,
      {
        emailOrId: request.emailOrId,
        password: request.password,
        role: 'teacher',
        rememberMe: request.rememberMe,
        deviceInfo: request.deviceInfo,
      }
    );

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    // Save tokens if login successful and 2FA not required
    if (response.data.tokens && !response.data.requires2FA) {
      tokenStorage.setTokens(
        response.data.tokens,
        request.rememberMe || false
      );
      
      if (response.data.user) {
        userStorage.setUser(response.data.user, request.rememberMe || false);
      }
    }

    return response.data;
  }

  /**
   * Student Login
   */
  async studentLogin(request: StudentLoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.auth.login,
      {
        admissionNumber: request.admissionNumber,
        dateOfBirth: request.dateOfBirth,
        role: 'student',
      }
    );

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    // Save tokens if login successful and 2FA not required
    if (response.data.tokens && !response.data.requires2FA) {
      tokenStorage.setTokens(response.data.tokens, false);
      
      if (response.data.user) {
        userStorage.setUser(response.data.user, false);
      }
    }

    return response.data;
  }

  /**
   * Parent Login
   */
  async parentLogin(request: ParentLoginRequest): Promise<LoginResponse> {
    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.auth.login,
      {
        mobileNumber: request.mobileNumber,
        password: request.password,
        loginMethod: request.loginMethod,
        role: 'parent',
      }
    );

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    // Save tokens if login successful and 2FA not required
    if (response.data.tokens && !response.data.requires2FA) {
      tokenStorage.setTokens(response.data.tokens, false);
      
      if (response.data.user) {
        userStorage.setUser(response.data.user, false);
      }
    }

    return response.data;
  }

  /**
   * Register (Admin)
   */
  async register(request: RegisterRequest): Promise<RegisterResponse> {
    const response = await apiClient.post<RegisterResponse>(
      API_ENDPOINTS.auth.register,
      request
    );

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    return response.data;
  }

  /**
   * Verify 2FA
   */
  async verify2FA(request: Verify2FARequest): Promise<LoginResponse> {
    // Prepare request body according to backend requirements
    const requestBody = {
      sessionId: request.sessionId,
      userId: request.userId,
      method: request.method || 'EMAIL', // Default to EMAIL if not specified
      code: request.code,
    };

    const response = await apiClient.post<LoginResponse>(
      API_ENDPOINTS.auth.verify2FA,
      requestBody
    );

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    // Save tokens after successful 2FA verification
    if (response.data.tokens) {
      // Check if remember me was set (stored temporarily)
      const rememberMe = sessionStorage.getItem('auth_remember_me') === 'true';
      tokenStorage.setTokens(response.data.tokens, rememberMe);
      
      if (response.data.user) {
        userStorage.setUser(response.data.user, rememberMe);
      }
      
      // Clear temporary remember me flag
      sessionStorage.removeItem('auth_remember_me');
    }

    return response.data;
  }

  /**
   * Resend OTP
   */
  async resendOTP(email: string): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(
      API_ENDPOINTS.auth.resendOTP,
      { email }
    );
  }

  /**
   * Forgot Password
   */
  async forgotPassword(request: ForgotPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(
      API_ENDPOINTS.auth.forgotPassword,
      request
    );
  }

  /**
   * Reset Password
   */
  async resetPassword(request: ResetPasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(
      API_ENDPOINTS.auth.resetPassword,
      request
    );
  }

  /**
   * Change Password
   */
  async changePassword(request: ChangePasswordRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(
      API_ENDPOINTS.auth.changePassword,
      request
    );
  }

  /**
   * Verify Email
   */
  async verifyEmail(request: VerifyEmailRequest): Promise<ApiResponse<{ message: string }>> {
    return apiClient.post<{ message: string }>(
      API_ENDPOINTS.auth.verifyEmail,
      request
    );
  }

  /**
   * Refresh Token
   */
  async refreshToken(request: RefreshTokenRequest): Promise<RefreshTokenResponse> {
    const response = await apiClient.post<RefreshTokenResponse>(
      API_ENDPOINTS.auth.refreshToken,
      request
    );

    if (!response.data) {
      throw new Error('Invalid response from server');
    }

    // Update tokens
    tokenStorage.setTokens({
      accessToken: response.data.accessToken,
      refreshToken: response.data.refreshToken,
    }, false);

    return response.data;
  }

  /**
   * Logout
   */
  async logout(request?: LogoutRequest): Promise<ApiResponse<{ message: string }>> {
    const refreshToken = tokenStorage.getRefreshToken();
    
    const response = await apiClient.post<{ message: string }>(
      API_ENDPOINTS.auth.logout,
      {
        refreshToken: request?.refreshToken || refreshToken,
        logoutAllDevices: request?.logoutAllDevices || false,
      }
    );

    // Clear local storage regardless of API response
    tokenStorage.clearTokens();
    userStorage.clearUser();

    return response;
  }

  /**
   * Get current user
   */
  getCurrentUser(): User | null {
    return userStorage.getUser();
  }

  /**
   * Check if user is authenticated
   */
  isAuthenticated(): boolean {
    return tokenStorage.hasTokens() && !!userStorage.getUser();
  }
}

// Export singleton instance
export const authService = new AuthService();

