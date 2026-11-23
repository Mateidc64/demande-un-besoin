// Page /compte : infos personnelles, mot de passe, déconnexion, suppression du compte.
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../connexion/actions";
import { DeleteAccountForm, PasswordForm, ProfileForm } from "./account-forms";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
      <h2 className="mb-4 text-lg font-semibold">{title}</h2>
      {children}
    </section>
  );
}

async function AccountContent() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getUser();
  const user = data.user;
  if (!user) redirect("/connexion");

  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name, last_name")
    .eq("id", user.id)
    .single();

  // Le mot de passe ne concerne que les comptes créés avec un e-mail (pas avec Google).
  const hasPassword = user.app_metadata.providers?.includes("email") ?? user.app_metadata.provider === "email";

  return (
    <div className="flex flex-col gap-6">
      <p className="text-zinc-600 dark:text-zinc-400">
        Connecté avec <strong>{user.email}</strong>
      </p>

      <Link href="/devenir-habitant" className="font-medium text-emerald-700 underline">
        Devenir habitant (ou voir l&apos;état de ma demande)
      </Link>

      <Section title="Mes informations">
        <ProfileForm firstName={profile?.first_name ?? ""} lastName={profile?.last_name ?? ""} />
      </Section>

      {hasPassword && (
        <Section title="Mot de passe">
          <PasswordForm />
        </Section>
      )}

      <form action={signOut}>
        <button
          type="submit"
          className="rounded-lg border border-zinc-300 px-5 py-2.5 font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Se déconnecter
        </button>
      </form>

      <Section title="Supprimer mon compte">
        <DeleteAccountForm />
      </Section>
    </div>
  );
}

export default function ComptePage() {
  return (
    <main className="mx-auto w-full max-w-xl flex-1 px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Mon compte</h1>
      <Suspense fallback={<p className="text-zinc-500">Chargement…</p>}>
        <AccountContent />
      </Suspense>
    </main>
  );
}
