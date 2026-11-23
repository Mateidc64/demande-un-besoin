// Page /cgu : conditions générales d'utilisation et de vente (version de travail).
import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage, ToFill } from "@/components/legal-page";

export const metadata: Metadata = { title: "Conditions générales · Demande à un voisin" };

export default function CguPage() {
  return (
    <LegalPage title="Conditions générales d'utilisation" updated="23 novembre 2026">
      <h2>1. Le service</h2>
      <p>
        Demande à un voisin (« la plateforme ») met en relation des personnes qui cherchent un logement
        (« chercheurs ») et des personnes qui habitent déjà un quartier (« habitants »), pour des échanges
        payants : appel ou visio, balade dans le quartier, visite du soir ou réponse écrite. La plateforme est
        éditée par <ToFill>éditeur, voir les mentions légales</ToFill>.
      </p>

      <h2>2. Compte</h2>
      <p>
        L&apos;inscription est réservée aux personnes majeures. Chacun s&apos;engage à donner des informations
        exactes et à garder ses identifiants confidentiels. Le compte peut être supprimé à tout moment depuis la
        page « Mon compte ».
      </p>

      <h2>3. Les habitants</h2>
      <ul>
        <li>L&apos;habitant doit vivre dans le logement déclaré et le prouver par un justificatif de moins de 3 mois, vérifié par la plateforme.</li>
        <li>Il ne doit pas être l&apos;agent immobilier, le vendeur ou le propriétaire du logement qui intéresse le chercheur.</li>
        <li>Il partage son expérience personnelle, honnêtement, sans promesse sur la valeur d&apos;un bien.</li>
        <li>Il fixe ses prix dans les fourchettes de la plateforme et ses disponibilités, et reste libre d&apos;accepter ou de refuser une demande.</li>
        <li>Il est responsable de la déclaration de ses revenus. La plateforme peut transmettre certaines informations à l&apos;administration fiscale, comme la loi l&apos;exige.</li>
      </ul>

      <h2>4. Réservation et paiement</h2>
      <p>
        Le chercheur paie le prix de l&apos;échange par carte au moment de la demande, via notre prestataire
        Stripe. La plateforme conserve <strong>20 %</strong> du prix (commission) et reverse{" "}
        <strong>80 %</strong> à l&apos;habitant une fois l&apos;échange réalisé : quand le chercheur le confirme,
        ou automatiquement 48 h après le créneau s&apos;il n&apos;a pas signalé de problème.
      </p>

      <h2>5. Annulation et remboursement</h2>
      <ul>
        <li>Si l&apos;habitant refuse la demande, l&apos;annule ou ne se présente pas : remboursement total du chercheur.</li>
        <li>Si le chercheur annule avant que l&apos;habitant ait accepté, ou plus de 24 h avant le créneau : remboursement total.</li>
        <li>Si le chercheur annule moins de 24 h avant le créneau : pas de remboursement, l&apos;habitant est payé.</li>
        <li>En cas de problème signalé, le paiement de l&apos;habitant est suspendu le temps que la plateforme examine la situation.</li>
      </ul>
      <p>
        <ToFill>Droit de rétractation : préciser, avec un professionnel, comment il s&apos;applique à une prestation réalisée à une date choisie par le chercheur.</ToFill>
      </p>

      <h2>6. Avis et signalements</h2>
      <p>
        Après un échange terminé, chacun peut noter l&apos;autre. Les avis doivent être sincères, respectueux et
        ne pas contenir d&apos;informations personnelles. La plateforme peut retirer un avis ou suspendre un
        compte en cas d&apos;abus, de fausse déclaration ou de comportement inapproprié, notamment après un
        signalement.
      </p>

      <h2>7. Responsabilité</h2>
      <p>
        Les informations données par un habitant reflètent son expérience personnelle. Elles ne remplacent ni un
        diagnostic, ni une visite, ni l&apos;avis d&apos;un professionnel. La plateforme n&apos;est pas partie à
        l&apos;achat ou à la location du logement et ne peut être tenue responsable de la décision du chercheur.
      </p>

      <h2>8. Données personnelles</h2>
      <p>
        Voir notre <Link href="/confidentialite">politique de confidentialité</Link>.
      </p>

      <h2>9. Droit applicable</h2>
      <p>
        Ces conditions sont soumises au droit français. En cas de litige, une solution amiable sera recherchée en
        priorité. <ToFill>Médiateur de la consommation à désigner</ToFill>.
      </p>
    </LegalPage>
  );
}
