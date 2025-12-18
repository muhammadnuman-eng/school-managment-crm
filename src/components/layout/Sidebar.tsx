import { 
  LayoutDashboard, 
  Users, 
  GraduationCap, 
  BookOpen, 
  CalendarCheck, 
  DollarSign, 
  MessageSquare, 
  ClipboardList, 
  Bus, 
  Building2, 
  Package, 
  BarChart3, 
  Settings, 
  CreditCard,
  FileText,
  Upload,
  User,
  Clock,
  Award,
  Calendar
} from 'lucide-react';
import { motion } from 'motion/react';
import { cn } from '../ui/utils';

interface SidebarProps {
  userType: 'admin' | 'teacher' | 'student';
  currentPage: string;
  onNavigate: (page: string) => void;
  collapsed?: boolean;
}

const adminMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'students', label: 'Students', icon: Users },
  { id: 'teachers', label: 'Teachers', icon: GraduationCap },
  { id: 'classes', label: 'Classes & Sections', icon: BookOpen },
  // { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'fees', label: 'Fee Management', icon: DollarSign },
  { id: 'communication', label: 'Communication', icon: MessageSquare },
  { id: 'examinations', label: 'Examinations', icon: ClipboardList },
  { id: 'transport', label: 'Transport', icon: Bus },
  { id: 'hostel', label: 'Hostel', icon: Building2 },
  { id: 'inventory', label: 'Office Inventory', icon: Package },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'subscriptions', label: 'Subscriptions', icon: CreditCard },
  { id: 'settings', label: 'Settings', icon: Settings },
];

const teacherMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'classes', label: 'My Classes', icon: BookOpen },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'assignments', label: 'Assignments', icon: FileText },
  { id: 'timetable', label: 'Timetable', icon: Clock },
  { id: 'gradebook', label: 'Gradebook', icon: Award },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'profile', label: 'My Profile', icon: User },
];

const studentMenuItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'timetable', label: 'My Timetable', icon: Calendar },
  { id: 'assignments', label: 'Assignments', icon: FileText },
  { id: 'grades', label: 'My Grades', icon: Award },
  { id: 'attendance', label: 'Attendance', icon: CalendarCheck },
  { id: 'fees', label: 'Fees & Payments', icon: DollarSign },
  { id: 'exams', label: 'Exams & Results', icon: ClipboardList },
  { id: 'messages', label: 'Messages', icon: MessageSquare },
  { id: 'profile', label: 'My Profile', icon: User },
];

export function Sidebar({ userType, currentPage, onNavigate, collapsed = false }: SidebarProps) {
  const menuItems = userType === 'admin' ? adminMenuItems : 
                    userType === 'teacher' ? teacherMenuItems : 
                    studentMenuItems;

  return (
    <aside className={cn(
      "bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 flex flex-col",
      collapsed ? "w-16" : "w-64"
    )}>
      <div className="p-6 border-b border-gray-200 dark:border-gray-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-[#0A66C2] to-[#0052A3] flex items-center justify-center">
            <GraduationCap className="w-6 h-6 text-white" />
          </div>
          {!collapsed && (
            <div>
              <h1 className="text-gray-900 dark:text-white">EduManage</h1>
              <p className="text-xs text-gray-500 dark:text-gray-400 capitalize">{userType} Panel</p>
            </div>
          )}
        </div>
      </div>

      <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;
          
          return (
            <motion.button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all group relative",
                isActive 
                  ? "bg-[#0A66C2] text-white shadow-lg shadow-blue-500/30" 
                  : "text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              )}
            >
              <Icon className={cn("w-5 h-5 flex-shrink-0", isActive ? "text-white" : "")} />
              {!collapsed && <span>{item.label}</span>}
              
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-sm rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap z-50">
                  {item.label}
                </div>
              )}
            </motion.button>
          );
        })}
      </nav>
    </aside>
  );
}
