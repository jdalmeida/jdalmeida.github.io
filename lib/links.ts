// Builds a tracked link; lib/track.ts reads these params and /api/track stores them on the visit.
export type CampaignLink = { source: string; medium?: string | null; campaign: string; content?: string | null; path: string };

export function linkUrl(base: string, l: CampaignLink) {
  const q = new URLSearchParams({ utm_source: l.source });
  if (l.medium) q.set("utm_medium", l.medium);
  q.set("utm_campaign", l.campaign);
  if (l.content) q.set("utm_content", l.content);
  return `${base}${l.path}?${q}`;
}

export const slugify = (v: string) => v.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().trim().replace(/[^a-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

// One click fills source, medium and campaign; everything stays editable.
export const PRESETS = [
  { label: "Instagram · bio", source: "instagram", medium: "social", campaign: "bio" },
  { label: "Instagram · story", source: "instagram", medium: "social", campaign: "story" },
  { label: "Instagram · post", source: "instagram", medium: "social", campaign: "post" },
  { label: "Instagram · direct", source: "instagram", medium: "dm", campaign: "direct" },
  { label: "LinkedIn · perfil", source: "linkedin", medium: "social", campaign: "perfil" },
  { label: "LinkedIn · post", source: "linkedin", medium: "social", campaign: "post" },
  { label: "WhatsApp", source: "whatsapp", medium: "dm", campaign: "conversa" },
  { label: "Currículo", source: "curriculo", medium: "documento", campaign: "cv" },
  { label: "E-mail / assinatura", source: "email", medium: "email", campaign: "assinatura" },
  { label: "QR code em evento", source: "qrcode", medium: "offline", campaign: "evento" },
];
