import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import { Avatar, AvatarFallback } from '../ui/avatar';
import { Mail, Shield, CheckCircle2, Lock } from 'lucide-react';
import { Switch } from '../ui/switch';
import { Label } from '../ui/label';
import { toast } from 'sonner@2.0.3';
import { authService } from '../../services';
import { getUserFriendlyError } from '../../utils/errors';
import { ApiException } from '../../utils/errors';

export function AdminProfile() {
  const user = authService.getCurrentUser();
  const [enable2FA, setEnable2FA] = useState(false);
  const [isSetting2FA, setIsSetting2FA] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Load current 2FA status (if available from user object or API)
  useEffect(() => {
    // Check if user has 2FA enabled (this might come from backend)
    // For now, we'll default to false and let user toggle
    setIsLoading(false);
  }, [user]);

  // Handle 2FA toggle with API call
  const handle2FAToggle = async (checked: boolean) => {
    if (!user?.email) {
      toast.error('User email not found. Please login again.');
      return;
    }

    setIsSetting2FA(true);

    try {
      // Call 2FA setup API
      const response = await authService.setup2FA({
        email: user.email,
        enabled: checked,
      });

      if (response.success) {
        setEnable2FA(checked);
        toast.success(
          response.data?.message || 
          (checked ? '2FA enabled successfully' : '2FA disabled successfully')
        );
      } else {
        // Revert toggle on failure
        setEnable2FA(!checked);
        toast.error(response.message || 'Failed to update 2FA settings');
      }
    } catch (error: any) {
      // Revert toggle on error
      setEnable2FA(!checked);
      
      let errorMessage = 'Failed to update 2FA settings. Please try again.';
      
      if (error instanceof ApiException) {
        errorMessage = getUserFriendlyError(error);
      } else if (error?.message) {
        errorMessage = error.message;
      }

      toast.error(errorMessage);
    } finally {
      setIsSetting2FA(false);
    }
  };

  const initials = user
    ? `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase() || 'AD'
    : 'AD';

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Card className="p-6 flex flex-col md:flex-row items-start md:items-center gap-4">
        <Avatar className="w-16 h-16">
          <AvatarFallback>{initials}</AvatarFallback>
        </Avatar>
        <div className="flex-1 space-y-1">
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-semibold">
              {user ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Admin User' : 'Admin User'}
            </h2>
            {user?.emailVerified ? (
              <Badge variant="success" className="flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" />
                Verified
              </Badge>
            ) : (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Shield className="w-4 h-4" />
                Unverified
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Mail className="w-4 h-4" />
            <span>{user?.email || 'admin@example.com'}</span>
          </div>
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
            <Shield className="w-4 h-4" />
            <span>{user?.role || 'ADMIN'}</span>
          </div>
        </div>
      </Card>

      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Profile Details</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <p className="text-gray-500 dark:text-gray-400">First Name</p>
            <p className="font-medium">{user?.firstName || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-500 dark:text-gray-400">Last Name</p>
            <p className="font-medium">{user?.lastName || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-500 dark:text-gray-400">Email</p>
            <p className="font-medium">{user?.email || 'N/A'}</p>
          </div>
          <div className="space-y-1">
            <p className="text-gray-500 dark:text-gray-400">Status</p>
            <p className="font-medium">{user?.status || 'ACTIVE'}</p>
          </div>
        </div>
      </Card>

      {/* 2FA Settings Card */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Lock className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <h3 className="text-lg font-semibold">Security Settings</h3>
        </div>
        
        <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div className="flex-1">
            <Label htmlFor="2fa-toggle" className="text-sm font-medium text-gray-900 dark:text-white cursor-pointer">
              Enable Two-Factor Authentication (2FA)
            </Label>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {enable2FA 
                ? 'OTP verification will be required on login' 
                : 'Login without OTP verification'}
            </p>
          </div>
          <Switch
            id="2fa-toggle"
            checked={enable2FA}
            onCheckedChange={handle2FAToggle}
            disabled={isLoading || isSetting2FA}
          />
        </div>
        
        {isSetting2FA && (
          <div className="mt-4 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin"></div>
            Updating 2FA settings...
          </div>
        )}
      </Card>
    </div>
  );
}

