import { useEffect, useState, useContext, useMemo } from "react";
import { useParams } from "react-router-dom";
import { api } from "../api";
import { FaTrashAlt, FaMapMarkedAlt } from "react-icons/fa";
import { AuthContext } from "../AuthContext";
import { useSearch } from "../SearchContext";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import defaultProfile from "../assets/profile-icon.jpg";
import "./Profile.css";

export default function Profile() {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const { filters } = useSearch();

  const [profile, setProfile] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState(null);
  const [viewMapPost, setViewMapPost] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [id]);

  async function fetchProfile() {
    try {
      const res = await api.get(`/users/${id}`);
      setProfile(res.data.user);
      setPosts(res.data.posts || []);
    } catch (err) {
      console.error("PROFILE_ERR", err);
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete(postId) {
    if (!window.confirm("Biztosan törölni szeretnéd ezt a posztot?")) return;

    try {
      await api.delete(`/posts/${postId}`);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setMessage("Poszt sikeresen törölve!");
      setMessageType("success");
      setTimeout(() => {
        setMessage("");
        setMessageType(null);
      }, 3000);
    } catch (err) {
      console.error("DELETE_POST_ERR", err);
      setMessage("Hiba történt a poszt törlésekor.");
      setMessageType("error");
      setTimeout(() => {
        setMessage("");
        setMessageType(null);
      }, 3000);
    }
  }

  const filteredPosts = useMemo(() => {
    return posts.filter((p) => {
      const textMatch =
        !filters.q ||
        p.text?.toLowerCase().includes(filters.q.toLowerCase()) ||
        p.animal_type?.toLowerCase().includes(filters.q.toLowerCase());
      const fromMatch =
        !filters.from || new Date(p.created_at) >= new Date(filters.from);
      const toMatch =
        !filters.to || new Date(p.created_at) <= new Date(filters.to);
      return textMatch && fromMatch && toMatch;
    });
  }, [posts, filters]);

  if (loading) return <p>Betöltés...</p>;
  if (!profile) return <p>Felhasználó nem található.</p>;

  return (
    <div className="profile-container">
      {message && (
        <div className={`alert ${messageType === "success" ? "alert-success" : "alert-error"}`}>
          {message}
        </div>
      )}
      <div className="profile-header">
        <img
          src={
            profile.profile_image
              ? `http://localhost:4000${profile.profile_image}`
              : defaultProfile
          }
          alt="Profil"
          className="profile-avatar"
        />
        <h2>{profile.display_name || profile.email}</h2>
        <p className="profile-email">{profile.email}</p>
      </div>
      {filteredPosts.length === 0 ? (
        <p className="no-results">A felhasználónak nincsenek posztjai.</p>
      ) : (
        filteredPosts.map((p) => (
          <div key={p.id} className="post-card">
            <div className="post-top">
              <div className="post-user-info">
                <img
                  src={
                    profile.profile_image
                      ? `http://localhost:4000${profile.profile_image}`
                      : defaultProfile
                  }
                  alt="Profil"
                  className="post-profile"
                />
                <div>
                  <div className="post-username">
                    {profile.display_name || profile.email}
                  </div>
                  <div className="post-time">{timeAgo(p.created_at)}</div>
                </div>
              </div>

              {user?.id === profile.id && (
                <FaTrashAlt
                  size={18}
                  className="delete-icon"
                  title="Poszt törlése"
                  onClick={() => handleDelete(p.id)}
                />
              )}
            </div>

            {p.text && <p className="post-text">{p.text}</p>}
            <p className="post-animal">
              <b>Állat:</b> {p.animal_type}
            </p>

            {p.image_url && (
              <img
                src={`http://localhost:4000${p.image_url}`}
                alt="állat"
                className="post-image"
              />
            )}

            <button
              type="button"
              className="map-view-btn"
              onClick={() => setViewMapPost(p)}
            >
              <FaMapMarkedAlt /> Megtekintés térképen
            </button>
          </div>
        ))
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
            <button className="close-btn" onClick={() => setViewMapPost(null)}>
              ✕
            </button>
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
