// Affichage des dates à l'heure de Paris, en français.
const TZ = "Europe/Paris";

export function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString("fr-FR", {
    timeZone: TZ,
    weekday: "long",
    day: "numeric",
    month: "long",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDay(iso: string) {
  return new Date(iso).toLocaleDateString("fr-FR", { timeZone: TZ, weekday: "long", day: "numeric", month: "long" });
}

export function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString("fr-FR", { timeZone: TZ, hour: "2-digit", minute: "2-digit" });
}
