import { UserPreferences } from "./types";

const PREFERENCES_KEY = "devtask_preferences_v1";

export const DEFAULT_PREFERENCES: UserPreferences = {
  defaultPriority: "med",
  startOfWeek: "monday",
  dateFormat: "standard",
  apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "/api/v1",
  offlineMode: false,
};

export function getPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }
  try {
    const raw = localStorage.getItem(PREFERENCES_KEY);
    if (!raw) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(raw) };
  } catch {
    return DEFAULT_PREFERENCES;
  }
}

export function savePreferences(preferences: Partial<UserPreferences>): UserPreferences {
  if (typeof window === "undefined") {
    return DEFAULT_PREFERENCES;
  }
  const current = getPreferences();
  const updated = { ...current, ...preferences };
  localStorage.setItem(PREFERENCES_KEY, JSON.stringify(updated));
  return updated;
}
