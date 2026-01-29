import { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
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
import { SchoolLoginSuccessPage } from './components/auth/SchoolLoginSuccessPage';
import { SchoolLoginPage } from './components/auth/SchoolLoginPage';
import { authService } from './services';
import { schoolStorage } from './utils/storage';
import { toast } from 'sonner';
import { PortalSelection } from './components/auth/PortalSelection';

export default function App() {
  const { schoolId } = useParams<{ schoolId: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  const BYPASS_AUTH = false;

  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    if (BYPASS_AUTH) return true;
    return authService.isAuthenticated();
  });

  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [userType, setUserType] = useState<'admin' | 'teacher' | 'student'>(() => {
    const storedUserType = sessionStorage.getItem('app_user_type') as 'admin' | 'teacher' | 'student' | null;
    if (storedUserType) return storedUserType;
    const user = authService.getCurrentUser();
    if (user?.role) {
      const role = user.role.toLowerCase();
      if (['super_admin', 'school_admin', 'admin'].includes(role)) return 'admin';
      if (role === 'teacher') return 'teacher';
      if (role === 'student') return 'student';
    }
    return 'admin';
  });

  const [currentPage, setCurrentPage] = useState(() => {
    const storedPage = sessionStorage.getItem('app_current_page');
    return storedPage || 'dashboard';
  });

  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  // Only restore selectedPortal if we're in the middle of a login flow
  // Otherwise, always start with portal selection
  const [selectedPortal, setSelectedPortal] = useState<string | null>(() => {
    const path = window.location.pathname;
    
    // If we're on school-login or login-success, we're in the middle of admin flow
    if (path.includes('/admin/school-login') || path.includes('/admin/login-success')) {
      const stored = sessionStorage.getItem('app_selected_portal');
      return stored || 'admin'; // Default to admin for these pages
    }
    
    // If we're on dashboard route with school ID, restore portal
    if (path.startsWith('/admin/school/')) {
      const stored = sessionStorage.getItem('app_selected_portal');
      if (stored) return stored;
    }
    
    // Otherwise, start fresh with portal selection
    return null;
  });

  // --- EFFECT: Auth & school ID checks ---
  useEffect(() => {
    if (BYPASS_AUTH) {
      setIsCheckingAuth(false);
      return;
    }

    // Only check auth status, don't auto-redirect
    // Portal selection flow should always be followed
    const authenticated = authService.isAuthenticated();
    
    // Only update state if it changed to prevent infinite loops
    setIsAuthenticated(prev => {
      if (prev !== authenticated) {
        return authenticated;
      }
      return prev;
    });
    setIsCheckingAuth(false);

    // Only update user type if authenticated, but don't redirect
    if (authenticated) {
      const user = authService.getCurrentUser();
      if (user?.role) {
        const role = user.role.toLowerCase();
        let userRole: 'admin' | 'teacher' | 'student' = 'admin';
        if (['super_admin', 'school_admin', 'admin'].includes(role)) userRole = 'admin';
        else if (role === 'teacher') userRole = 'teacher';
        else if (role === 'student') userRole = 'student';
        setUserType(prev => {
          if (prev !== userRole) {
            sessionStorage.setItem('app_user_type', userRole);
            return userRole;
          }
          return prev;
        });
      }
    }

    // Only redirect if we're already on a dashboard route and have school ID
    // Don't redirect during login flow
    const path = location.pathname;
    if (path.includes('/login') || path.includes('/login-success') || path.includes('/school-login')) {
      return;
    }

    // Only redirect to dashboard if:
    // 1. User is authenticated
    // 2. Portal is selected
    // 3. We're not in login flow
    // 4. We have school ID (for admin)
    // 5. We're not already on the correct dashboard route
    if (authenticated && selectedPortal && path.startsWith('/admin/school/')) {
      const storedSchoolId = schoolStorage.getSchoolId();
      const user = authService.getCurrentUser();
      const userSchoolId = user?.schoolId;
      const currentSchoolId = storedSchoolId || userSchoolId;

      if (selectedPortal === 'admin' && currentSchoolId) {
        const expectedPath = `/admin/school/${currentSchoolId}/dashboard`;
        // Only navigate if we're not already on the correct path
        if (path !== expectedPath) {
          if (schoolId && currentSchoolId !== schoolId) {
            navigate(expectedPath, { replace: true });
          } else if (!schoolId && currentSchoolId) {
            navigate(expectedPath, { replace: true });
          }
        }
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [navigate, schoolId, location.pathname, selectedPortal]); // Removed isAuthenticated from dependencies

  // --- Theme effect ---
  useEffect(() => {
    if (theme === 'dark') document.documentElement.classList.add('dark');
    else document.documentElement.classList.remove('dark');
  }, [theme]);

  // Effect to set portal if we're on school-login or login-success pages
  // This must be before any conditional returns (Rules of Hooks)
  useEffect(() => {
    if (!selectedPortal && (location.pathname.includes('/admin/school-login') || location.pathname.includes('/admin/login-success'))) {
      const stored = sessionStorage.getItem('app_selected_portal');
      if (!stored) {
        setSelectedPortal('admin');
        sessionStorage.setItem('app_selected_portal', 'admin');
      }
    }
  }, [location.pathname, selectedPortal]);

  // --- Handlers ---
  const handleThemeToggle = () => setTheme(theme === 'light' ? 'dark' : 'light');
  const handleSwitchUser = (type: 'admin' | 'teacher' | 'student') => {
    setUserType(type);
    setCurrentPage('dashboard');
    sessionStorage.setItem('app_user_type', type);
    sessionStorage.setItem('app_current_page', 'dashboard');
  };
  const handleNavigate = (page: string) => {
    setCurrentPage(page);
    sessionStorage.setItem('app_current_page', page);
  };
  const handleProfileSettings = () => {
    setCurrentPage('profile');
    sessionStorage.setItem('app_current_page', 'profile');
  };
  const handleMenuToggle = () => setSidebarCollapsed(!sidebarCollapsed);
  const handlePortalSelect = (portal: string) => {
    // Clear any existing auth when selecting a new portal
    // This ensures fresh login flow
    setSelectedPortal(portal);
    sessionStorage.setItem('app_selected_portal', portal);
    setIsAuthenticated(false);
    // Clear school ID when starting new portal flow
    schoolStorage.clearSchoolId();
  };
  const handleBackToPortalSelection = () => {
    setSelectedPortal(null);
    sessionStorage.removeItem('app_selected_portal');
    setIsAuthenticated(false);
    schoolStorage.clearSchoolId();
  };

  const handleLoginSuccess = (role: UserRole) => {
    setIsAuthenticated(true);
    const userRole = role as 'admin' | 'teacher' | 'student';
    setUserType(userRole);
    setCurrentPage('dashboard');
    sessionStorage.setItem('app_user_type', userRole);
    sessionStorage.setItem('app_current_page', 'dashboard');

    if (role === 'admin') {
      const schoolId = schoolStorage.getSchoolId();
      const user = authService.getCurrentUser();
      const userSchoolId = user?.schoolId;
      const finalSchoolId = schoolId || userSchoolId;
      if (!finalSchoolId) {
        window.location.href = '/admin/school-login';
        return;
      }
      navigate(`/admin/school/${finalSchoolId}/dashboard`);
    }
  };

  const handleLogout = async () => {
    try {
      await authService.logout({ logoutAllDevices: false });
      setIsAuthenticated(false);
      setCurrentPage('dashboard');
      setSelectedPortal(null);
      sessionStorage.removeItem('app_current_page');
      sessionStorage.removeItem('app_user_type');
      sessionStorage.removeItem('app_selected_portal');
      schoolStorage.clearSchoolId();
      toast.success('Logged out successfully');
    } catch {
      setIsAuthenticated(false);
      setCurrentPage('dashboard');
      setSelectedPortal(null);
      sessionStorage.removeItem('app_current_page');
      sessionStorage.removeItem('app_user_type');
      sessionStorage.removeItem('app_selected_portal');
      schoolStorage.clearSchoolId();
      toast.info('Logged out successfully');
    }
  };

  const getUserInfo = () => {
    const user = authService.getCurrentUser();
    
    if (user) {
      const fullName = `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'User';
      return { 
        name: fullName, 
        email: user.email || 'No email' 
      };
    }
    
    // Fallback to mock data if user not found
    switch (userType) {
      case 'admin': return { name: 'Admin User', email: 'admin@edumanage.com' };
      case 'teacher': return { name: 'Dr. Sarah Mitchell', email: 'sarah.m@school.com' };
      case 'student': return { name: 'Emily Rodriguez', email: 'emily.r@school.com' };
    }
  };

  const renderPage = () => {
    if (userType === 'admin') {
      switch (currentPage) {
        case 'dashboard': return <AdminDashboard />;
        case 'students': return <Students />;
        case 'teachers': return <Teachers />;
        case 'fees': return <FeeManagement />;
        case 'subscriptions': return <Subscriptions />;
        case 'classes': return <Classes />;
        case 'attendance': return <Attendance />;
        case 'communication': return <Communication />;
        case 'examinations': return <Examinations />;
        case 'transport': return <Transport />;
        case 'hostel': return <Hostel />;
        case 'inventory': return <OfficeInventory />;
        case 'analytics': return <Analytics />;
        case 'settings': return <Settings />;
        case 'profile': return <AdminProfile />;
        default: return <AdminDashboard />;
      }
    } else if (userType === 'teacher') {
      switch (currentPage) {
        case 'dashboard': return <TeacherDashboard />;
        case 'classes': return <TeacherClasses />;
        case 'attendance': return <TeacherAttendance />;
        case 'assignments': return <TeacherAssignments />;
        case 'timetable': return <TeacherTimetable />;
        case 'gradebook': return <TeacherGradebook />;
        case 'messages': return <TeacherMessages />;
        case 'profile': return <TeacherProfile />;
        default: return <TeacherDashboard />;
      }
    } else {
      switch (currentPage) {
        case 'dashboard': return <StudentDashboard />;
        case 'timetable': return <StudentTimetable />;
        case 'assignments': return <StudentAssignments />;
        case 'grades': return <StudentGrades />;
        case 'attendance': return <StudentAttendance />;
        case 'fees': return <StudentFees />;
        case 'exams': return <StudentExams />;
        case 'messages': return <StudentMessages />;
        case 'profile': return <StudentProfile />;
        default: return <StudentDashboard />;
      }
    }
  };

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

  if (location.pathname === '/admin/login-success') {
    return (
      <>
        <SchoolLoginSuccessPage />
        <Toaster />
      </>
    );
  }

  if (location.pathname === '/admin/school-login') {
    return (
      <>
        <SchoolLoginPage />
        <Toaster />
      </>
    );
  }

  // Always show portal selection first if not selected
  if (!selectedPortal) {
    return (
      <>
        <PortalSelection onSelectPortal={handlePortalSelect} />
        <Toaster />
      </>
    );
  }

  // If portal is selected, check what to show
  // Flow: Portal Selection → Admin Login → School Login → Login Success → Dashboard
  if (selectedPortal) {
    const storedSchoolId = schoolStorage.getSchoolId();
    const user = authService.getCurrentUser();
    const userSchoolId = user?.schoolId;
    const hasSchoolId = storedSchoolId || userSchoolId;
    
    // If authenticated AND have school ID AND on dashboard route → show dashboard
    // Otherwise → show login page (AuthSystem)
    if (isAuthenticated && hasSchoolId && location.pathname.startsWith('/admin/school/')) {
      // Allow dashboard to show - continue to dashboard rendering below
    } else {
      // Show login page - portal selected but not fully authenticated yet
      return (
        <>
          <AuthSystem
            onLoginSuccess={handleLoginSuccess}
            initialPortal={selectedPortal as UserRole}
            onBackToPortalSelection={handleBackToPortalSelection}
          />
          <Toaster />
        </>
      );
    }
  }

  const userInfo = getUserInfo();

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
            <motion.div key={currentPage} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }} transition={{ duration: 0.2, ease: 'easeInOut' }}>
              {renderPage()}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
      <Toaster />
    </div>
  );
}
