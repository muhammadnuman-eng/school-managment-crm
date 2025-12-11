import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Shield, RefreshCw, Smartphone } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { toast } from 'sonner@2.0.3';
import { InputOTP, InputOTPGroup, InputOTPSlot } from '../ui/input-otp';
import { authService } from '../../services';
import { getUserFriendlyError } from '../../utils/errors';
import { ApiException } from '../../utils/errors';

interface TwoFactorAuthProps {
  email: string;
  tempToken?: string; // Temporary token from login (deprecated)
  sessionId?: string; // Session ID from login response
  userId?: string; // User ID from login response
  onVerified: () => void;
  onBack: () => void;
}

export function TwoFactorAuth({ email, tempToken, sessionId, userId, onVerified, onBack }: TwoFactorAuthProps) {
  const [code, setCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(60);
  const [isVerifying, setIsVerifying] = useState(false);
  const [canResend, setCanResend] = useState(false);

  // Load sessionId and userId from storage on mount
  useEffect(() => {
    // Check if sessionId and userId are available
    const storedSessionId = sessionStorage.getItem('auth_session_id');
    const storedUserId = sessionStorage.getItem('auth_user_id');
    
    if (import.meta.env.DEV) {
      console.log('TwoFactorAuth Mounted - Session Info:', {
        propsSessionId: sessionId,
        propsUserId: userId,
        storedSessionId,
        storedUserId,
        allSessionStorage: {
          sessionId: sessionStorage.getItem('auth_session_id'),
          userId: sessionStorage.getItem('auth_user_id'),
          tempToken: sessionStorage.getItem('auth_temp_token'),
        },
      });
    }
  }, []);

  useEffect(() => {
    if (timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [timeLeft]);

  const handleVerify = async () => {
    // Validation - code must be at least 4 characters
    if (code.length < 4) {
      toast.error('Please enter at least 4 characters');
      return;
    }

    // Get sessionId and userId from props or sessionStorage
    // Try multiple sources to find the values
    let finalSessionId = sessionId 
      || sessionStorage.getItem('auth_session_id')
      || localStorage.getItem('auth_session_id');
      
    let finalUserId = userId 
      || sessionStorage.getItem('auth_user_id')
      || localStorage.getItem('auth_user_id');

    // If still missing, try to get from component state (if available)
    // This handles cases where the component re-renders but props aren't updated
    if (!finalSessionId || !finalUserId) {
      // Check all possible storage locations
      const allStorageKeys = Object.keys(sessionStorage);
      const allLocalKeys = Object.keys(localStorage);
      
      if (import.meta.env.DEV) {
        console.warn('Session info missing, checking all storage:', {
          sessionStorage: allStorageKeys.filter(k => k.includes('auth') || k.includes('session')),
          localStorage: allLocalKeys.filter(k => k.includes('auth') || k.includes('session')),
          props: { sessionId, userId },
        });
      }
    }

    // Debug logging
    if (import.meta.env.DEV) {
      console.log('OTP Verification - Session Info:', {
        sessionId: finalSessionId,
        userId: finalUserId,
        fromProps: { sessionId, userId },
        fromSessionStorage: {
          sessionId: sessionStorage.getItem('auth_session_id'),
          userId: sessionStorage.getItem('auth_user_id'),
        },
        allSessionStorage: Object.fromEntries(
          Object.keys(sessionStorage).map(key => [key, sessionStorage.getItem(key)])
        ),
      });
    }

    if (!finalSessionId || !finalUserId) {
      const errorMsg = 'Session information missing. Please login again.';
      console.error('Session information missing:', {
        sessionId: finalSessionId,
        userId: finalUserId,
        allStorage: {
          session: sessionStorage.getItem('auth_session_id'),
          user: sessionStorage.getItem('auth_user_id'),
        },
        sessionStorageKeys: Object.keys(sessionStorage),
      });
      toast.error(errorMsg);
      // Optionally redirect back to login
      setTimeout(() => {
        onBack();
      }, 2000);
      return;
    }

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(finalSessionId) || !uuidRegex.test(finalUserId)) {
      toast.error('Invalid session. Please login again.');
      return;
    }

    setIsVerifying(true);

    try {
      // Call verify 2FA API with required fields
      const response = await authService.verify2FA({
        sessionId: finalSessionId,
        userId: finalUserId,
        method: 'EMAIL', // Default to EMAIL for admin login
        code: code,
      });

      // Check if verification successful
      if (response.tokens && response.user) {
        toast.success('Verification successful! Redirecting to dashboard...');
        // Small delay to show success message
        setTimeout(() => {
          onVerified();
        }, 500);
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error: any) {
      // Handle errors
      let errorMessage = 'OTP verification failed. Please try again.';
      
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
        
        // Clear code on error
        if (error.code === 'INVALID_OTP' || error.code === 'OTP_EXPIRED') {
          setCode('');
        }
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResend = async () => {
    try {
      // Call resend OTP API
      await authService.resendOTP(email);
      
      setTimeLeft(60);
      setCanResend(false);
      setCode('');
      toast.success('New OTP code sent to your email');
    } catch (error: any) {
      let errorMessage = 'Failed to resend OTP. Please try again.';
      
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    }
  };

  const maskEmail = (email: string) => {
    const [local, domain] = email.split('@');
    return `${local.slice(0, 2)}***@${domain}`;
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900/20 dark:to-purple-900/20">
      <Card className="w-full max-w-md p-8 md:p-12 bg-white dark:bg-gray-900 shadow-2xl">
        <div className="mb-8">
          <Button
            variant="ghost"
            size="sm"
            onClick={onBack}
            className="mb-6 -ml-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <div className="flex justify-center mb-6">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center shadow-lg shadow-blue-500/50 animate-pulse">
              <Shield className="w-8 h-8 text-white" />
            </div>
          </div>

          <h1 className="text-[32px] text-center mb-2 text-gray-900 dark:text-white tracking-tight">
            Two-Factor Authentication
          </h1>
          <p className="text-sm text-center text-gray-600 dark:text-gray-400">
            Enter the code sent to your device
          </p>
        </div>

        {/* Sent To Display */}
        <div className="mb-8 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg text-center">
          <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Code sent to:</p>
          <p className="text-sm text-gray-900 dark:text-white font-mono">
            {maskEmail(email)}
          </p>
        </div>

        {/* OTP Input */}
        <div className="mb-8">
          <div className="flex justify-center">
            <InputOTP
              maxLength={6}
              value={code}
              onChange={(value) => setCode(value)}
            >
              <InputOTPGroup>
                <InputOTPSlot index={0} className="w-12 h-14 text-xl" />
                <InputOTPSlot index={1} className="w-12 h-14 text-xl" />
                <InputOTPSlot index={2} className="w-12 h-14 text-xl" />
                <InputOTPSlot index={3} className="w-12 h-14 text-xl" />
                <InputOTPSlot index={4} className="w-12 h-14 text-xl" />
                <InputOTPSlot index={5} className="w-12 h-14 text-xl" />
              </InputOTPGroup>
            </InputOTP>
          </div>
          <p className="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
            Enter 4-6 digit code
          </p>
        </div>

        {/* Timer/Resend */}
        <div className="text-center mb-8">
          {canResend ? (
            <Button
              variant="link"
              onClick={handleResend}
              className="text-blue-600 hover:text-blue-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Resend code
            </Button>
          ) : (
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Resend code in{' '}
              <span className="font-mono text-blue-600">
                {Math.floor(timeLeft / 60)}:{(timeLeft % 60).toString().padStart(2, '0')}
              </span>
            </p>
          )}
        </div>

        {/* Verify Button */}
        <Button
          onClick={handleVerify}
          disabled={code.length < 4 || isVerifying}
          className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-base shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isVerifying ? (
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
              Verifying...
            </div>
          ) : (
            'Verify & Continue'
          )}
        </Button>

        {/* Alternative Method */}
        <div className="mt-6">
          <button className="w-full text-sm text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
            Try another method
          </button>
        </div>

        {/* Backup Code */}
        <div className="mt-4 text-center">
          <button className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300">
            Use backup code
          </button>
        </div>
      </Card>
    </div>
  );
}
