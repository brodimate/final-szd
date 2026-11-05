import { useState } from "react";
import Input from "../components/Input";
import Button from "../components/Button";
import { api } from "../api";
import { Link } from "react-router-dom";
import "./Register.css";

export default function Register() {
  const [form, setForm] = useState({
    email: "",
    password: "",
    confirmPassword: "",
    displayName: "",
  });
  const [error, setError] = useState(null);
  const [fieldErrors, setFieldErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  const onChange = (e) =>
    setForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));

  const onSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setStatus(null);
    setFieldErrors({});

    try {
      const res = await api.post("/auth/register", form);
      setStatus(
        res.data.message ||
          "Sikeres regisztráció! Nézd meg az emailed a megerősítő linkért."
      );
    } catch (err) {
      const data = err.response?.data;
      setError(data?.error || "Hiba történt a regisztráció során.");
      if (data?.details?.fieldErrors) {
        setFieldErrors(data.details.fieldErrors);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="register-container">
      <div className="register-card">
        <h1 className="register-title">Regisztráció</h1>

        <form onSubmit={onSubmit} className="register-form">
          <Input
            label="Név"
            name="displayName"
            value={form.displayName}
            onChange={onChange}
            placeholder="Pl. Kovács Anna"
          />
          {fieldErrors.displayName && (
            <p className="field-error">{fieldErrors.displayName[0]}</p>
          )}

          <Input
            label="Email"
            type="email"
            name="email"
            value={form.email}
            onChange={onChange}
            placeholder="te@pelda.hu"
          />
          {fieldErrors.email && (
            <p className="field-error">{fieldErrors.email[0]}</p>
          )}

          <Input
            label="Jelszó"
            type="password"
            name="password"
            value={form.password}
            onChange={onChange}
            placeholder="••••••••"
          />
          {fieldErrors.password && (
            <p className="field-error">{fieldErrors.password[0]}</p>
          )}

          <Input
            label="Jelszó ismét"
            type="password"
            name="confirmPassword"
            value={form.confirmPassword}
            onChange={onChange}
            placeholder="••••••••"
          />
          {fieldErrors.confirmPassword && (
            <p className="field-error">{fieldErrors.confirmPassword[0]}</p>
          )}

          <Button type="submit" disabled={loading}>
            {loading ? "Regisztrálás..." : "Regisztráció"}
          </Button>
        </form>

        {error && <p className="error-msg">{error}</p>}
        {status && <p className="success-msg">{status}</p>}

        <div className="register-links">
          <p>
            Már van fiókod? <Link to="/login">Jelentkezz be</Link>
          </p>
        </div>
      </div>
    </div>
  );
}
