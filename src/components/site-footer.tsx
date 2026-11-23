// Pied de page : FAQ et pages légales, sur toutes les pages.
import Link from "next/link";

const links = [
  { href: "/faq", label: "Questions fréquentes" },
  { href: "/cgu", label: "Conditions générales" },
  { href: "/confidentialite", label: "Confidentialité" },
  { href: "/mentions-legales", label: "Mentions légales" },
];

export function SiteFooter() {
  return (
    <footer className="mt-16 border-t border-brume px-6 py-8 text-sm text-ardoise">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <p>
          <span className="font-bold text-nuit">Demande à un voisin</span> · Avant de signer, parle à quelqu&apos;un
          qui habite déjà là.
        </p>
        <nav aria-label="Liens utiles" className="flex flex-wrap gap-x-5 gap-y-2">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="hover:text-nuit hover:underline">
              {l.label}
            </Link>
          ))}
        </nav>
      </div>
    </footer>
  );
}
