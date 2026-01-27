import { useState } from 'react';
import { Card } from '../ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Save, RotateCcw, Settings as SettingsIcon } from 'lucide-react';
import { BasicInformation } from './settings/BasicInformation';
import { BrandingSection } from './settings/BrandingSection';
import { DomainPlatform } from './settings/DomainPlatform';
import { AdminPreferences } from './settings/AdminPreferences';
import { BrandingPreview } from './settings/BrandingPreview';
import { toast } from 'sonner@2.0.3';

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
  schoolName: 'Green Valley School',
  schoolTagline: 'Empowering Education Through Technology',
  schoolEmail: 'info@greenvalley.edu',
  schoolPhone: '+92 300-1234567',
  schoolAddress: 'Plot 123, Education Avenue\nIslamabad, Pakistan',
  
  schoolLogo: null,
  favicon: null,
  primaryColor: '#2563EB',
  secondaryColor: '#7C3AED',
  accentColor: '#10B981',
  fontFamily: 'Inter',
  
  customDomain: 'greenvalley.edumanage.com',
  subdomainStatus: 'active',
  enableCustomEmailTemplates: true,
  
  timezone: 'Asia/Karachi',
  currency: 'PKR',
  defaultLanguage: 'English',
  academicYearStart: '2024-04-01',
  academicYearEnd: '2025-03-31'
};

export function Settings() {
  const [settings, setSettings] = useState<SettingsData>(defaultSettings);
  const [hasChanges, setHasChanges] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleChange = (field: keyof SettingsData, value: any) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const handleSaveChanges = () => {
    setIsSaving(true);
    
    // Simulate API call
    setTimeout(() => {
      setIsSaving(false);
      setHasChanges(false);
      toast.success('Settings saved successfully!', {
        description: 'Your school branding and settings have been updated.'
      });
    }, 1500);
  };

  const handleResetDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to defaults? This action cannot be undone.')) {
      setSettings(defaultSettings);
      setHasChanges(true);
      toast.info('Settings reset to defaults', {
        description: 'Remember to save changes to apply the defaults.'
      });
    }
  };

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
      <BrandingPreview settings={settings} />

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
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
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
                <span className="px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300">
                  {settings.subdomainStatus}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-gray-600 dark:text-gray-400">Last Updated</span>
                <span className="text-gray-900 dark:text-white">2 hours ago</span>
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
