import { useContext } from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { AuthContext } from '../AuthContext';

export default function PublicRoute() {
  const { user, loading } = useContext(AuthContext);
  if (loading) return <div style={{ padding:16 }}>Betöltés...</div>;
  if (user) return <Navigate to="/" replace />;
  return <Outlet />;
}
