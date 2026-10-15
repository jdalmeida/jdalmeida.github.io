import type { Credential } from "@/lib/credential-meta";

const MONO = "JetBrains Mono,ui-monospace,SF Mono,Menlo,monospace";
const DISPLAY = "Space Grotesk,Helvetica Neue,Arial,sans-serif";

// Event name on one line when short, else split at the space that leaves the two lines closest in length.
function titleLines(name: string): string[] {
  const words = name.trim().split(/\s+/);
  if (name.length <= 14 || words.length < 2) return [name];
  let best = [name];
  let width = Infinity;
  for (let i = 1; i < words.length; i++) {
    const lines = [words.slice(0, i).join(" "), words.slice(i).join(" ")];
    const w = Math.max(...lines.map((l) => l.length));
    if (w < width) [best, width] = [lines, w];
  }
  return best;
}

// The printed badge (1000×1450), drawn from the credential's data: white header with the slot and the holder's name,
// the event's color in the middle, its dark shade at the foot with the role.
// `label` names it for screen readers; without one it is decoration (e.g. inside a button that already says the event).
export default function CredentialBadge({ event, className, label }: {
  event: Pick<Credential, "name" | "year" | "place" | "role" | "color" | "darkColor">; className?: string; label?: string;
}) {
  const lines = titleLines(event.name);
  const longest = Math.max(...lines.map((l) => l.length));
  const size = Math.min(96, Math.floor(1560 / Math.max(longest, 1))); // ~0.6em per glyph within 940 units
  const role = event.role.toUpperCase();
  return (
    <svg className={className} viewBox="0 0 1000 1450" {...(label ? { role: "img", "aria-label": label } : { "aria-hidden": true })}>
      <rect width="1000" height="1450" rx="24" fill="#ffffff" />
      <rect y="370" width="1000" height="850" fill={event.color} />
      <rect y="1220" width="1000" height="230" fill={event.darkColor} />
      <rect x="0" y="362" width="1000" height="8" fill="#0a0a0b" />
      <rect x="449" y="82" width="102" height="86" rx="43" fill="#e9ebef" stroke="#0a0a0b" strokeWidth="6" />
      <rect x="475" y="98" width="50" height="54" rx="27" fill="#0a0a0b" />
      <text x="500" y="230" textAnchor="middle" fontFamily={MONO} fontSize="30" fontWeight="600" letterSpacing="12" fill="#6b6f77">CREDENCIAL</text>
      <text x="500" y="300" textAnchor="middle" fontFamily="Instrument Sans,Helvetica Neue,Arial,sans-serif" fontSize="34" fontWeight="600" fill="#0a0a0b">João Gabriel de Almeida</text>
      {lines.map((line, i) => (
        <text key={i} x="500" y={lines.length === 1 ? 700 : 640 + i * 100} textAnchor="middle" fontFamily={DISPLAY} fontSize={size} fontWeight="700" fill="#ffffff">{line}</text>
      ))}
      <rect x="350" y="838" width="300" height="4" fill="#ffffff" opacity=".5" />
      <text x="500" y="948" textAnchor="middle" fontFamily={MONO} fontSize="86" fontWeight="600" letterSpacing="18" dx="9" fill="#ffffff">{event.year}</text>
      <text x="500" y="1030" textAnchor="middle" fontFamily={MONO} fontSize="32" letterSpacing="10" fill="#ffffff" opacity=".82">{event.place.toUpperCase()}</text>
      <text x="500" y="1360" textAnchor="middle" fontFamily={MONO} fontSize={Math.min(64, Math.floor(1250 / Math.max(role.length, 1)))} fontWeight="600" letterSpacing="9" fill="#ffffff">{role}</text>
      <rect x="3" y="3" width="994" height="1444" rx="22" fill="none" stroke="#0a0a0b" strokeWidth="6" />
    </svg>
  );
}
