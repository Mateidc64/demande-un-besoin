// Page /compte : infos personnelles, mot de passe, déconnexion, suppression du compte.
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "../connexion/actions";
import { DeleteAccountForm, PasswordForm, ProfileForm } from "./account-forms";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-2xl border bg-white border-brume p-6">
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
    .select("first_name, last_name, is_admin")
    .eq("id", user.id)
    .single();

  // Le mot de passe ne concerne que les comptes créés avec un e-mail (pas avec Google).
  const hasPassword = user.app_metadata.providers?.includes("email") ?? user.app_metadata.provider === "email";

  return (
    <div className="flex flex-col gap-6">
      <p className="text-ardoise">
        Connecté avec <strong>{user.email}</strong>
      </p>

      {profile?.is_admin && (
        <Link href="/admin" className="font-medium text-lien underline">
          Espace admin : habitants à vérifier
        </Link>
      )}

      <Link href="/devenir-habitant" className="font-medium text-lien underline">
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
          className="rounded-xl border border-contour px-5 py-2.5 font-semibold hover:bg-creme"
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
      <Suspense fallback={<p className="text-ardoise">Chargement…</p>}>
        <AccountContent />
      </Suspense>
    </main>
  );
}
