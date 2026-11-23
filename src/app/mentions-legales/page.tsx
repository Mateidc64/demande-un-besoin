// Page /mentions-legales : éditeur et hébergeurs du site (obligatoire en France).
import type { Metadata } from "next";
import { LegalPage, ToFill } from "@/components/legal-page";

export const metadata: Metadata = { title: "Mentions légales · Demande à un voisin" };

export default function MentionsLegalesPage() {
  return (
    <LegalPage title="Mentions légales" updated="23 novembre 2026">
      <h2>Éditeur du site</h2>
      <p>
        Le site Demande à un voisin est édité par <ToFill>nom et prénom, ou raison sociale</ToFill>,{" "}
        <ToFill>statut : micro-entreprise, SAS…</ToFill>, immatriculé sous le numéro{" "}
        <ToFill>SIREN / SIRET</ToFill>, dont le siège est situé <ToFill>adresse</ToFill>.
      </p>
      <p>
        Directeur de la publication : <ToFill>nom</ToFill>. Contact : <ToFill>adresse e-mail de contact</ToFill>.
      </p>

      <h2>Hébergement</h2>
      <ul>
        <li>Site : Vercel Inc., 440 N Barranca Ave #4133, Covina, CA 91723, États-Unis (vercel.com).</li>
        <li>
          Base de données, comptes et fichiers : Supabase Inc., données hébergées dans l&apos;Union européenne
          (Irlande) (supabase.com).
        </li>
      </ul>

      <h2>Prestataires</h2>
      <ul>
        <li>Paiements : Stripe Payments Europe, Ltd. (Irlande).</li>
        <li>E-mails : Resend.</li>
        <li>Cartes : © les contributeurs d&apos;OpenStreetMap.</li>
        <li>Recherche d&apos;adresse : Géoplateforme de l&apos;IGN (service public).</li>
      </ul>
    </LegalPage>
  );
}
