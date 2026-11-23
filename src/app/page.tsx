import { HomeSearch } from "@/components/home-search";
import { RecruitResidents } from "@/components/recruit-residents";
import { StreetIllustration } from "@/components/street-illustration";

// « Comment ça marche » en 3 étapes, avec un petit dessin au trait pour chacune.
const steps = [
  {
    title: "Je cherche un quartier",
    text: "Tape l'adresse du logement qui t'intéresse. Tu vois les habitants vérifiés à moins de 300 m, ceux du même immeuble et de la même rue en premier.",
    icon: (
      <>
        <circle cx="11" cy="11" r="6" />
        <path d="M15.5 15.5 L20 20" />
      </>
    ),
  },
  {
    title: "Je réserve un habitant",
    text: "Choisis un appel, une balade ou une visite du soir, puis un créneau. Tu paies en ligne : si l'habitant refuse ou annule, tu es remboursé.",
    icon: (
      <>
        <rect x="4" y="5" width="16" height="15" rx="2" />
        <path d="M4 10 H20 M9 3 V7 M15 3 V7" />
        <path d="M9 15 L11 17 L15 13" />
      </>
    ),
  },
  {
    title: "On échange",
    text: "Tu poses toutes tes questions : bruit, voisins, copropriété, humidité. Tu décides en connaissance de cause, puis tu laisses un avis.",
    icon: (
      <>
        <path d="M3 6 H14 V13 H8 L5 16 V13 H3 Z" />
        <path d="M17 9 H21 V16 H19 V19 L16 16 H11 V15" />
      </>
    ),
  },
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

        <div id="recherche" className="mt-6 scroll-mt-24">
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

      <section id="comment-ca-marche" className="mt-16 w-full max-w-5xl" aria-labelledby="comment-titre">
        <h2 id="comment-titre" className="text-center text-2xl font-extrabold sm:text-3xl">
          Comment ça marche
        </h2>
        <p className="mt-2 text-center text-ardoise">Trois étapes, quelques minutes.</p>
        <ol className="mt-8 grid gap-6 sm:grid-cols-3">
          {steps.map((step, i) => (
            <li key={step.title} className="relative rounded-2xl border border-brume bg-white p-6">
              <span className="absolute -top-4 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-action text-sm font-extrabold text-white">
                {i + 1}
              </span>
              <svg
                width="36"
                height="36"
                viewBox="0 0 24 24"
                fill="none"
                stroke="#F26A21"
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
                className="mt-2"
              >
                {step.icon}
              </svg>
              <h3 className="mt-3 text-lg font-extrabold">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ardoise">{step.text}</p>
            </li>
          ))}
        </ol>
        <div className="mt-8 text-center">
          <a
            href="#recherche"
            className="inline-block rounded-xl bg-action px-6 py-3 font-bold text-white hover:bg-action-survol"
          >
            Trouver un habitant près d&apos;une adresse
          </a>
        </div>
      </section>

      <RecruitResidents />
    </main>
  );
}
