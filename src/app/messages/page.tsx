// Page /messages : la liste de mes conversations (comme chercheur et comme habitant).
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { formatDay, formatTime } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import type { ConversationSummary } from "./[id]/page";

async function Inbox() {
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/connexion");

  const { data } = await supabase.rpc("my_conversations");
  const list = (data ?? []) as ConversationSummary[];

  if (list.length === 0) {
    return (
      <p className="text-ardoise">
        Aucune conversation pour l&apos;instant. Sur le profil d&apos;un habitant, clique sur « Poser une question » pour
        lui écrire avant de réserver.{" "}
        <Link href="/" className="text-lien underline">
          Chercher une adresse
        </Link>
      </p>
    );
  }

  return (
    <ul className="flex flex-col gap-3">
      {list.map((c) => (
        <li key={c.conversation_id}>
          <Link
            href={`/messages/${c.conversation_id}`}
            className="flex items-center gap-4 rounded-2xl border border-brume bg-white p-4 hover:border-contour"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-peche font-bold text-nuit">
              {c.other_first_name?.[0]?.toUpperCase() ?? "?"}
            </div>
            <div className="min-w-0 flex-1">
              <p className="flex justify-between gap-2">
                <span className="font-semibold">
                  {c.other_first_name}
                  <span className="text-xs font-normal text-ardoise">
                    {" "}
                    · {c.my_role === "chercheur" ? "habitant" : "chercheur"}
                  </span>
                </span>
                <span className="shrink-0 text-xs capitalize text-ardoise">
                  {formatDay(c.last_at).split(" ").slice(1).join(" ")} · {formatTime(c.last_at)}
                </span>
              </p>
              <p className="truncate text-sm text-ardoise">
                {c.last_body ? `${c.last_mine ? "Toi : " : ""}${c.last_body}` : "Pas encore de message"}
              </p>
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export default function MessagesPage() {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <h1 className="mb-6 text-2xl font-bold">Mes messages</h1>
      <Suspense fallback={<p className="text-ardoise">Chargement…</p>}>
        <Inbox />
      </Suspense>
    </main>
  );
}
