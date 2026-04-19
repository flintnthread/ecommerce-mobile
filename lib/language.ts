import { useCallback } from "react";

/**
 * Lightweight i18n hook. `tr` returns the key as-is until a real catalog is wired.
 * Used by screens that were written against a missing `@/lib/i18n-react-native` layer.
 */
export function useLanguage() {
  const tr = useCallback((key: string) => key, []);
  return { tr };
}
