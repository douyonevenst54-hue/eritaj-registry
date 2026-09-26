// Shared by the server (to store the statement) and the browser (to preview it).
// The artist never edits this text: the registry records exactly this wording.

export const STATEMENT_LOCALES = ["ht", "fr", "en"] as const;
export type StatementLocale = (typeof STATEMENT_LOCALES)[number];

export function buildStatement(
  locale: StatementLocale,
  displayName: string,
  title: string,
  year: number | null,
): string {
  switch (locale) {
    case "fr":
      return `Moi, ${displayName}, je déclare être l'auteur de l'œuvre « ${title} »${
        year ? `, réalisée en ${year}` : ""
      }. Les photos montrent l'œuvre dans son état actuel. Je comprends que cette déclaration sera publique dans l'Eritaj Registry et qu'elle ne pourra pas être effacée.`;
    case "en":
      return `I, ${displayName}, declare that I created the work "${title}"${
        year ? ` in ${year}` : ""
      }. The photos show the work as it is today. I understand that this declaration will be public in the Eritaj Registry and cannot be erased.`;
    default:
      return `Mwen menm, ${displayName}, mwen deklare se mwen ki fè zèv sa a, «${title}»${
        year ? `, an ${year}` : ""
      }. Foto yo montre zèv la jan li ye jodi a. Mwen konprann deklarasyon sa a ap piblik nan Eritaj Registry, e yo p ap ka efase l.`;
  }
}

export function normalizeName(name: string): string {
  return name.normalize("NFC").trim().replace(/\s+/g, " ").toLowerCase();
}
