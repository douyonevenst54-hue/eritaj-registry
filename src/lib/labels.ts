export const MEDIUMS = [
  "PAINTING",
  "SCULPTURE",
  "METALWORK",
  "SEQUIN_FLAG",
  "MIXED_MEDIA",
  "TEXTILE",
  "CERAMIC",
  "OTHER",
] as const;

export const mediumLabel: Record<string, string> = {
  PAINTING: "Penti",
  SCULPTURE: "Eskilti",
  METALWORK: "Fè koupe",
  SEQUIN_FLAG: "Drapo (pay)",
  MIXED_MEDIA: "Teknik mikst",
  TEXTILE: "Twal",
  CERAMIC: "Seramik",
  OTHER: "Lòt",
};

export const IMAGE_KINDS = ["FRONT", "ARTIST_WITH_WORK", "SIGNATURE", "BACK", "DETAIL"] as const;
export type ImageKindName = (typeof IMAGE_KINDS)[number];

export const REQUIRED_KINDS: ImageKindName[] = ["FRONT", "ARTIST_WITH_WORK"];
export const MAX_DETAIL_IMAGES = 3;

export const imageKindLabel: Record<string, { label: string; hint: string }> = {
  FRONT: { label: "Devan zèv la", hint: "Tout zèv la, byen klere, san rebò koupe." },
  ARTIST_WITH_WORK: {
    label: "Ou menm ak zèv la",
    hint: "Yon foto kote yo wè figi w ak zèv la ansanm.",
  },
  SIGNATURE: { label: "Siyati a", hint: "Gwo plan sou siyati w sou zèv la." },
  BACK: { label: "Dèyè zèv la", hint: "Dèyè twal la oswa anba eskilti a." },
  DETAIL: { label: "Detay", hint: "Jiska 3 foto detay (opsyonèl)." },
};

export const eventLabel: Record<string, string> = {
  CREATED: "Kreye",
  REGISTERED: "Anrejistre nan Eritaj",
  SOLD: "Vann",
  GIFTED: "Bay kado",
  INHERITED: "Eritye",
  LOANED: "Prete",
  EXHIBITED: "Ekspoze",
  RETURNED: "Retounen",
  DISPUTE_OPENED: "Kontestasyon louvri",
  DISPUTE_RESOLVED: "Kontestasyon rezoud",
  CORRECTION: "Koreksyon",
};

export const artworkStatusLabel: Record<string, string> = {
  DRAFT: "Bouyon",
  SUBMITTED: "Soumèt",
  REGISTERED: "Anrejistre",
  DISPUTED: "Konteste",
  WITHDRAWN: "Retire",
};
