// Page /messages/[id] : une conversation entre un chercheur et un habitant (avant ou après réservation).
// [id] est l'identifiant de la conversation. Pour les anciens liens et le bouton « Messages » de
// Mes réservations, ce peut aussi être l'identifiant d'une réservation : on redirige alors.
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { formatDay, formatTime } from "@/lib/dates";
import { createClient } from "@/lib/supabase/server";
import { MessageForm } from "./message-form";

export type ConversationSummary = {
  conversation_id: string;
  my_role: "chercheur" | "habitant";
  other_first_name: string | null;
  resident_id: string;
  last_body: string | null;
  last_mine: boolean | null;
  last_at: string;
};

type Message = {
  message_id: string;
  mine: boolean;
  author_first_name: string | null;
  body: string;
  created_at: string;
};

const UUID = /^[0-9a-f-]{36}$/i;

function NotFound() {
  return (
    <p className="text-ardoise">
      Conversation introuvable.{" "}
      <Link href="/messages" className="text-lien underline">
        Retour à mes messages
      </Link>
    </p>
  );
}

async function Conversation({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!UUID.test(id)) return <NotFound />;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/connexion");

  const [{ data: conversations }, { data: messages }] = await Promise.all([
    supabase.rpc("my_conversations"),
    supabase.rpc("conversation_messages_for", { p_conversation_id: id }),
  ]);
  const header = ((conversations ?? []) as ConversationSummary[]).find((c) => c.conversation_id === id);

  if (!header) {
    // Peut-être l'identifiant d'une réservation : on retrouve sa conversation.
    const { data: conversationId } = await supabase.rpc("conversation_for_booking", { p_booking_id: id });
    if (conversationId) redirect(`/messages/${conversationId}`);
    return <NotFound />;
  }

  const list = (messages ?? []) as Message[];
  const isSeeker = header.my_role === "chercheur";

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-brume bg-white p-5">
        <p className="font-semibold">
          Conversation avec {header.other_first_name}
          <span className="font-normal text-ardoise"> · {isSeeker ? "habitant vérifié" : "chercheur"}</span>
        </p>
        {isSeeker && (
          <Link href={`/habitant/${header.resident_id}`} className="text-sm text-lien underline">
            Voir son profil et réserver
          </Link>
        )}
        <p className="mt-2 text-xs text-ardoise">
          Les numéros, e-mails et liens sont masqués automatiquement : le contact de l&apos;habitant est donné une fois
          la réservation acceptée. Reste courtois. En cas de signalement, l&apos;équipe peut lire cette conversation.
        </p>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-ardoise">
          {isSeeker
            ? `Pose ta question à ${header.other_first_name} : le quartier, l'immeuble, ce que tu veux savoir avant de réserver.`
            : "Aucun message pour l'instant."}
        </p>
      ) : (
        <ol className="flex flex-col gap-3" aria-label="Messages">
          {list.map((m, i) => {
            const day = formatDay(m.created_at);
            const showDay = i === 0 || formatDay(list[i - 1].created_at) !== day;
            return (
              <li key={m.message_id} className="flex flex-col">
                {showDay && <p className="my-2 text-center text-xs capitalize text-ardoise">{day}</p>}
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm ${
                    m.mine ? "self-end rounded-br-sm bg-nuit text-white" : "self-start rounded-bl-sm border border-brume bg-white"
                  }`}
                >
                  {!m.mine && <p className="text-xs font-semibold text-voisin">{m.author_first_name}</p>}
                  <p className="whitespace-pre-line break-words">{m.body}</p>
                  <p className={`mt-1 text-right text-[11px] ${m.mine ? "text-white/70" : "text-ardoise"}`}>
                    {formatTime(m.created_at)}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
      )}

      <MessageForm conversationId={id} />
    </div>
  );
}

export default function ConversationPage({ params }: PageProps<"/messages/[id]">) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <Link href="/messages" className="text-sm text-lien underline">
        ← Mes messages
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-bold">Messages</h1>
      <Suspense fallback={<p className="text-ardoise">Chargement…</p>}>
        <Conversation params={params} />
      </Suspense>
    </main>
  );
}
