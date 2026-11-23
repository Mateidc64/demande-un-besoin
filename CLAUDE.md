# Demande à un voisin — cahier des charges V1 (MVP)

Ce fichier est le cahier des charges du projet. Claude le relit à chaque session : il sert de boussole.
Il reprend le document de référence de MATEI (Google Doc « Demande à un voisin »). Toute décision prise
en cours de route doit être reportée ici, dans la section 13 « Décisions et écarts ».

**Promesse :** « Avant de signer, parle à quelqu'un qui habite déjà là. »

## 1. Règles de travail pour Claude (à respecter en priorité)

Le porteur du projet (MATEI) débute en développement. Claude doit :

- Toujours répondre et commenter en **français**, expliquer simplement ce qu'il fait et pourquoi
  (définir chaque mot technique la première fois : « un commit, c'est une sauvegarde du code »).
- Travailler **une étape à la fois** (plan en section 12), ne jamais faire plusieurs étapes d'un coup.
- À la fin de chaque étape : expliquer **comment tester** (page à ouvrir, ce qu'on doit voir), puis
  sauvegarder sur GitHub avec un message clair (commit + pull request).
- **Ne pas changer de technologie sans demander. Ne pas ajouter de bibliothèque inutile.**
- Ne jamais écrire de clé secrète dans le code : tout passe par `.env.local` (jamais envoyé sur GitHub)
  et par les réglages « Environment Variables » de Vercel (cocher Production **et** Preview).
- Sécuriser la base avec les règles d'accès Supabase (Row Level Security, « RLS ») sur **chaque table**.
- Écrire un code simple et lisible plutôt que malin.
- Si quelque chose est flou dans ce cahier des charges, **poser la question avant de coder**.
- Si une étape demande une action de MATEI (créer un compte, copier une clé…), le dire clairement,
  avec des liens cliquables.
- Avant d'écrire du code Next.js, lire la doc embarquée dans `node_modules/next/dist/docs/`
  (voir `AGENTS.md`) : la version utilisée (Next.js 16) diffère parfois des habitudes.

## 2. Le concept

Une plateforme qui met en relation :

- **Les chercheurs** : des gens qui veulent acheter ou louer un logement et savoir à quoi ressemble
  vraiment la vie dans une rue, un immeuble ou un quartier (bruit, voisins, sécurité, copropriété,
  humidité, ambiance le soir…).
- **Les habitants** : des personnes qui vivent déjà dans le quartier, **vérifiées**, rémunérées pour
  partager ce qu'elles savent.

Mécanique inspirée de BlaBlaCar : l'habitant publie son offre (comme un conducteur publie un trajet),
le chercheur cherche par adresse, réserve un créneau, paie en ligne, puis les deux se notent.

## 3. Les types d'utilisateurs

| Rôle | Ce qu'il fait |
|---|---|
| Chercheur | Cherche des habitants près d'une adresse, réserve et paie un échange, laisse un avis. Acheteur ou locataire. |
| Habitant | Crée son profil, envoie un justificatif de domicile, définit ses offres, prix et disponibilités, réalise les échanges, est payé. |
| Admin (MATEI) | Valide ou refuse les justificatifs, gère les litiges et les signalements, voit les statistiques de base. |

Un même compte peut être à la fois chercheur et habitant.

## 4. Les offres

| Format | Durée | Prix indicatif | Pour qui |
|---|---|---|---|
| Appel téléphonique ou visio (`appel`) | 15 min | 20 € | Acheteurs et locataires |
| Balade dans le quartier (`balade`) | 45 min | 40 € | Surtout acheteurs |
| Visite du soir, entendre le bruit réel (`visite_soir`) | 30 min | 35 € | Acheteurs |
| Réponse écrite à des questions (`question_ecrite`) | Sous 24 h | 8 € | Surtout locataires |

L'habitant peut modifier ses prix dans une fourchette fixée par la plateforme. Fourchettes choisies
(modifiables dans `src/lib/offres.ts`) : appel 10 à 40 €, balade 25 à 80 €, visite du soir 20 à 70 €,
réponse écrite 5 à 20 €.
**Commission de la plateforme : 20 %** sur chaque échange.

## 5. Les parcours

### Habitant
1. S'inscrire (e-mail ou Google), renseigner prénom, photo, téléphone.
2. Indiquer son adresse (jamais affichée publiquement), son ancienneté et le type de logement.
3. Envoyer un justificatif de domicile **de moins de 3 mois** (facture d'énergie, quittance, avis de taxe).
4. Attendre la validation par l'admin. Le profil n'est visible qu'une fois validé.
5. Choisir ses offres, ses prix et ses disponibilités (créneaux par jour de la semaine).
6. Connecter son compte bancaire via Stripe pour recevoir les paiements.
7. Recevoir les demandes, les accepter ou les refuser, réaliser l'échange, être payé, noter le chercheur.

### Chercheur
1. Saisir l'adresse du logement qui l'intéresse (ou un quartier).
2. Voir les habitants vérifiés dans un rayon d'environ **300 m**, triés par proximité (**même immeuble
   puis même rue d'abord**), avec photo, prénom, ancienneté, note moyenne et offres.
3. Ouvrir un profil, choisir une offre et un créneau.
4. Créer un compte s'il n'en a pas, puis payer par carte.
5. Recevoir la confirmation avec le contact (numéro ou lien visio) et une checklist de questions.
6. Après l'échange : confirmer qu'il a eu lieu et noter l'habitant.

## 6. Périmètre de la V1

### Inclus
- Inscription / connexion (e-mail + Google).
- Profil habitant avec justificatif et validation manuelle par l'admin.
- Offres, prix et disponibilités de l'habitant.
- Recherche par adresse avec rayon (carte simple + liste).
- Réservation d'un créneau, paiement en ligne, annulation et remboursement.
- Notes et avis dans les deux sens.
- E-mails automatiques : confirmation, rappel la veille, demande d'avis.
- Checklist de questions affichée au chercheur.
- Espace admin minimal : justificatifs, liste des réservations, signalements.
- Site responsive, utilisable comme une app sur téléphone (PWA).

### Exclu (plus tard)
- Application native iOS / Android.
- Appel vidéo intégré (en V1 : numéro masqué ou lien de visio externe).
- Messagerie en temps réel.
- Coller le lien d'une annonce SeLoger / Leboncoin (problèmes juridiques).
- Abonnement « pass recherche » pour les locataires.
- Offre B2B (agences, relocateurs, entreprises).
- Plusieurs langues.

## 7. Les écrans de la V1

| # | Écran | Contenu |
|---|---|---|
| 1 | Accueil | Accroche, recherche d'adresse, « comment ça marche » en 3 étapes, bouton « Devenir habitant ». |
| 2 | Résultats | Carte + liste des habitants proches, filtres (type d'offre, prix, note). |
| 3 | Profil habitant (public) | Photo, prénom, ancienneté, badges, description, offres et prix, avis, bouton « Réserver ». |
| 4 | Réservation | Offre et créneau, adresse du bien concerné, récapitulatif, paiement. |
| 5 | Confirmation | Détails, contact, checklist de questions, bouton « Ajouter au calendrier ». |
| 6 | Mes réservations | À venir / passées, annulation, confirmer que l'échange a eu lieu, laisser un avis. |
| 7 | Devenir habitant | Formulaire en étapes : infos, adresse, justificatif, offres, disponibilités, compte bancaire. |
| 8 | Tableau de bord habitant | Demandes reçues, agenda, gains, avis, modification des offres. |
| 9 | Compte | Infos personnelles, mot de passe, suppression du compte (RGPD). |
| 10 | Admin | Justificatifs à valider, réservations, litiges, signalements. |
| 11 | Pages légales | CGU, politique de confidentialité, mentions légales, FAQ. |

## 8. Modèle de données (Supabase / PostgreSQL)

Les tables sont décrites en SQL dans `supabase/migrations/`, un fichier par changement, à exécuter
**dans l'ordre** dans Supabase > SQL Editor. Ne jamais modifier un fichier déjà exécuté : en ajouter un.
Noms de tables et colonnes en anglais dans le code ; correspondance avec le Google Doc :

| Google Doc | Table | Champs principaux |
|---|---|---|
| profiles | `profiles` | id, first_name, last_name (privé), avatar_url, is_seeker, is_resident, is_admin, created_at |
| habitants | `residents` | profile_id, address_label (privée), building_key, street_name, neighborhood, city, location (lat/lng PostGIS), move_in_year, housing_type, bio, contact_info (téléphone / lien visio, privé), not_agent_confirmed, verification_status (`en_attente` / `verifie` / `refuse`), stripe_account_id |
| (lien du justificatif) | `proof_documents` | resident_id, file_path (stockage privé), status, admin_note, created_at |
| offres | `offers` | resident_id, type (`appel` / `balade` / `visite_soir` / `question_ecrite`), duration_minutes, price_cents, active |
| disponibilites | `availabilities` | resident_id, weekday (1 = lundi … 7 = dimanche), start_time, end_time |
| reservations | `bookings` | seeker_id, offer_id, resident_id, starts_at, target_address, status (`en_attente` / `confirmee` / `terminee` / `annulee` / `litige`), amount_cents, commission_cents, stripe_payment_intent_id |
| avis | `reviews` | booking_id, author_id, target_id, rating (1 à 5), comment, created_at |
| signalements | `reports` | author_id, target_id, booking_id, reason, status (`ouvert` / `en_cours` / `traite`) |

Règles d'accès déjà en place :
- `residents` est **privée** : seuls l'habitant et l'admin la lisent. Les chercheurs passent par la
  fonction `search_residents(lat, lng, building_key, street_name, rayon = 300)`, qui renvoie seulement
  prénom, photo, année d'emménagement, type de logement, description, **nom de la rue**, « même
  immeuble », « même rue », une **distance arrondie à 50 m**, la note moyenne et le nombre d'avis.
- `profiles` n'est lisible que par soi-même et l'admin ; la vue `public_profiles` expose seulement
  prénom et photo.
- Personne ne peut se nommer admin, se déclarer « vérifié » ou changer son `stripe_account_id`.
- La fiche habitant ne peut pas être créée sans cocher « je ne suis pas l'agent, le vendeur ou le
  propriétaire du bien » (`not_agent_confirmed`).
- `bookings` n'est jamais écrite depuis le navigateur : seulement par le serveur (avec Stripe).
- Un avis n'est possible qu'après un échange `terminee`, sur l'autre participant.
- Page `/statut` : vérifie que le site parle bien à la base de données.
- Fichiers (Supabase Storage) : bucket privé `justificatifs` (dossier = id de la personne ; lecture par
  elle et l'admin, suppression par l'admin), bucket public `avatars` pour les photos de profil. Les
  fichiers sont envoyés directement depuis le navigateur, puis l'action serveur enregistre leur chemin.
- Adresses : service officiel de la Géoplateforme (`data.geopf.fr/geocodage`, successeur de
  api-adresse.data.gouv.fr), appelé depuis le navigateur (`src/lib/adresse.ts`). L'identifiant de
  l'adresse sert de `building_key` (« même immeuble »), l'arrondissement de `neighborhood`.
- Admin : `profiles.is_admin` se règle uniquement à la main dans Supabase (SQL Editor). La page `/admin`
  passe par `admin_pending_residents()` et `admin_review_resident(id, valider, note)`, qui vérifient
  `is_admin()`. Après la décision, le justificatif est supprimé du stockage (seule la décision reste).
- Offres et disponibilités : page `/mes-offres`. Les offres sont enregistrées en « upsert » (une ligne
  par habitant et par type) ; les disponibilités sont remplacées en entier à chaque enregistrement.
- Exécution du SQL : MATEI a branché le connecteur Supabase dans la conversation principale du projet ;
  les nouveaux fichiers SQL lui sont transmis pour qu'elle les applique.
- Recherche : page `/recherche?adresse=…&lat=…&lng=…&rue=…&immeuble=…` (+ filtres `offre`, `prixmax`,
  `notemin`). La carte (Leaflet + OpenStreetMap, chargée seulement dans le navigateur) montre l'adresse
  recherchée et le cercle de 300 m, **jamais la position des habitants**. Un habitant sans offre active
  n'apparaît pas dans les résultats.
- Les offres sont lisibles par tous si l'habitant est vérifié, via la fonction `resident_is_verified()`
  (la table `residents` étant privée, une règle qui la lirait directement ne verrait rien).
- Profil public : page `/habitant/[id]`, via `public_resident_profile(id)` (seulement les champs
  publics, seulement si vérifié) et `reviews_for_profile(profile_id)`. Bouton « Signaler ce profil »
  (table `reports`, connexion requise).
- SQL envoyé à la conversation principale : **éviter les `drop`** (ils déclenchent une confirmation
  bloquante). L'ancienne règle « offres actives des habitants vérifiés lisibles par tous » existe donc
  encore dans la base à côté de la nouvelle ; c'est sans danger (les règles s'additionnent).
- Suppression du compte : fonction `delete_my_account()` (chacun ne peut supprimer que le sien). Elle est
  refusée si des réservations ou des avis sont liés au compte : l'admin s'en occupe alors à la main.

Badges (calculés, pas de table) : « Domicile vérifié », « Habitant depuis 5 ans ou plus »,
« Très bien noté ».

## 9. Paiements (Stripe Connect)

- Comptes **Stripe Connect Express** pour les habitants.
- Le chercheur paie à la réservation, la plateforme garde l'argent (via Stripe).
- Une fois l'échange confirmé (par le chercheur, ou automatiquement **48 h après le créneau** sans
  litige), l'habitant reçoit **80 %**, la plateforme garde **20 %**.
- Annulation par le chercheur **plus de 24 h avant** : remboursement total. **Moins de 24 h avant** :
  pas de remboursement (l'habitant est payé).
- Annulation ou absence de l'habitant : remboursement total du chercheur.
- **Mode test Stripe pendant tout le développement.**
- Les événements Stripe (paiement réussi…) arrivent par un « webhook » (adresse de notre site que
  Stripe appelle).

## 10. Confiance, sécurité et RGPD

- Domicile vérifié manuellement par l'admin pour chaque habitant.
- Justificatifs stockés dans un espace **privé** (admin seulement), **supprimés après validation**.
- L'adresse exacte n'est jamais affichée : seulement le nom de la rue et une distance approximative.
- Le téléphone n'est partagé qu'après paiement confirmé.
- Notes dans les deux sens, visibles sur les profils.
- Bouton de signalement sur chaque profil et chaque réservation.
- Case obligatoire : l'habitant n'est pas l'agent immobilier, le vendeur ou le propriétaire du bien.
- Suppression du compte possible depuis la page Compte (RGPD).
- Aucun mot de passe ni clé secrète dans ce dépôt ni dans un document partagé.

## 11. Choix techniques

| Brique | Outil |
|---|---|
| Framework web | Next.js 16 (App Router) + TypeScript |
| Interface | Tailwind CSS + composants shadcn/ui (à ajouter quand on construit les formulaires) |
| Base, comptes, stockage | Supabase (Postgres + Auth + Storage) + PostGIS pour le rayon |
| Paiements | Stripe Connect |
| Carte et adresses | API Adresse (adresse.data.gouv.fr) pour l'autocomplétion, Leaflet + OpenStreetMap pour la carte |
| E-mails | Resend |
| Hébergement | Vercel, relié au dépôt GitHub `Mateidc64/demande-un-besoin` |

Site en ligne : https://demande-un-besoin.vercel.app. Supabase est hébergé en Europe (Irlande).

Commandes utiles :
- `npm install` : installer les dépendances.
- `npm run dev` : lancer le site en local sur http://localhost:3000.
- `npm run build` : vérifier que le site se construit sans erreur.
- `npm run lint` : vérifier la qualité du code.

Organisation du code :
- `src/app/` : les pages (un dossier = une adresse du site, ex. `src/app/compte/page.tsx` → `/compte`).
- `src/components/` : morceaux d'interface réutilisables.
- `src/lib/` : code utilitaire (`src/lib/supabase/` pour la connexion à la base).
- `src/proxy.ts` : s'exécute avant chaque page, garde la connexion Supabase à jour.
- `src/components/site-header.tsx` : barre du haut (« Se connecter » / « Mon compte »).
- Pages de compte : `/connexion` (connexion + inscription + Google), `/auth/callback` (retour après le
  lien de confirmation par e-mail ou Google), `/compte`.
- Avec Next.js 16 (« Cache Components »), toute partie de page qui lit la connexion de l'utilisateur
  doit être dans un `<Suspense>`.

## 12. Plan de développement

| Étape | Objectif | Résultat à tester | État |
|---|---|---|---|
| 0 | Installation | Projet Next.js relié à GitHub et Vercel, page d'accueil en ligne. | ✅ |
| 1 | Base de données | Projet Supabase, tables du modèle, règles d'accès actives. | ✅ (2 fichiers SQL) |
| 2 | Comptes | Inscription, connexion (e-mail + Google), déconnexion, page Compte. | ✅ |
| 3 | Devenir habitant | Formulaire en étapes, envoi du justificatif, profil « en attente ». | ✅ |
| 4 | Admin | Page admin pour valider ou refuser les habitants. | ✅ |
| 5 | Offres et disponibilités | L'habitant crée ses offres, ses prix et ses créneaux. | ✅ |
| 6 | Recherche | Autocomplétion d'adresse, carte + liste des habitants dans le rayon. | ✅ |
| 7 | Profil public | Page profil habitant avec offres et avis. | ✅ |
| 8 | Réservation | Choix du créneau, création de la réservation, tableau de bord habitant. | ✅ |
| 9 | Paiement | Stripe Connect en mode test : paiement, versement, remboursement. | ✅ |
| 10 | Avis et e-mails | Notes dans les deux sens, e-mails de confirmation, rappel, demande d'avis. | en cours |
| 11 | Finitions | Pages légales, mobile soigné, PWA, page d'accueil finale. | |
| 12 | Lancement test | Stripe en mode réel, lancement sur un seul quartier pilote. | |

## 13. Décisions et écarts

- Le dépôt s'appelle `demande-un-besoin` (le nom de l'app reste « Demande à un voisin »).
- Le téléphone / lien visio est dans `residents.contact_info` et pas dans `profiles`, pour qu'il ne
  soit jamais lisible avant paiement.
- Le justificatif est dans une table à part (`proof_documents`) plutôt qu'un simple lien dans
  `residents` : ça garde l'historique des envois et la note de l'admin, et permet de supprimer le
  fichier après validation en gardant le statut.
- Le type d'offre `appel_express` existe encore dans la base (créé avant l'alignement sur le Google
  Doc) mais n'est pas utilisé.
- Étape 2 : pas encore de « mot de passe oublié » (à ajouter en finitions).
- Les formulaires sont en Tailwind simple pour l'instant : shadcn/ui n'a pas encore été ajouté (pas
  indispensable jusqu'ici, à décider avec MATEI avant de l'installer).
- Étape 3 : le téléphone saisi dans « Devenir habitant » est rangé dans `residents.contact_info`. Les
  coordonnées GPS viennent de l'adresse choisie dans le navigateur ; l'admin vérifie que le justificatif
  correspond bien à l'adresse déclarée.
- Le statut de réservation `en_attente` couvre « demande envoyée, en attente d'acceptation et de
  paiement ».

## 14. Points juridiques avant le lancement

- CGU et politique de confidentialité (RGPD), notamment pour les justificatifs.
- Informer les habitants sur la déclaration de leurs revenus (la plateforme transmet certaines
  informations aux impôts, comme Airbnb ou BlaBlaCar).
- Statut juridique (micro-entreprise ou société) avant d'encaisser de vrais paiements.
- Faire relire les CGU par un professionnel.

## 15. Marché de lancement

Un seul quartier très demandé (ex. un arrondissement de Paris ou de Lyon). Objectif avant d'ouvrir
aux chercheurs : 30 à 50 habitants vérifiés recrutés à la main (affiches dans les halls, groupes
Facebook de quartier, bouche-à-oreille).
- Réservations (étape 8) : créneaux de 30 min calculés par `available_slots()` (heure de Paris, au moins 2 h à l'avance, sans chevauchement). Création via `create_booking()`, réponse de l'habitant via `respond_booking()`, annulation via `cancel_booking()`, liste via `my_bookings()`. Le contact de l'habitant n'est montré au chercheur qu'une fois la réservation confirmée ; à l'étape 9 ce sera après paiement.
- Paiements (étape 9) : modèle Stripe « charges et virements séparés ». Comptes habitants créés avec l'API Stripe « Accounts v2 » (Stripe refuse désormais la v1 pour les nouvelles intégrations) : tableau de bord Express, configuration `recipient` (capacité `stripe_balance.stripe_transfers`), la plateforme gère frais et pertes. Compte prêt = cette capacité est `active`. Le chercheur paie à la demande
  (Stripe Checkout, page ouverte 30 min ; une demande non payée bloque le créneau 30 min puis est
  annulée). L'habitant ne voit la demande qu'une fois payée. L'argent reste sur le compte de la
  plateforme ; le versement de 80 % (`transfers` avec `source_transaction`) part quand le chercheur
  confirme l'échange, ou 48 h après le créneau. Refus ou annulation par l'habitant : remboursement
  total. Annulation par le chercheur : remboursement total si la demande n'est pas encore acceptée ou
  si le créneau est à plus de 24 h ; sinon l'habitant est payé. « Signaler un problème » met la
  réservation en `litige` (argent bloqué, l'admin tranche à la main).
- La base décide de ce qui est dû (`refund_due`, `transfer_due` sur `bookings`) ; le serveur exécute
  chez Stripe (`src/lib/paiements.ts`) avec des clés d'idempotence, puis l'enregistre
  (`record_refund`, `record_transfer`). Les fonctions serveur (`record_booking_payment`,
  `booking_maintenance`, `booking_money_tasks`, `set_resident_stripe`…) ne sont accessibles qu'avec la
  clé `service_role`, rangée seulement dans Vercel (`SUPABASE_SERVICE_ROLE_KEY`).
- Variables Vercel de l'étape 9 : `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`,
  `SUPABASE_SERVICE_ROLE_KEY`, `CRON_SECRET`. Webhook Stripe : `/api/stripe/webhook`
  (`checkout.session.completed`). Tâche automatique quotidienne (vercel.json) : `/api/cron/paiements`.
- Un habitant ne peut être réservé qu'après avoir connecté son compte bancaire
  (`residents.stripe_ready`, page `/mes-offres`). `my_bookings()` est remplacée par
  `bookings_overview()` (elle reste en base, sans DROP).
- Menu du haut : onglet « Habitant » → `/espace-habitant`, qui redirige vers `/devenir-habitant` (pas encore
  habitant, demande en attente ou refusée : la page montre l'état) ou vers `/mes-offres` (« Espace habitant »)
  si l'habitant est vérifié. Le lien « Devenir habitant » reste aussi dans « Mon compte ».
- Charte graphique (Google Doc « Charte graphique — Demande à un voisin ») : couleurs définies une seule fois
  dans `src/app/globals.css` (`@theme` : `nuit`, `voisin`, `action`, `verifie`, `lien`, `encre`, `ardoise`,
  `brume`, `contour`, `creme`…), utilisées comme classes Tailwind (`bg-action`, `text-nuit`…). Police
  Plus Jakarta Sans. Logo « maison bulle » dans `src/components/logo.tsx` et `src/app/icon.svg`. Le site
  est en thème clair uniquement (mode sombre automatique désactivé). L'accueil utilise une illustration
  dessinée (`street-illustration.tsx`) en attendant de vraies photos du quartier pilote.
- Avis (étape 10) : `leave_review(réservation, note, commentaire)`, seulement sur un échange `terminee`,
  une fois par personne, sur l'autre participant. Formulaire étoiles dans « Mes réservations ». Les avis
  reçus par un habitant s'affichent sur son profil public (`reviews_for_profile`).
- E-mails (étape 10) : Resend appelé directement par son API (`src/lib/emails.ts`, pas de librairie),
  clé `RESEND_API_KEY` dans Vercel, expéditeur `EMAIL_FROM` (par défaut l'adresse de test
  `onboarding@resend.dev`, qui n'envoie qu'au propriétaire du compte Resend tant qu'aucun domaine n'est
  vérifié). E-mails : paiement reçu (chercheur + habitant), confirmation avec contact et checklist de
  questions, annulation, rappel (tâche quotidienne, rendez-vous dans les 36 h), demande d'avis. Chaque
  e-mail n'est envoyé qu'une fois (`claim_booking_email`, colonnes `email_*_at` sur `bookings`).

- Pages `/faq`, `/cgu`, `/confidentialite`, `/mentions-legales` (pied de page sur tout le site,
  `src/components/site-footer.tsx`). Les pages légales sont une **version de travail** : les passages
  surlignés `[…]` (éditeur, SIRET, contact, médiateur, durées de conservation, rétractation) sont à
  compléter, puis à faire relire par un professionnel avant le lancement.

- Messagerie chercheur ↔ habitant (comme BlaBlaCar) : **une conversation par couple chercheur +
  habitant**, possible **avant toute réservation** (bouton « 💬 Poser une question » sur le profil
  public) et réutilisée après (bouton « 💬 Messages » de Mes réservations, qui redirige vers la même
  conversation). Pages `/messages` (liste, lien « Messages » dans le menu du haut) et `/messages/[id]`.
  Tables `conversations` et `conversation_messages` (lecture : les deux participants et l'admin ;
  écriture seulement via `start_conversation()` et `send_conversation_message()`). Les numéros de
  téléphone (8 chiffres ou plus), e-mails et liens sont **masqués par la base** (`mask_contacts()`) :
  le contact de l'habitant n'est donné qu'après une réservation acceptée. **Pas de temps réel en V1** :
  la page se recharge toute seule toutes les 15 s. E-mail « Nouveau message » à l'autre personne, au
  plus un toutes les 30 min par conversation (`claim_conversation_email`). La première version
  (table `messages`, une conversation par réservation) n'est plus utilisée : elle reste en base, vide,
  sans accès (pas de DROP).
