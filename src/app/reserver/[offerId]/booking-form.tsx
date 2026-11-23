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

  const fieldClass = "w-full rounded-lg border border-zinc-300 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-900";

  return (
    <form action={action} className="flex flex-col gap-6">
      <input type="hidden" name="offer_id" value={offerId} />
      <input type="hidden" name="starts_at" value={slot} />

      {!isWritten && (
        <section>
          <h2 className="mb-2 font-semibold">1. Choisis un créneau</h2>
          {days.length === 0 ? (
            <p className="text-sm text-zinc-500">Aucun créneau libre dans les 14 prochains jours.</p>
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
                    className={`rounded-lg border px-3 py-1.5 text-sm capitalize ${d === day ? "border-emerald-600 bg-emerald-50 font-semibold dark:bg-emerald-950" : "border-zinc-300 dark:border-zinc-700"}`}
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
                    className={`rounded-lg border px-3 py-1.5 text-sm ${s === slot ? "border-emerald-600 bg-emerald-600 font-semibold text-white" : "border-zinc-300 dark:border-zinc-700"}`}
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

      {state.error && <p className="rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{state.error}</p>}

      <button
        type="submit"
        disabled={pending || (!isWritten && !slot)}
        className="rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
      >
        {pending ? "Ouverture du paiement…" : "Continuer vers le paiement"}
      </button>
      <p className="text-xs text-zinc-500">
        Paiement sécurisé par carte avec Stripe. L&apos;habitant accepte ou refuse ensuite ta demande : s&apos;il
        refuse, tu es remboursé en totalité. Annulation gratuite jusqu&apos;à 24 h avant le créneau.
      </p>
    </form>
  );
}
