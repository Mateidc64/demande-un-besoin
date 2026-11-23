// Page /recherche : habitants vérifiés autour d'une adresse (300 m), même immeuble et même rue d'abord.
import Link from "next/link";
import { Suspense } from "react";
import { OFFER_TYPES, OFFERS, type OfferType } from "@/lib/offres";
import { createClient } from "@/lib/supabase/server";
import { MapLoader } from "./map-loader";

const RADIUS_M = 300;

type Params = {
  adresse?: string;
  lat?: string;
  lng?: string;
  rue?: string;
  immeuble?: string;
  offre?: string;
  prixmax?: string;
  notemin?: string;
};

type ResidentResult = {
  resident_id: string;
  first_name: string | null;
  avatar_url: string | null;
  move_in_year: number | null;
  housing_type: string | null;
  bio: string | null;
  street_name: string | null;
  same_building: boolean;
  same_street: boolean;
  distance_m: number;
  average_rating: number | null;
  review_count: number;
};

type Offer = { resident_id: string; type: OfferType; price_cents: number };

function proximityLabel(r: ResidentResult) {
  if (r.same_building) return "Même immeuble";
  if (r.same_street) return `Même rue · ${r.street_name}`;
  return `${r.street_name ?? "Rue voisine"} · à ~${Math.max(r.distance_m, 50)} m`;
}

