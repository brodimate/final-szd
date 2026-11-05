import { useState, useEffect } from 'react';
import { api } from '../api';
import Input from '../components/Input';
import Button from '../components/Button';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [status, setStatus] = useState(null);
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [token, setToken] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const t = params.get('token');
    setToken(t);
  }, []);

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      setStatus('Hiányzó token.');
      return;
    }

    setLoading(true);
    setStatus(null);
    setError(null);
    setFieldErrors({});

    try {
      const res = await api.post('/auth/reset-password', {
        token,
        password,
        confirmPassword
      });
      setStatus(res.data.message);
      setTimeout(() => navigate('/login'), 3000);
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || 'Hiba történt.');
      if (data?.details?.fieldErrors) {
        setFieldErrors(data.details.fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth: 420, margin: '40px auto' }}>
      <h1>Új jelszó beállítása</h1>
      <form onSubmit={onSubmit}>
        <Input
          label="Új jelszó"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="••••••••"
        />
        {fieldErrors.password && (
          <p style={{ color: 'crimson' }}>{fieldErrors.password[0]}</p>
        )}

        <Input
          label="Új jelszó ismét"
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          placeholder="••••••••"
        />
        {fieldErrors.confirmPassword && (
          <p style={{ color: 'crimson' }}>{fieldErrors.confirmPassword[0]}</p>
        )}

        <Button type="submit" disabled={loading}>
          {loading ? 'Mentés...' : 'Jelszó frissítése'}
        </Button>
      </form>

      {error && <p style={{ color: 'crimson', marginTop: 12 }}>{error}</p>}
      {status && <p style={{ color: 'green', marginTop: 12 }}>{status}</p>}
    </div>
  );
}
