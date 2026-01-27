import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { LoginSuccess } from './LoginSuccess';
import { authService } from '../../services';
import { schoolStorage } from '../../utils/storage';

export function SchoolLoginSuccessPage() {
  const navigate = useNavigate();
  const [userName, setUserName] = useState('Admin User');

  useEffect(() => {
    // Check if this is a school login success
    const schoolLoginSuccess = sessionStorage.getItem('school_login_success');
    const schoolId = sessionStorage.getItem('school_login_school_id') || schoolStorage.getSchoolId();

    if (!schoolLoginSuccess || !schoolId) {
      // Not a school login success, redirect to school login
      navigate('/admin/school-login');
      return;
    }

    // Get user info
    const user = authService.getCurrentUser();
    const name = user 
      ? `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email?.split('@')[0] || 'Admin User'
      : 'Admin User';
    setUserName(name);
  }, [navigate]);

  const handleComplete = () => {
    const schoolId = sessionStorage.getItem('school_login_school_id') || schoolStorage.getSchoolId();
    if (schoolId) {
      sessionStorage.removeItem('school_login_success');
      sessionStorage.removeItem('school_login_school_id');
      navigate(`/admin/school/${schoolId}/dashboard`);
    } else {
      navigate('/admin/school-login');
    }
  };

  return (
    <LoginSuccess
      userName={userName}
      userRole="admin"
      onComplete={handleComplete}
    />
  );
}
