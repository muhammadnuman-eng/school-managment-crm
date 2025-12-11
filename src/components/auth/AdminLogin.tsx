import { useState } from 'react';
import { ArrowLeft, Shield, Mail, Lock, Eye, EyeOff, Chrome } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Checkbox } from '../ui/checkbox';
import { Card } from '../ui/card';
import { toast } from 'sonner@2.0.3';
import { authService } from '../../services';
import { getDeviceInfo } from '../../utils/device';
import { getUserFriendlyError } from '../../utils/errors';
import { ApiException } from '../../utils/errors';
import { tokenStorage, userStorage } from '../../utils/storage';

interface AdminLoginProps {
  onBack: () => void;
  onForgotPassword: (email: string) => void;
  onLogin: (
    email: string, 
    password: string, 
    needs2FA: boolean, 
    tempToken?: string, 
    isFirstLogin?: boolean,
    sessionId?: string,
    userId?: string
  ) => void;
  onSignup?: () => void;
}

export function AdminLogin({ onBack, onForgotPassword, onLogin, onSignup }: AdminLoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!email || !password) {
      toast.error('Please fill in all fields');
      return;
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error('Please enter a valid email address');
      return;
    }

    setIsLoading(true);

    try {
      // Call login API
      const response = await authService.adminLogin({
        email: email.trim(),
        password,
        rememberMe,
        deviceInfo: getDeviceInfo(),
      });

      // Flags from backend + UI
      const isFirstLogin = response.isFirstLogin || false;
      const backendRequires2FA =
        response.requires2FA ||
        (response as any).requiresTwoFactor ||
        false;
      const hasTokens = !!response.tokens;

      // OTP decision matrix:
      // - First login => always OTP (regardless of Remember Me)
      // - After first login:
      //     Remember Me checked => skip OTP (direct dashboard)
      //     Remember Me unchecked + backend requires 2FA => OTP
      //     Remember Me unchecked + backend doesn't require 2FA => skip OTP
      const shouldUseOTP =
        isFirstLogin ||
        (!rememberMe && backendRequires2FA);

      if (shouldUseOTP) {
        // Store remember me flag temporarily for OTP verification
        if (rememberMe) {
          sessionStorage.setItem('auth_remember_me', 'true');
        } else {
          sessionStorage.removeItem('auth_remember_me');
        }

        // Always redirect to OTP screen for first login or when 2FA is enabled/required
        toast.success(response.message || 'OTP sent to your email');
        
        // Extract sessionId and userId from response (handle different response formats)
        const sessionId =
          (response as any).sessionId ||
          response.sessionId ||
          (response as any).session?.id;
        const userId =
          (response as any).userId ||
          response.userId ||
          (response.user as any)?.id ||
          response.user?.id;
        
        // Store sessionId and userId for OTP verification
        if (sessionId) {
          sessionStorage.setItem('auth_session_id', String(sessionId));
          console.log('Stored sessionId:', sessionId); // Debug log
        } else {
          console.warn('sessionId not found in login response:', response); // Debug log
        }
        
        if (userId) {
          sessionStorage.setItem('auth_user_id', String(userId));
          console.log('Stored userId:', userId); // Debug log
        } else {
          console.warn('userId not found in login response:', response); // Debug log
        }
        
        // Keep tempToken for backward compatibility
        if (response.tempToken) {
          sessionStorage.setItem('auth_temp_token', response.tempToken);
        }
        
        onLogin(
          email, 
          password, 
          true, 
          response.tempToken, 
          isFirstLogin,
          sessionId,
          userId
        );
      } else {
        // If OTP not required, use tokens directly (should come from backend)
        if (!hasTokens || !response.tokens) {
          toast.error('Login response missing tokens. Please try again.');
          return;
        }
        if (hasTokens && response.tokens) {
          const remember = rememberMe;
          tokenStorage.setTokens(response.tokens, remember);
          if (response.user) {
            userStorage.setUser(response.user, remember);
          }
        }
        // Clear any residual temp session flags
        sessionStorage.removeItem('auth_remember_me');
        sessionStorage.removeItem('auth_session_id');
        sessionStorage.removeItem('auth_user_id');
        sessionStorage.removeItem('auth_temp_token');

        toast.success('Login successful');
        onLogin(email, password, false);
      }
    } catch (error: any) {
      // Handle errors
      let errorMessage = 'Login failed. Please try again.';
      
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
        
        // Show detailed error for 400 Bad Request
        if (error.statusCode === 400 && error.details) {
          console.error('Login error details:', error.details);
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Login Card */}
      <Card className="w-full max-w-md relative z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBack}
              className="mb-6 -ml-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Portal Selection
            </Button>

            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-[32px] text-center mb-2 text-gray-900 dark:text-white tracking-tight">
              Administrator Login
            </h1>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Sign in to access the admin dashboard
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <Label htmlFor="email" className="text-sm mb-2 block">
                Email Address
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@schoolhub.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="h-12 pl-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password" className="text-sm mb-2 block">
                Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="h-12 pl-12 pr-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Remember Me & Forgot Password */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="remember"
                  checked={rememberMe}
                  onCheckedChange={(checked) => setRememberMe(checked as boolean)}
                />
                <label
                  htmlFor="remember"
                  className="text-sm text-gray-700 dark:text-gray-300 cursor-pointer"
                >
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={() => onForgotPassword(email)}
                className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                Forgot Password?
              </button>
            </div>

            {/* Login Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-base shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Signing in...
                </div>
              ) : (
                'Sign In to Admin Portal'
              )}
            </Button>
          </form>

          {/* Divider */}
          <div className="relative my-8">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-gray-300 dark:border-gray-700"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-4 bg-white dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                Or continue with
              </span>
            </div>
          </div>

          {/* SSO Options */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              type="button"
              variant="outline"
              className="h-12 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
              </svg>
              Google
            </Button>
            <Button
              type="button"
              variant="outline"
              className="h-12 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                <path fill="#00A4EF" d="M0 0h11.377v11.372H0z" />
                <path fill="#FFB900" d="M12.623 0H24v11.372H12.623z" />
                <path fill="#05A6F0" d="M0 12.628h11.377V24H0z" />
                <path fill="#FFBA08" d="M12.623 12.628H24V24H12.623z" />
              </svg>
              Microsoft
            </Button>
          </div>

          {/* Signup Link */}
          {onSignup && (
            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account?{' '}
                <button
                  type="button"
                  onClick={onSignup}
                  className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
                >
                  Sign up
                </button>
              </p>
            </div>
          )}

          {/* Security Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Protected by enterprise-grade security</span>
            </div>
            <div className="flex items-center justify-center gap-3 mt-3 text-xs text-gray-400 dark:text-gray-500">
              <a href="#" className="hover:text-gray-600 dark:hover:text-gray-300">Terms of Service</a>
              <span>•</span>
              <a href="#" className="hover:text-gray-600 dark:hover:text-gray-300">Privacy Policy</a>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
