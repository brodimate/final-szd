import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import { useState, useEffect } from "react";

function LocationMarker({ onSelect, selected }) {
  const [position, setPosition] = useState(selected || null);

  useEffect(() => {
    if (selected) setPosition(selected);
  }, [selected]);

  useMapEvents({
    click(e) {
      setPosition(e.latlng);
      onSelect(e.latlng);
    },
  });

  return position ? <Marker position={position} /> : null;
}

function ResizeHandler({ deps = [] }) {
  const map = useMap();
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 300);
    return () => clearTimeout(t);
  }, [map, ...deps]);
  return null;
}

export default function MapPicker({
  onSelect,
  initial,
  forceClass = false,
  selected,
  children,
}) {
  return (
    <MapContainer
      center={initial || [47.4979, 19.0402]}
      zoom={13}
      className={forceClass ? "map-container" : undefined}
      style={forceClass ? undefined : { width: "100%", height: "100%" }}
      whenReady={(map) => setTimeout(() => map.target.invalidateSize(), 300)}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/">OSM</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <LocationMarker onSelect={onSelect} selected={selected} />

      {children}
      <ResizeHandler deps={[initial]} />
    </MapContainer>
  );
}
