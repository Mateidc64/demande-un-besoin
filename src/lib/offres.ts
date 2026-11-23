// Les 4 formats d'échange, avec leur durée, leur prix conseillé et la fourchette autorisée (en euros).
// Source : cahier des charges, section 4. La plateforme garde 20 % de commission.

export const COMMISSION_RATE = 0.2;

export const OFFER_TYPES = ["appel", "balade", "visite_soir", "question_ecrite"] as const;
export type OfferType = (typeof OFFER_TYPES)[number];

export const OFFERS: Record<
  OfferType,
  { label: string; description: string; durationMinutes: number; defaultPrice: number; minPrice: number; maxPrice: number }
> = {
  appel: {
    label: "Appel téléphonique ou visio",
    description: "15 minutes pour répondre aux questions du chercheur.",
    durationMinutes: 15,
    defaultPrice: 20,
    minPrice: 10,
    maxPrice: 40,
  },
  balade: {
    label: "Balade dans le quartier",
    description: "45 minutes à pied pour montrer le quartier.",
    durationMinutes: 45,
    defaultPrice: 40,
    minPrice: 25,
    maxPrice: 80,
  },
  visite_soir: {
    label: "Visite du soir",
    description: "30 minutes le soir pour entendre le bruit réel de la rue.",
    durationMinutes: 30,
    defaultPrice: 35,
    minPrice: 20,
    maxPrice: 70,
  },
  question_ecrite: {
    label: "Réponse écrite",
    description: "Réponse écrite aux questions du chercheur, sous 24 h.",
    durationMinutes: 0,
    defaultPrice: 8,
    minPrice: 5,
    maxPrice: 20,
  },
};

export const WEEKDAYS = ["Lundi", "Mardi", "Mercredi", "Jeudi", "Vendredi", "Samedi", "Dimanche"];

// Ce que l'habitant touche réellement (80 %), arrondi au centime.
export function residentShare(priceEuros: number) {
  return Math.round(priceEuros * (1 - COMMISSION_RATE) * 100) / 100;
}
