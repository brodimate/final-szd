import { useState } from 'react';
import { api } from '../api';
import Input from '../components/Input';
import Button from '../components/Button';

export default function ResendVerification() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setStatus(null);

    try {
      const res = await api.post('/auth/resend-verification', { email });
      setStatus(res.data.message);
    } catch (err) {
      setStatus(err.response?.data?.error || 'Hiba történt.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ maxWidth:420, margin:'40px auto' }}>
      <h1>Verifikációs email újraküldése</h1>
      <form onSubmit={onSubmit}>
        <Input
          label="Email cím"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="te@pelda.hu"
        />
        <Button type="submit" disabled={loading}>
          {loading ? 'Küldés...' : 'Email újraküldése'}
        </Button>
      </form>
      {status && <p style={{ marginTop:12 }}>{status}</p>}
    </div>
  );
}
