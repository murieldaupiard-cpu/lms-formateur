"use client";

// ---------------------------------------------------------------------------
// L'Arène CADGA — custom gladiator avatar.
//
// An avatar is a compact string "<helmet>:<skinHex>:<accentHex>", never an
// emoji. It's built from three independently chosen parts (skin tone,
// helmet/hairstyle, accent colour) so every player can look genuinely
// different — shared as-is between the host screen (page.tsx) and the
// learner join page (join/page.tsx).
// ---------------------------------------------------------------------------

export const SKIN_TONES = ["#ffdbb4", "#edb98a", "#d08b5b", "#ae7242", "#8d5524", "#5c3a21"];

export const ACCENT_COLORS = ["#e63946", "#f4a340", "#2a9d8f", "#457b9d", "#9b5de5", "#06d6a0"];

export const HELMETS = [
  { id: "spartan", label: "Casque à crête" },
  { id: "crest", label: "Crête large" },
  { id: "laurel", label: "Couronne de laurier" },
  { id: "curls", label: "Boucles" },
  { id: "mohawk", label: "Crête colorée" },
  { id: "bandana", label: "Bandana" },
] as const;

export type HelmetId = (typeof HELMETS)[number]["id"];

export const DEFAULT_AVATAR = "spartan:#d08b5b:#e63946";

const BRONZE = "#caa46a";
const INK = "#1b1330";

export function encodeAvatar(helmet: string, skin: string, accent: string): string {
  return `${helmet}:${skin}:${accent}`;
}

export function decodeAvatar(code?: string | null): { helmet: HelmetId; skin: string; accent: string } {
  const parts = (code || DEFAULT_AVATAR).split(":");
  const helmet = (parts[0] as HelmetId) || "spartan";
  const skin = parts[1] || SKIN_TONES[2];
  const accent = parts[2] || ACCENT_COLORS[0];
  return { helmet, skin, accent };
}

function Headwear({ id, accent }: { id: string; accent: string }) {
  switch (id) {
    case "spartan":
      return (
        <>
          <path d="M18 23 A14 14 0 0 1 46 23 L46 15 A14 14 0 0 0 18 15 Z" fill={BRONZE} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
          <path d="M28 15 L32 1 L36 15 Z" fill={accent} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
        </>
      );
    case "crest":
      return (
        <>
          <path d="M18 23 A14 14 0 0 1 46 23 L46 15 A14 14 0 0 0 18 15 Z" fill={BRONZE} stroke={INK} strokeWidth={2} strokeLinejoin="round" />
          <path d="M15 15 Q32 2 49 15 L49 20 Q32 8 15 20 Z" fill={accent} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
        </>
      );
    case "laurel":
      return (
        <g fill={accent} stroke={INK} strokeWidth={1.2}>
          <ellipse cx={17} cy={21} rx={4} ry={2.2} transform="rotate(-25 17 21)" />
          <ellipse cx={14.5} cy={16} rx={4} ry={2.2} transform="rotate(-50 14.5 16)" />
          <ellipse cx={15} cy={10} rx={4} ry={2.2} transform="rotate(-78 15 10)" />
          <ellipse cx={47} cy={21} rx={4} ry={2.2} transform="rotate(25 47 21)" />
          <ellipse cx={49.5} cy={16} rx={4} ry={2.2} transform="rotate(50 49.5 16)" />
          <ellipse cx={49} cy={10} rx={4} ry={2.2} transform="rotate(78 49 10)" />
        </g>
      );
    case "curls":
      return (
        <>
          <path d="M19 22 A13 13 0 0 1 45 22" fill="none" stroke={BRONZE} strokeWidth={4} strokeLinecap="round" />
          <g fill={accent} stroke={INK} strokeWidth={1.5}>
            <circle cx={20} cy={16} r={4.6} />
            <circle cx={28} cy={10} r={5} />
            <circle cx={36} cy={10} r={5} />
            <circle cx={44} cy={16} r={4.6} />
            <circle cx={32} cy={8} r={5.2} />
          </g>
        </>
      );
    case "mohawk":
      return (
        <>
          <path d="M19 22 A13 13 0 0 1 45 22" fill="none" stroke={BRONZE} strokeWidth={4} strokeLinecap="round" />
          <path d="M23 19 L27 2 L30.5 15 L32 3 L33.5 15 L37 2 L41 19 Z" fill={accent} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
        </>
      );
    case "bandana":
      return (
        <>
          <path d="M16 24 Q32 6 48 24 L47 30 Q32 15 17 30 Z" fill={accent} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
          <path d="M46 25 L55 27 L54 32 L47 30 Z" fill={accent} stroke={INK} strokeWidth={1.5} strokeLinejoin="round" />
        </>
      );
    default:
      return null;
  }
}

