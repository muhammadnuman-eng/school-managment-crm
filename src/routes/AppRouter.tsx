import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from '../App';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Let App component handle all routes including portal selection, login flows, and dashboard */}
        <Route path="/" element={<App />} />
        <Route path="/admin/login" element={<App />} />
        <Route path="/admin/register" element={<App />} />
        <Route path="/admin/verify-otp" element={<App />} />
        <Route path="/admin/school-login" element={<App />} />
        <Route path="/admin/login-success" element={<App />} />
        <Route path="/admin/create-school" element={<App />} />
        <Route path="/admin/school/:schoolId/*" element={<App />} />
        <Route path="*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}

