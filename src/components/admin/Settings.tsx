import { useState, useEffect } from 'react';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Save, RotateCcw, Settings as SettingsIcon, Loader2 } from 'lucide-react';
import { BasicInformation } from './settings/BasicInformation';
import { BrandingSection } from './settings/BrandingSection';
import { DomainPlatform } from './settings/DomainPlatform';
import { AdminPreferences } from './settings/AdminPreferences';
import { BrandingPreview } from './settings/BrandingPreview';
import { toast } from 'sonner@2.0.3';
import { adminService, schoolService } from '../../services';
import { schoolStorage } from '../../utils/storage';

export interface SettingsData {
  // Basic Information
  schoolName: string;
  schoolTagline: string;
  schoolEmail: string;
  schoolPhone: string;
  schoolAddress: string;
  
  // Branding
  schoolLogo: string | null;
  favicon: string | null;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  
  // Domain & Platform
  customDomain: string;
  subdomainStatus: 'active' | 'pending' | 'inactive';
  enableCustomEmailTemplates: boolean;
  
  // Admin Preferences
  timezone: string;
  currency: string;
  defaultLanguage: string;
  academicYearStart: string;
  academicYearEnd: string;
}

const defaultSettings: SettingsData = {
  schoolName: '',
  schoolTagline: '',
  schoolEmail: '',
  schoolPhone: '',
  schoolAddress: '',
  
  schoolLogo: null,
  favicon: null,
  primaryColor: '#2563EB',
  secondaryColor: '#7C3AED',
  accentColor: '#10B981',
  fontFamily: 'Inter',
  
  customDomain: '',
  subdomainStatus: 'active',
  enableCustomEmailTemplates: true,
  
  timezone: 'Asia/Karachi',
  currency: 'PKR',
  defaultLanguage: 'English',
  academicYearStart: '',
  academicYearEnd: ''
};

