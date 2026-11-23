// Page /connexion : se connecter ou créer un compte.
import { Suspense } from "react";
import { AuthForm } from "./auth-form";

async function AuthFormWithError({ searchParams }: { searchParams: Promise<{ erreur?: string }> }) {
  const { erreur } = await searchParams;
  return <AuthForm initialError={erreur} />;
}

export default function ConnexionPage({ searchParams }: PageProps<"/connexion">) {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <h1 className="mb-8 text-2xl font-bold">Bienvenue</h1>
      <Suspense fallback={<AuthForm />}>
        <AuthFormWithError searchParams={searchParams as Promise<{ erreur?: string }>} />
      </Suspense>
    </main>
  );
}
