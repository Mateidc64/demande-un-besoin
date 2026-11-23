// Page /admin : réservée à l'admin. Liste les demandes d'habitants à vérifier.
import { notFound, redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { reviewResident } from "./actions";

type PendingResident = {
  resident_id: string;
  first_name: string | null;
  last_name: string | null;
  email: string;
  address_label: string;
  move_in_year: number | null;
  housing_type: string | null;
  bio: string | null;
  contact_info: string | null;
  submitted_at: string;
  proof_path: string | null;
};

async function AdminContent() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/connexion");

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", auth.user.id).single();
  // Pour les non-admins, la page « n'existe pas ».
  if (!profile?.is_admin) notFound();

  const { data, error } = await supabase.rpc("admin_pending_residents");
  if (error) return <p className="text-red-600">Erreur de chargement : {error.message}</p>;
  const pending = (data ?? []) as PendingResident[];

  // Liens temporaires (10 minutes) pour ouvrir les justificatifs privés.
  const links = new Map<string, string>();
  for (const r of pending) {
    if (!r.proof_path) continue;
    const { data: signed } = await supabase.storage.from("justificatifs").createSignedUrl(r.proof_path, 600);
    if (signed) links.set(r.resident_id, signed.signedUrl);
  }

  if (pending.length === 0) {
    return <p className="text-zinc-600 dark:text-zinc-400">Aucune demande en attente. 🎉</p>;
  }

  return (
    <ul className="flex flex-col gap-6">
      {pending.map((r) => (
        <li key={r.resident_id} className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
          <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">
              {r.first_name} {r.last_name}
            </h2>
            <span className="text-sm text-zinc-500">
              Envoyée le {new Date(r.submitted_at).toLocaleDateString("fr-FR")}
            </span>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-zinc-500">Adresse</dt>
            <dd className="font-medium">{r.address_label}</dd>
            <dt className="text-zinc-500">E-mail</dt>
            <dd>{r.email}</dd>
            <dt className="text-zinc-500">Téléphone</dt>
            <dd>{r.contact_info}</dd>
            <dt className="text-zinc-500">Emménagement</dt>
            <dd>
              {r.move_in_year} · {r.housing_type}
            </dd>
          </dl>
          <p className="mt-3 whitespace-pre-line text-sm text-zinc-700 dark:text-zinc-300">{r.bio}</p>

          {links.get(r.resident_id) ? (
            <a
              href={links.get(r.resident_id)}
              target="_blank"
              rel="noreferrer"
              className="mt-4 inline-block font-medium text-emerald-700 underline"
            >
              Ouvrir le justificatif ↗
            </a>
          ) : (
            <p className="mt-4 text-sm text-red-600">Justificatif introuvable.</p>
          )}

          <p className="mt-3 text-xs text-zinc-500">
            À vérifier : nom identique, même adresse, document de moins de 3 mois.
          </p>

          <form action={reviewResident} className="mt-4 flex flex-col gap-3">
            <input type="hidden" name="resident_id" value={r.resident_id} />
            <input type="hidden" name="proof_path" value={r.proof_path ?? ""} />
            <input
              name="note"
              placeholder="Note (facultative, ex. motif du refus)"
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            />
            <div className="flex gap-3">
              <button
                name="decision"
                value="valider"
                className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
              >
                Valider
              </button>
              <button
                name="decision"
                value="refuser"
                className="rounded-lg border border-red-300 px-5 py-2.5 font-semibold text-red-700 hover:bg-red-50 dark:border-red-800 dark:hover:bg-red-950"
              >
                Refuser
              </button>
            </div>
          </form>
        </li>
      ))}
    </ul>
  );
}

export default function AdminPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="mb-2 text-2xl font-bold">Admin : habitants à vérifier</h1>
      <p className="mb-8 text-zinc-600 dark:text-zinc-400">
        Le justificatif est supprimé automatiquement après ta décision.
      </p>
      <Suspense fallback={<p className="text-zinc-500">Chargement…</p>}>
        <AdminContent />
      </Suspense>
    </main>
  );
}
