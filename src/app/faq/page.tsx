// Page /faq : questions fréquentes des chercheurs et des habitants.
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = { title: "Questions fréquentes · Demande à un voisin" };

const sections: { title: string; items: { q: string; a: string }[] }[] = [
  {
    title: "Pour les chercheurs",
    items: [
      {
        q: "À quoi sert Demande à un voisin ?",
        a: "Avant d'acheter ou de louer, tu peux parler à quelqu'un qui habite déjà la rue ou l'immeuble : bruit le soir, voisins, copropriété, humidité, ambiance du quartier. Ce que les annonces ne disent pas.",
      },
      {
        q: "Comment sont choisis les habitants ?",
        a: "Chaque habitant envoie un justificatif de domicile de moins de 3 mois, que nous vérifions à la main. Il s'engage aussi à ne pas être l'agent immobilier, le vendeur ou le propriétaire du logement dont tu parles.",
      },
      {
        q: "Combien ça coûte ?",
        a: "Chaque habitant fixe ses prix dans une fourchette. À titre indicatif : environ 20 € l'appel de 15 minutes, 40 € la balade de 45 minutes, 35 € la visite du soir et 8 € la réponse écrite.",
      },
      {
        q: "Comment se passe le paiement ?",
        a: "Tu paies par carte au moment de la réservation, sur la page sécurisée de Stripe. L'argent est gardé jusqu'à l'échange : l'habitant n'est payé qu'une fois l'échange réalisé.",
      },
      {
        q: "Et si l'habitant refuse ou annule ?",
        a: "Tu es remboursé en totalité. Si c'est toi qui annules plus de 24 h avant le rendez-vous (ou avant que l'habitant ait accepté), tu es aussi remboursé. À moins de 24 h, l'habitant est payé.",
      },
      {
        q: "Comment je contacte l'habitant ?",
        a: "Une fois ta réservation payée et acceptée, tu reçois son numéro de téléphone ou son lien de visio, sur le site et par e-mail, avec une liste de questions à poser.",
      },
      {
        q: "Et si l'échange s'est mal passé ?",
        a: "Dans « Mes réservations », clique sur « Signaler un problème » : le paiement de l'habitant est bloqué le temps que nous regardions. Tu peux aussi signaler un profil.",
      },
    ],
  },
  {
    title: "Pour les habitants",
    items: [
      {
        q: "Qui peut devenir habitant ?",
        a: "Toute personne majeure qui vit dans le logement déclaré et peut le prouver avec un justificatif récent (facture d'énergie, quittance, avis de taxe).",
      },
      {
        q: "Mon adresse est-elle affichée ?",
        a: "Non, jamais. Les chercheurs voient seulement le nom de ta rue et une distance approximative. Ton justificatif est supprimé après la vérification.",
      },
      {
        q: "Combien je gagne ?",
        a: "Tu reçois 80 % du prix de chaque échange, la plateforme garde 20 %. Tu choisis tes formats, tes prix et tes créneaux, et tu acceptes seulement les demandes qui te conviennent.",
      },
      {
        q: "Quand suis-je payé ?",
        a: "Quand le chercheur confirme que l'échange a eu lieu, ou automatiquement 48 h après le créneau s'il n'a rien signalé. Le virement passe par Stripe vers ton compte bancaire.",
      },
      {
        q: "Dois-je déclarer ces revenus ?",
        a: "Oui, ce sont des revenus à déclarer. Comme d'autres plateformes, nous pouvons être amenés à transmettre certaines informations à l'administration fiscale.",
      },
    ],
  },
];

export default function FaqPage() {
  return (
    <main className="mx-auto w-full max-w-3xl flex-1 px-6 py-12">
      <h1 className="text-3xl font-extrabold">Questions fréquentes</h1>
      {sections.map((section) => (
        <section key={section.title} className="mt-10">
          <h2 className="text-xl font-extrabold">{section.title}</h2>
          <div className="mt-4 flex flex-col gap-3">
            {section.items.map((item) => (
              <details key={item.q} className="group rounded-2xl border border-brume bg-white p-4">
                <summary className="cursor-pointer list-none font-semibold text-nuit marker:hidden">
                  <span className="mr-2 inline-block text-voisin transition group-open:rotate-90">›</span>
                  {item.q}
                </summary>
                <p className="mt-2 leading-relaxed text-ardoise">{item.a}</p>
              </details>
            ))}
          </div>
        </section>
      ))}
      <p className="mt-10 text-ardoise">
        Une autre question ? Consulte nos <Link href="/cgu" className="text-lien underline">conditions générales</Link>{" "}
        ou notre <Link href="/confidentialite" className="text-lien underline">politique de confidentialité</Link>.
      </p>
    </main>
  );
}
