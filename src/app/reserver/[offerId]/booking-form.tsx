"use client";

// Formulaire de réservation : choix du jour puis de l'heure, adresse du bien, questions.
import { useActionState, useMemo, useState } from "react";
import { formatDay, formatTime } from "@/lib/dates";
import { requestBooking, type BookingState } from "./actions";

export function BookingForm({
  offerId,
  isWritten,
  slots,
}: {
  offerId: string;
  isWritten: boolean;
  slots: string[];
}) {
  const [state, action, pending] = useActionState<BookingState, FormData>(requestBooking, {});

  // On regroupe les créneaux par jour.
  const days = useMemo(() => {
    const map = new Map<string, string[]>();
    for (const s of slots) {
      const day = formatDay(s);
      map.set(day, [...(map.get(day) ?? []), s]);
    }
    return [...map.entries()];
  }, [slots]);
  const [day, setDay] = useState(days[0]?.[0] ?? "");
  const [slot, setSlot] = useState("");

  const fieldClass = "w-full rounded-xl border border-contour px-4 py-2.5";

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="offer_id" value={offerId} />
      <input type="hidden" name="starts_at" value={slot} />

      {!isWritten && (
        <section>
          <h2 className="mb-2 font-semibold">1. Choisis un créneau</h2>
          {days.length === 0 ? (
            <p className="text-sm text-ardoise">Aucun créneau libre dans les 14 prochains jours.</p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap gap-2">
                {days.map(([d]) => (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      setDay(d);
                      setSlot("");
                    }}
                    className={`rounded-xl border px-3 py-1.5 text-sm capitalize ${d === day ? "border-action bg-voisin-pale font-semibold" : "border-contour"}`}
                  >
                    {d}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap gap-2">
                {(days.find(([d]) => d === day)?.[1] ?? []).map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSlot(s)}
                    className={`rounded-xl border px-3 py-1.5 text-sm ${s === slot ? "border-action bg-action font-semibold text-white" : "border-contour"}`}
                  >
                    {formatTime(s)}
                  </button>
                ))}
              </div>
            </>
          )}
        </section>
      )}

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">{isWritten ? "1." : "2."} Le logement qui t&apos;intéresse</h2>
        <input
          name="target_address"
          required
          minLength={5}
          placeholder="Adresse du bien (ex. : 12 rue de la Paix, 3e étage)"
          className={fieldClass}
        />
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="font-semibold">{isWritten ? "2. Tes questions" : "3. Ce que tu veux savoir (facultatif)"}</h2>
        <textarea
          name="message"
          rows={4}
          required={isWritten}
          minLength={isWritten ? 10 : undefined}
          maxLength={2000}
          placeholder="Bruit le soir ? Ambiance de l'immeuble ? Commerces ? Sécurité ?"
          className={fieldClass}
        />
      </section>

      {state.error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || (!isWritten && !slot)}
        className="rounded-xl bg-action px-6 py-3 font-semibold text-white hover:bg-action-survol disabled:opacity-50"
      >
        {pending ? "Ouverture du paiement…" : "Continuer vers le paiement"}
      </button>
      <p className="text-xs text-ardoise">
        Paiement sécurisé par carte avec Stripe. L&apos;habitant accepte ou refuse ensuite ta demande : s&apos;il
        refuse, tu es remboursé en totalité. Annulation gratuite jusqu&apos;à 24 h avant le créneau.
      </p>
    </form>
  );
}
