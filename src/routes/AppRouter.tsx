import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from '../App';

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        {/* All routes go through App component which handles portal selection first */}
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  );
}

