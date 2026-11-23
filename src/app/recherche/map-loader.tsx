"use client";

// Leaflet ne fonctionne que dans le navigateur : on charge la carte seulement côté navigateur.
import dynamic from "next/dynamic";

const SearchMap = dynamic(() => import("./search-map"), {
  ssr: false,
  loading: () => <div className="h-64 w-full animate-pulse rounded-xl bg-zinc-100 md:h-full dark:bg-zinc-800" />,
});

export function MapLoader(props: { lat: number; lng: number; radius: number }) {
  return <SearchMap {...props} />;
}
