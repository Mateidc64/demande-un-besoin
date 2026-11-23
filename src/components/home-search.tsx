"use client";

// Champ de recherche de l'accueil : on choisit une adresse, puis on va sur la page des résultats.
import { useRouter } from "next/navigation";
import { useState } from "react";
import type { AddressSuggestion } from "@/lib/adresse";
import { AddressField } from "./address-field";

export function searchUrl(a: AddressSuggestion) {
  const params = new URLSearchParams({
    adresse: a.label,
    lat: String(a.lat),
    lng: String(a.lng),
  });
  if (a.street) params.set("rue", a.street);
  // L'identifiant d'immeuble n'a de sens que pour une adresse précise (avec un numéro).
  if (a.type === "housenumber") params.set("immeuble", a.id);
  return `/recherche?${params.toString()}`;
}

export function HomeSearch() {
  const router = useRouter();
  const [address, setAddress] = useState<AddressSuggestion | null>(null);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (address) router.push(searchUrl(address));
      }}
      className="flex flex-col gap-3 sm:flex-row"
    >
      <div className="flex-1 text-left">
        <AddressField
          value={address}
          onChange={(a) => {
            setAddress(a);
            if (a) router.push(searchUrl(a));
          }}
          inputClass="h-13 w-full rounded-xl border border-contour px-4"
          placeholder="Ex. 12 rue des Martyrs, Paris"
        />
      </div>
      <button
        type="submit"
        disabled={!address}
        className="h-13 rounded-xl bg-action px-6 font-bold text-white hover:bg-action-survol disabled:opacity-60"
      >
        Trouver un voisin
      </button>
    </form>
  );
}
