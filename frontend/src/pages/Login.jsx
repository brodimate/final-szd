import { useState, useContext } from "react";
import Input from "../components/Input";
import Button from "../components/Button";
import { api } from "../api";
import { AuthContext } from "../AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "./Login.css";

export default function Login() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const res = await api.post("/auth/login", form);
      login(res.data.token, res.data.user);
      navigate("/");
    } catch (err) {
      setError(err.response?.data?.error || "Hiba történt a bejelentkezés során.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h1 className="login-title">Bejelentkezés</h1>

        <form onSubmit={onSubmit} className="login-form">
          <Input
            label="Email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="te@pelda.hu"
          />
          <Input
            label="Jelszó"
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="••••••••"
          />
          <Button type="submit" disabled={loading}>
            {loading ? "Beléptetés..." : "Belépek"}
          </Button>
        </form>

        {error && <p className="error-msg">{error}</p>}

        <div className="login-links">
          <p>
            <Link to="/forgot-password">Elfelejtetted a jelszavad?</Link>
          </p>
          <p>
            <Link to="/resend-verification">Nem kaptál megerősítő emailt?</Link>
          </p>
          <p>
            Nincs még fiókod? <Link to="/register">Regisztrálj itt</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
