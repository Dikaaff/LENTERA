import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { isLanguage, type Language } from "./language";
import { id } from "./translations/id";
import { en } from "./translations/en";

export type TranslationKey = keyof typeof id;
type Vars = Record<string, string | number>;

const STORAGE_KEY = "lentera.lang.v1";
const dictionaries: Record<Language, Record<TranslationKey, string>> = { id, en };

export const translate = (language: Language, key: TranslationKey, vars?: Vars): string => {
  const template = dictionaries[language][key] ?? dictionaries.id[key];
  if (!vars) return template;
  return Object.entries(vars).reduce(
    (text, [name, value]) => text.split(`{${name}}`).join(String(value)),
    template,
  );
};

const detect = (): Language => {
  if (typeof window === "undefined") return "id";
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (isLanguage(saved)) return saved;
  } catch {
    // Blocked storage falls through to the browser language.
  }
  return navigator.language.toLowerCase().startsWith("en") ? "en" : "id";
};

interface LanguageValue {
  language: Language;
  setLanguage: (next: Language) => void;
  t: (key: TranslationKey, vars?: Vars) => string;
}

const LanguageContext = createContext<LanguageValue | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(detect);

  const setLanguage = useCallback((next: Language) => {
    setLanguageState(next);
    try {
      window.localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // The current session still uses the selected language.
    }
  }, []);

  useEffect(() => {
    document.documentElement.lang = language;
    document.title = translate(language, "app.title");
    document
      .querySelector('meta[name="description"]')
      ?.setAttribute("content", translate(language, "app.description"));
  }, [language]);

  const value = useMemo<LanguageValue>(
    () => ({
      language,
      setLanguage,
      t: (key, vars) => translate(language, key, vars),
    }),
    [language, setLanguage],
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageValue {
  const value = useContext(LanguageContext);
  if (!value) throw new Error("useLanguage must be used inside LanguageProvider");
  return value;
}
