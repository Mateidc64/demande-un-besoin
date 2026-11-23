// Logo « maison bulle » : une maison qui a aussi la forme d'une bulle de dialogue.
export function LogoMark({ size = 32, dots = "#ffffff" }: { size?: number; dots?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 52 52" aria-hidden="true">
      <path
        d="M8 24 L26 9 L44 24 V40 a4 4 0 0 1 -4 4 H20 L12 50 V44 H12 a4 4 0 0 1 -4 -4 Z"
        fill="#F26A21"
      />
      <circle cx="20" cy="31" r="2.6" fill={dots} />
      <circle cx="26" cy="31" r="2.6" fill={dots} />
      <circle cx="32" cy="31" r="2.6" fill={dots} />
    </svg>
  );
}

// Logo complet : le dessin + « Demande à un voisin », avec « voisin » en orange.
export function Logo() {
  return (
    <span className="flex items-center gap-2">
      <LogoMark />
      <span className="text-lg font-extrabold tracking-tight text-nuit">
        Demande à un <span className="text-voisin">voisin</span>
      </span>
    </span>
  );
}
