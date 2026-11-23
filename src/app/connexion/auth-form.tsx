"use client";

// Formulaire de connexion / inscription (avec deux onglets).
import { useActionState, useState } from "react";
import { signIn, signInWithGoogle, signUp, type FormState } from "./actions";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-4 py-3 dark:border-zinc-700 dark:bg-zinc-900";
const buttonClass =
  "w-full rounded-lg bg-emerald-600 px-6 py-3 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60";

export function AuthForm({ initialError }: { initialError?: string }) {
  const [mode, setMode] = useState<"connexion" | "inscription">("connexion");
  const [signInState, signInAction, signInPending] = useActionState<FormState, FormData>(signIn, {});
  const [signUpState, signUpAction, signUpPending] = useActionState<FormState, FormData>(signUp, {});

  const state = mode === "connexion" ? signInState : signUpState;
  const error = state.error ?? (mode === "connexion" ? initialError : undefined);

  return (
    <div className="w-full max-w-sm">
      <div className="mb-6 grid grid-cols-2 rounded-lg bg-zinc-100 p-1 dark:bg-zinc-800">
        {(["connexion", "inscription"] as const).map((m) => (
          <button
            key={m}
            type="button"
            onClick={() => setMode(m)}
            className={`rounded-md py-2 font-medium ${mode === m ? "bg-white shadow dark:bg-zinc-900" : "text-zinc-500"}`}
          >
            {m === "connexion" ? "Se connecter" : "Créer un compte"}
          </button>
        ))}
      </div>

      <form action={signInWithGoogle}>
        <button
          type="submit"
          className="w-full rounded-lg border border-zinc-300 px-6 py-3 font-semibold hover:bg-zinc-50 dark:border-zinc-700 dark:hover:bg-zinc-900"
        >
          Continuer avec Google
        </button>
      </form>

      <p className="my-4 text-center text-sm text-zinc-500">ou avec ton e-mail</p>

      {mode === "connexion" ? (
        <form action={signInAction} className="flex flex-col gap-3">
          <input name="email" type="email" placeholder="E-mail" required autoComplete="email" className={inputClass} />
          <input
            name="password"
            type="password"
            placeholder="Mot de passe"
            required
            autoComplete="current-password"
            className={inputClass}
          />
          <button type="submit" disabled={signInPending} className={buttonClass}>
            {signInPending ? "Connexion…" : "Se connecter"}
          </button>
        </form>
      ) : (
        <form action={signUpAction} className="flex flex-col gap-3">
          <input name="first_name" type="text" placeholder="Prénom" required autoComplete="given-name" className={inputClass} />
          <input name="email" type="email" placeholder="E-mail" required autoComplete="email" className={inputClass} />
          <input
            name="password"
            type="password"
            placeholder="Mot de passe (8 caractères minimum)"
            required
            minLength={8}
            autoComplete="new-password"
            className={inputClass}
          />
          <button type="submit" disabled={signUpPending} className={buttonClass}>
            {signUpPending ? "Création…" : "Créer mon compte"}
          </button>
        </form>
      )}

      {error && <p className="mt-4 rounded-lg bg-red-50 p-3 text-sm text-red-700 dark:bg-red-950 dark:text-red-300">{error}</p>}
      {state.message && (
        <p className="mt-4 rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
          {state.message}
        </p>
      )}
    </div>
  );
}
