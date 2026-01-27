import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Building2, Mail, Phone, MapPin, Globe, Image as ImageIcon, FileIcon, ArrowLeft, Lock, Eye, EyeOff } from 'lucide-react';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Card } from '../ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Textarea } from '../ui/textarea';
import { toast } from 'sonner';
import { schoolService } from '../../services';
import { userStorage, schoolStorage, tokenStorage } from '../../utils/storage';
import { CreateSchoolRequest, SchoolType } from '../../types/school.types';
import { ApiException } from '../../utils/errors';
import { getUserFriendlyError } from '../../utils/errors';

export function CreateSchoolPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  // Form state
  const [formData, setFormData] = useState<CreateSchoolRequest>({
    name: '',
    contactPhone: '',
    contactEmail: '',
    schoolPassword: '',
    schoolType: 'school',
    address: {
      city: '',
      stateProvince: '',
      street: '',
      postalCode: '',
      country: '',
    },
    tagline: '',
    websiteUrl: '',
    logo: '',
    favicon: '',
  });

  // Validation errors
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Required fields validation
    if (!formData.name.trim()) {
      newErrors.name = 'School name is required';
    }

    if (!formData.contactPhone.trim()) {
      newErrors.contactPhone = 'Contact phone is required';
    } else {
      // Basic phone validation
      const phoneRegex = /^[\d\s\-\+\(\)]+$/;
      if (!phoneRegex.test(formData.contactPhone)) {
        newErrors.contactPhone = 'Please enter a valid phone number';
      }
    }

    if (!formData.contactEmail.trim()) {
      newErrors.contactEmail = 'Contact email is required';
    } else {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.contactEmail)) {
        newErrors.contactEmail = 'Please enter a valid email address';
      }
    }

    if (!formData.schoolPassword.trim()) {
      newErrors.schoolPassword = 'School password is required';
    } else if (formData.schoolPassword.length < 8) {
      newErrors.schoolPassword = 'School password must be at least 8 characters';
    }

    if (!formData.address.city.trim()) {
      newErrors['address.city'] = 'City is required';
    }

    if (!formData.address.stateProvince.trim()) {
      newErrors['address.stateProvince'] = 'State/Province is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('address.')) {
      const addressField = field.replace('address.', '');
      setFormData((prev) => ({
        ...prev,
        address: {
          ...prev.address,
          [addressField]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }

    // Clear error for this field
    if (errors[field]) {
      setErrors((prev) => {
        const newErrors = { ...prev };
        delete newErrors[field];
        return newErrors;
      });
    }
  };


  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationResult = validateForm();

    if (!validationResult) {
      toast.error('Please fix the errors in the form');
      return;
    }

    // Only admins can create/register school
    const currentUser = userStorage.getUser();
    const token = tokenStorage.getAccessToken();
    
    // Debug: Log token status
    console.log('Token check before school creation:', {
      hasToken: !!token,
      tokenLength: token?.length,
      hasUser: !!currentUser,
      userRole: currentUser?.role,
    });
    
    // Require auth token; check if 2FA is pending
    if (!token) {
      const sessionId = sessionStorage.getItem('auth_session_id');
      const userId = sessionStorage.getItem('auth_user_id');
      
      if (sessionId && userId) {
        // 2FA is required but not completed
        console.error('2FA verification required before school creation');
        toast.error('Please complete 2FA verification first. You need to verify your email OTP before creating a school.');
        navigate('/admin/login');
        return;
      } else {
        console.error('No token found in storage. Redirecting to login.');
        toast.error('Please login as administrator first.');
        navigate('/admin/login');
        return;
      }
    }
    
    // If user object is present, enforce role check; otherwise let backend validate using token
    if (currentUser?.role) {
      const role = currentUser.role.toLowerCase();
      const validRoles = ['admin', 'school_admin', 'super_admin'];
      if (!validRoles.includes(role)) {
        toast.error('Only administrators can register a school.');
        navigate('/admin/login');
        return;
      }
    }

    setIsLoading(true);

    try {
      // Get admin data from storage
      const currentUser = userStorage.getUser();
      if (!currentUser) {
        toast.error('Please login as administrator first.');
        navigate('/admin/login');
        return;
      }

      // Prepare request data (only school fields, admin is authenticated via token)
      const requestData: CreateSchoolRequest = {
        name: formData.name.trim(),
        contactPhone: formData.contactPhone.trim(),
        contactEmail: formData.contactEmail.trim(),
        schoolPassword: formData.schoolPassword,
        schoolType: formData.schoolType,
        address: {
          city: formData.address.city.trim(),
          stateProvince: formData.address.stateProvince.trim(),
          ...(formData.address.street && { street: formData.address.street.trim() }),
          ...(formData.address.postalCode && { postalCode: formData.address.postalCode.trim() }),
          ...(formData.address.country && { country: formData.address.country.trim() }),
        },
        ...(formData.tagline && { tagline: formData.tagline.trim() }),
        ...(formData.websiteUrl && { websiteUrl: formData.websiteUrl.trim() }),
        ...(formData.logo && { logo: formData.logo.trim() }),
        ...(formData.favicon && { favicon: formData.favicon.trim() }),
      };

      // Call API to create school (auth/school/register)
      const response = await schoolService.createSchool(requestData);

      // Extract school ID from response
      const schoolId =
        response.school?.id ||
        (response as any).school?.uuid ||
        (response as any).schoolId ||
        (response as any).id;

      if (!schoolId) {
        throw new Error('School created but no ID returned');
      }

      toast.success('School registered successfully!');
      
      // Store school UUID for subsequent requests
      console.log('Storing school UUID after school creation:', schoolId);
      schoolStorage.setSchoolId(String(schoolId));
      
      // Verify school UUID was stored
      const storedSchoolId = schoolStorage.getSchoolId();
      console.log('School UUID stored successfully:', !!storedSchoolId, storedSchoolId);
      
      // Verify token is still available
      const token = tokenStorage.getAccessToken();
      console.log('Token available after school creation:', !!token);

      // Redirect to school login
      navigate('/admin/school-login');
    } catch (error: any) {
      let errorMessage = 'Failed to create school. Please try again.';

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

      {/* Form Card */}
      <Card className="w-full max-w-2xl relative z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl border-gray-200/50 dark:border-gray-700/50 shadow-2xl">
        <div className="p-8 md:p-12">
          {/* Header */}
          <div className="mb-8">
            {/* Back Button */}
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
              Register Your School
            </h1>
            <p className="text-sm text-center text-gray-600 dark:text-gray-400">
              Create your school profile to get started
            </p>
          </div>

          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="space-y-6"
            noValidate
          >
            {/* Required Fields Section */}
            <div className="space-y-6">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Required Information
              </h2>

              {/* School Name */}
              <div>
                <Label htmlFor="name" className="text-sm mb-2 block">
                  School Name <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Building2 className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="name"
                    type="text"
                    placeholder="Enter school name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`h-12 pl-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 ${errors.name ? 'border-red-500' : ''
                      }`}
                    disabled={isLoading}
                  />
                </div>
                {errors.name && (
                  <p className="mt-1 text-sm text-red-500">{errors.name}</p>
                )}
              </div>

              {/* Contact Phone */}
              <div>
                <Label htmlFor="contactPhone" className="text-sm mb-2 block">
                  Contact Phone <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="contactPhone"
                    type="tel"
                    placeholder="+1 (555) 123-4567"
                    value={formData.contactPhone}
                    onChange={(e) => handleInputChange('contactPhone', e.target.value)}
                    className={`h-12 pl-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 ${errors.contactPhone ? 'border-red-500' : ''
                      }`}
                    disabled={isLoading}
                  />
                </div>
                {errors.contactPhone && (
                  <p className="mt-1 text-sm text-red-500">{errors.contactPhone}</p>
                )}
              </div>

              {/* Contact Email */}
              <div>
                <Label htmlFor="contactEmail" className="text-sm mb-2 block">
                  Contact Email <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="contactEmail"
                    type="email"
                    placeholder="contact@school.com"
                    value={formData.contactEmail}
                    onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                    className={`h-12 pl-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 ${errors.contactEmail ? 'border-red-500' : ''
                      }`}
                    disabled={isLoading}
                  />
                </div>
                {errors.contactEmail && (
                  <p className="mt-1 text-sm text-red-500">{errors.contactEmail}</p>
                )}
              </div>

              {/* School Password */}
              <div>
                <Label htmlFor="schoolPassword" className="text-sm mb-2 block">
                  School Password <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="schoolPassword"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={formData.schoolPassword}
                    onChange={(e) => handleInputChange('schoolPassword', e.target.value)}
                    className={`h-12 pl-12 pr-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 ${errors.schoolPassword ? 'border-red-500' : ''
                      }`}
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
                {errors.schoolPassword && (
                  <p className="mt-1 text-sm text-red-500">{errors.schoolPassword}</p>
                )}
              </div>

              {/* School Type */}
              <div>
                <Label htmlFor="schoolType" className="text-sm mb-2 block">
                  School Type <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={formData.schoolType}
                  onValueChange={(value) => handleInputChange('schoolType', value as SchoolType)}
                  disabled={isLoading}
                >
                  <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700">
                    <SelectValue placeholder="Select school type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="school">School</SelectItem>
                    <SelectItem value="college">College</SelectItem>
                    <SelectItem value="academy">Academy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Address - City */}
              <div>
                <Label htmlFor="city" className="text-sm mb-2 block">
                  City <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="city"
                    type="text"
                    placeholder="Enter city"
                    value={formData.address.city}
                    onChange={(e) => handleInputChange('address.city', e.target.value)}
                    className={`h-12 pl-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 ${errors['address.city'] ? 'border-red-500' : ''
                      }`}
                    disabled={isLoading}
                  />
                </div>
                {errors['address.city'] && (
                  <p className="mt-1 text-sm text-red-500">{errors['address.city']}</p>
                )}
              </div>

              {/* Address - State/Province */}
              <div>
                <Label htmlFor="stateProvince" className="text-sm mb-2 block">
                  State/Province <span className="text-red-500">*</span>
                </Label>
                <div className="relative">
                  <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="stateProvince"
                    type="text"
                    placeholder="Enter state or province"
                    value={formData.address.stateProvince}
                    onChange={(e) => handleInputChange('address.stateProvince', e.target.value)}
                    className={`h-12 pl-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500 ${errors['address.stateProvince'] ? 'border-red-500' : ''
                      }`}
                    disabled={isLoading}
                  />
                </div>
                {errors['address.stateProvince'] && (
                  <p className="mt-1 text-sm text-red-500">{errors['address.stateProvince']}</p>
                )}
              </div>
            </div>

            {/* Optional Fields Section */}
            <div className="space-y-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white border-b border-gray-200 dark:border-gray-700 pb-2">
                Optional Information
              </h2>

              {/* Tagline */}
              <div>
                <Label htmlFor="tagline" className="text-sm mb-2 block">
                  Tagline
                </Label>
                <Textarea
                  id="tagline"
                  placeholder="Enter a brief tagline for your school"
                  value={formData.tagline}
                  onChange={(e) => handleInputChange('tagline', e.target.value)}
                  className="bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                  rows={2}
                />
              </div>

              {/* Website URL */}
              <div>
                <Label htmlFor="websiteUrl" className="text-sm mb-2 block">
                  Website URL
                </Label>
                <div className="relative">
                  <Globe className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="websiteUrl"
                    type="url"
                    placeholder="https://www.school.com"
                    value={formData.websiteUrl}
                    onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                    className="h-12 pl-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Street Address */}
              <div>
                <Label htmlFor="street" className="text-sm mb-2 block">
                  Street Address
                </Label>
                <Input
                  id="street"
                  type="text"
                  placeholder="Enter street address"
                  value={formData.address.street || ''}
                  onChange={(e) => handleInputChange('address.street', e.target.value)}
                  className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              {/* Postal Code */}
              <div>
                <Label htmlFor="postalCode" className="text-sm mb-2 block">
                  Postal Code
                </Label>
                <Input
                  id="postalCode"
                  type="text"
                  placeholder="Enter postal code"
                  value={formData.address.postalCode || ''}
                  onChange={(e) => handleInputChange('address.postalCode', e.target.value)}
                  className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              {/* Country */}
              <div>
                <Label htmlFor="country" className="text-sm mb-2 block">
                  Country
                </Label>
                <Input
                  id="country"
                  type="text"
                  placeholder="Enter country"
                  value={formData.address.country || ''}
                  onChange={(e) => handleInputChange('address.country', e.target.value)}
                  className="h-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                  disabled={isLoading}
                />
              </div>

              {/* Logo URL */}
              <div>
                <Label htmlFor="logo" className="text-sm mb-2 block">
                  Logo URL
                </Label>
                <div className="relative">
                  <ImageIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="logo"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    value={formData.logo}
                    onChange={(e) => handleInputChange('logo', e.target.value)}
                    className="h-12 pl-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
              </div>

              {/* Favicon URL */}
              <div>
                <Label htmlFor="favicon" className="text-sm mb-2 block">
                  Favicon URL
                </Label>
                <div className="relative">
                  <FileIcon className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <Input
                    id="favicon"
                    type="url"
                    placeholder="https://example.com/favicon.ico"
                    value={formData.favicon}
                    onChange={(e) => handleInputChange('favicon', e.target.value)}
                    className="h-12 pl-12 bg-gray-50 dark:bg-gray-800 border-gray-300 dark:border-gray-700 focus:border-blue-500 focus:ring-blue-500"
                    disabled={isLoading}
                  />
                </div>
              </div>
            </div>

            {/* Submit Button */}
            <div className="pt-6">
              <Button
                type="submit"
                disabled={isLoading}
                className="w-full h-14 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-base shadow-lg shadow-blue-500/30 transition-all duration-200 hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                    Creating School...
                  </div>
                ) : (
                  'Create School'
                )}
              </Button>
            </div>
          </form>
        </div>
      </Card>
    </div>
  );
}