export function Settings() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [loading, setLoading] = useState(true);
  const [systemSettings, setSystemSettings] = useState<any[]>([]);
  const [dashboardStats, setDashboardStats] = useState<any>(null);
  const [classesCount, setClassesCount] = useState<number>(0);

  useEffect(() => {
    fetchSettingsData();
  }, []);

  const fetchSettingsData = async () => {
    try {
      setLoading(true);
      const schoolId = schoolStorage.getSchoolId();

      if (!schoolId) {
        toast.error('School ID not found');
        setLoading(false);
        return;
      }

      // Fetch school data, system settings, dashboard stats, and classes in parallel
      const [schoolResponse, systemSettingsResponse, dashboardStatsResponse, classesResponse] = await Promise.all([
        schoolService.getSchoolById(schoolId).catch((error) => {
          console.error('Error fetching school:', error);
          return { data: null };
        }),
        adminService.getSystemSettings().catch((error) => {
          console.error('Error fetching system settings:', error);
          return [];
        }),
        adminService.getDashboardStats().catch((error) => {
          console.error('Error fetching dashboard stats:', error);
          return null;
        }),
        adminService.getClasses().catch((error) => {
          console.error('Error fetching classes:', error);
          return { classes: [] };
        }),
      ]);

      // Handle school response - could be direct object or wrapped in data
      const school = schoolResponse?.data || schoolResponse || null;
      
      // Handle system settings response - could be array or wrapped
      let settingsList: any[] = [];
      if (Array.isArray(systemSettingsResponse)) {
        settingsList = systemSettingsResponse;
      } else if (systemSettingsResponse && Array.isArray(systemSettingsResponse.data)) {
        settingsList = systemSettingsResponse.data;
      } else if (systemSettingsResponse && systemSettingsResponse.settings) {
        settingsList = Array.isArray(systemSettingsResponse.settings) 
          ? systemSettingsResponse.settings 
          : [];
      }

      // Format address from school data
      let formattedAddress = '';
      if (school) {
        const addressParts = [];
        if (school.streetAddress) addressParts.push(school.streetAddress);
        if (school.city || school.stateProvince) {
          addressParts.push(`${school.city || ''}${school.city && school.stateProvince ? ', ' : ''}${school.stateProvince || ''}`);
        }
        if (school.postalCode) addressParts.push(school.postalCode);
        formattedAddress = addressParts.join('\n');
      }

      // Map school data to settings
      const mappedSettings: SettingsData = {
        schoolName: school?.name || '',
        schoolTagline: school?.tagline || '',
        schoolEmail: school?.contactEmail || '',
        schoolPhone: school?.contactPhone || '',
        schoolAddress: formattedAddress,
        
        schoolLogo: school?.logoUrl || school?.logo || null,
        favicon: school?.faviconUrl || school?.favicon || null,
        primaryColor: school?.primaryColor || '#2563EB',
        secondaryColor: school?.secondaryColor || '#7C3AED',
        accentColor: '#10B981', // Default, can be from settings
        fontFamily: 'Inter', // Default, can be from settings
        
        customDomain: school?.customDomain || '',
        subdomainStatus: school?.subdomain ? 'active' : 'inactive',
        enableCustomEmailTemplates: true, // Default, can be from settings
        
        timezone: school?.timezone || 'Asia/Karachi',
        currency: school?.currency || 'PKR',
        defaultLanguage: school?.language || 'English',
        academicYearStart: '', // Will be fetched from academic year
        academicYearEnd: '', // Will be fetched from academic year
      };

      // Map system settings to settings data
      settingsList.forEach((setting: any) => {
        const key = setting.settingKey;
        const value = setting.settingValue;
        
        switch (key) {
          case 'accentColor':
            mappedSettings.accentColor = value || '#10B981';
            break;
          case 'fontFamily':
            mappedSettings.fontFamily = value || 'Inter';
            break;
          case 'enableCustomEmailTemplates':
            mappedSettings.enableCustomEmailTemplates = value === 'true' || value === true;
            break;
          case 'academicYearStart':
            mappedSettings.academicYearStart = value || '';
            break;
          case 'academicYearEnd':
            mappedSettings.academicYearEnd = value || '';
            break;
        }
      });

      setSettings(mappedSettings);
      setSystemSettings(settingsList);
      
      // Set dashboard stats
      if (dashboardStatsResponse) {
        setDashboardStats(dashboardStatsResponse);
      }
      
      // Set classes count
      if (classesResponse) {
        let classes: any[] = [];
        if (Array.isArray(classesResponse)) {
          classes = classesResponse;
        } else if (classesResponse && Array.isArray(classesResponse.classes)) {
          classes = classesResponse.classes;
        } else if (classesResponse && classesResponse.data && Array.isArray(classesResponse.data)) {
          classes = classesResponse.data;
        } else if (classesResponse && classesResponse.data && classesResponse.data.classes && Array.isArray(classesResponse.data.classes)) {
          classes = classesResponse.data.classes;
        }
        setClassesCount(classes.length);
      } else {
        setClassesCount(0);
      }
      
      if (import.meta.env.DEV) {
        console.log('Settings data loaded:', {
          school,
          settingsList,
          mappedSettings,
          dashboardStats: dashboardStatsResponse,
          classesCount: Array.isArray(classesResponse) 
            ? classesResponse.length 
            : Array.isArray(classesResponse?.classes) 
              ? classesResponse.classes.length 
              : 0,
        });
      }
    } catch (error: any) {
      console.error('Error fetching settings data:', error);
      toast.error('Failed to load settings', {
        description: error?.message || 'Please try again later',
      });
      // Set default settings on error
      setSettings(defaultSettings);
      setSystemSettings([]);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (field: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveChanges = async () => {
    try {
      setIsSaving(true);
      const schoolId = schoolStorage.getSchoolId();

      if (!schoolId) {
        toast.error('School ID not found');
        return;
      }

      // Parse address
      const addressLines = settings.schoolAddress.split('\n').filter(line => line.trim());
      let streetAddress = '';
      let city = '';
      let stateProvince = '';
      let postalCode = '';
      
      if (addressLines.length > 0) {
        streetAddress = addressLines[0] || '';
      }
      if (addressLines.length > 1) {
        const cityState = addressLines[1].split(',').map(s => s.trim());
        city = cityState[0] || '';
        stateProvince = cityState[1] || '';
      }
      if (addressLines.length > 2) {
        postalCode = addressLines[2] || '';
      }
      
      const address = {
        streetAddress: streetAddress,
        city: city || 'Islamabad',
        stateProvince: stateProvince || 'Punjab',
        postalCode: postalCode,
        country: 'Pakistan',
      };

      // Prepare school update data
      const schoolUpdateData: any = {
        name: settings.schoolName,
        tagline: settings.schoolTagline,
        contactEmail: settings.schoolEmail,
        contactPhone: settings.schoolPhone,
        address: address,
        logoUrl: settings.schoolLogo,
        faviconUrl: settings.favicon,
        primaryColor: settings.primaryColor,
        secondaryColor: settings.secondaryColor,
        customDomain: settings.customDomain,
        timezone: settings.timezone,
        currency: settings.currency,
        language: settings.defaultLanguage,
      };

      // Update school
      await schoolService.updateSchool(schoolId, schoolUpdateData);

      // Update system settings
      const settingsToUpdate = [
        { key: 'accentColor', value: settings.accentColor },
        { key: 'fontFamily', value: settings.fontFamily },
        { key: 'enableCustomEmailTemplates', value: settings.enableCustomEmailTemplates.toString() },
        { key: 'academicYearStart', value: settings.academicYearStart },
        { key: 'academicYearEnd', value: settings.academicYearEnd },
      ];

      // Update or create system settings
      for (const setting of settingsToUpdate) {
        const existing = systemSettings.find((s: any) => s.settingKey === setting.key);
        if (existing) {
          await adminService.updateSystemSetting(existing.id, {
            settingValue: setting.value,
          });
        } else {
          await adminService.createSystemSetting({
            schoolId,
            settingKey: setting.key,
            settingValue: setting.value,
            settingType: 'STRING',
            category: 'preferences',
          });
        }
      }

      setHasChanges(false);
      toast.success('Settings saved successfully!', {
        description: 'Your school branding and settings have been updated.',
      });

      // Refresh data
      await fetchSettingsData();
    } catch (error: any) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings', {
        description: error.message || 'Please try again later',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      setSettings(defaultSettings);
      setHasChanges(true);
      toast.info('Settings reset to defaults', {
        description: 'Remember to save changes to apply the defaults.',
      });
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="w-8 h-8 animate-spin text-[#0A66C2]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl text-gray-900 dark:text-white mb-2 flex items-center gap-3">
            <SettingsIcon className="w-8 h-8" />
            School Settings & Branding
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Customize your school's branding, contact details, and platform preferences
          </p>
        </div>
      </div>

      {/* Preview Card */}
      <BrandingPreview 
        settings={settings} 
        stats={{
          totalStudents: dashboardStats?.students?.total || 0,
          totalTeachers: dashboardStats?.teachers?.total || 0,
          totalClasses: classesCount,
        }}
      />

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form (2/3 width) */}
        <div className="lg:col-span-2">
          <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <Tabs defaultValue="basic" className="w-full">
              <div className="border-b border-gray-200 dark:border-gray-700 px-6 pt-6">
                <TabsList className="w-full justify-start bg-transparent border-b-0 h-auto p-0 space-x-8">
                  <TabsTrigger 
                    value="basic"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-3"
                  >
                    Basic Info
                  </TabsTrigger>
                  <TabsTrigger 
                    value="branding"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-3"
                  >
                    Branding
                  </TabsTrigger>
                  <TabsTrigger 
                    value="domain"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-3"
                  >
                    Domain
                  </TabsTrigger>
                  <TabsTrigger 
                    value="preferences"
                    className="rounded-none border-b-2 border-transparent data-[state=active]:border-blue-600 data-[state=active]:bg-transparent px-0 pb-3"
                  >
                    Preferences
                  </TabsTrigger>
                </TabsList>
              </div>

              <div className="p-6">
                <TabsContent value="basic" className="mt-0">
                  <BasicInformation 
                    settings={settings} 
                    onChange={handleChange} 
                  />
                </TabsContent>

                <TabsContent value="branding" className="mt-0">
                  <BrandingSection 
                    settings={settings} 
                    onChange={handleChange} 
                  />
                </TabsContent>

                <TabsContent value="domain" className="mt-0">
                  <DomainPlatform 
                    settings={settings} 
                    onChange={handleChange} 
                  />
                </TabsContent>

                <TabsContent value="preferences" className="mt-0">
                  <AdminPreferences 
                    settings={settings} 
                    onChange={handleChange} 
                  />
                </TabsContent>
              </div>
            </Tabs>
          </Card>
        </div>

        {/* Quick Actions Sidebar (1/3 width) */}
        <div className="space-y-4">
          {/* Save Actions Card */}
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <h3 className="text-lg mb-4 text-gray-900 dark:text-white">Actions</h3>
            <div className="space-y-3">
              <Button
                onClick={handleSaveChanges}
                disabled={!hasChanges || isSaving}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
              <Button
                onClick={handleResetDefaults}
                variant="outline"
                className="w-full"
                disabled={isSaving}
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset to Defaults
              </Button>
            </div>
            
            {hasChanges && (
              <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
                <p className="text-xs text-amber-800 dark:text-amber-200">
                  You have unsaved changes
                </p>
              </div>
            )}
          </Card>

          {/* Help Card */}
          <Card className="p-6 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800">
            <h3 className="text-sm mb-2 text-blue-900 dark:text-blue-100">Need Help?</h3>
            <p className="text-xs text-blue-700 dark:text-blue-300 mb-4">
              Learn more about customizing your school's branding and settings.
            </p>
            <Button variant="outline" size="sm" className="w-full text-xs border-blue-300 dark:border-blue-700">
              View Documentation
            </Button>
          </Card>

          {/* Current Status */}
          <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <h3 className="text-sm mb-3 text-gray-900 dark:text-white">System Status</h3>
            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Domain Status</span>
                <span className={`px-2 py-1 rounded-full ${
                  settings.subdomainStatus === 'active' 
                    ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                    : settings.subdomainStatus === 'pending'
                    ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
                    : 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300'
                }`}>
                  {settings.subdomainStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                <span className="text-gray-900 dark:text-white">Just now</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Version</span>
                <span className="text-gray-900 dark:text-white">v2.1.0</span>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
