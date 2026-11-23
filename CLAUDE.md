# Demande à un voisin — cahier des charges V1

Ce fichier est le cahier des charges du projet. Claude le relit à chaque session : il sert de boussole.
Toute décision importante prise en cours de route doit être reportée ici.

## 0. Règles de travail avec Claude (à respecter en priorité)

- Le porteur du projet (MATEI) débute en code. **Explique tout en français simple**, sans jargon, ou en
  définissant chaque mot technique la première fois (ex. : « un commit, c'est une sauvegarde du code »).
- **Une seule étape à la fois** (voir le plan en section 11). Ne jamais « faire toute l'app » d'un coup.
- À la fin de chaque étape : dire ce qui a été fait, **comment le tester soi-même** (commandes exactes,
  page à ouvrir, ce qu'on doit voir), puis sauvegarder sur GitHub (commit + pull request).
- Préférer les solutions simples et standards plutôt que les solutions astucieuses.
- Ne jamais mettre de clé secrète (Stripe, Supabase…) dans le code : elles vont dans `.env.local`
  (jamais envoyé sur GitHub) et dans les réglages de Vercel.
- Avant d'écrire du code Next.js, lire la doc embarquée dans `node_modules/next/dist/docs/`
  (voir `AGENTS.md`) : la version utilisée est récente et diffère parfois des habitudes.
- Si une étape demande une action de MATEI (créer un compte, copier une clé…), le dire clairement,
  avec les étapes cliquables, avant de continuer.

## 1. Le concept

Une place de marché « à la BlaBlaCar » qui met en relation :

- **les chercheurs** : futurs acheteurs ou locataires d'un logement, qui veulent savoir à quoi ressemble
  vraiment la vie dans une rue ou un immeuble (bruit le soir, voisins, humidité, copropriété, sécurité,
  travaux prévus, ambiance du quartier) ;
- **les habitants** : des personnes qui vivent déjà dans la rue ou l'immeuble, **vérifiées** (justificatif
  de domicile), qui gagnent un peu d'argent en racontant ce qu'elles savent.

La plateforme vend **la mise en relation et la confiance** : vérification du domicile, paiement sécurisé
bloqué jusqu'à la fin de l'échange, avis dans les deux sens.

Le risque principal : un agent immobilier ou un vendeur qui se fait passer pour un voisin. Toute la valeur
repose sur la vérification et l'indépendance des habitants.

## 2. Offres et prix (indicatifs, réglables par l'habitant dans une fourchette)

| Offre | Durée | Prix indicatif | Public visé |
|---|---|---|---|
| Appel express | 10 min | 5 à 10 € | Locataires pressés |
| Appel | 15 min | ~20 € (20 à 40 €) | Acheteurs, locataires |
| Balade dans le quartier | 45 min | ~40 € | Acheteurs |
| Visite du soir (entendre le bruit réel vers 22 h) | 30 à 45 min | ~40 € | Acheteurs |

- **Commission de la plateforme : 15 à 20 %** du prix, prélevée automatiquement par Stripe Connect.
- Plus tard : un « pass recherche » location (15 à 20 € / mois, questions illimitées).
- Les revenus des habitants doivent être déclarés (comme BlaBlaCar ou Airbnb) : le rappeler dans les CGU.

## 3. Parcours utilisateurs

### Habitant (comme le conducteur BlaBlaCar qui publie son trajet)
1. Crée un compte.
2. Remplit son profil : adresse (rue / immeuble), depuis quand il y habite, courte présentation.
3. Envoie un justificatif de domicile → statut « en attente » puis « vérifié » (validation manuelle par
   l'admin en V1).
4. Choisit ses offres et ses prix, et ses disponibilités (ex. : « mardi soir et week-end »).
5. Connecte son compte de paiement Stripe pour recevoir l'argent.
6. Reçoit les réservations, réalise l'échange (téléphone ou lien visio), est payé une fois l'échange terminé.
7. Note le chercheur.

### Chercheur (comme le passager qui cherche un trajet)
1. Tape l'adresse du logement qui l'intéresse.
2. Voit la liste des habitants vérifiés dans un rayon d'environ 200 m, **ceux du même immeuble en premier**.
3. Ouvre un profil : ancienneté, badges, avis, offres et prix.
4. Choisit une offre et un créneau, paie (l'argent est bloqué).
5. Reçoit la confirmation, le contact ou le lien visio, et une **checklist de questions** à poser.
6. Après l'échange : confirme qu'il a eu lieu, note l'habitant. L'argent est alors versé à l'habitant.

## 4. Périmètre

### Dans la V1
1. Inscription et connexion (email + mot de passe, ou lien magique).
2. Profil habitant : adresse, ancienneté, présentation, offres, prix, disponibilités, justificatif.
3. Recherche par adresse avec la liste des habitants proches (même immeuble en priorité).
4. Réservation d'un créneau et paiement (Stripe Connect, argent versé après l'échange).
5. Notes et avis dans les deux sens, après l'échange.
6. Checklist de questions fournie au chercheur.
7. Petit espace admin pour valider les justificatifs de domicile.

### Plus tard (pas en V1)
- Appel vidéo intégré (en V1 : numéro de téléphone ou lien visio externe donné après paiement).
- Chat en temps réel.
- Abonnement « pass recherche » pour la location.
- Coller le lien d'une annonce SeLoger / Leboncoin (problèmes juridiques : on garde la saisie d'adresse).
- Application mobile native (en V1 : site web utilisable comme une app, une « PWA »).
- Offre B2B (agences, relocateurs d'expatriés, banques).
- Pages par rue / quartier pour le référencement Google.

## 5. Écrans de la V1 (11)

1. **Accueil** : explication du concept + champ « Quelle adresse vous intéresse ? ».
2. **Inscription / connexion**.
3. **Choix du rôle** : « Je cherche un logement » ou « J'habite ici et je veux aider » (un compte peut
   avoir les deux).
4. **Résultats de recherche** : habitants proches, même immeuble en premier, distance, badges, prix.
5. **Profil public d'un habitant** : présentation, ancienneté, badges, avis, offres.
6. **Réservation** : choix de l'offre et du créneau, récapitulatif, paiement.
7. **Confirmation** : contact / lien visio + checklist de questions.
8. **Mon tableau de bord** : mes réservations (à venir, passées), statut des paiements.
9. **Mon profil habitant (édition)** : adresse, offres, prix, disponibilités, justificatif, connexion Stripe.
10. **Laisser un avis** : note sur 5 + commentaire.
11. **Admin** : liste des justificatifs à valider / refuser.

## 6. Modèle de données (Supabase / PostgreSQL)

- `profiles` : id (lié au compte), prénom, photo, téléphone, rôle(s), date de création.
- `residents` : profile_id, adresse, numéro d'immeuble, latitude, longitude, habite_depuis,
  présentation, statut_verification (`en_attente` / `verifie` / `refuse`), stripe_account_id.
- `proof_documents` : resident_id, chemin du fichier (stockage privé), date d'envoi, statut, note admin.
- `offers` : resident_id, type (`appel_express` / `appel` / `balade` / `visite_soir`), durée, prix (en
  centimes), actif.
- `availabilities` : resident_id, jour de la semaine, heure début, heure fin.
- `bookings` : offer_id, seeker_id, resident_id, créneau, adresse visée, statut (`en_attente_paiement` /
  `payee` / `realisee` / `annulee` / `litige`), montant, commission, stripe_payment_intent_id.
- `reviews` : booking_id, auteur, cible, note (1 à 5), commentaire, date.
- Badges calculés (pas de table) : « Domicile vérifié », « Habitant depuis 5 ans + »,
  « Réponses jugées honnêtes » (bonne moyenne d'avis).

Recherche « à 200 m » : géocodage de l'adresse avec l'API Adresse du gouvernement (gratuite,
api-adresse.data.gouv.fr), puis calcul de distance (extension PostGIS de Supabase).

## 7. Paiements (Stripe Connect)

- Chaque habitant a un compte Stripe Connect (type Express) qu'il crée depuis son profil.
- Le chercheur paie à la réservation. L'argent est conservé par Stripe (pas par nous : ça évite les
  problèmes réglementaires liés au fait de détenir l'argent des autres).
- Une fois l'échange confirmé (ou automatiquement 48 h après le créneau sans litige), le paiement est
  versé à l'habitant, **moins la commission** (15 à 20 %).
- Annulation par le chercheur plus de 24 h avant : remboursement. Annulation par l'habitant : toujours
  remboursé.
- Les événements Stripe (paiement réussi, etc.) sont reçus par un « webhook » (une adresse de notre site
  que Stripe appelle).

## 8. Sécurité et RGPD

- Les justificatifs de domicile sont des **données sensibles** : stockage privé dans Supabase, visibles
  uniquement par l'habitant concerné et l'admin, supprimés après vérification (on garde juste le statut).
- Règles d'accès Supabase (« RLS ») activées sur toutes les tables : chacun ne voit et ne modifie que
  ce qui le concerne.
- L'adresse exacte d'un habitant n'est **jamais affichée** : on montre seulement « même immeuble » ou la
  distance approximative.
- Le téléphone / lien visio n'est donné qu'après paiement.
- Pages légales à prévoir avant le lancement : CGU, politique de confidentialité, mentions légales.
- Signalement d'un faux voisin (agent, vendeur) possible depuis un profil.

## 9. Outils techniques

- **Next.js** (App Router, TypeScript, Tailwind CSS) : le site.
- **Supabase** : base de données, comptes utilisateurs, stockage des fichiers.
- **Stripe Connect** : paiements entre chercheurs et habitants.
- **Vercel** : mise en ligne, reliée à GitHub.
- **API Adresse (data.gouv.fr)** : transformer une adresse en coordonnées GPS.

Commandes utiles :
- `npm install` : installer les dépendances (une seule fois, ou après un changement).
- `npm run dev` : lancer le site en local sur http://localhost:3000.
- `npm run build` : vérifier que le site se construit sans erreur.
- `npm run lint` : vérifier la qualité du code.

## 10. Organisation du code

- `src/app/` : les pages (un dossier = une adresse du site, ex. `src/app/recherche/page.tsx` → `/recherche`).
- `src/components/` : les morceaux d'interface réutilisables.
- `src/lib/` : le code utilitaire (connexion Supabase, Stripe, géocodage).
- Textes de l'interface en français. Noms de variables et de fichiers en anglais ou français simple,
  mais cohérents.

## 11. Plan d'étapes (0 à 12)

0. **Squelette** : projet Next.js qui démarre, page d'accueil simple en français. (en cours)
1. **Mise en ligne** : brancher le dépôt sur Vercel pour avoir une adresse publique.
2. **Supabase** : créer le projet, brancher les clés, tables de base.
3. **Inscription / connexion**.
4. **Choix du rôle et profil de base**.
5. **Profil habitant** : adresse (géocodage), ancienneté, présentation.
6. **Justificatif de domicile + espace admin** de validation.
7. **Offres, prix et disponibilités**.
8. **Recherche par adresse** : habitants proches, même immeuble en premier.
9. **Profil public d'un habitant**.
10. **Réservation + paiement Stripe Connect** (argent versé après l'échange).
11. **Confirmation, checklist de questions, tableau de bord**.
12. **Avis dans les deux sens + pages légales**, puis lancement sur un quartier test.

En parallèle du code : une page de présentation sur un seul quartier et le recrutement manuel de
10 à 50 habitants (affiches dans les halls, groupes Facebook du quartier).
