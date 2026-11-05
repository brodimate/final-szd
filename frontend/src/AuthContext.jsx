import { createContext, useState, useEffect } from "react";
import { api } from "./api";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const saved = localStorage.getItem("auth");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        if (parsed.token) {
          setToken(parsed.token);
          setUser(parsed.user || null);
          api.defaults.headers.common["Authorization"] = `Bearer ${parsed.token}`;
        }
      } catch (err) {
        console.error("Hibás auth a localStorage-ban", err);
        localStorage.removeItem("auth");
      }
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    setToken(token);
    setUser(userData);
    localStorage.setItem("auth", JSON.stringify({ token, user: userData }));
    api.defaults.headers.common["Authorization"] = `Bearer ${token}`;
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("auth");
    delete api.defaults.headers.common["Authorization"];
  };

  const refreshUser = async () => {
    try {
      const res = await api.get("/auth/me");
      setUser(res.data.user);
      localStorage.setItem(
        "auth",
        JSON.stringify({ token, user: res.data.user })
      );
    } catch (err) {
      console.error("REFRESH_USER_ERR", err);
    }
  };

  return (
    <AuthContext.Provider value={{ user, token, login, logout, refreshUser, loading }}>
      {children}
    </AuthContext.Provider>
  );
}
