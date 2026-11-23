# Demande à un voisin

Avant d'acheter ou de louer un logement, parlez à quelqu'un qui habite déjà la rue.

Le cahier des charges complet est dans [CLAUDE.md](./CLAUDE.md).

## Lancer le site sur ton ordinateur

1. Installer [Node.js](https://nodejs.org) (version « LTS »).
2. Dans un terminal, dans le dossier du projet :
   ```bash
   npm install   # installe les outils (une seule fois)
   npm run dev   # démarre le site
   ```
3. Ouvrir http://localhost:3000 dans ton navigateur.

Pour arrêter le site : `Ctrl + C` dans le terminal.

## Brancher la base de données (Supabase)

1. Copier le fichier `.env.example` et le renommer en `.env.local`.
2. Y coller la Project URL et la clé anon / publishable de Supabase
   (Supabase > ton projet > bouton « Connect »).
3. Relancer `npm run dev`, puis ouvrir http://localhost:3000/statut :
   on doit voir « ✅ Tout fonctionne ».

`.env.local` reste sur ton ordinateur : il n'est jamais envoyé sur GitHub.
