import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { SearchProvider } from './SearchContext';

import PublicRoute from './components/PublicRoute';
import ProtectedRoute from './components/ProtectedRoute';

import MainLayout from './layouts/MainLayout';
import AuthLayout from './layouts/AuthLayout';

import Home from './pages/Home';
import Settings from './pages/Settings';
import Profile from './pages/Profile';
import Admin from './pages/Admin';

import Login from './pages/Login';
import Register from './pages/Register';
import Verify from './pages/Verify';
import Verified from './pages/Verified';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import ResendVerification from './pages/ResendVerification';

export default function App() {
  return (
    <BrowserRouter>
      <SearchProvider>
        <Routes>
          <Route element={<PublicRoute />}>
            <Route element={<AuthLayout />}>
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route path="/verify" element={<Verify />} />
              <Route path="/verified" element={<Verified />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route path="/reset" element={<ResetPassword />} />
              <Route path="/resend-verification" element={<ResendVerification />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Route>

          <Route element={<ProtectedRoute />}>
            <Route element={<MainLayout />}>
              <Route index element={<Home />} />          
              <Route path="/settings" element={<Settings />} />
              <Route path="/profile/:id" element={<Profile />} />
              <Route path="/admin" element={<Admin />} />
            </Route>
          </Route>

          <Route path="*" element={<Home />} />
        </Routes>
      </SearchProvider>
    </BrowserRouter>
  );
}
