export default function Home() {
  return (
    <main className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <div className="w-full max-w-xl text-center">
        <h1 className="text-4xl font-bold tracking-tight">Demande à un voisin</h1>
        <p className="mt-4 text-lg text-zinc-600 dark:text-zinc-400">
          Avant d&apos;acheter ou de louer, parlez à quelqu&apos;un qui habite déjà la rue.
          Bruit le soir, voisins, humidité, ambiance du quartier : posez vos questions à un
          habitant vérifié.
        </p>

        {/* Le champ de recherche sera branché à l'étape 8. Pour l'instant il est décoratif. */}
        <form className="mt-8 flex flex-col gap-3 sm:flex-row">
          <label htmlFor="adresse" className="sr-only">
            Adresse du logement
          </label>
          <input
            id="adresse"
            type="text"
            placeholder="Quelle adresse vous intéresse ?"
            className="flex-1 rounded-lg border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900"
            disabled
          />
          <button
            type="submit"
            className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white opacity-60"
            disabled
          >
            Chercher
          </button>
        </form>
        <p className="mt-3 text-sm text-zinc-500">Bientôt disponible.</p>
      </div>
    </main>
  );
}
