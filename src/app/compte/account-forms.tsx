"use client";

// Les trois formulaires de la page Compte.
import { useActionState } from "react";
import { deleteAccount, updatePassword, updateProfile, type FormState } from "./actions";

const inputClass =
  "w-full rounded-lg border border-zinc-300 px-4 py-2.5 dark:border-zinc-700 dark:bg-zinc-900";
const buttonClass =
  "rounded-lg bg-emerald-600 px-5 py-2.5 font-semibold text-white hover:bg-emerald-700 disabled:opacity-60";

function Feedback({ state }: { state: FormState }) {
  if (state.error) return <p className="text-sm text-red-600">{state.error}</p>;
  if (state.message) return <p className="text-sm text-emerald-700">{state.message}</p>;
  return null;
}

export function ProfileForm({ firstName, lastName }: { firstName: string; lastName: string }) {
  const [state, action, pending] = useActionState<FormState, FormData>(updateProfile, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <label className="text-sm font-medium">
        Prénom (visible sur ton profil)
        <input name="first_name" defaultValue={firstName} required className={`${inputClass} mt-1`} />
      </label>
      <label className="text-sm font-medium">
        Nom (jamais affiché publiquement)
        <input name="last_name" defaultValue={lastName} className={`${inputClass} mt-1`} />
      </label>
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Enregistrement…" : "Enregistrer"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function PasswordForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(updatePassword, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <input
        name="password"
        type="password"
        placeholder="Nouveau mot de passe"
        minLength={8}
        required
        autoComplete="new-password"
        className={inputClass}
      />
      <input
        name="confirm"
        type="password"
        placeholder="Confirme le nouveau mot de passe"
        minLength={8}
        required
        autoComplete="new-password"
        className={inputClass}
      />
      <div className="flex items-center gap-4">
        <button type="submit" disabled={pending} className={buttonClass}>
          {pending ? "Modification…" : "Changer le mot de passe"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}

export function DeleteAccountForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(deleteAccount, {});
  return (
    <form action={action} className="flex flex-col gap-3">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Ton compte et toutes tes informations seront effacés définitivement. Pour confirmer, écris{" "}
        <strong>SUPPRIMER</strong> ci-dessous.
      </p>
      <input name="confirm" placeholder="SUPPRIMER" required className={inputClass} />
      <div className="flex items-center gap-4">
        <button
          type="submit"
          disabled={pending}
          className="rounded-lg bg-red-600 px-5 py-2.5 font-semibold text-white hover:bg-red-700 disabled:opacity-60"
        >
          {pending ? "Suppression…" : "Supprimer mon compte"}
        </button>
        <Feedback state={state} />
      </div>
    </form>
  );
}
