"use client";

// Formulaire d'avis : une note de 1 à 5 étoiles et un commentaire facultatif.
import { useActionState, useState } from "react";
import { leaveReview, type ReviewState } from "./actions";

export function ReviewForm({ bookingId, otherName }: { bookingId: string; otherName: string | null }) {
  const [state, action, pending] = useActionState<ReviewState, FormData>(leaveReview, {});
  const [rating, setRating] = useState(0);

  if (state.done) {
    return <p className="mt-3 text-sm text-verifie">Merci pour ton avis ✅</p>;
  }

  return (
    <form action={action} className="mt-3 flex flex-col gap-2 rounded-xl bg-voisin-pale p-4">
      <input type="hidden" name="booking_id" value={bookingId} />
      <input type="hidden" name="rating" value={rating || ""} />
      <p className="text-sm font-semibold text-nuit">Note ton échange avec {otherName}</p>
      <div className="flex gap-1" role="radiogroup" aria-label="Note sur 5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={rating === n}
            aria-label={`${n} étoile${n > 1 ? "s" : ""}`}
            onClick={() => setRating(n)}
            className={`text-2xl leading-none ${n <= rating ? "text-etoile" : "text-contour"}`}
          >
            ★
          </button>
        ))}
      </div>
      <textarea
        name="comment"
        rows={2}
        maxLength={1000}
        placeholder="Un mot sur l'échange (facultatif)"
        className="rounded-lg border border-contour p-2 text-sm"
      />
      {state.error && <p className="text-sm text-red-700">{state.error}</p>}
      <button
        disabled={pending || !rating}
        className="self-start rounded-lg bg-action px-4 py-2 text-sm font-semibold text-white hover:bg-action-survol disabled:opacity-50"
      >
        {pending ? "Envoi…" : "Publier mon avis"}
      </button>
    </form>
  );
}
