import { useEffect, useState } from 'react';
import { api } from '../api';
import { useNavigate } from 'react-router-dom';

export default function Verify() {
  const [status, setStatus] = useState('Ellenőrzés folyamatban...');
  const [countdown, setCountdown] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    if (!token) {
      setStatus('Hiányzó token.');
      return;
    }

    async function run() {
      try {
        const res = await api.get(`/auth/verify`, { params: { token } });
        setStatus(res.data.message || 'Email megerősítve!');
        setCountdown(5);

      } catch (err) {
        setStatus(err.response?.data?.error || 'Hiba történt a verifikációnál.');
      }
    }
    run();
  }, []);

  useEffect(() => {
    if (countdown === null) return;
    if (countdown === 0) {
      navigate('/login');
      return;
    }
    const timer = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown, navigate]);

  return (
    <div style={{ maxWidth:480, margin:'40px auto', textAlign:'center' }}>
      <h1>Email megerősítés</h1>
      <p>{status}</p>
      {countdown !== null && (
        <p>Átirányítás a bejelentkezéshez {countdown} másodperc múlva...</p>
      )}
    </div>
  );
}
