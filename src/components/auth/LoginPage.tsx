import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Shield, Mail, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Checkbox } from '../ui/checkbox';
import { toast } from 'sonner';
import { authService } from '../../services';
import { getDeviceInfo } from '../../utils/device';
import { getUserFriendlyError } from '../../utils/errors';
import { ApiException } from '../../utils/errors';
import { tokenStorage, userStorage } from '../../utils/storage';
import { getLogoutReason } from '../../utils/auth-logout';

export function LoginPage() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Check for logout reason on mount
  useEffect(() => {
    const reason = getLogoutReason();
    if (reason) {
      toast.warning(reason, { duration: 5000 });
    }
  }, []);

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
      // Call admin login API
      const response = await authService.adminLogin({
        email: email.trim(),
        password,
        rememberMe: rememberMe,
        deviceInfo: getDeviceInfo(),
      });

      // Check if admin has a school
      const user = response.user;
      const schoolId = user?.schoolId;

      // Check if this is first login
      const isFirstLogin = response.isFirstLogin || false;
      
      // Check if 2FA is required
      const requires2FA = response.requires2FA || (response as any).requiresTwoFactor || false;
      const sessionId = response.sessionId || (response as any).session?.id;
      const userId = response.userId || response.user?.id;

      // Save tokens if available (check multiple possible locations)
      const tokens = response.tokens || (response as any).data?.tokens || (response as any).tokens;
      
      // Logic: 
      // 1. If first login → Always show OTP
      // 2. If NOT first login + remember me checked → No OTP, store token directly
      // 3. If NOT first login + remember me unchecked → Show OTP
      
      if (isFirstLogin) {
        // First login - always require OTP verification
        if (requires2FA && sessionId && userId) {
          console.log('First login - redirecting to OTP verification');
          sessionStorage.setItem('auth_session_id', String(sessionId));
          sessionStorage.setItem('auth_user_id', String(userId));
          sessionStorage.setItem('auth_email', email.trim());
          sessionStorage.setItem('auth_remember_me', rememberMe.toString());
          
          if (response.user) {
            userStorage.setUser(response.user, false);
          }
          
          toast.info('OTP sent to your email. Please verify to continue.');
          navigate('/admin/verify-otp');
        } else {
          toast.error('OTP verification required but session info missing');
        }
      } else if (tokens && rememberMe) {
        // NOT first login + remember me checked → No OTP, store token directly
        console.log('Storing tokens directly (remember me checked):', {
          hasAccessToken: !!tokens.accessToken,
          hasRefreshToken: !!tokens.refreshToken,
        });
        tokenStorage.setTokens(tokens, true); // Store in localStorage
        
        // Verify token was stored
        const storedToken = tokenStorage.getAccessToken();
        console.log('Token stored successfully:', !!storedToken);
        
        if (response.user) {
          userStorage.setUser(response.user, true);
        }
        
        toast.success('Admin login successful');
        // Redirect to school login page
        navigate('/admin/school-login');
      } else if (requires2FA && sessionId && userId) {
        // NOT first login + remember me unchecked → Show OTP
        console.log('OTP required (remember me unchecked)');
        sessionStorage.setItem('auth_session_id', String(sessionId));
        sessionStorage.setItem('auth_user_id', String(userId));
        sessionStorage.setItem('auth_email', email.trim());
        sessionStorage.setItem('auth_remember_me', rememberMe.toString());
        
        if (response.user) {
          userStorage.setUser(response.user, false);
        }
        
        toast.info('OTP sent to your email. Please verify to continue.');
        navigate('/admin/verify-otp');
      } else if (tokens) {
        // Tokens available but no 2FA required
        console.log('Storing tokens (no 2FA required):', {
          hasAccessToken: !!tokens.accessToken,
          hasRefreshToken: !!tokens.refreshToken,
        });
        tokenStorage.setTokens(tokens, rememberMe);
        
        if (response.user) {
          userStorage.setUser(response.user, rememberMe);
        }
        
        toast.success('Admin login successful');
        navigate('/admin/school-login');
      } else {
        console.warn('No tokens found and 2FA info missing:', response);
        toast.error('Login incomplete. Please try again.');
      }
    } catch (error: any) {
      // Handle errors
      let errorMessage = 'Login failed. Please try again.';
      
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
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

            {/* Remember Me Checkbox */}
            <div className="flex items-center space-x-2">
              <Checkbox
                id="rememberMe"
                checked={rememberMe}
                onCheckedChange={(checked) => setRememberMe(checked === true)}
                disabled={isLoading}
              />
              <Label
                htmlFor="rememberMe"
                className="text-sm font-normal cursor-pointer text-gray-700 dark:text-gray-300"
              >
                Remember me
              </Label>
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
                'Sign In to School Login'
              )}
            </Button>
          </form>

          {/* Register Now Button */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Don't have an account?
            </p>
            <Link to="/admin/register">
              <Button
                type="button"
                variant="outline"
                className="w-full h-12 border-gray-300 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Register Now
              </Button>
            </Link>
          </div>

          {/* Security Footer */}
          <div className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-center gap-2 text-xs text-gray-500 dark:text-gray-400">
              <Shield className="w-4 h-4" />
              <span>Protected by enterprise-grade security</span>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}

