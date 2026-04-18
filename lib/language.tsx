import { useCallback } from "react";

/**
 * Lightweight translation hook used by screens that call `tr(...)`.
 * Returns the key as-is until a real i18n layer is wired up.
 */
export function useLanguage() {
  const tr = useCallback((key: string) => key, []);
  return { tr };
}
