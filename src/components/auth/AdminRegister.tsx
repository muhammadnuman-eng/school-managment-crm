import { useState, useEffect } from 'react';
import { ArrowLeft, Shield, Mail, Lock, Eye, EyeOff, User, Phone, Building2, AlertCircle } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '../ui/alert';
import { authService } from '../../services';
import { getDeviceInfo } from '../../utils/device';
import { getUserFriendlyError } from '../../utils/errors';
import { ApiException } from '../../utils/errors';

interface AdminRegisterProps {
  onBack: () => void;
  onRegisterSuccess: () => void;
}

// Simple UUID generator
const generateUUID = (): string => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
};

// Password strength checker
const getPasswordStrength = (password: string): { strength: 'weak' | 'medium' | 'strong'; score: number; feedback: string } => {
  let score = 0;
  let feedback = '';

  if (password.length >= 8) score += 1;
  else feedback += 'At least 8 characters. ';

  if (/[a-z]/.test(password)) score += 1;
  else feedback += 'Add lowercase letters. ';

  if (/[A-Z]/.test(password)) score += 1;
  else feedback += 'Add uppercase letters. ';

  if (/[0-9]/.test(password)) score += 1;
  else feedback += 'Add numbers. ';

  if (/[^a-zA-Z0-9]/.test(password)) score += 1;
  else feedback += 'Add special characters. ';

  if (score <= 2) return { strength: 'weak', score, feedback: feedback || 'Very weak password' };
  if (score <= 3) return { strength: 'medium', score, feedback: feedback || 'Medium strength password' };
  return { strength: 'strong', score, feedback: 'Strong password' };
};

