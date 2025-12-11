/**
 * Authentication Types
 * TypeScript types for authentication-related API requests and responses
 */

/**
 * User Roles
 */
export type UserRole = 'admin' | 'teacher' | 'student' | 'parent';

/**
 * Login Request
 */
export interface LoginRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
  deviceInfo?: DeviceInfo;
}

/**
 * Admin Login Request
 */
export interface AdminLoginRequest extends LoginRequest {
  email: string;
  password: string;
  enable2FA?: boolean;
}

/**
 * Setup 2FA Request
 */
export interface Setup2FARequest {
  email: string;
  enabled: boolean; // true to enable, false to disable
  password?: string; // Optional: for validation if endpoint requires auth
}

/**
 * Setup 2FA Response
 */
export interface Setup2FAResponse {
  success: boolean;
  message: string;
  enabled: boolean;
}

/**
 * Teacher Login Request
 */
export interface TeacherLoginRequest extends LoginRequest {
  emailOrId: string; // Can be email or employee ID
  password: string;
}

/**
 * Student Login Request
 */
export interface StudentLoginRequest {
  admissionNumber: string;
  dateOfBirth: string; // Format: YYYY-MM-DD
}

/**
 * Parent Login Request
 */
export interface ParentLoginRequest {
  mobileNumber: string;
  password?: string; // Optional if using OTP
  loginMethod: 'otp' | 'password';
}

/**
 * Register Request
 */
export interface RegisterRequest {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  role: 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'ADMIN';
  schoolId?: string;
  phone?: string;
  device: DeviceInfo;
}

/**
 * Device Information
 */
export interface DeviceInfo {
  deviceId: string;
  ipAddress?: string;
  userAgent: string;
  platform?: string;
  browser?: string;
}

/**
 * 2FA Verification Request
 */
export interface Verify2FARequest {
  sessionId: string; // UUID from login response
  userId: string; // UUID from login response
  method: 'TOTP' | 'SMS' | 'EMAIL'; // OTP delivery method
  code: string; // OTP code (minimum 4 characters)
}

/**
 * Forgot Password Request
 */
export interface ForgotPasswordRequest {
  email: string;
  userRole?: UserRole;
}

/**
 * Reset Password Request
 */
export interface ResetPasswordRequest {
  token: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Change Password Request
 */
export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
  confirmPassword: string;
}

/**
 * Verify Email Request
 */
export interface VerifyEmailRequest {
  token: string;
}

/**
 * Login Response
 */
export interface LoginResponse {
  user: User;
  tokens?: AuthTokens; // Only present if login successful without 2FA
  requires2FA?: boolean;
  isFirstLogin?: boolean; // Indicates if this is user's first login
  tempToken?: string; // Temporary token for 2FA verification (deprecated)
  sessionId?: string; // UUID session ID for 2FA verification
  userId?: string; // UUID user ID for 2FA verification
  message?: string; // Success/Info message
}

/**
 * User Information
 */
export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: UserRole;
  schoolId?: string;
  phone?: string;
  avatar?: string;
  isEmailVerified?: boolean;
  is2FAEnabled?: boolean;
}

/**
 * Authentication Tokens
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number; // seconds
  tokenType?: string; // Usually 'Bearer'
}

/**
 * Refresh Token Request
 */
export interface RefreshTokenRequest {
  refreshToken: string;
}

/**
 * Refresh Token Response
 */
export interface RefreshTokenResponse {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * Logout Request
 */
export interface LogoutRequest {
  refreshToken?: string;
  logoutAllDevices?: boolean;
}

/**
 * Register Response
 */
export interface RegisterResponse {
  user: User;
  message: string;
  requiresEmailVerification?: boolean;
}
