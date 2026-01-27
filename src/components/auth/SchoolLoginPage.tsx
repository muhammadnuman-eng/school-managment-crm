import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Building2, Mail, Lock, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { toast } from 'sonner';
import { authService } from '../../services';
import { getUserFriendlyError } from '../../utils/errors';
import { ApiException } from '../../utils/errors';
import { tokenStorage, userStorage, schoolStorage } from '../../utils/storage';
import { getLogoutReason } from '../../utils/auth-logout';

export function SchoolLoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showNoSchoolError, setShowNoSchoolError] = useState(false);

  // Check for logout reason on mount
  useEffect(() => {
    const reason = getLogoutReason();
    if (reason) {
      toast.warning(reason, { duration: 5000 });
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setShowNoSchoolError(false);

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
      // Call school login API
      const response = await authService.schoolLogin({
        email: email.trim(),
        password,
      });

      // Save tokens if available (check multiple possible locations)
      const tokens = response.tokens || (response as any).data?.tokens || (response as any).tokens;
      
      if (tokens) {
        console.log('Storing tokens after school login:', {
          hasAccessToken: !!tokens.accessToken,
          hasRefreshToken: !!tokens.refreshToken,
        });
        tokenStorage.setTokens(tokens, false);
        
        if (response.user) {
          userStorage.setUser(response.user, false);
        }
      } else {
        console.warn('No tokens found in school login response:', response);
        if (response.user) {
          userStorage.setUser(response.user, false);
        }
      }

      // Extract school ID from multiple possible locations in response
      const schoolId =
        (response as any).school?.id ||
        (response as any).school?.uuid ||
        (response as any).schoolId ||
        response.user?.schoolId ||
        (response as any).data?.school?.id ||
        (response as any).data?.school?.uuid ||
        (response as any).data?.schoolId;

      console.log('School Login Response Analysis:', {
        fullResponse: response,
        schoolId,
        hasSchool: !!(response as any).school,
        userSchoolId: response.user?.schoolId,
        responseKeys: Object.keys(response || {}),
      });

      if (schoolId) {
        console.log('Storing school UUID after school login:', schoolId);
        schoolStorage.setSchoolId(String(schoolId));
        
        // Verify school UUID was stored
        const storedSchoolId = schoolStorage.getSchoolId();
        console.log('School UUID stored successfully:', !!storedSchoolId, storedSchoolId);
        
        toast.success('School login successful');
        // Redirect to dashboard - App component will check auth on mount
        navigate(`/admin/school/${schoolId}/dashboard`);
      } else {
        // If no schoolId found, check if user has schoolId
        const userSchoolId = response.user?.schoolId;
        if (userSchoolId) {
          console.log('Using user schoolId:', userSchoolId);
          schoolStorage.setSchoolId(String(userSchoolId));
          toast.success('School login successful');
          navigate(`/admin/school/${userSchoolId}/dashboard`);
        } else {
          // No school found - show error and stay on login page
          console.error('No school ID found in login response:', response);
          setShowNoSchoolError(true);
          toast.error('School not found. Please register your school first.');
          // Don't redirect - stay on login page
        }
      }
    } catch (error: any) {
      // Handle errors with detailed logging
      console.error('School Login Error:', {
        error,
        message: error?.message,
        statusCode: error?.statusCode,
        code: error?.code,
        details: error?.details,
      });

      let errorMessage = 'Login failed. Please try again.';
      
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
        
        // Check for validation errors (400 Bad Request)
        if (error.statusCode === 400) {
          // Check if error details contain validation messages
          if (error.details?.message && Array.isArray(error.details.message)) {
            const validationErrors = error.details.message.join(', ');
            errorMessage = `Validation Error: ${validationErrors}`;
          } else if (error.details?.message) {
            errorMessage = error.details.message;
          } else if (error.message) {
            errorMessage = error.message;
          }
        }
        
        // Check for CORS errors
        if (error.code === 'CORS_ERROR' || errorMessage.toLowerCase().includes('cors')) {
          console.error('CORS Error Details:', {
            url: error.details?.url,
            message: error.message,
            fullError: error,
          });
          errorMessage = 'CORS Error: Backend server is not allowing requests. Please check backend CORS configuration.';
        }
        
        // Check if error is due to no school
        if (error.statusCode === 404 || errorMessage.toLowerCase().includes('school')) {
          setShowNoSchoolError(true);
        }
      } else if (error?.message) {
        // Check for CORS in error message
        if (error.message.includes('CORS') || error.message.includes('Failed to fetch') || error.message.includes('network')) {
          console.error('Network/CORS Error:', error);
          errorMessage = 'Network/CORS Error: Unable to connect to server. Please check:\n1. Backend server is running\n2. Backend CORS configuration\n3. Browser console for details';
        } else {
          errorMessage = error.message;
        }
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
            {/* Back Button - Same navigation as admin register */}
            <div className="mb-6">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/admin/login')}
                className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to Admin Login
              </Button>
            </div>

            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <Building2 className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-[32px] text-center mb-2 text-gray-900 dark:text-white tracking-tight">
              School Login
            </h1>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Sign in to access your school dashboard
            </p>
          </div>

          {/* No School Error Message */}
          {showNoSchoolError && (
            <div className="mb-6 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                You don't have a school registered yet.
              </p>
              <Link
                to="/admin/create-school"
                className="text-sm font-medium text-yellow-900 dark:text-yellow-100 hover:underline"
              >
                Register your school →
              </Link>
            </div>
          )}

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
                  disabled={isLoading}
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
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  disabled={isLoading}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
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
                'Sign In to School Portal'
              )}
            </Button>
          </form>

          {/* Register School Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Don't have a school?{' '}
              <Link
                to="/admin/create-school"
                className="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium"
              >
                Register your school
              </Link>
            </p>
          </div>

          {/* Security Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Building2 className="w-4 h-4" />
              <span>Protected by enterprise-grade security</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

