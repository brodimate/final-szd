import { useEffect, useState, useMemo, useRef } from "react";
import { api } from "../api";
import { useSearch } from "../SearchContext";
import MapPicker from "../components/MapPicker";
import { FiImage } from "react-icons/fi";
import { FaMapMarkedAlt } from "react-icons/fa";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import defaultProfile from "../assets/profile-icon.jpg";
import "./Home.css";

export default function Home() {
  const { filters } = useSearch();
  const [posts, setPosts] = useState([]);
  const [page, setPage] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const loaderRef = useRef(null);
  const [text, setText] = useState("");
  const [animalType, setAnimalType] = useState("");
  const [image, setImage] = useState(null);
  const [coords, setCoords] = useState({ lat: "", lng: "" });
  const [loading, setLoading] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const [preview, setPreview] = useState(null);
  const [viewMapPost, setViewMapPost] = useState(null);

  const animalOptions = ["Kutya", "Macska", "Madar", "Nyúl", "Egyéb"];

  useEffect(() => {
    loadMorePosts();
  }, [page]);

  async function loadMorePosts() {
    setLoadingMore(true);
    try {
      const res = await api.get(`/posts?offset=${page * 20}&limit=20`);
      setPosts((prev) => [...prev, ...res.data]);
    } catch (err) {
      console.error("Nem sikerült betölteni a posztokat", err);
    } finally {
      setLoadingMore(false);
    }
  }

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          setPage((p) => p + 1);
        }
      },
      { threshold: 1 }
    );

    if (loaderRef.current) observer.observe(loaderRef.current);
    return () => {
      if (loaderRef.current) observer.unobserve(loaderRef.current);
    };
  }, []);

  function resetForm() {
    setText("");
    setAnimalType("");
    setImage(null);
    setCoords({ lat: "", lng: "" });
    setPreview(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!animalType || !image || !coords.lat || !coords.lng) {
      alert("Minden mező kötelező!");
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("text", text);
      formData.append("animal_type", animalType.toLowerCase());
      formData.append("latitude", coords.lat);
      formData.append("longitude", coords.lng);
      formData.append("image", image);

      await api.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      resetForm();
      setPosts([]);
      setPage(0);
    } catch (err) {
      console.error("Hiba poszt küldésekor", err);
    } finally {
      setLoading(false);
    }
  }

  function handleImageChange(e) {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setPreview(URL.createObjectURL(file));
    }
  }

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const textMatch =
        !filters.q ||
        p.text?.toLowerCase().includes(filters.q.toLowerCase()) ||
        p.animal_type?.toLowerCase().includes(filters.q.toLowerCase()) ||
        p.display_name?.toLowerCase().includes(filters.q.toLowerCase()) ||
        p.email?.toLowerCase().includes(filters.q.toLowerCase());

      const fromMatch = !filters.from || new Date(p.created_at) >= new Date(filters.from);
      const toMatch = !filters.to || new Date(p.created_at) <= new Date(filters.to);

      return textMatch && fromMatch && toMatch;
    });
  }, [posts, filters]);

  return (
    <div className="home-container">

      <form className="post-form" onSubmit={handleSubmit}>
        <div className="post-input-group">
          <textarea
            placeholder="Írd ide amit szeretnél..."
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={3}
            className="post-textarea"
          />
          {preview && <img src={preview} alt="Feltöltött" className="preview-img" />}
        </div>

        <div className="post-action-row">
          <select
            value={animalType}
            onChange={(e) => setAnimalType(e.target.value)}
            className="action-select"
          >
            <option value="">Válassz állat típust...</option>
            {animalOptions.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>

          <label htmlFor="file-upload" className={`upload-btn ${image ? "active" : ""}`}>
            <FiImage size={20} />
            {image ? "Kép kiválasztva" : "Kép feltöltése"}
          </label>
          <input
            id="file-upload"
            type="file"
            accept="image/*"
            onChange={handleImageChange}
            style={{ display: "none" }}
          />

          <button
            type="button"
            onClick={() => setMapOpen(true)}
            className={`map-btn ${coords.lat ? "active" : ""}`}
          >
            <FaMapMarkedAlt size={20} />
            {coords.lat ? "Hely kiválasztva" : "Térkép megnyitása"}
          </button>
        </div>

        <button type="submit" disabled={loading} className="submit-btn">
          {loading ? "Küldés..." : "Posztolás"}
        </button>
      </form>

      {filteredPosts.length === 0 ? (
        <p className="no-results">Nincs találat a megadott szűrésre.</p>
      ) : (
        filteredPosts.map((p) => (
          <div key={p.id} className="post-card">
            <div className="post-header">
              <img
                src={p.profile_image ? `http://localhost:4000${p.profile_image}` : defaultProfile}
                alt="Profil"
                className="post-profile"
              />
              <div>
                <a href={`/profile/${p.user_id}`} className="post-user">
                  {p.display_name || p.email}
                </a>
                <div className="post-time">{timeAgo(p.created_at)}</div>
              </div>
            </div>

            {p.text && <p className="post-text">{p.text}</p>}
            <p className="post-animal">
              <b>Állat:</b> {p.animal_type}
            </p>
            <img
              src={`http://localhost:4000${p.image_url}`}
              alt="állat"
              className="post-image"
            />

            <button type="button" className="map-view-btn" onClick={() => setViewMapPost(p)}>
              <FaMapMarkedAlt /> Megtekintés térképen
            </button>
          </div>
        ))
      )}

      <div ref={loaderRef} style={{ height: "40px", textAlign: "center" }}>
        {loadingMore && <p>Töltés...</p>}
      </div>

      {mapOpen && (
        <div className="modal">
          <div className="modal-content">
            <MapPicker
              key="map-picker"
              onSelect={(latlng) => setCoords({ lat: latlng.lat, lng: latlng.lng })}
              initial={
                coords.lat && coords.lng
                  ? [coords.lat, coords.lng]
                  : [47.4979, 19.0402]
              }
              selected={coords.lat && coords.lng ? [coords.lat, coords.lng] : null}
            />
            <button className="close-btn" onClick={() => setMapOpen(false)}>✕</button>
          </div>
        </div>
      )}

      {viewMapPost && (
        <div className="modal">
          <div className="modal-content">
            <MapContainer
              center={[viewMapPost.latitude, viewMapPost.longitude]}
              zoom={14}
              style={{ width: "100%", height: "100%" }}
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[viewMapPost.latitude, viewMapPost.longitude]} />
            </MapContainer>
            <button className="close-btn" onClick={() => setViewMapPost(null)}>✕</button>
          </div>
        </div>
      )}

    </div>
  );
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const sec = Math.floor(diff / 1000);
  if (sec < 60) return `${sec} másodperce`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} perce`;
  const h = Math.floor(min / 60);
  if (h < 24) return `${h} órája`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d} napja`;
  const m = Math.floor(d / 30);
  if (m < 12) return `${m} hónapja`;
  const y = Math.floor(m / 12);
  return `${y} éve`;
}
