import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { Sidebar } from './components/layout/Sidebar';
import { Header } from './components/layout/Header';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { AdminProfile } from './components/admin/AdminProfile';
import { Students } from './components/admin/Students';
import { Teachers } from './components/admin/Teachers';
import { Classes } from './components/admin/Classes';
import { Attendance } from './components/admin/Attendance';
import { FeeManagement } from './components/admin/FeeManagement';
import { Subscriptions } from './components/admin/Subscriptions';
import { Communication } from './components/admin/Communication';
import { Examinations } from './components/admin/Examinations';
import { Settings } from './components/admin/Settings';
import { Transport } from './components/admin/Transport';
import { Hostel } from './components/admin/Hostel';
import { OfficeInventory } from './components/admin/OfficeInventory';
import { Analytics } from './components/admin/Analytics';
import { TeacherDashboard } from './components/teacher/TeacherDashboard';
import { TeacherAttendance } from './components/teacher/TeacherAttendance';
import { TeacherClasses } from './components/teacher/TeacherClasses';
import { TeacherAssignments } from './components/teacher/TeacherAssignments';
import { TeacherTimetable } from './components/teacher/TeacherTimetable';
import { TeacherGradebook } from './components/teacher/TeacherGradebook';
import { TeacherMessages } from './components/teacher/TeacherMessages';
import { TeacherProfile } from './components/teacher/TeacherProfile';
import { StudentDashboard } from './components/student/StudentDashboard';
import { StudentTimetable } from './components/student/StudentTimetable';
import { StudentAssignments } from './components/student/StudentAssignments';
import { StudentGrades } from './components/student/StudentGrades';
import { StudentAttendance } from './components/student/StudentAttendance';
import { StudentFees } from './components/student/StudentFees';
import { StudentExams } from './components/student/StudentExams';
import { StudentMessages } from './components/student/StudentMessages';
import { StudentProfile } from './components/student/StudentProfile';
import { Toaster } from './components/ui/sonner';
import { AuthSystem, UserRole } from './components/auth/AuthSystem';
import { authService } from './services';
import { schoolStorage } from './utils/storage';
import { toast } from 'sonner';

