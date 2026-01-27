import { Shield, BookOpen, GraduationCap, ArrowRight, Globe } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { UserRole } from './AuthSystem';

interface PortalSelectionProps {
  onSelectPortal: (role: UserRole) => void;
}

export function PortalSelection({ onSelectPortal }: PortalSelectionProps) {
  const portals = [
    {
      id: 'admin' as UserRole,
      icon: Shield,
      title: 'Administrator Portal',
      description: 'Manage schools, users, and system settings',
      userCount: '24 Admins',
      color: 'blue',
      gradient: 'from-blue-500 to-blue-600',
      hoverBorder: 'hover:border-blue-500',
      iconBg: 'bg-blue-100 dark:bg-blue-900/20',
      iconColor: 'text-blue-600'
    },
    {
      id: 'teacher' as UserRole,
      icon: BookOpen,
      title: 'Teacher Portal',
      description: 'Access classes, attendance, and student records',
      userCount: '156 Teachers',
      color: 'purple',
      gradient: 'from-purple-500 to-purple-600',
      hoverBorder: 'hover:border-purple-500',
      iconBg: 'bg-purple-100 dark:bg-purple-900/20',
      iconColor: 'text-purple-600'
    },
    {
      id: 'student' as UserRole,
      icon: GraduationCap,
      title: 'Student & Parent Portal',
      description: 'View schedules, results, fees, and announcements',
      userCount: '1,234 Students',
      color: 'green',
      gradient: 'from-green-500 to-green-600',
      hoverBorder: 'hover:border-green-500',
      iconBg: 'bg-green-100 dark:bg-green-900/20',
      iconColor: 'text-green-600'
    }
  ];

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Branding */}
      <div className="hidden lg:flex lg:w-2/5 bg-gradient-to-br from-blue-600 via-blue-700 to-purple-700 relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-20 left-10 w-64 h-64 bg-white rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-white rounded-full blur-3xl"></div>
        </div>

        {/* Floating icons */}
        <div className="absolute top-1/4 left-1/4 opacity-20 animate-pulse">
          <BookOpen className="w-16 h-16 text-white" />
        </div>
        <div className="absolute bottom-1/3 right-1/4 opacity-20 animate-pulse" style={{ animationDelay: '1s' }}>
          <GraduationCap className="w-20 h-20 text-white" />
        </div>

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center justify-center w-full p-12 text-white">
          <div className="text-center space-y-6">
            {/* Logo */}
            <div className="w-32 h-32 mx-auto bg-white/10 backdrop-blur-lg rounded-3xl flex items-center justify-center border border-white/20">
              <GraduationCap className="w-16 h-16 text-white" />
            </div>

            {/* School Name */}
            <div>
              <h1 className="text-4xl mb-3 tracking-tight">
                SchoolHub
              </h1>
              <p className="text-lg text-blue-100">
                Empowering Education Through Technology
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-3 gap-6 pt-8">
              <div className="text-center">
                <div className="text-3xl mb-1">24</div>
                <div className="text-sm text-blue-200">Schools</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-1">156</div>
                <div className="text-sm text-blue-200">Teachers</div>
              </div>
              <div className="text-center">
                <div className="text-3xl mb-1">1.2K</div>
                <div className="text-sm text-blue-200">Students</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Portal Selection */}
      <div className="flex-1 flex items-center justify-center p-8 bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)',
            backgroundSize: '32px 32px'
          }}></div>
        </div>

        <div className="relative z-10 w-full max-w-lg">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-5xl mb-4 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
              Welcome to SchoolHub
            </h1>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              Select your portal to continue
            </p>
          </div>

          {/* Portal Cards */}
          <div className="space-y-4 mb-8">
            {portals.map((portal) => (
              <Card
                key={portal.id}
                onClick={() => onSelectPortal(portal.id)}
                className={`
                  p-8 cursor-pointer transition-all duration-300 border-2 border-gray-200 dark:border-gray-700
                  hover:border-transparent hover:shadow-xl hover:-translate-y-1
                  ${portal.hoverBorder}
                  bg-white dark:bg-gray-800
                `}
              >
                <div className="flex items-center gap-6">
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-2xl ${portal.iconBg} flex items-center justify-center flex-shrink-0`}>
                    <portal.icon className={`w-8 h-8 ${portal.iconColor}`} />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <h3 className="text-2xl mb-2 text-gray-900 dark:text-white tracking-tight">
                      {portal.title}
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {portal.description}
                    </p>
                    <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs bg-${portal.color}-50 dark:bg-${portal.color}-900/20 text-${portal.color}-700 dark:text-${portal.color}-300`}>
                      {portal.userCount}
                    </div>
                  </div>

                  {/* Arrow */}
                  <ArrowRight className="w-6 h-6 text-gray-400 group-hover:text-gray-600 transition-colors flex-shrink-0" />
                </div>
              </Card>
            ))}
          </div>

          {/* Footer */}
          <div className="text-center space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Need help? Contact{' '}
              <a href="mailto:support@schoolhub.com" className="text-blue-600 hover:underline">
                support@schoolhub.com
              </a>
            </p>

            <div className="flex items-center justify-center gap-4 text-sm text-gray-500 dark:text-gray-400">
              <button className="flex items-center gap-2 hover:text-gray-700 dark:hover:text-gray-300">
                <Globe className="w-4 h-4" />
                English
              </button>
              <span>•</span>
              <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">Privacy Policy</a>
              <span>•</span>
              <a href="#" className="hover:text-gray-700 dark:hover:text-gray-300">Terms of Service</a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
