"use client";

// Champ d'adresse avec suggestions (autocomplétion) au fur et à mesure de la saisie.
import { useEffect, useState } from "react";
import { searchAddresses, type AddressSuggestion } from "@/lib/adresse";

export function AddressField({
  value,
  onChange,
  inputClass,
  placeholder = "Ex. : 12 rue de la Paix, Paris",
}: {
  value: AddressSuggestion | null;
  onChange: (address: AddressSuggestion | null) => void;
  inputClass: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState(value?.label ?? "");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);

  // On attend 300 ms après la dernière touche avant d'interroger le service d'adresses.
  useEffect(() => {
    if (value && query === value.label) return;
    const timer = setTimeout(async () => {
      try {
        setSuggestions(await searchAddresses(query));
      } catch {
        setSuggestions([]);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [query, value]);

  return (
    <div className="relative">
      <input
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          onChange(null);
        }}
        placeholder={placeholder}
        autoComplete="off"
        className={inputClass}
      />
      {suggestions.length > 0 && !value && (
        <ul className="absolute z-10 mt-1 w-full overflow-hidden rounded-xl border border-brume bg-white shadow-lg">
          {suggestions.map((s) => (
            <li key={s.id}>
              <button
                type="button"
                onClick={() => {
                  onChange(s);
                  setQuery(s.label);
                  setSuggestions([]);
                }}
                className="w-full px-4 py-2 text-left text-sm hover:bg-brume"
              >
                {s.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