export function AdminRegister({ onBack, onRegisterSuccess }: AdminRegisterProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [role, setRole] = useState<'SUPER_ADMIN' | 'SCHOOL_ADMIN' | ''>('');
  const [schoolId, setSchoolId] = useState('');
  const [phone, setPhone] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [ipAddress, setIpAddress] = useState('');

  // Auto-capture IP (if possible) - optional
  useEffect(() => {
    // Try to get IP from a service (optional)
    fetch('https://api.ipify.org?format=json')
      .then(res => res.json())
      .then(data => setIpAddress(data.ip))
      .catch(() => {
        // If fails, leave empty - not critical
        setIpAddress('');
      });
  }, []);

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const validateUUID = (uuid: string): boolean => {
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    return uuidRegex.test(uuid);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!email) {
      newErrors.email = 'Email is required';
    } else if (!validateEmail(email)) {
      newErrors.email = 'Please enter a valid email address';
    }

    if (!password) {
      newErrors.password = 'Password is required';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
    }

    if (!firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!role) {
      newErrors.role = 'Role is required';
    }

    if (role === 'SCHOOL_ADMIN' && schoolId && !validateUUID(schoolId)) {
      newErrors.schoolId = 'Please enter a valid UUID format';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error('Please fix the errors in the form');
      return;
    }

    // Warning if SCHOOL_ADMIN but no schoolId
    if (role === 'SCHOOL_ADMIN' && !schoolId.trim()) {
      toast.warning('School ID is recommended for SCHOOL_ADMIN role');
    }

    setIsLoading(true);

    try {
      // Get device info using utility
      const deviceInfo = getDeviceInfo();
      
      // Prepare request body with all required fields
      const requestBody = {
        email: email.trim(),
        password,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        role: role as 'SUPER_ADMIN' | 'SCHOOL_ADMIN' | 'ADMIN',
        ...(schoolId.trim() && { schoolId: schoolId.trim() }),
        ...(phone.trim() && { phone: phone.trim() }),
        device: {
          deviceId: deviceInfo.deviceId,
          userAgent: deviceInfo.userAgent,
          ...(deviceInfo.platform && { platform: deviceInfo.platform }),
          ...(deviceInfo.browser && { browser: deviceInfo.browser }),
          ...(ipAddress && { ipAddress }),
        },
      };

      // Call register API
      const response = await authService.register(requestBody);

      if (response && response.user) {
        toast.success(
          response.message || 'Account created successfully! Please login to continue.'
        );
        
        // Redirect to login after 2-3 seconds
        setTimeout(() => {
          onRegisterSuccess();
        }, 2500);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      // Handle errors
      let errorMessage = 'Registration failed. Please try again.';
      
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
        
        // Show validation errors if available
        if (error.details && typeof error.details === 'object') {
          const validationErrors: Record<string, string> = {};
          Object.keys(error.details).forEach((key) => {
            if (error.details && error.details[key]) {
              validationErrors[key] = Array.isArray(error.details[key]) 
                ? error.details[key][0] 
                : error.details[key];
            }
          });
          
          if (Object.keys(validationErrors).length > 0) {
            setErrors(validationErrors);
          }
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const passwordStrength = password ? getPasswordStrength(password) : null;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-400/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-purple-400/20 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }}></div>
      </div>

      {/* Registration Card */}
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
              Back to Login
            </Button>

            <div className="flex justify-center mb-6">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50">
                <Shield className="w-8 h-8 text-white" />
              </div>
            </div>

            <h1 className="text-[32px] text-center mb-2 text-gray-900 dark:text-white tracking-tight">
              Admin Registration
            </h1>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Create a new administrator account
            </p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email Field */}
            <div>
              <Label htmlFor="email" className="text-sm mb-2 block">
                Email Address <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="email"
                  type="email"
                  placeholder="admin@schoolhub.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (errors.email) {
                      setErrors({ ...errors, email: '' });
                    }
                  }}
                  className={`h-12 pl-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
              </div>
              {errors.email && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.email}
                </p>
              )}
            </div>

            {/* Password Field */}
            <div>
              <Label htmlFor="password" className="text-sm mb-2 block">
                Password <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (errors.password) {
                      setErrors({ ...errors, password: '' });
                    }
                  }}
                  className={`h-12 pl-12 pr-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 ${
                    errors.password ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.password}
                </p>
              )}
              
              {/* Password Strength Indicator */}
              {password && (
                <div className="mt-2">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 ${
                          passwordStrength?.strength === 'weak'
                            ? 'bg-red-500 w-1/3'
                            : passwordStrength?.strength === 'medium'
                            ? 'bg-yellow-500 w-2/3'
                            : 'bg-green-500 w-full'
                        }`}
                      />
                    </div>
                    <span
                      className={`text-xs font-medium ${
                        passwordStrength?.strength === 'weak'
                          ? 'text-red-500'
                          : passwordStrength?.strength === 'medium'
                          ? 'text-yellow-500'
                          : 'text-green-500'
                      }`}
                    >
                      {passwordStrength?.strength.toUpperCase()}
                    </span>
                  </div>
                  {passwordStrength && passwordStrength.strength !== 'strong' && (
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {passwordStrength.feedback}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* First Name Field */}
            <div>
              <Label htmlFor="firstName" className="text-sm mb-2 block">
                First Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="firstName"
                  type="text"
                  placeholder="John"
                  value={firstName}
                  onChange={(e) => {
                    setFirstName(e.target.value);
                    if (errors.firstName) {
                      setErrors({ ...errors, firstName: '' });
                    }
                  }}
                  className={`h-12 pl-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 ${
                    errors.firstName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
              </div>
              {errors.firstName && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.firstName}
                </p>
              )}
            </div>

            {/* Last Name Field */}
            <div>
              <Label htmlFor="lastName" className="text-sm mb-2 block">
                Last Name <span className="text-red-500">*</span>
              </Label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="lastName"
                  type="text"
                  placeholder="Doe"
                  value={lastName}
                  onChange={(e) => {
                    setLastName(e.target.value);
                    if (errors.lastName) {
                      setErrors({ ...errors, lastName: '' });
                    }
                  }}
                  className={`h-12 pl-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 ${
                    errors.lastName ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                />
              </div>
              {errors.lastName && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.lastName}
                </p>
              )}
            </div>

            {/* Role Field - Locked to Admin Roles Only */}
            <div>
              <Label htmlFor="role" className="text-sm mb-2 block">
                Role <span className="text-red-500">*</span>
                <span className="text-xs text-gray-500 dark:text-gray-400 ml-2">(Admin registration only)</span>
              </Label>
              <Select
                value={role}
                onValueChange={(value: 'SUPER_ADMIN' | 'SCHOOL_ADMIN') => {
                  setRole(value);
                  if (errors.role) {
                    setErrors({ ...errors, role: '' });
                  }
                }}
              >
                <SelectTrigger
                  id="role"
                  className={`h-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 ${
                    errors.role ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                  }`}
                >
                  <SelectValue placeholder="Select admin role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="SUPER_ADMIN">Super Admin</SelectItem>
                  <SelectItem value="SCHOOL_ADMIN">School Admin</SelectItem>
                </SelectContent>
              </Select>
              {errors.role && (
                <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                  <AlertCircle className="w-3 h-3" />
                  {errors.role}
                </p>
              )}
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Only administrators can register new accounts
              </p>
            </div>

            {/* School ID Field (Optional but recommended for SCHOOL_ADMIN) */}
            {role === 'SCHOOL_ADMIN' && (
              <div>
                <Label htmlFor="schoolId" className="text-sm mb-2 block">
                  School ID <span className="text-gray-500 text-xs">(Optional but recommended)</span>
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="schoolId"
                    type="text"
                    placeholder="xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx"
                    value={schoolId}
                    onChange={(e) => {
                      setSchoolId(e.target.value);
                      if (errors.schoolId) {
                        setErrors({ ...errors, schoolId: '' });
                      }
                    }}
                    className={`h-12 pl-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 ${
                      errors.schoolId ? 'border-red-500 focus:border-red-500 focus:ring-red-500' : ''
                    }`}
                  />
                </div>
                {errors.schoolId && (
                  <p className="text-xs text-red-500 mt-1 flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    {errors.schoolId}
                  </p>
                )}
                {!schoolId.trim() && (
                  <Alert className="mt-2 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800">
                    <AlertCircle className="h-4 w-4 text-yellow-600 dark:text-yellow-400" />
                    <AlertDescription className="text-xs text-yellow-800 dark:text-yellow-300 col-start-2">
                      School ID is recommended for SCHOOL_ADMIN role
                    </AlertDescription>
                  </Alert>
                )}
              </div>
            )}

            {/* Phone Field (Optional) */}
            <div>
              <Label htmlFor="phone" className="text-sm mb-2 block">
                Phone Number <span className="text-gray-500 text-xs">(Optional)</span>
              </Label>
              <div className="relative">
                <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+1234567890"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="h-12 pl-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
            </div>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-base shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Creating Account...
                </div>
              ) : (
                'Create Admin Account'
              )}
            </Button>
          </form>

          {/* Back to Login Link */}
          <div className="mt-6 text-center">
            <button
              type="button"
              onClick={onBack}
              className="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
            >
              ← Back to Login
            </button>
          </div>

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

