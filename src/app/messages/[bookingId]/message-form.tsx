"use client";

// Zone de saisie d'un message. Recharge aussi la conversation toutes les 15 secondes
// (pas de temps réel en V1 : c'est simple et suffisant pour quelques messages).
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useRef } from "react";
import { sendMessage, type MessageState } from "./actions";

const REFRESH_MS = 15_000;

export function MessageForm({ bookingId, canWrite }: { bookingId: string; canWrite: boolean }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<MessageState, FormData>(sendMessage, {});
  const formRef = useRef<HTMLFormElement>(null);

  // Vide la zone de texte après un envoi réussi.
  useEffect(() => {
    if (state.sentAt) formRef.current?.reset();
  }, [state.sentAt]);

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, REFRESH_MS);
    return () => clearInterval(id);
  }, [router]);

  if (!canWrite) {
    return <p className="text-sm text-ardoise">Cette réservation est annulée : la conversation est fermée.</p>;
  }

  return (
    <form ref={formRef} action={action} className="flex flex-col gap-2">
      <input type="hidden" name="booking_id" value={bookingId} />
      <label htmlFor="body" className="sr-only">
        Ton message
      </label>
      <textarea
        id="body"
        name="body"
        rows={3}
        maxLength={2000}
        required
        placeholder="Écris ton message…"
        className="rounded-xl border border-contour bg-white p-3 text-sm"
        onKeyDown={(e) => {
          // Ctrl/Cmd + Entrée pour envoyer.
          if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) formRef.current?.requestSubmit();
        }}
      />
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button
        disabled={pending}
        className="self-end rounded-xl bg-action px-5 py-2 text-sm font-semibold text-white hover:bg-action-survol disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Envoyer"}
      </button>
    </form>
  );
}
