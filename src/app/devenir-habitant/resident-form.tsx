"use client";

// Formulaire « Devenir habitant », en 4 étapes. Rien n'est enregistré avant le bouton final.
import { useState, useTransition } from "react";
import type { AddressSuggestion } from "@/lib/adresse";
import { createClient } from "@/lib/supabase/client";
import { submitResidentApplication } from "./actions";
import { AddressField } from "@/components/address-field";
import {
  AVATAR_MAX_BYTES,
  AVATAR_TYPES,
  HOUSING_TYPES,
  PROOF_MAX_BYTES,
  PROOF_TYPES,
} from "./constants";

const inputClass =
  "w-full rounded-xl border border-contour px-4 py-2.5";
const labelClass = "flex flex-col gap-1 text-sm font-medium";
const STEPS = ["Toi", "Ton adresse", "Ta présentation", "Justificatif"];

function fileExtension(file: File) {
  return file.name.split(".").pop()?.toLowerCase() ?? "bin";
}

export function ResidentForm({ userId, defaultFirstName }: { userId: string; defaultFirstName: string }) {
  const [step, setStep] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const [firstName, setFirstName] = useState(defaultFirstName);
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<File | null>(null);
  const [address, setAddress] = useState<AddressSuggestion | null>(null);
  const [moveInYear, setMoveInYear] = useState("");
  const [housingType, setHousingType] = useState("");
  const [bio, setBio] = useState("");
  const [notAgent, setNotAgent] = useState(false);
  const [proof, setProof] = useState<File | null>(null);

  const currentYear = new Date().getFullYear();

  // Vérifie l'étape en cours avant de passer à la suivante. Renvoie un message d'erreur ou null.
  function checkStep(): string | null {
    if (step === 0) {
      if (!firstName.trim()) return "Indique ton prénom.";
      if (phone.replace(/\D/g, "").length < 10) return "Indique un numéro de téléphone valide.";
      if (avatar && !AVATAR_TYPES.includes(avatar.type)) return "La photo doit être en JPG, PNG ou WebP.";
      if (avatar && avatar.size > AVATAR_MAX_BYTES) return "La photo ne doit pas dépasser 2 Mo.";
    }
    if (step === 1) {
      if (!address) return "Choisis ton adresse dans la liste proposée.";
      if (address.type !== "housenumber") return "Choisis une adresse précise, avec un numéro de rue.";
      const year = Number(moveInYear);
      if (!Number.isInteger(year) || year < 1900 || year > currentYear) return "Indique une année d'emménagement valide.";
      if (!housingType) return "Choisis un type de logement.";
    }
    if (step === 2) {
      if (bio.trim().length < 30) return "Écris au moins 30 caractères pour te présenter.";
      if (!notAgent) return "Coche la case de confirmation pour continuer.";
    }
    if (step === 3) {
      if (!proof) return "Ajoute ton justificatif de domicile.";
      if (!PROOF_TYPES.includes(proof.type)) return "Le justificatif doit être un PDF, un JPG ou un PNG.";
      if (proof.size > PROOF_MAX_BYTES) return "Le justificatif ne doit pas dépasser 5 Mo.";
    }
    return null;
  }

  function next() {
    const problem = checkStep();
    setError(problem);
    if (!problem) setStep(step + 1);
  }

  function submit() {
    const problem = checkStep();
    setError(problem);
    if (problem || !proof || !address) return;

    startTransition(async () => {
      const supabase = createClient();
      const stamp = Date.now();

      // 1. Envoi du justificatif dans l'espace privé (dossier = identifiant de la personne).
      const proofPath = `${userId}/${stamp}.${fileExtension(proof)}`;
      const { error: proofError } = await supabase.storage
        .from("justificatifs")
        .upload(proofPath, proof, { contentType: proof.type });
      if (proofError) {
        setError("L'envoi du justificatif a échoué. Réessaie.");
        return;
      }

      // 2. Envoi de la photo (facultative) dans l'espace public des photos.
      let avatarUrl: string | null = null;
      if (avatar) {
        const avatarPath = `${userId}/avatar-${stamp}.${fileExtension(avatar)}`;
        const { error: avatarError } = await supabase.storage
          .from("avatars")
          .upload(avatarPath, avatar, { contentType: avatar.type });
        if (!avatarError) avatarUrl = supabase.storage.from("avatars").getPublicUrl(avatarPath).data.publicUrl;
      }

      // 3. Enregistrement de la demande (sur le serveur).
      const result = await submitResidentApplication({
        firstName,
        phone,
        avatarUrl,
        address,
        moveInYear: Number(moveInYear),
        housingType,
        bio,
        notAgentConfirmed: notAgent,
        proofPath,
      });
      if (result?.error) setError(result.error);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Barre de progression */}
      <ol className="grid grid-cols-4 gap-2 text-xs">
        {STEPS.map((label, i) => (
          <li key={label} className="flex flex-col gap-1">
            <span className={`h-1.5 rounded-full ${i <= step ? "bg-action" : "bg-brume"}`} />
            <span className={i === step ? "font-semibold" : "text-ardoise"}>{label}</span>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="flex flex-col gap-4">
          <label className={labelClass}>
            Prénom (affiché sur ton profil)
            <input value={firstName} onChange={(e) => setFirstName(e.target.value)} className={inputClass} />
          </label>
          <label className={labelClass}>
            Téléphone (donné au chercheur seulement après son paiement)
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="06 12 34 56 78"
              autoComplete="tel"
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Photo de profil (facultative, 2 Mo max)
            <input
              type="file"
              accept={AVATAR_TYPES.join(",")}
              onChange={(e) => setAvatar(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </label>
        </div>
      )}

      {step === 1 && (
        <div className="flex flex-col gap-4">
          <div className={labelClass}>
            Ton adresse (jamais affichée : les chercheurs voient seulement le nom de ta rue)
            <AddressField value={address} onChange={setAddress} inputClass={inputClass} />
          </div>
          <label className={labelClass}>
            Année d&apos;emménagement
            <input
              type="number"
              inputMode="numeric"
              min={1900}
              max={currentYear}
              value={moveInYear}
              onChange={(e) => setMoveInYear(e.target.value)}
              placeholder={String(currentYear - 3)}
              className={inputClass}
            />
          </label>
          <label className={labelClass}>
            Type de logement
            <select value={housingType} onChange={(e) => setHousingType(e.target.value)} className={inputClass}>
              <option value="">Choisir…</option>
              {HOUSING_TYPES.map((t) => (
                <option key={t}>{t}</option>
              ))}
            </select>
          </label>
        </div>
      )}

      {step === 2 && (
        <div className="flex flex-col gap-4">
          <label className={labelClass}>
            Présente-toi et ton quartier (ce que tu aimes, ce qu&apos;il faut savoir…)
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={6}
              maxLength={1000}
              placeholder="J'habite ici depuis 6 ans avec ma famille. La rue est calme le soir, le marché du dimanche est super…"
              className={inputClass}
            />
            <span className="text-xs font-normal text-ardoise">{bio.trim().length} / 1000 (30 minimum)</span>
          </label>
          <label className="flex items-start gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm">
            <input type="checkbox" checked={notAgent} onChange={(e) => setNotAgent(e.target.checked)} className="mt-1" />
            <span>
              Je confirme que je ne suis <strong>ni agent immobilier, ni vendeur, ni propriétaire</strong> d&apos;un bien
              sur lequel un chercheur me poserait des questions, et que je réponds en toute honnêteté.
            </span>
          </label>
        </div>
      )}

      {step === 3 && (
        <div className="flex flex-col gap-4">
          <p className="text-sm text-ardoise">
            Envoie un justificatif de domicile <strong>de moins de 3 mois</strong> à ton nom et à l&apos;adresse indiquée
            : facture d&apos;énergie, quittance de loyer ou avis de taxe. Il est stocké dans un espace privé, vu
            uniquement par l&apos;équipe, puis <strong>supprimé après vérification</strong>.
          </p>
          <label className={labelClass}>
            Justificatif (PDF, JPG ou PNG, 5 Mo max)
            <input
              type="file"
              accept={PROOF_TYPES.join(",")}
              onChange={(e) => setProof(e.target.files?.[0] ?? null)}
              className="text-sm"
            />
          </label>
        </div>
      )}

      {error && <p className="rounded-xl bg-red-50 p-3 text-sm text-red-700">{error}</p>}

      <div className="flex justify-between">
        {step > 0 ? (
          <button
            type="button"
            onClick={() => {
              setError(null);
              setStep(step - 1);
            }}
            disabled={pending}
            className="rounded-xl border border-contour px-5 py-2.5 font-semibold"
          >
            Retour
          </button>
        ) : (
          <span />
        )}
        {step < STEPS.length - 1 ? (
          <button type="button" onClick={next} className="rounded-xl bg-action px-5 py-2.5 font-semibold text-white hover:bg-action-survol">
            Continuer
          </button>
        ) : (
          <button
            type="button"
            onClick={submit}
            disabled={pending}
            className="rounded-xl bg-action px-5 py-2.5 font-semibold text-white hover:bg-action-survol disabled:opacity-60"
          >
            {pending ? "Envoi en cours…" : "Envoyer ma demande"}
          </button>
        )}
      </div>
    </div>
  );
}
