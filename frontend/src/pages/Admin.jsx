import { useEffect, useState, useContext, useMemo } from "react";
import { AuthContext } from "../AuthContext";
import { useSearch } from "../SearchContext";
import { api } from "../api";
import { Navigate } from "react-router-dom";
import { FaMapMarkedAlt, FaTrashAlt, FaImage } from "react-icons/fa";
import { MapContainer, TileLayer, Marker } from "react-leaflet";
import "./Admin.css";

export default function Admin() {
  const { user } = useContext(AuthContext);
  const { filters } = useSearch();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedMap, setSelectedMap] = useState(null);

  if (!user || !user.isAdmin) return <Navigate to="/" replace />;

  useEffect(() => {
    fetchPosts();
  }, []);

  async function fetchPosts() {
    try {
      const res = await api.get("/posts");
      setPosts(res.data);
    } catch (err) {
      console.error("ADMIN_POSTS_ERR", err);
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
    } catch (err) {
      console.error("DELETE_ERR", err);
      setMessage("Hiba történt a törlés során.");
    } finally {
      setTimeout(() => setMessage(""), 3000);
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

  if (loading) return <p className="loading-text">Betöltés...</p>;

  return (
    <div className="admin-container">
      {message && (
        <div className={`admin-alert ${message.includes("sikeresen") ? "success" : "error"}`}>
          {message}
        </div>
      )}

      <div className="admin-table-wrapper">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Felhasználó</th>
              <th>Szöveg</th>
              <th>Állat</th>
              <th>Kép</th>
              <th>Hely</th>
              <th>Dátum</th>
              <th>Művelet</th>
            </tr>
          </thead>
          <tbody>
            {filteredPosts.length === 0 ? (
              <tr>
                <td colSpan="8" className="no-results">
                  Nincs találat a megadott szűrésre.
                </td>
              </tr>
            ) : (
              filteredPosts.map((p) => (
                <tr key={p.id}>
                  <td>{p.id}</td>
                  <td>{p.display_name || p.email}</td>
                  <td className="truncate">{p.text || "-"}</td>
                  <td>{p.animal_type}</td>
                  <td className="center">
                    {p.image_url ? (
                      <FaImage
                        size={20}
                        className="icon-link"
                        onClick={() =>
                          setSelectedImage(`http://localhost:4000${p.image_url}`)
                        }
                      />
                    ) : (
                      "-"
                    )}
                  </td>
                  <td className="center">
                    <FaMapMarkedAlt
                      size={20}
                      className="icon-link"
                      onClick={() => setSelectedMap(p)}
                    />
                  </td>
                  <td>{new Date(p.created_at).toLocaleString()}</td>
                  <td className="center">
                    <FaTrashAlt
                      size={18}
                      className="delete-icon"
                      onClick={() => handleDelete(p.id)}
                    />
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {selectedImage && (
        <div className="modal" onClick={() => setSelectedImage(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedImage(null)}>
              ✕
            </button>
            <img src={selectedImage} alt="Nagyított" className="modal-image" />
          </div>
        </div>
      )}

      {selectedMap && (
        <div className="modal" onClick={() => setSelectedMap(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="close-btn" onClick={() => setSelectedMap(null)}>
              ✕
            </button>
            <MapContainer
              center={[selectedMap.latitude, selectedMap.longitude]}
              zoom={14}
              className="map-frame"
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              <Marker position={[selectedMap.latitude, selectedMap.longitude]} />
            </MapContainer>
          </div>
        </div>
      )}
    </div>
  );
}
