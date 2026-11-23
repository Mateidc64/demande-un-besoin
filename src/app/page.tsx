import Link from "next/link";
import { HomeSearch } from "@/components/home-search";

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

        <div className="mt-8">
          <HomeSearch />
        </div>
        <p className="mt-3 text-sm text-zinc-500">Une adresse précise ou simplement une rue, un quartier.</p>

        <div className="mt-12 rounded-xl border border-zinc-200 p-6 dark:border-zinc-800">
          <p className="font-semibold">Tu habites un quartier recherché ?</p>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Partage ce que tu sais et sois rémunéré pour chaque échange.
          </p>
          <Link
            href="/devenir-habitant"
            className="mt-4 inline-block rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700"
          >
            Devenir habitant
          </Link>
        </div>
      </div>
    </main>
  );
}
