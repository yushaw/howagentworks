import { usePreferencesContext } from "@/components/PreferencesProvider";

export function useUserPreferences() {
  return usePreferencesContext();
}
