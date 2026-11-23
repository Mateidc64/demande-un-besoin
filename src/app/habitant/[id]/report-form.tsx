"use client";

import { useActionState, useState } from "react";
import { reportProfile, type ReportState } from "./actions";

export function ReportForm({ targetId }: { targetId: string }) {
  const [open, setOpen] = useState(false);
  const [state, action, pending] = useActionState<ReportState, FormData>(reportProfile, {});

  if (state.message) return <p className="text-sm text-verifie">{state.message}</p>;
  if (!open) {
    return (
      <button type="button" onClick={() => setOpen(true)} className="text-sm text-ardoise underline">
        Signaler ce profil
      </button>
    );
  }
  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="target_id" value={targetId} />
      <textarea
        name="reason"
        rows={3}
        required
        placeholder="Pourquoi signales-tu ce profil ? (ex. : c'est un agent immobilier, informations fausses…)"
        className="rounded-xl border border-contour px-3 py-2 text-sm"
      />
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={pending}
          className="rounded-xl border border-red-300 px-4 py-2 text-sm font-medium text-red-700 disabled:opacity-60"
        >
          {pending ? "Envoi…" : "Envoyer le signalement"}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
      </div>
    </form>
  );
}