async function Results({ searchParams }: { searchParams: Promise<Params> }) {
  const p = await searchParams;
  const lat = Number(p.lat);
  const lng = Number(p.lng);
  if (!p.adresse || !Number.isFinite(lat) || !Number.isFinite(lng)) {
    return (
      <p>
        Aucune adresse choisie.{" "}
        <Link href="/" className="text-emerald-700 underline">
          Faire une recherche
        </Link>
      </p>
    );
  }

  const supabase = await createClient();
  const { data, error } = await supabase.rpc("search_residents", {
    p_lat: lat,
    p_lng: lng,
    p_building_key: p.immeuble ?? null,
    p_street_name: p.rue ?? null,
    p_radius_m: RADIUS_M,
  });
  if (error) return <p className="text-red-600">La recherche a échoué. Réessaie dans un instant.</p>;
  let residents = (data ?? []) as ResidentResult[];

  // Offres actives de ces habitants (visibles par tous, car les habitants sont vérifiés).
  const ids = residents.map((r) => r.resident_id);
  const { data: offerRows } = ids.length
    ? await supabase.from("offers").select("resident_id, type, price_cents").in("resident_id", ids).eq("active", true)
    : { data: [] };
  const offersByResident = new Map<string, Offer[]>();
  for (const o of (offerRows ?? []) as Offer[]) {
    offersByResident.set(o.resident_id, [...(offersByResident.get(o.resident_id) ?? []), o]);
  }

  // Filtres : type d'offre, prix maximum, note minimum.
  const offerFilter = OFFER_TYPES.includes(p.offre as OfferType) ? (p.offre as OfferType) : null;
  const maxPrice = Number(p.prixmax) || null;
  const minRating = Number(p.notemin) || null;
  residents = residents.filter((r) => {
    const offers = (offersByResident.get(r.resident_id) ?? []).filter((o) => !offerFilter || o.type === offerFilter);
    if (offers.length === 0) return false; // un habitant sans offre active n'apparaît pas
    if (maxPrice && !offers.some((o) => o.price_cents <= maxPrice * 100)) return false;
    if (minRating && (r.average_rating ?? 0) < minRating) return false;
    return true;
  });

  const selectClass = "rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <div className="grid gap-6 md:grid-cols-[1fr_1.2fr]">
      <div className="md:sticky md:top-6 md:h-[70vh]">
        <MapLoader lat={lat} lng={lng} radius={RADIUS_M} />
      </div>

      <div className="flex flex-col gap-4">
        {/* Filtres : un simple formulaire qui recharge la page avec les bons paramètres. */}
        <form className="flex flex-wrap items-end gap-2">
          {(["adresse", "lat", "lng", "rue", "immeuble"] as const).map((k) =>
            p[k] ? <input key={k} type="hidden" name={k} value={p[k]} /> : null,
          )}
          <select name="offre" defaultValue={offerFilter ?? ""} className={selectClass}>
            <option value="">Toutes les offres</option>
            {OFFER_TYPES.map((t) => (
              <option key={t} value={t}>
                {OFFERS[t].label}
              </option>
            ))}
          </select>
          <select name="prixmax" defaultValue={maxPrice ?? ""} className={selectClass}>
            <option value="">Tous les prix</option>
            {[10, 20, 30, 40, 60].map((v) => (
              <option key={v} value={v}>
                Jusqu&apos;à {v} €
              </option>
            ))}
          </select>
          <select name="notemin" defaultValue={minRating ?? ""} className={selectClass}>
            <option value="">Toutes les notes</option>
            <option value="4">4 ★ et plus</option>
            <option value="4.5">4,5 ★ et plus</option>
          </select>
          <button className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium dark:border-zinc-700">
            Filtrer
          </button>
        </form>

        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          {residents.length === 0
            ? "Aucun habitant vérifié dans un rayon de 300 m pour l'instant."
            : `${residents.length} habitant${residents.length > 1 ? "s" : ""} vérifié${residents.length > 1 ? "s" : ""} dans un rayon de 300 m`}
        </p>

        {residents.length === 0 && (
          <div className="rounded-xl border border-zinc-200 p-6 text-sm dark:border-zinc-800">
            Nous lançons le service quartier par quartier. Tu habites près d&apos;ici ?{" "}
            <Link href="/devenir-habitant" className="font-medium text-emerald-700 underline">
              Deviens habitant
            </Link>
            .
          </div>
        )}

        <ul className="flex flex-col gap-4">
          {residents.map((r) => {
            const offers = (offersByResident.get(r.resident_id) ?? []).sort((a, b) => a.price_cents - b.price_cents);
            const years = r.move_in_year ? new Date().getFullYear() - r.move_in_year : null;
            return (
              <li key={r.resident_id} className="rounded-xl border border-zinc-200 p-5 dark:border-zinc-800">
                <div className="flex gap-4">
                  {r.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={r.avatar_url} alt="" className="h-14 w-14 rounded-full object-cover" />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-emerald-100 text-xl font-bold text-emerald-700">
                      {r.first_name?.[0]?.toUpperCase() ?? "?"}
                    </div>
                  )}
                  <div className="flex-1">
                    <Link href={`/habitant/${r.resident_id}`} className="font-semibold hover:underline">
                      {r.first_name}
                    </Link>
                    <p className="text-sm text-emerald-700">{proximityLabel(r)}</p>
                    <p className="text-sm text-zinc-500">
                      {years !== null && (years <= 0 ? "Habitant depuis moins d'un an" : `Habitant depuis ${years} an${years > 1 ? "s" : ""}`)}
                      {r.review_count > 0 ? ` · ★ ${r.average_rating} (${r.review_count} avis)` : " · Nouveau"}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-xs">
                  <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
                    ✓ Domicile vérifié
                  </span>
                  {years !== null && years >= 5 && (
                    <span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">Habitant depuis 5 ans ou plus</span>
                  )}
                  {r.review_count >= 3 && (r.average_rating ?? 0) >= 4.5 && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
                      ★ Très bien noté
                    </span>
                  )}
                </div>
                <ul className="mt-3 flex flex-wrap gap-2 text-sm">
                  {offers.map((o) => (
                    <li key={o.type} className="rounded-lg border border-zinc-200 px-3 py-1.5 dark:border-zinc-700">
                      {OFFERS[o.type].label} · <strong>{o.price_cents / 100} €</strong>
                    </li>
                  ))}
                </ul>
                <Link
                  href={`/habitant/${r.resident_id}`}
                  className="mt-3 inline-block text-sm font-medium text-emerald-700 underline"
                >
                  Voir le profil et réserver
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}

async function Title({ searchParams }: { searchParams: Promise<Params> }) {
  const { adresse } = await searchParams;
  return <p className="mb-6 text-zinc-600 dark:text-zinc-400">{adresse ?? ""}</p>;
}

export default function RecherchePage({ searchParams }: PageProps<"/recherche">) {
  const params = searchParams as Promise<Params>;
  return (
    <main className="mx-auto w-full max-w-6xl flex-1 px-6 py-8">
      <h1 className="text-2xl font-bold">Habitants autour de cette adresse</h1>
      <Suspense fallback={null}>
        <Title searchParams={params} />
      </Suspense>
      <Suspense fallback={<p className="text-zinc-500">Recherche en cours…</p>}>
        <Results searchParams={params} />
      </Suspense>
    </main>
  );
}
