import { useContext } from 'react';
import { AuthContext } from '../AuthContext';
import Button from '../components/Button';

export default function Dashboard() {
  const { user, logout } = useContext(AuthContext);

  if (!user) {
    return (
      <div style={{ maxWidth:420, margin:'40px auto' }}>
        <h2>Nem vagy bejelentkezve</h2>
      </div>
    );
  }

  return (
    <div style={{ maxWidth:480, margin:'40px auto' }}>
      <h1>Üdv, {user.displayName || user.email}!</h1>
      <p>Email: {user.email}</p>
      <p>Felhasználó ID: {user.id}</p>
      <p>Verifikálva: {user.isVerified ? 'Igen' : 'Nem'}</p>
      <Button onClick={logout}>Kijelentkezés</Button>
    </div>
  );
}
