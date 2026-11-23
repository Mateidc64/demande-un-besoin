// Page /habitant/[id] : le profil public d'un habitant vérifié.
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { OFFERS, WEEKDAYS, residentShare, type OfferType } from "@/lib/offres";
import { createClient } from "@/lib/supabase/server";
import { ReportForm } from "./report-form";

type PublicProfile = {
  resident_id: string;
  profile_id: string;
  first_name: string | null;
  avatar_url: string | null;
  move_in_year: number | null;
  housing_type: string | null;
  bio: string | null;
  street_name: string | null;
  neighborhood: string | null;
  city: string | null;
  average_rating: number | null;
  review_count: number;
};

type Review = { rating: number; comment: string | null; created_at: string; author_first_name: string | null };

const UUID = /^[0-9a-f-]{36}$/i;

async function Profile({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) notFound();

  const supabase = await createClient();
  const { data } = await supabase.rpc("public_resident_profile", { p_resident_id: id });
  const profile = (data as PublicProfile[] | null)?.[0];
  if (!profile) notFound();

  const [{ data: offers }, { data: slots }, { data: reviews }] = await Promise.all([
    supabase.from("offers").select("id, type, price_cents").eq("resident_id", id).eq("active", true).order("price_cents"),
    supabase.from("availabilities").select("weekday, start_time, end_time").eq("resident_id", id).order("weekday").order("start_time"),
    supabase.rpc("reviews_for_profile", { p_profile_id: profile.profile_id }),
  ]);

  const years = profile.move_in_year ? new Date().getFullYear() - profile.move_in_year : null;
  const place = [profile.street_name, profile.neighborhood, profile.city].filter(Boolean).join(", ");

  return (
    <div className="flex flex-col gap-8">
      <header className="flex items-center gap-5">
        {profile.avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={profile.avatar_url} alt="" className="h-24 w-24 rounded-full object-cover" />
        ) : (
          <div className="flex h-24 w-24 items-center justify-center rounded-full bg-emerald-100 text-4xl font-bold text-emerald-700">
            {profile.first_name?.[0]?.toUpperCase() ?? "?"}
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">{profile.first_name}</h1>
          <p className="text-zinc-600 dark:text-zinc-400">{place}</p>
          <p className="text-sm text-zinc-500">
            {years !== null && (years <= 0 ? "Habitant depuis moins d'un an" : `Habitant depuis ${years} an${years > 1 ? "s" : ""}`)}
            {profile.housing_type ? ` · ${profile.housing_type}` : ""}
            {profile.review_count > 0 ? ` · ★ ${profile.average_rating} (${profile.review_count} avis)` : " · Nouveau"}
          </p>
        </div>
      </header>

      <div className="flex flex-wrap gap-2 text-xs">
        <span className="rounded-full bg-emerald-50 px-2.5 py-1 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-200">
          ✓ Domicile vérifié
        </span>
        {years !== null && years >= 5 && (
          <span className="rounded-full bg-zinc-100 px-2.5 py-1 dark:bg-zinc-800">Habitant depuis 5 ans ou plus</span>
        )}
        {profile.review_count >= 3 && (profile.average_rating ?? 0) >= 4.5 && (
          <span className="rounded-full bg-amber-50 px-2.5 py-1 text-amber-800 dark:bg-amber-950 dark:text-amber-200">
            ★ Très bien noté
          </span>
        )}
      </div>

      {profile.bio && <p className="whitespace-pre-line">{profile.bio}</p>}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Ce que {profile.first_name} propose</h2>
        {(offers ?? []).length === 0 ? (
          <p className="text-sm text-zinc-500">Aucune offre pour le moment.</p>
        ) : (
          <ul className="flex flex-col gap-3">
            {(offers ?? []).map((o) => {
              const offer = OFFERS[o.type as OfferType];
              return (
                <li
                  key={o.type}
                  className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800"
                >
                  <div>
                    <p className="font-semibold">{offer.label}</p>
                    <p className="text-sm text-zinc-600 dark:text-zinc-400">{offer.description}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold">{o.price_cents / 100} €</p>
                    <Link
                      href={`/reserver/${o.id}`}
                      className="mt-1 inline-block rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-semibold text-white hover:bg-emerald-700"
                    >
                      Réserver
                    </Link>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        <p className="mt-2 text-xs text-zinc-500">
          Le paiement est bloqué jusqu&apos;à la fin de l&apos;échange. {profile.first_name} reçoit 80 % du prix
          {offers?.[0] ? ` (ex. ${residentShare(offers[0].price_cents / 100)} € sur ${offers[0].price_cents / 100} €)` : ""}.
        </p>
      </section>

      {(slots ?? []).length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Disponibilités habituelles</h2>
          <ul className="grid gap-1 text-sm sm:grid-cols-2">
            {(slots ?? []).map((s, i) => (
              <li key={i}>
                <span className="font-medium">{WEEKDAYS[s.weekday - 1]}</span> de {String(s.start_time).slice(0, 5)} à{" "}
                {String(s.end_time).slice(0, 5)}
              </li>
            ))}
          </ul>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Avis reçus</h2>
        {((reviews ?? []) as Review[]).length === 0 ? (
          <p className="text-sm text-zinc-500">Pas encore d&apos;avis.</p>
        ) : (
          <ul className="flex flex-col gap-4">
            {((reviews ?? []) as Review[]).map((r, i) => (
              <li key={i} className="border-b border-zinc-200 pb-4 dark:border-zinc-800">
                <p className="text-sm">
                  <span className="text-amber-500">{"★".repeat(r.rating)}</span>
                  <span className="text-zinc-300">{"★".repeat(5 - r.rating)}</span> · {r.author_first_name} ·{" "}
                  <span className="text-zinc-500">{new Date(r.created_at).toLocaleDateString("fr-FR")}</span>
                </p>
                {r.comment && <p className="mt-1 text-sm">{r.comment}</p>}
              </li>
            ))}
          </ul>
        )}
      </section>

      <ReportForm targetId={profile.profile_id} />
    </div>
  );
}

export default function HabitantPage({ params }: PageProps<"/habitant/[id]">) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <Suspense fallback={<p className="text-zinc-500">Chargement…</p>}>
        <Profile params={params} />
      </Suspense>
    </main>
  );
}
