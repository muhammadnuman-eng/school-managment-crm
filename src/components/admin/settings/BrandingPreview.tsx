import { Card } from '../../ui/card';
import { SettingsData } from '../Settings';
import { Bell, Search, Menu } from 'lucide-react';

interface BrandingPreviewProps {
  settings: SettingsData;
}

export function BrandingPreview({ settings }: BrandingPreviewProps) {
  return (
    <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="mb-4">
        <h3 className="text-lg text-gray-900 dark:text-white mb-1">Live Preview</h3>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          See how your branding will appear on the dashboard
        </p>
      </div>

      {/* Preview Container */}
      <div className="border-2 border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden bg-gray-50 dark:bg-gray-900">
        {/* Preview Header */}
        <div 
          className="h-16 px-6 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 transition-colors duration-200"
          style={{ 
            backgroundColor: settings.primaryColor,
            fontFamily: settings.fontFamily 
          }}
        >
          {/* Logo & Name */}
          <div className="flex items-center gap-4">
            <button className="lg:hidden">
              <Menu className="w-5 h-5 text-white" />
            </button>
            <div className="flex items-center gap-3">
              {settings.schoolLogo ? (
                <div className="w-10 h-10 bg-white rounded-lg p-1 flex items-center justify-center">
                  <img 
                    src={settings.schoolLogo} 
                    alt="Logo" 
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              ) : (
                <div className="w-10 h-10 bg-white/20 rounded-lg flex items-center justify-center text-white">
                  <span className="text-lg">S</span>
                </div>
              )}
              <span className="text-white hidden md:block" style={{ fontFamily: settings.fontFamily }}>
                {settings.schoolName}
              </span>
            </div>
          </div>

          {/* Header Actions */}
          <div className="flex items-center gap-3">
            <button className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <Search className="w-4 h-4 text-white" />
            </button>
            <button className="w-9 h-9 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
              <Bell className="w-4 h-4 text-white" />
            </button>
            <div className="w-9 h-9 rounded-lg bg-white/20 flex items-center justify-center">
              <span className="text-white text-sm">AD</span>
            </div>
          </div>
        </div>

        {/* Preview Content */}
        <div className="p-6 space-y-4">
          {/* Welcome Card */}
          <div 
            className="p-4 rounded-lg text-white"
            style={{ 
              backgroundColor: settings.secondaryColor,
              fontFamily: settings.fontFamily 
            }}
          >
            <p className="text-sm opacity-90">Welcome back!</p>
            <p className="text-lg">Dashboard Preview</p>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-3 gap-3">
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400">Total Students</p>
              <p className="text-xl text-gray-900 dark:text-white" style={{ fontFamily: settings.fontFamily }}>
                1,234
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400">Teachers</p>
              <p className="text-xl text-gray-900 dark:text-white" style={{ fontFamily: settings.fontFamily }}>
                156
              </p>
            </div>
            <div className="bg-white dark:bg-gray-800 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-xs text-gray-600 dark:text-gray-400">Classes</p>
              <p className="text-xl text-gray-900 dark:text-white" style={{ fontFamily: settings.fontFamily }}>
                48
              </p>
            </div>
          </div>

          {/* Sample Buttons */}
          <div className="flex gap-2">
            <button 
              className="px-4 py-2 rounded-lg text-white text-sm transition-opacity hover:opacity-90"
              style={{ 
                backgroundColor: settings.accentColor,
                fontFamily: settings.fontFamily 
              }}
            >
              Primary Action
            </button>
            <button 
              className="px-4 py-2 rounded-lg text-sm border-2 transition-colors"
              style={{ 
                borderColor: settings.primaryColor,
                color: settings.primaryColor,
                fontFamily: settings.fontFamily 
              }}
            >
              Secondary
            </button>
          </div>

          {/* Info Text */}
          <div className="text-xs text-gray-500 dark:text-gray-400 pt-2">
            <p style={{ fontFamily: settings.fontFamily }}>
              {settings.schoolTagline}
            </p>
          </div>
        </div>
      </div>

      {/* Color Swatches */}
      <div className="mt-4 flex items-center gap-3">
        <div className="text-xs text-gray-600 dark:text-gray-400">Colors:</div>
        <div className="flex gap-2">
          <div 
            className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: settings.primaryColor }}
            title="Primary"
          />
          <div 
            className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: settings.secondaryColor }}
            title="Secondary"
          />
          <div 
            className="w-8 h-8 rounded border-2 border-gray-300 dark:border-gray-600"
            style={{ backgroundColor: settings.accentColor }}
            title="Accent"
          />
        </div>
        <div className="text-xs text-gray-600 dark:text-gray-400 ml-auto">
          Font: <span className="font-mono">{settings.fontFamily}</span>
        </div>
      </div>
    </Card>
  );
}
