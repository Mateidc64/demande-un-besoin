"use client";

// Disponibilités : une liste de créneaux (jour + heure de début + heure de fin).
import { useState, useTransition } from "react";
import { WEEKDAYS } from "@/lib/offres";
import { saveAvailabilities, type SaveState, type Slot } from "./actions";

const fieldClass = "rounded-xl border border-contour px-2 py-1.5 text-sm";

export function AvailabilityForm({ existing }: { existing: Slot[] }) {
  const [slots, setSlots] = useState<Slot[]>(existing);
  const [state, setState] = useState<SaveState>({});
  const [pending, startTransition] = useTransition();

  function update(index: number, change: Partial<Slot>) {
    setSlots(slots.map((s, i) => (i === index ? { ...s, ...change } : s)));
  }

  return (
    <div className="flex flex-col gap-3">
      {slots.length === 0 && <p className="text-sm text-ardoise">Aucun créneau pour l&apos;instant.</p>}
      {slots.map((slot, i) => (
        <div key={i} className="flex flex-wrap items-center gap-2">
          <select
            value={slot.weekday}
            onChange={(e) => update(i, { weekday: Number(e.target.value) })}
            className={fieldClass}
          >
            {WEEKDAYS.map((day, d) => (
              <option key={day} value={d + 1}>
                {day}
              </option>
            ))}
          </select>
          de
          <input type="time" value={slot.start} onChange={(e) => update(i, { start: e.target.value })} className={fieldClass} />
          à
          <input type="time" value={slot.end} onChange={(e) => update(i, { end: e.target.value })} className={fieldClass} />
          <button
            type="button"
            onClick={() => setSlots(slots.filter((_, j) => j !== i))}
            className="text-sm text-red-600 underline"
          >
            Retirer
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => setSlots([...slots, { weekday: 2, start: "18:30", end: "21:00" }])}
        className="self-start text-sm font-medium text-lien underline"
      >
        + Ajouter un créneau
      </button>
      <div className="flex items-center gap-4">
        <button
          type="button"
          disabled={pending}
          onClick={() => startTransition(async () => setState(await saveAvailabilities(slots)))}
          className="rounded-xl bg-action px-5 py-2.5 font-semibold text-white hover:bg-action-survol disabled:opacity-60"
        >
          {pending ? "Enregistrement…" : "Enregistrer mes disponibilités"}
        </button>
        {state.error && <p className="text-sm text-red-600">{state.error}</p>}
        {state.message && <p className="text-sm text-verifie">{state.message}</p>}
      </div>
    </div>
  );
}
