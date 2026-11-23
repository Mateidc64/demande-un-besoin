"use client";

// Formulaire des offres : on active les formats voulus et on choisit son prix dans la fourchette.
import { useActionState, useState } from "react";
import { OFFER_TYPES, OFFERS, residentShare, type OfferType } from "@/lib/offres";
import { saveOffers, type SaveState } from "./actions";

export type ExistingOffer = { type: OfferType; price: number; active: boolean };

export function OffersForm({ existing }: { existing: ExistingOffer[] }) {
  const [state, action, pending] = useActionState<SaveState, FormData>(saveOffers, {});
  const [prices, setPrices] = useState<Record<OfferType, string>>(() =>
    Object.fromEntries(
      OFFER_TYPES.map((t) => [t, String(existing.find((o) => o.type === t)?.price ?? OFFERS[t].defaultPrice)]),
    ) as Record<OfferType, string>,
  );

  return (
    <form action={action} className="flex flex-col gap-4">
      {OFFER_TYPES.map((type) => {
        const offer = OFFERS[type];
        const current = existing.find((o) => o.type === type);
        const price = Number(prices[type].replace(",", "."));
        return (
          <div key={type} className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
            <label className="flex items-start gap-3">
              <input
                type="checkbox"
                name={`${type}_active`}
                defaultChecked={current ? current.active : existing.length === 0}
                className="mt-1"
              />
              <span>
                <span className="font-semibold">{offer.label}</span>
                <span className="block text-sm text-zinc-600 dark:text-zinc-400">{offer.description}</span>
              </span>
            </label>
            <div className="mt-3 flex flex-wrap items-center gap-3 pl-7 text-sm">
              <label className="flex items-center gap-2">
                Prix
                <input
                  name={`${type}_price`}
                  type="number"
                  min={offer.minPrice}
                  max={offer.maxPrice}
                  step="1"
                  value={prices[type]}
                  onChange={(e) => setPrices({ ...prices, [type]: e.target.value })}
                  className="w-20 rounded-lg border border-zinc-300 px-2 py-1.5 dark:border-zinc-700 dark:bg-zinc-900"
                />
                €
              </label>
              <span className="text-zinc-500">
                entre {offer.minPrice} et {offer.maxPrice} € · tu reçois{" "}
                <strong>{Number.isFinite(price) ? residentShare(price).toLocaleString("fr-FR") : "–"} €</strong> (80 %)
              </span>
            </div>
          </div>
        );
      })}
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer mes offres"}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.message && <p className="text-sm text-emerald-700">{state.message}</p>}
      </div>
    </form>
  );
}
