import { useState, useEffect } from 'react';

export type Language = 'en' | 'es' | 'fr' | 'de';

interface UserPreferences {
  language: Language;
  autoDownloadImages: boolean;
}

const PREFERENCES_KEY = 'user_preferences';

const DEFAULT_PREFERENCES: UserPreferences = {
  language: 'en',
  autoDownloadImages: true,
};

export const useUserPreferences = () => {
  const [preferences, setPreferencesState] = useState<UserPreferences>(() => {
    const stored = localStorage.getItem(PREFERENCES_KEY);
    if (stored) {
      try {
        return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
      } catch {
        return DEFAULT_PREFERENCES;
      }
    }
    return DEFAULT_PREFERENCES;
  });

  useEffect(() => {
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
  }, [preferences]);

  const setLanguage = (language: Language) => {
    setPreferencesState(prev => ({ ...prev, language }));
  };

  const setAutoDownloadImages = (autoDownloadImages: boolean) => {
    setPreferencesState(prev => ({ ...prev, autoDownloadImages }));
  };

  const resetPreferences = () => {
    setPreferencesState(DEFAULT_PREFERENCES);
  };

  return {
    preferences,
    setLanguage,
    setAutoDownloadImages,
    resetPreferences,
  };
};
