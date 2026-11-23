// Bloc de l'accueil pour recruter des habitants : ce qu'on gagne, comment ça se passe, et nos garanties.
// Les montants viennent de src/lib/offres.ts (prix conseillé moins la commission de 20 %).
import Link from "next/link";
import { OFFERS, OFFER_TYPES, residentShare } from "@/lib/offres";

const euros = (n: number) => n.toLocaleString("fr-FR", { minimumFractionDigits: n % 1 ? 2 : 0 }) + " €";

const steps = [
  "Tu crées ton profil et envoies un justificatif de domicile (moins de 3 mois).",
  "Nous vérifions ton adresse à la main, puis ton profil devient visible.",
  "Tu choisis tes formats, tes prix et tes créneaux. Tu acceptes seulement les demandes qui te vont.",
];

const promises = [
  "Ton adresse exacte n'est jamais affichée : seulement le nom de ta rue.",
  "Ton numéro n'est donné qu'après paiement, à la personne qui t'a réservé.",
  "Paiement sécurisé par Stripe, versé sur ton compte après l'échange.",
];

export function RecruitResidents() {
  return (
    <section
      id="devenir-habitant"
      aria-labelledby="recrutement-titre"
      className="mt-16 w-full max-w-5xl overflow-hidden rounded-3xl bg-nuit text-white"
    >
      <div className="grid gap-10 p-6 sm:p-10 md:grid-cols-2">
        <div>
          <p className="text-sm font-bold uppercase tracking-wider text-voisin">Tu habites un quartier recherché ?</p>
          <h2 id="recrutement-titre" className="mt-2 text-2xl font-extrabold text-white sm:text-3xl">
            Gagne de l&apos;argent en parlant de ton quartier
          </h2>
          <p className="mt-3 text-brume">
            Des futurs voisins se posent des questions que les annonces ne règlent pas. Tu as les réponses :
            partage-les, à ton rythme, et sois payé pour chaque échange.
          </p>

          <ol className="mt-6 flex flex-col gap-3">
            {steps.map((step, i) => (
              <li key={step} className="flex gap-3 text-sm">
                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-voisin font-extrabold text-white">
                  {i + 1}
                </span>
                <span className="pt-1">{step}</span>
              </li>
            ))}
          </ol>

          <Link
            href="/espace-habitant"
            className="mt-8 inline-block rounded-xl bg-action px-6 py-3 font-bold text-white hover:bg-action-survol"
          >
            Devenir habitant
          </Link>
        </div>

        <div className="flex flex-col gap-6">
          <div className="rounded-2xl bg-white p-5 text-encre">
            <p className="font-bold text-nuit">Ce que tu gagnes par échange</p>
            <p className="text-xs text-ardoise">Aux prix conseillés, après la commission de 20 %. Tu fixes tes prix.</p>
            <ul className="mt-3 divide-y divide-brume">
              {OFFER_TYPES.map((type) => (
                <li key={type} className="flex items-center justify-between py-2 text-sm">
                  <span>{OFFERS[type].label}</span>
                  <span className="font-extrabold text-verifie">{euros(residentShare(OFFERS[type].defaultPrice))}</span>
                </li>
              ))}
            </ul>
          </div>
          <ul className="flex flex-col gap-2 text-sm text-brume">
            {promises.map((p) => (
              <li key={p} className="flex gap-2">
                <span aria-hidden="true" className="text-voisin">✓</span>
                {p}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
