// Recherche d'adresses avec le service officiel et gratuit de l'État (Géoplateforme / IGN),
// le successeur de api-adresse.data.gouv.fr. Appelé directement depuis le navigateur.

export type AddressSuggestion = {
  label: string; // ex. « 8 Boulevard du Port 80000 Amiens »
  id: string; // identifiant unique de l'adresse : sert à repérer « le même immeuble »
  type: string; // « housenumber » = adresse précise avec numéro
  street: string | null;
  city: string | null;
  district: string | null; // arrondissement pour Paris, Lyon, Marseille
  lat: number;
  lng: number;
};

type ApiFeature = {
  geometry: { coordinates: [number, number] };
  properties: {
    label: string;
    id: string;
    type: string;
    name?: string;
    street?: string;
    city?: string;
    district?: string;
  };
};

export async function searchAddresses(query: string): Promise<AddressSuggestion[]> {
  if (query.trim().length < 3) return [];
  const url = `https://data.geopf.fr/geocodage/search?autocomplete=1&limit=5&q=${encodeURIComponent(query)}`;
  const response = await fetch(url);
  if (!response.ok) return [];
  const data: { features?: ApiFeature[] } = await response.json();
  return (data.features ?? []).map((f) => ({
    label: f.properties.label,
    id: f.properties.id,
    type: f.properties.type,
    street: f.properties.street ?? f.properties.name ?? null,
    city: f.properties.city ?? null,
    district: f.properties.district ?? null,
    lng: f.geometry.coordinates[0],
    lat: f.geometry.coordinates[1],
  }));
}
