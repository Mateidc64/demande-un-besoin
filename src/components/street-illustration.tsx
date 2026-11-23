// Illustration de l'accueil : une rue de quartier en fin de journée, quelques fenêtres allumées.
// En attendant de vraies photos du quartier pilote (voir la charte graphique, « Style photo »).

// Chaque immeuble : position x, largeur, hauteur, couleur de façade.
const buildings = [
  { x: 0, w: 92, h: 150, color: "#2A4D68" },
  { x: 96, w: 118, h: 200, color: "#15364F" },
  { x: 218, w: 84, h: 132, color: "#3B6280" },
  { x: 306, w: 126, h: 186, color: "#1F4560" },
  { x: 436, w: 70, h: 146, color: "#2A4D68" },
  { x: 510, w: 90, h: 214, color: "#15364F" },
];

// Fenêtres allumées (les autres restent sombres), repérées par « immeuble-ligne-colonne ».
const lit = new Set(["1-1-0", "1-3-2", "3-0-1", "3-2-0", "3-2-2", "5-1-1", "5-4-0", "0-1-1", "2-0-0", "4-2-0"]);

export function StreetIllustration() {
  const ground = 236;
  return (
    <svg
      viewBox="0 0 600 260"
      preserveAspectRatio="xMidYMax slice"
      className="h-full w-full"
      role="img"
      aria-label="Une rue de quartier en fin de journée, avec des fenêtres allumées"
    >
      <rect width="600" height="260" fill="#FFE3CC" />
      <circle cx="470" cy="70" r="34" fill="#FFC79E" />
      {buildings.map((b, i) => {
        const top = ground - b.h;
        const cols = Math.max(2, Math.floor((b.w - 16) / 26));
        const rows = Math.floor((b.h - 50) / 30);
        const gap = (b.w - cols * 14) / (cols + 1);
        return (
          <g key={i}>
            <rect x={b.x} y={top} width={b.w} height={b.h} fill={b.color} />
            {Array.from({ length: rows }, (_, r) =>
              Array.from({ length: cols }, (_, c) => (
                <rect
                  key={`${r}-${c}`}
                  x={b.x + gap + c * (14 + gap)}
                  y={top + 16 + r * 30}
                  width="14"
                  height="18"
                  rx="2"
                  fill={lit.has(`${i}-${r}-${c}`) ? "#F26A21" : "#4C7391"}
                />
              )),
            )}
            <rect x={b.x + b.w / 2 - 9} y={ground - 28} width="18" height="28" rx="2" fill="#FBF7F2" />
          </g>
        );
      })}
      <circle cx="60" cy="214" r="24" fill="#1E7A4F" />
      <rect x="57" y="214" width="6" height="22" fill="#15364F" />
      <circle cx="400" cy="210" r="28" fill="#2F9E6B" />
      <rect x="397" y="212" width="6" height="24" fill="#15364F" />
      <rect y={ground} width="600" height={260 - ground} fill="#E3E8ED" />
    </svg>
  );
}
