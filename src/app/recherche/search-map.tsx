"use client";

// Carte OpenStreetMap : l'adresse recherchée et le cercle de 300 m où l'on cherche des habitants.
// Pour protéger leur vie privée, la position des habitants n'est PAS affichée sur la carte.
import "leaflet/dist/leaflet.css";
import { Circle, CircleMarker, MapContainer, TileLayer, Tooltip } from "react-leaflet";

export default function SearchMap({ lat, lng, radius }: { lat: number; lng: number; radius: number }) {
  return (
    <MapContainer
      center={[lat, lng]}
      zoom={16}
      scrollWheelZoom={false}
      className="h-64 w-full rounded-xl md:h-full md:min-h-96"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <Circle center={[lat, lng]} radius={radius} pathOptions={{ color: "#059669", fillOpacity: 0.08 }} />
      <CircleMarker center={[lat, lng]} radius={8} pathOptions={{ color: "#fff", fillColor: "#059669", fillOpacity: 1 }}>
        <Tooltip>L&apos;adresse recherchée</Tooltip>
      </CircleMarker>
    </MapContainer>
  );
}
