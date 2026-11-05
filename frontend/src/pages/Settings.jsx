import { useState, useEffect, useContext } from "react";
import { api } from "../api";
import { AuthContext } from "../AuthContext";
import MapPicker from "../components/MapPicker";
import { Marker } from "react-leaflet";
import "./Settings.css";

export default function Settings() {
  const { login, token } = useContext(AuthContext); // 🔹 login kell a user azonnali frissítéséhez
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [profileImage, setProfileImage] = useState(null);
  const [profileImageUrl, setProfileImageUrl] = useState(null);
  const [coords, setCoords] = useState(null);
  const [distance, setDistance] = useState(10);
  const [animalType, setAnimalType] = useState("");
  const [notify, setNotify] = useState(false);

  const [status, setStatus] = useState(null);
  const [statusType, setStatusType] = useState(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const animalOptions = ["Kutya", "Macska", "Nyúl", "Madár", "Egyéb"];

  useEffect(() => {
    async function fetchData() {
      try {
        const res = await api.get("/auth/me");
        const u = res.data.user;
        setDisplayName(u.display_name || "");
        setEmail(u.email || "");
        setCoords(
          u.latitude && u.longitude
            ? { lat: parseFloat(u.latitude), lng: parseFloat(u.longitude) }
            : null
        );
        setDistance(u.distance_km || 10);
        setAnimalType(u.animal_type || "");
        setNotify(u.notify === 1);
        if (u.profile_image) {
          setProfileImageUrl(`http://localhost:4000${u.profile_image}`);
        }
      } catch (err) {
        console.error("ME_ERR", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    setStatus(null);
    setStatusType(null);

    try {
      const formData = new FormData();
      formData.append("displayName", displayName);
      formData.append("latitude", coords?.lat || "");
      formData.append("longitude", coords?.lng || "");
      formData.append("distance", distance);
      formData.append("animalType", animalType);
      formData.append("notify", notify);
      if (profileImage) formData.append("profileImage", profileImage);

      // 🔹 Backend most már visszaküldi az updated user-t (ahogy előző üzenetben mutattam)
      const res = await api.post("/auth/settings", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      // 🔹 Azonnal frissítjük a Navbarban is megjelenő user adatokat
      if (res.data.user) {
        login(token, res.data.user);
        if (res.data.user.profile_image) {
          setProfileImageUrl(`http://localhost:4000${res.data.user.profile_image}`);
        }
      }

      setStatus("Sikeresen elmentve!");
      setStatusType("success");
    } catch (err) {
      console.error("SETTINGS_SAVE_ERR", err);
      setStatus("Hiba történt a mentés közben.");
      setStatusType("error");
    } finally {
      setSaving(false);
    }
  }

  if (loading) return <p>Betöltés...</p>;

  return (
    <div className="settings-container">
      <form className="settings-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label>Név:</label>
          <input
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            className="input-field"
          />
        </div>

        <div className="form-group">
          <label>Email:</label>
          <input
            type="email"
            value={email}
            disabled
            className="input-field disabled"
          />
        </div>

        <div className="form-group">
          <label>Profilkép:</label>
          {profileImageUrl && (
            <div className="profile-preview">
              <img src={profileImageUrl} alt="Profilkép" />
            </div>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={(e) => setProfileImage(e.target.files[0])}
            className="input-file"
          />
        </div>

        <div className="form-group map-container">
          <label>Hely kiválasztása:</label>
          <div className="map-wrapper">
            <MapPicker
              onSelect={(latlng) => setCoords({ lat: latlng.lat, lng: latlng.lng })}
              initial={coords ? [coords.lat, coords.lng] : [47.4979, 19.0402]}
            >
              {coords && <Marker position={coords}></Marker>}
            </MapPicker>
          </div>
        </div>

        <div className="form-group">
          <label>Távolság: {distance} km</label>
          <input
            type="range"
            min="0"
            max="100"
            value={distance}
            onChange={(e) => setDistance(e.target.value)}
            className="range-input"
          />
        </div>

        <div className="form-group">
          <label>Keresett állat:</label>
          <select
            value={animalType}
            onChange={(e) => setAnimalType(e.target.value)}
            className="select-field"
          >
            <option value="">Válassz...</option>
            {animalOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>

        <div className="form-group checkbox">
          <label>
            <input
              type="checkbox"
              checked={notify}
              onChange={(e) => setNotify(e.target.checked)}
            />
            Értesítést kérek emailben
          </label>
        </div>

        <button type="submit" disabled={saving} className="submit-btn">
          {saving ? "Mentés..." : "Mentés"}
        </button>
      </form>

      {status && (
        <p className={`status-msg ${statusType}`}>{status}</p>
      )}
    </div>
  );
}
