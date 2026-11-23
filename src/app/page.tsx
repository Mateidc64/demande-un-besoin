import Link from "next/link";
import { HomeSearch } from "@/components/home-search";
import { StreetIllustration } from "@/components/street-illustration";

const steps = [
  "Tu tapes l'adresse du logement qui t'intéresse.",
  "Tu choisis un habitant vérifié et un créneau.",
  "Vous parlez, tu décides en connaissance de cause.",
];

export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center px-4 py-8 sm:px-6 sm:py-12">
      <div className="w-full max-w-2xl">
        <div className="h-48 overflow-hidden rounded-3xl sm:h-64">
          <StreetIllustration />
        </div>

        <h1 className="mt-8 text-3xl font-extrabold leading-tight tracking-tight sm:text-4xl">
          Avant de signer, parle à quelqu&apos;un qui habite déjà là.
        </h1>
        <p className="mt-3 text-lg text-ardoise">
          Bruit le soir, voisins, humidité, ambiance du quartier : des habitants vérifiés te disent
          tout.
        </p>

        <div className="mt-6">
          <HomeSearch />
        </div>
        <p className="mt-2 text-sm text-ardoise">Une adresse précise ou simplement une rue, un quartier.</p>

        <section className="mt-10">
          <h2 className="text-xs font-bold uppercase tracking-wider text-ardoise">Comment ça marche</h2>
          <ol className="mt-4 flex flex-col gap-3">
            {steps.map((step, i) => (
              <li key={step} className="flex items-center gap-3">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-voisin-pale font-extrabold text-action">
                  {i + 1}
                </span>
                {step}
              </li>
            ))}
          </ol>
        </section>

        <div className="mt-10 rounded-2xl bg-nuit p-6 text-white">
          <p className="text-lg font-bold">Tu habites un quartier recherché ?</p>
          <p className="mt-1 text-sm text-brume">
            Partage ce que tu sais et sois rémunéré pour chaque échange.
          </p>
          <Link
            href="/devenir-habitant"
            className="mt-4 inline-block rounded-xl bg-white px-5 py-3 font-bold text-nuit hover:bg-voisin-pale"
          >
            Devenir habitant
          </Link>
        </div>
      </div>
    </main>
  );
}
