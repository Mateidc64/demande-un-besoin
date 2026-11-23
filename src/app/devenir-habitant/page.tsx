// Page /devenir-habitant : formulaire en étapes, ou état de la demande si elle est déjà envoyée.
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { ResidentForm } from "./resident-form";

const STATUS_TEXT = {
  en_attente: {
    title: "Ta demande est en cours de vérification ⏳",
    text: "Nous vérifions ton justificatif de domicile, en général sous 48 h. Ton profil sera visible par les chercheurs dès qu'il sera validé.",
  },
  verifie: {
    title: "Ton domicile est vérifié ✅",
    text: "Bravo, tu fais partie des habitants vérifiés ! Choisis maintenant tes offres, tes prix et tes disponibilités.",
  },
  refuse: {
    title: "Ta demande n'a pas pu être validée",
    text: "Ton justificatif n'a pas pu être accepté. Écris-nous pour en envoyer un nouveau.",
  },
} as const;

async function Content() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;

  if (!user) {
    return (
      <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <p className="mb-4">Pour devenir habitant, connecte-toi ou crée un compte d&apos;abord.</p>
        <Link href="/connexion" className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white">
          Se connecter
        </Link>
      </div>
    );
  }

  const { data: resident } = await supabase
    .from("residents")
    .select("verification_status, street_name, city")
    .eq("profile_id", user.id)
    .maybeSingle();

  if (resident) {
    const status = STATUS_TEXT[resident.verification_status as keyof typeof STATUS_TEXT];
    return (
      <div className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
        <h2 className="mb-2 text-lg font-semibold">{status.title}</h2>
        <p className="text-zinc-600 dark:text-zinc-400">{status.text}</p>
        <p className="mt-4 text-sm text-zinc-500">
          Adresse déclarée : {resident.street_name}, {resident.city}
        </p>
        <Link
          href="/mes-offres"
          className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
        >
          Mes offres et disponibilités
        </Link>
      </div>
    );
  }

  const { data: profile } = await supabase.from("profiles").select("first_name").eq("id", user.id).single();
  return <ResidentForm userId={user.id} defaultFirstName={profile?.first_name ?? ""} />;
}

export default function DevenirHabitantPage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <h1 className="mb-2 text-2xl font-bold">Devenir habitant</h1>
      <p className="mb-8 text-zinc-600 dark:text-zinc-400">
        Partage ce que tu sais de ton quartier et sois rémunéré pour chaque échange.
      </p>
      <Suspense fallback={<p className="text-zinc-500">Chargement…</p>}>
        <Content />
      </Suspense>
    </main>
  );
}