export default function App() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  
  // Set to true to bypass authentication for development
  const BYPASS_AUTH = false;
  
  // Initialize authentication state - start with checking storage to prevent flash
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (BYPASS_AUTH) return true;
    // Check if user is authenticated from storage immediately
    const authenticated = authService.isAuthenticated();
    return authenticated;
  });
  
  const [isCheckingAuth, setIsCheckingAuth] = useState(true); // Add loading state
  
  const [userType, setUserType] = useState<'admin' | 'teacher' | 'student'>(() => {
    // Try to restore from storage first
    const storedUserType = sessionStorage.getItem('app_user_type') as 'admin' | 'teacher' | 'student' | null;
    if (storedUserType && ['admin', 'teacher', 'student'].includes(storedUserType)) {
      return storedUserType;
    }
    
    // Fallback to user data from auth service
    const user = authService.getCurrentUser();
    if (user?.role) {
      const role = user.role.toLowerCase();
      if (role === 'super_admin' || role === 'school_admin' || role === 'admin') {
        return 'admin';
      } else if (role === 'teacher') {
        return 'teacher';
      } else if (role === 'student') {
        return 'student';
      }
    }
    return 'admin';
  });
  
  const [currentPage, setCurrentPage] = useState(() => {
    // Restore current page from storage on reload
    const storedPage = sessionStorage.getItem('app_current_page');
    if (storedPage) {
      return storedPage;
    }
    return 'dashboard';
  });
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  // Check authentication on mount and when storage changes
  useEffect(() => {
    if (!BYPASS_AUTH) {
      const checkAuth = () => {
        const authenticated = authService.isAuthenticated();
        
        // If not authenticated and on protected route, redirect to login
        if (!authenticated) {
          setIsAuthenticated(false);
          setIsCheckingAuth(false);
          // Only redirect if we're on a protected route (not on login page)
          const currentPath = window.location.pathname;
          if (!currentPath.includes('/admin/login') && !currentPath.includes('/admin/school-login')) {
            navigate('/admin/login');
          }
          return;
        }
        
        // User is authenticated
        setIsAuthenticated(true);
        setIsCheckingAuth(false);
        
        // Update user type if authenticated
        const user = authService.getCurrentUser();
        if (user?.role) {
          const role = user.role.toLowerCase();
          let newUserType: 'admin' | 'teacher' | 'student' = 'admin';
          if (role === 'super_admin' || role === 'school_admin' || role === 'admin') {
            newUserType = 'admin';
          } else if (role === 'teacher') {
            newUserType = 'teacher';
          } else if (role === 'student') {
            newUserType = 'student';
          }
          setUserType(newUserType);
          // Save user type to storage
          sessionStorage.setItem('app_user_type', newUserType);
        }
        
        // Verify school ID matches route
        if (schoolId) {
          // Check schoolStorage first (most reliable)
          const storedSchoolId = schoolStorage.getSchoolId();
          const user = authService.getCurrentUser();
          const userSchoolId = user?.schoolId;
          
          // Use stored school ID if available, otherwise use user's schoolId
          const currentSchoolId = storedSchoolId || userSchoolId;
          
          if (currentSchoolId && currentSchoolId !== schoolId) {
            // School ID mismatch - redirect to correct school dashboard
            console.log('School ID mismatch, redirecting:', { routeSchoolId: schoolId, currentSchoolId });
            navigate(`/admin/school/${currentSchoolId}/dashboard`);
          } else if (!currentSchoolId) {
            // No school ID found - redirect to school login
            console.warn('No school ID found, redirecting to school login');
            navigate('/admin/school-login');
          }
        } else {
          // No schoolId in route - check if we have one stored
          const storedSchoolId = schoolStorage.getSchoolId();
          if (storedSchoolId) {
            // Redirect to dashboard with school ID
            navigate(`/admin/school/${storedSchoolId}/dashboard`);
          } else {
            // No school ID in storage either - redirect to school login
            navigate('/admin/school-login');
          }
        }
        
        // Restore current page from storage if available
        const storedPage = sessionStorage.getItem('app_current_page');
        if (storedPage) {
          setCurrentPage(storedPage);
        }
      };
      
      // Check immediately
      checkAuth();
      
      // Listen for storage changes (for cross-tab sync)
      const handleStorageChange = (e: StorageEvent) => {
        if (e.key === 'auth_token' || e.key === 'auth_refresh_token' || e.key === 'auth_user' || e.key === 'school_uuid') {
          checkAuth();
        }
      };
      
      window.addEventListener('storage', handleStorageChange);
      
      return () => {
        window.removeEventListener('storage', handleStorageChange);
      };
    } else {
      setIsCheckingAuth(false);
    }
  }, [navigate, schoolId]);

  useEffect(() => {
    if (theme === 'dark') {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [theme]);

  const handleThemeToggle = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const handleSwitchUser = (type: 'admin' | 'teacher' | 'student') => {
    setUserType(type);
    setCurrentPage('dashboard');
    // Save to storage
    sessionStorage.setItem('app_user_type', type);
    sessionStorage.setItem('app_current_page', 'dashboard');
  };

  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    // Save current page to storage for reload persistence
    sessionStorage.setItem('app_current_page', page);
  };

  const handleProfileSettings = () => {
    setCurrentPage('profile');
    // Save current page to storage
    sessionStorage.setItem('app_current_page', 'profile');
  };

  const handleMenuToggle = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const getUserInfo = () => {
    switch (userType) {
      case 'admin':
        return { name: 'Admin User', email: 'admin@edumanage.com' };
      case 'teacher':
        return { name: 'Dr. Sarah Mitchell', email: 'sarah.m@school.com' };
      case 'student':
        return { name: 'Emily Rodriguez', email: 'emily.r@school.com' };
    }
  };

  const renderPage = () => {
    if (userType === 'admin') {
      switch (currentPage) {
        case 'dashboard':
          return <AdminDashboard />;
        case 'students':
          return <Students />;
        case 'teachers':
          return <Teachers />;
        case 'fees':
          return <FeeManagement />;
        case 'subscriptions':
          return <Subscriptions />;
        case 'classes':
          return <Classes />;
        case 'attendance':
          return <Attendance />;
        case 'communication':
          return <Communication />;
        case 'examinations':
          return <Examinations />;
        case 'transport':
          return <Transport />;
        case 'hostel':
          return <Hostel />;
        case 'inventory':
          return <OfficeInventory />;
        case 'analytics':
          return <Analytics />;
        case 'settings':
          return <Settings />;
        case 'profile':
          return <AdminProfile />;
        default:
          return <AdminDashboard />;
      }
    } else if (userType === 'teacher') {
      switch (currentPage) {
        case 'dashboard':
          return <TeacherDashboard />;
        case 'classes':
          return <TeacherClasses />;
        case 'attendance':
          return <TeacherAttendance />;
        case 'assignments':
          return <TeacherAssignments />;
        case 'timetable':
          return <TeacherTimetable />;
        case 'gradebook':
          return <TeacherGradebook />;
        case 'messages':
          return <TeacherMessages />;
        case 'profile':
          return <TeacherProfile />;
        default:
          return <TeacherDashboard />;
      }
    } else {
      switch (currentPage) {
        case 'dashboard':
          return <StudentDashboard />;
        case 'timetable':
          return <StudentTimetable />;
        case 'assignments':
          return <StudentAssignments />;
        case 'grades':
          return <StudentGrades />;
        case 'attendance':
          return <StudentAttendance />;
        case 'fees':
          return <StudentFees />;
        case 'exams':
          return <StudentExams />;
        case 'messages':
          return <StudentMessages />;
        case 'profile':
          return <StudentProfile />;
        default:
          return <StudentDashboard />;
      }
    }
  };

  const handleLoginSuccess = (role: UserRole) => {
    setIsAuthenticated(true);
    const userTypeValue = role as 'admin' | 'teacher' | 'student';
    setUserType(userTypeValue);
    setCurrentPage('dashboard');
    // Save to storage
    sessionStorage.setItem('app_user_type', userTypeValue);
    sessionStorage.setItem('app_current_page', 'dashboard');
  };

  const handleLogout = async () => {
    try {
      // Call logout API
      await authService.logout({
        logoutAllDevices: false,
      });
      
      // Clear local state
      setIsAuthenticated(false);
      setCurrentPage('dashboard');
      
      // Clear page storage on logout
      sessionStorage.removeItem('app_current_page');
      sessionStorage.removeItem('app_user_type');
      
      // Show success message
      toast.success('Logged out successfully');
    } catch (error: any) {
      // Even if API fails, clear local state (tokens already cleared by service)
      setIsAuthenticated(false);
      setCurrentPage('dashboard');
      
      // Clear page storage on logout
      sessionStorage.removeItem('app_current_page');
      sessionStorage.removeItem('app_user_type');
      
      // Show info message (not error, since local session is cleared)
      toast.info('Logged out successfully');
    }
  };

  const userInfo = getUserInfo();

  // Show loading state while checking authentication
  if (isCheckingAuth) {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-950">
        <div className="text-center">
          <div className="mb-4 inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-[#2563EB] border-r-transparent"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  // Show authentication system if not authenticated
  if (!isAuthenticated) {
    return (
      <>
        <AuthSystem onLoginSuccess={handleLoginSuccess} />
        <Toaster />
      </>
    );
  }

  return (
    <div className="flex h-screen bg-white dark:bg-gray-950">
      <Sidebar 
        userType={userType} 
        currentPage={currentPage} 
        onNavigate={handleNavigate}
        collapsed={sidebarCollapsed}
      />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header
          userType={userType}
          userName={userInfo.name}
          userEmail={userInfo.email}
          theme={theme}
          onThemeToggle={handleThemeToggle}
          onMenuToggle={handleMenuToggle}
          onSwitchUser={handleSwitchUser}
          onLogout={handleLogout}
          onProfileSettings={handleProfileSettings}
        />
        
        <main className="flex-1 overflow-y-auto p-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentPage}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.2, ease: 'easeInOut' }}
            >
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      
      <Toaster />
    </div>
  );
}

// Placeholder Components
function ClassesPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Classes & Sections</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage class structure and subject mapping</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Classes & Sections management interface</p>
      </div>
    </div>
  );
}

function AttendancePlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Attendance Tracking</h1>
        <p className="text-gray-600 dark:text-gray-400">View and manage student attendance</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Attendance calendar and list view</p>
      </div>
    </div>
  );
}

function CommunicationPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Communication Hub</h1>
        <p className="text-gray-600 dark:text-gray-400">Notice board, chat, and messaging</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Communication module with chat interface</p>
      </div>
    </div>
  );
}

function ExaminationsPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Examination Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Schedule exams, manage grading, and generate report cards</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Exam scheduling and report card generation</p>
      </div>
    </div>
  );
}

function TransportPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Transport Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage buses, routes, and student transport</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Transport routes and vehicle management</p>
      </div>
    </div>
  );
}

function HostelPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Hostel Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage hostel rooms and student allocations</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Hostel room allocation and management</p>
      </div>
    </div>
  );
}

function LibraryPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Library Management</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage books, issue records, and library resources</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Library book catalog and issue tracking</p>
      </div>
    </div>
  );
}

function AnalyticsPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Analytics & Reports</h1>
        <p className="text-gray-600 dark:text-gray-400">Comprehensive insights and performance metrics</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Advanced analytics and custom reports</p>
      </div>
    </div>
  );
}

function SettingsPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">System configuration and preferences</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">System settings, roles, and permissions</p>
      </div>
    </div>
  );
}

function TeacherAttendancePlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Mark Attendance</h1>
        <p className="text-gray-600 dark:text-gray-400">Take attendance for your classes</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Attendance marking interface with checkboxes</p>
      </div>
    </div>
  );
}

function TeacherAssignmentsPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Assignments</h1>
        <p className="text-gray-600 dark:text-gray-400">Create and manage assignments</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Assignment upload and submission tracking</p>
      </div>
    </div>
  );
}

function TeacherExamsPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Exam Marks Entry</h1>
        <p className="text-gray-600 dark:text-gray-400">Enter and manage exam marks</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Grade entry and marks management</p>
      </div>
    </div>
  );
}

function TimetablePlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">My Timetable</h1>
        <p className="text-gray-600 dark:text-gray-400">Your weekly class schedule</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Weekly calendar view of classes</p>
      </div>
    </div>
  );
}

function StudentAssignmentsPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Assignments</h1>
        <p className="text-gray-600 dark:text-gray-400">View and submit your assignments</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Assignment list and submission interface</p>
      </div>
    </div>
  );
}

function StudentFeesPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Fee Payment</h1>
        <p className="text-gray-600 dark:text-gray-400">View and pay your school fees</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Payment gateway and fee history</p>
      </div>
    </div>
  );
}

function ReportCardsPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Report Cards</h1>
        <p className="text-gray-600 dark:text-gray-400">View your academic performance</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Performance graphs and downloadable report cards</p>
      </div>
    </div>
  );
}

function MessagesPlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Messages</h1>
        <p className="text-gray-600 dark:text-gray-400">Chat with teachers, students, and parents</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Real-time messaging interface</p>
      </div>
    </div>
  );
}

function ProfilePlaceholder() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl text-gray-900 dark:text-white mb-2">Profile Settings</h1>
        <p className="text-gray-600 dark:text-gray-400">Manage your account information</p>
      </div>
      <div className="bg-white dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-800 p-12 text-center">
        <p className="text-gray-500 dark:text-gray-400">Profile information and settings</p>
      </div>
    </div>
  );
}