export function GladiatorAvatar({
  code,
  size = 40,
  className,
}: {
  code?: string | null;
  size?: number;
  className?: string;
}) {
  const { helmet, skin, accent } = decodeAvatar(code);
  return (
    <svg viewBox="0 0 64 64" width={size} height={size} className={className} aria-hidden="true" style={{ flex: "none" }}>
      <circle cx={32} cy={32} r={30} fill={accent} opacity={0.16} />
      <path d="M12 62 Q12 40 32 40 Q52 40 52 62 Z" fill={BRONZE} stroke={INK} strokeWidth={2} />
      <circle cx={32} cy={52} r={4} fill={accent} stroke={INK} strokeWidth={1.5} />
      <Headwear id={helmet} accent={accent} />
      <circle cx={32} cy={27} r={12} fill={skin} stroke={INK} strokeWidth={2} />
      <circle cx={27.5} cy={27} r={1.6} fill={INK} />
      <circle cx={36.5} cy={27} r={1.6} fill={INK} />
      <path d="M26 32 Q32 35.5 38 32" stroke={INK} strokeWidth={2} fill="none" strokeLinecap="round" />
    </svg>
  );
}

// Three-row picker (skin tone, helmet/hairstyle, accent colour) shared by the
// host's "choose your avatar" screen and the learner join page.
export function AvatarBuilder({ value, onChange }: { value: string; onChange: (code: string) => void }) {
  const { helmet, skin, accent } = decodeAvatar(value);

  return (
    <div className="qz-builder">
      <GladiatorAvatar code={value} size={84} className="qz-builder-preview" />

      <div className="qz-builder-row">
        <span className="qz-builder-label">Teint</span>
        <div className="qz-builder-swatches">
          {SKIN_TONES.map((tone) => (
            <button
              key={tone}
              type="button"
              className={`qz-swatch ${skin === tone ? "selected" : ""}`}
              style={{ background: tone }}
              onClick={() => onChange(encodeAvatar(helmet, tone, accent))}
              aria-label={`Teint ${tone}`}
            />
          ))}
        </div>
      </div>

      <div className="qz-builder-row">
        <span className="qz-builder-label">Casque / coiffure</span>
        <div className="qz-builder-helmets">
          {HELMETS.map((h) => (
            <button
              key={h.id}
              type="button"
              className={`qz-helmet-opt ${helmet === h.id ? "selected" : ""}`}
              onClick={() => onChange(encodeAvatar(h.id, skin, accent))}
              aria-label={h.label}
              title={h.label}
            >
              <GladiatorAvatar code={encodeAvatar(h.id, skin, accent)} size={40} />
            </button>
          ))}
        </div>
      </div>

      <div className="qz-builder-row">
        <span className="qz-builder-label">Couleur</span>
        <div className="qz-builder-swatches">
          {ACCENT_COLORS.map((color) => (
            <button
              key={color}
              type="button"
              className={`qz-swatch ${accent === color ? "selected" : ""}`}
              style={{ background: color }}
              onClick={() => onChange(encodeAvatar(helmet, skin, color))}
              aria-label={`Couleur ${color}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
