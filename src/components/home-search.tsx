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
          inputClass="w-full rounded-lg border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Quelle adresse vous intéresse ?"
        />
      </div>
      <button
        type="submit"
        disabled={!address}
        className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
      >
        Chercher
      </button>
    </form>
  );
}
