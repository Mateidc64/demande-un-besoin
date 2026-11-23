// Mise en page commune des pages légales (CGU, confidentialité, mentions légales).
// Les passages entre crochets sont à compléter par MATEI ; le bandeau rappelle de faire relire le texte.
import type { ReactNode } from "react";

export function LegalPage({ title, updated, children }: { title: string; updated: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-extrabold">{title}</h1>
      <p className="mt-1 text-sm text-ardoise">Dernière mise à jour : {updated}</p>
      <p className="mt-6 rounded-xl bg-voisin-pale p-4 text-sm text-encre">
        Version de travail : ce texte doit être complété et relu par un professionnel du droit avant le
        lancement public du service.
      </p>
      <div className="legal mt-8 flex flex-col gap-4 leading-relaxed text-encre [&_h2]:mt-6 [&_h2]:text-xl [&_h2]:font-extrabold [&_li]:ml-5 [&_li]:list-disc [&_a]:text-lien [&_a]:underline">
        {children}
      </div>
    </main>
  );
}

// Un passage à compléter (surligné pour qu'on ne l'oublie pas).
export function ToFill({ children }: { children: ReactNode }) {
  return <mark className="rounded bg-peche px-1 text-encre">[{children}]</mark>;
}
