import { Bell, Search, Moon, Sun, Menu, ChevronDown, UserCircle, LogOut, Settings as SettingsIcon } from 'lucide-react';
import { Input } from '../ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../ui/avatar';
import { Button } from '../ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';

interface HeaderProps {
  userType: 'admin' | 'teacher' | 'student';
  userName: string;
  userEmail: string;
  theme: 'light' | 'dark';
  onThemeToggle: () => void;
  onMenuToggle: () => void;
  onSwitchUser: (type: 'admin' | 'teacher' | 'student') => void;
  onLogout: () => void;
  onProfileSettings?: () => void;
}

export function Header({ 
  userType, 
  userName, 
  userEmail, 
  theme, 
  onThemeToggle, 
  onMenuToggle,
  onSwitchUser,
  onLogout,
  onProfileSettings,
}: HeaderProps) {
  const notifications = [
    { id: 1, title: 'New Assignment Posted', message: 'Mathematics homework due Friday', time: '5 min ago', unread: true },
    { id: 2, title: 'Fee Payment Reminder', message: 'Monthly fee due in 3 days', time: '1 hour ago', unread: true },
    { id: 3, title: 'Parent-Teacher Meeting', message: 'Scheduled for next Monday', time: '2 hours ago', unread: false },
    { id: 4, title: 'Exam Schedule Released', message: 'Mid-term exams start next week', time: '1 day ago', unread: false },
  ];
  return (
    <header className="h-16 border-b border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 flex items-center justify-between px-6">
      <div className="flex items-center gap-4 flex-1">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onMenuToggle}
          className="lg:hidden"
        >
          <Menu className="w-5 h-5" />
        </Button>
        
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input 
            placeholder="Search students, teachers, classes..." 
            className="pl-10 bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700"
          />
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Button 
          variant="ghost" 
          size="icon"
          onClick={onThemeToggle}
          className="rounded-full"
        >
          {theme === 'light' ? (
            <Moon className="w-5 h-5" />
          ) : (
            <Sun className="w-5 h-5" />
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-80">
            <DropdownMenuLabel className="flex items-center justify-between">
              <span>Notifications</span>
              <span className="text-xs text-[#2563EB]">Mark all as read</span>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <div className="max-h-96 overflow-y-auto">
              {notifications.map((notification) => (
                <DropdownMenuItem key={notification.id} className="flex-col items-start py-3 cursor-pointer">
                  <div className="flex items-start gap-3 w-full">
                    <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${notification.unread ? 'bg-[#2563EB]' : 'bg-gray-300'}`}></div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900 dark:text-white">{notification.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{notification.time}</p>
                    </div>
                  </div>
                </DropdownMenuItem>
              ))}
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-center text-sm text-[#2563EB] justify-center">
              View all notifications
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="flex items-center gap-3 pl-2">
              <Avatar className="w-8 h-8">
                <AvatarImage src="" />
                <AvatarFallback className="bg-gradient-to-br from-[#0A66C2] to-[#0052A3] text-white">
                  {userName.split(' ').map(n => n[0]).join('')}
                </AvatarFallback>
              </Avatar>
              <div className="hidden md:block text-left">
                <div className="text-sm text-gray-900 dark:text-white">{userName}</div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{userEmail}</div>
              </div>
              <ChevronDown className="w-4 h-4 text-gray-400" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>My Account</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="cursor-pointer" onClick={onProfileSettings}>
              <UserCircle className="w-4 h-4 mr-2" />
              Profile Settings
            </DropdownMenuItem>
            <DropdownMenuItem className="cursor-pointer">
              <SettingsIcon className="w-4 h-4 mr-2" />
              Preferences
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuLabel>Switch View</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => onSwitchUser('admin')} className="cursor-pointer">
              Admin Panel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSwitchUser('teacher')} className="cursor-pointer">
              Teacher Panel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onSwitchUser('student')} className="cursor-pointer">
              Student Panel
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={onLogout} className="text-red-600 cursor-pointer">
              <LogOut className="w-4 h-4 mr-2" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
