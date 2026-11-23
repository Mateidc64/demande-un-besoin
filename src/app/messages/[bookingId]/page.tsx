// Page /messages/[bookingId] : la conversation entre le chercheur et l'habitant d'une réservation payée.
import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { formatDateTime, formatDay, formatTime } from "@/lib/dates";
import { OFFERS, type OfferType } from "@/lib/offres";
import { createClient } from "@/lib/supabase/server";
import { MessageForm } from "./message-form";

type Header = {
  booking_id: string;
  my_role: "chercheur" | "habitant";
  other_first_name: string | null;
  offer_type: OfferType;
  starts_at: string;
  status: "en_attente" | "confirmee" | "terminee" | "annulee" | "litige";
  paid: boolean;
};

type Message = {
  message_id: string;
  mine: boolean;
  author_first_name: string | null;
  body: string;
  created_at: string;
};

const OPEN_STATUSES = ["en_attente", "confirmee", "terminee", "litige"];

async function Conversation({ params }: { params: Promise<{ bookingId: string }> }) {
  const { bookingId } = await params;
  const supabase = await createClient();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) redirect("/connexion");

  const [{ data: bookings }, { data: messages }] = await Promise.all([
    supabase.rpc("bookings_overview"),
    supabase.rpc("booking_conversation", { p_booking_id: bookingId }),
  ]);
  const header = ((bookings ?? []) as Header[]).find((b) => b.booking_id === bookingId);

  if (!header || !header.paid) {
    return (
      <p className="text-ardoise">
        Conversation introuvable.{" "}
        <Link href="/mes-reservations" className="text-lien underline">
          Retour à mes réservations
        </Link>
      </p>
    );
  }

  const list = (messages ?? []) as Message[];
  const canWrite = OPEN_STATUSES.includes(header.status);
  const isWritten = header.offer_type === "question_ecrite";

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-2xl border border-brume bg-white p-5">
        <p className="font-semibold">
          {OFFERS[header.offer_type].label} avec {header.other_first_name}
        </p>
        <p className="text-sm capitalize text-ardoise">
          {isWritten ? `Demandée le ${formatDateTime(header.starts_at)}` : formatDateTime(header.starts_at)}
        </p>
        <p className="mt-2 text-xs text-ardoise">
          Reste courtois et ne partage jamais de coordonnées bancaires. En cas de problème signalé, l&apos;équipe peut
          lire cette conversation.
        </p>
      </div>

      {list.length === 0 ? (
        <p className="text-sm text-ardoise">
          Aucun message pour l&apos;instant. Écris à {header.other_first_name} pour préparer l&apos;échange.
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

      <MessageForm bookingId={bookingId} canWrite={canWrite} />
    </div>
  );
}

export default function MessagesPage({ params }: PageProps<"/messages/[bookingId]">) {
  return (
    <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
      <Link href="/mes-reservations" className="text-sm text-lien underline">
        ← Mes réservations
      </Link>
      <h1 className="mb-6 mt-3 text-2xl font-bold">Messages</h1>
      <Suspense fallback={<p className="text-ardoise">Chargement…</p>}>
        <Conversation params={params} />
      </Suspense>
    </main>
  );
}
