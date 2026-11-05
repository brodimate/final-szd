import { useContext, useMemo, useState, useRef } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../AuthContext";
import { useSearch } from "../SearchContext";
import logoUrl from "../assets/logo.png";
import defaultProfile from "../assets/profile-icon.jpg";
import { IoMdSettings } from "react-icons/io";
import {
  IoLogOutOutline,
  IoSearchOutline,
  IoCalendarOutline,
  IoSearch,
} from "react-icons/io5";
import "./Navbar.css";

export default function Navbar() {
  const { user, logout } = useContext(AuthContext);
  const { filters, setFilters } = useSearch();
  const navigate = useNavigate();
  const location = useLocation();

  const [showSearch, setShowSearch] = useState(false);
  const [showDate, setShowDate] = useState(false);

  const fromRef = useRef(null);
  const toRef = useRef(null);

  const initials = useMemo(() => {
    const name = user?.display_name || user?.displayName || user?.email || "";
    const parts = name.split(" ").filter(Boolean);
    if (parts.length === 0) return (name[0] || "?").toUpperCase();
    return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
  }, [user]);

  const onSearch = (e) => e.preventDefault();

  const handleLogoClick = () => {
    if (location.pathname === "/") window.location.reload();
    else navigate("/");
  };

  const handleProfileClick = () => {
    if (!user) return;
    const profilePath = `/profile/${user.id}`;
    if (location.pathname === profilePath) window.location.reload();
    else navigate(profilePath);
  };

  const handleSettingsClick = () => {
    if (location.pathname === "/settings") window.location.reload();
    else navigate("/settings");
  };

  const profileImage = user?.profile_image
    ? `http://localhost:4000${user.profile_image}`
    : defaultProfile;

  const displayName =
    user?.display_name || user?.displayName || user?.email || "Ismeretlen";

  return (
    <nav className="navbar">
      <div onClick={handleLogoClick} className="nav-left" title="Vissza a főoldalra">
        <img src={logoUrl} alt="EHÁK" className="logo" />
        <span className="brand">EHÁK</span>
      </div>

      <form className="nav-center" onSubmit={onSearch}>
        <div className="search-wrapper">
          <IoSearch className="search-icon" />
          <input
            type="text"
            placeholder="Keresés..."
            value={filters.q}
            onChange={(e) => setFilters({ ...filters, q: e.target.value })}
            className="search"
          />
        </div>

        <div className="date-icons">
          <button
            type="button"
            className={`icon-btn ${filters.from ? "active" : ""}`}
            title="Kezdő dátum"
            onClick={() => fromRef.current.showPicker()}
          >
            <IoCalendarOutline size={20} />
          </button>
          <span className="dash">–</span>
          <button
            type="button"
            className={`icon-btn ${filters.to ? "active" : ""}`}
            title="Vég dátum"
            onClick={() => toRef.current.showPicker()}
          >
            <IoCalendarOutline size={20} />
          </button>

          <input
            ref={fromRef}
            type="date"
            value={filters.from}
            onChange={(e) => setFilters({ ...filters, from: e.target.value })}
            className="hidden-date"
          />
          <input
            ref={toRef}
            type="date"
            value={filters.to}
            onChange={(e) => setFilters({ ...filters, to: e.target.value })}
            className="hidden-date"
          />
        </div>

      </form>

      <div className="nav-mobile">
        <button
          className={`icon-btn ${showSearch ? "active" : ""}`}
          onClick={() => setShowSearch(!showSearch)}
          title="Keresés"
        >
          <IoSearchOutline size={20} />
        </button>
        <button
          className={`icon-btn ${(filters.from || filters.to) ? "active" : ""}`}
          onClick={() => setShowDate(!showDate)}
          title="Dátum"
        >
          <IoCalendarOutline size={20} />
        </button>
      </div>

      {user && (
        <div className="nav-right">
          <div className="profile" onClick={handleProfileClick} title="Saját profil">
            <img src={profileImage} alt="Profilkép" />
            <span>{displayName}</span>
          </div>
          <button onClick={handleSettingsClick} className="icon-btn" title="Beállítások">
            <IoMdSettings size={20} />
          </button>
          <button onClick={logout} className="icon-btn" title="Kijelentkezés">
            <IoLogOutOutline size={20} />
          </button>
        </div>
      )}

      {showSearch && (
        <div className="dropdown">
          <div className="search-wrapper">
            <IoSearch className="search-icon" />
            <input
              type="text"
              placeholder="Keresés..."
              value={filters.q}
              onChange={(e) => setFilters({ ...filters, q: e.target.value })}
              className="search"
            />
          </div>
        </div>
      )}

      {showDate && (
        <div className="dropdown date-mobile">
          <button
            type="button"
            className={`icon-btn ${filters.from ? "active" : ""}`}
            onClick={() => fromRef.current.showPicker()}
            title="Kezdő dátum"
          >
            <IoCalendarOutline size={22} />
          </button>
          <span>–</span>
          <button
            type="button"
            className={`icon-btn ${filters.to ? "active" : ""}`}
            onClick={() => toRef.current.showPicker()}
            title="Vég dátum"
          >
            <IoCalendarOutline size={22} />
          </button>
        </div>
      )}
    </nav>
  );
}
