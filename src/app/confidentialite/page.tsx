// Page /confidentialite : politique de confidentialité (RGPD), version de travail.
import type { Metadata } from "next";
import { LegalPage, ToFill } from "@/components/legal-page";

export const metadata: Metadata = { title: "Confidentialité · Demande à un voisin" };

export default function ConfidentialitePage() {
  return (
    <LegalPage title="Politique de confidentialité" updated="23 novembre 2026">
      <p>
        Le responsable du traitement est <ToFill>éditeur du site</ToFill>, joignable à{" "}
        <ToFill>adresse e-mail de contact</ToFill>. Nous collectons le minimum nécessaire pour faire fonctionner
        le service.
      </p>

      <h2>Les données que nous utilisons</h2>
      <ul>
        <li><strong>Compte</strong> : e-mail, prénom, nom (jamais affiché), photo si tu en ajoutes une.</li>
        <li>
          <strong>Habitants</strong> : adresse (jamais affichée : seul le nom de la rue et une distance
          approximative sont visibles), année d&apos;emménagement, type de logement, description, téléphone ou lien
          de visio (donné seulement au chercheur qui a payé et dont la demande est acceptée).
        </li>
        <li>
          <strong>Justificatif de domicile</strong> : stocké dans un espace privé, visible seulement par
          l&apos;administrateur, et <strong>supprimé dès la décision</strong> de vérification.
        </li>
        <li><strong>Réservations</strong> : offre, créneau, adresse du logement qui t&apos;intéresse, message, montant, statut.</li>
        <li><strong>Avis et signalements</strong> que tu laisses.</li>
        <li>
          <strong>Paiement</strong> : géré par Stripe. Nous ne voyons ni ne stockons tes numéros de carte ni ton
          IBAN.
        </li>
      </ul>

      <h2>Pourquoi</h2>
      <p>
        Pour exécuter le service que tu demandes (mise en relation, réservation, paiement, e-mails de
        confirmation et de rappel), assurer la sécurité (vérification des habitants, signalements) et respecter
        nos obligations légales (comptabilité, obligations fiscales des plateformes).
      </p>

      <h2>Avec qui</h2>
      <ul>
        <li>Supabase (base de données et comptes, hébergée dans l&apos;Union européenne).</li>
        <li>Vercel (hébergement du site).</li>
        <li>Stripe (paiements et versements).</li>
        <li>Resend (envoi des e-mails).</li>
        <li>Géoplateforme de l&apos;IGN (l&apos;adresse que tu tapes est envoyée pour proposer des suggestions).</li>
        <li>OpenStreetMap (affichage de la carte).</li>
      </ul>
      <p>Nous ne vendons aucune donnée et n&apos;affichons pas de publicité.</p>

      <h2>Combien de temps</h2>
      <ul>
        <li>Justificatif de domicile : supprimé dès la décision de vérification.</li>
        <li>Compte : jusqu&apos;à sa suppression par toi.</li>
        <li>Données de paiement et de réservation : <ToFill>durée légale de conservation comptable à confirmer</ToFill>.</li>
      </ul>

      <h2>Cookies</h2>
      <p>
        Nous utilisons seulement les cookies nécessaires pour te garder connecté. Pas de cookie publicitaire ni
        de mesure d&apos;audience.
      </p>

      <h2>Tes droits</h2>
      <p>
        Tu peux accéder à tes données, les corriger, les supprimer (bouton « Supprimer mon compte » dans « Mon
        compte »), t&apos;opposer à un traitement ou demander leur portabilité en écrivant à{" "}
        <ToFill>adresse e-mail de contact</ToFill>. Tu peux aussi saisir la CNIL (cnil.fr).
      </p>
    </LegalPage>
  );
}
