// Traduit les messages d'erreur de Supabase (en anglais) en français simple.
export function translateAuthError(message: string): string {
  const m = message.toLowerCase();
  if (m.includes("invalid login credentials")) return "E-mail ou mot de passe incorrect.";
  if (m.includes("email not confirmed"))
    return "Ton e-mail n'est pas encore confirmé : clique sur le lien reçu par e-mail.";
  if (m.includes("user already registered")) return "Un compte existe déjà avec cet e-mail.";
  if (m.includes("password should be at least"))
    return "Le mot de passe doit contenir au moins 8 caractères.";
  if (m.includes("rate limit") || m.includes("too many"))
    return "Trop de tentatives. Réessaie dans quelques minutes.";
  if (m.includes("same password")) return "Le nouveau mot de passe doit être différent de l'ancien.";
  if (m.includes("provider is not enabled"))
    return "La connexion avec Google n'est pas encore activée.";
  return "Une erreur est survenue. Réessaie.";
}
