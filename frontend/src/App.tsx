import { Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom';
import { useState } from 'react';
import LoginPage, { type User } from './pages/LoginPage.tsx';
import HomePage from './pages/HomePage.tsx';
import TranslationWorkspace from './pages/TranslationWorkspace.tsx';
import ForgotPasswordPage from './pages/ForgotPasswordPage.tsx';
import Navbar from './components/Navbar.tsx';

type Page = 'home' | 'translate' | 'integration' | 'about';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();

  const [user, setUser] = useState<User | null>(() => {
    const savedUser = localStorage.getItem('sh_user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const handleAuth = (userData: User, accessToken: string) => {
    setUser(userData);
    localStorage.setItem('sh_token', accessToken);
    localStorage.setItem('sh_user', JSON.stringify(userData));
    navigate('/');
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('sh_token');
    localStorage.removeItem('sh_user');
    navigate('/login');
  };

  const currentPath = location.pathname;
  let activePage: Page = 'home';
  if (currentPath.includes('translate')) activePage = 'translate';
  else if (currentPath.includes('integration')) activePage = 'integration';
  else if (currentPath.includes('about')) activePage = 'about';

  const handleNavigate = (page: Page) => {
    if (page === 'home') navigate('/');
    else navigate(`/${page}`);
  };

  return (
    <div className="min-h-screen" style={{ background: '#f4f4f9' }}>
      
      {/* Global Navbar for authenticated users */}
      {user && location.pathname !== '/login' && (
        <Navbar 
          activePage={activePage}
          onNavigate={handleNavigate}
          onLogout={handleLogout}
          userName={user.name}
        />
      )}

      <Routes>
        <Route
          path="/login"
          element={
            user ? <Navigate to="/" replace /> : <LoginPage onAuth={handleAuth} />
          }
        />
        <Route
          path="/forgot-password"
          element={
            user ? <Navigate to="/" replace /> : <ForgotPasswordPage />
          }
        />
        <Route
          path="/"
          element={
            user ? <HomePage onNavigate={handleNavigate} /> : <Navigate to="/login" replace />
          }
        />
        <Route
          path="/translate"
          element={
            user ? <TranslationWorkspace /> : <Navigate to="/login" replace />
          }
        />
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
