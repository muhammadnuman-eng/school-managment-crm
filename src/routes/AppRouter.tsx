import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { LoginPage } from '../components/auth/LoginPage';
import { AdminRegisterPage } from '../components/auth/AdminRegisterPage';
import { SchoolLoginPage } from '../components/auth/SchoolLoginPage';
import { CreateSchoolPage } from '../components/auth/CreateSchoolPage';
import { VerifyOTPPage } from '../components/auth/VerifyOTPPage';
import App from '../App';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route path="/admin/login" element={<LoginPage />} />
        <Route path="/admin/register" element={<AdminRegisterPage />} />
        <Route path="/admin/verify-otp" element={<VerifyOTPPage />} />
        <Route path="/admin/school-login" element={<SchoolLoginPage />} />
        <Route path="/admin/create-school" element={<CreateSchoolPage />} />
        
        {/* Protected Routes - redirect to login if not authenticated */}
        <Route path="/admin/school/:schoolId/dashboard" element={<App />} />
        <Route path="/admin/school/:schoolId/*" element={<App />} />
        
        {/* Default redirect */}
        <Route path="/" element={<Navigate to="/admin/login" replace />} />
        <Route path="*" element={<Navigate to="/admin/login" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

