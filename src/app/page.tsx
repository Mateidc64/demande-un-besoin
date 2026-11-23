import Link from "next/link";
import { HomeSearch } from "@/components/home-search";
import { StreetIllustration } from "@/components/street-illustration";

const steps = [
  "Tu tapes l'adresse du logement qui t'intéresse.",
  "Tu choisis un habitant vérifié et un créneau.",
  "Vous parlez, tu décides en connaissance de cause.",
];

// Les 3 colonnes « pourquoi Demande à un voisin » : le problème du chercheur et notre solution.
// Chaque icône est un petit dessin au trait (SVG), aux couleurs de la charte.
const reasons = [
  {
    title: "Connais le quartier avant de signer",
    text: "Une annonce ne dit rien du bruit le soir, de l'ambiance de la copro ou de l'humidité. Avant d'engager des années de loyer ou de crédit, renseigne-toi auprès de ceux qui vivent là.",
    icon: (
      <>
        <path d="M4 11 L12 4 L20 11 V20 H4 Z" />
        <circle cx="12" cy="14" r="2.5" />
        <path d="M14 16 L16.5 18.5" />
      </>
    ),
  },
  {
    title: "Parle à un vrai habitant",
    text: "Pas un agent, pas le vendeur : un voisin du même immeuble ou de la même rue, qui te raconte le quotidien, le bon comme le moins bon. Au téléphone, en balade ou lors d'une visite du soir.",
    icon: (
      <>
        <path d="M4 5 H20 V16 H10 L6 20 V16 H4 Z" />
        <path d="M8 10.5 H8.01 M12 10.5 H12.01 M16 10.5 H16.01" />
      </>
    ),
  },
  {
    title: "Réserve en toute confiance",
    text: "Nous vérifions le domicile de chaque habitant avec un justificatif. Le paiement est sécurisé, et tu es remboursé si l'habitant annule.",
    icon: (
      <>
        <path d="M12 3 L19 6 V11 C19 15.5 16 19 12 21 C8 19 5 15.5 5 11 V6 Z" />
        <path d="M9 12 L11 14 L15 10" />
      </>
    ),
  },
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
      </div>

      <section className="mt-14 w-full max-w-5xl" aria-label="Pourquoi Demande à un voisin">
        <div className="grid gap-10 sm:grid-cols-3 sm:gap-8">
          {reasons.map((r) => (
            <div key={r.title}>
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-voisin-pale">
                <svg
                  width="30"
                  height="30"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="#15364F"
                  strokeWidth="1.8"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  aria-hidden="true"
                >
                  {r.icon}
                </svg>
              </span>
              <h2 className="mt-4 text-xl font-extrabold">{r.title}</h2>
              <p className="mt-2 leading-relaxed text-ardoise">{r.text}</p>
            </div>
          ))}
        </div>
      </section>

      <div className="mt-14 w-full max-w-2xl">
        <section>
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
