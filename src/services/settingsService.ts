import type { AppSettings, SiteContent } from "../types";
import { safeParse } from "./utils";

export const SETTINGS_DOC_PATH = "app_settings/business";
export const SETTINGS_STORAGE_KEY = "orbitrio_app_settings";

export const DEFAULT_APP_SETTINGS: AppSettings = {
  companyName: "Orbitrio Trades",
  supportEmail: "support@orbitriotrades.com",
  supportPhone: "+1 (000) 000-0000",
  companyAddress: "Not configured",
  senderName: "Orbitrio Trades",
  replyToEmail: "",
  tawkPropertyId: "6a395d28c9a6011d42f66d6c",
  tawkWidgetId: "1jro17q8a"
};

export const mergeSiteContent = (current: SiteContent, updates: Partial<SiteContent>): SiteContent => ({
  ...current,
  ...updates
});

export const normalizeAppSettings = (settings: Partial<AppSettings> = {}): AppSettings => ({
  companyName: (settings.companyName || DEFAULT_APP_SETTINGS.companyName).trim(),
  supportEmail: (settings.supportEmail || DEFAULT_APP_SETTINGS.supportEmail).trim(),
  supportPhone: (settings.supportPhone || DEFAULT_APP_SETTINGS.supportPhone).trim(),
  companyAddress: (settings.companyAddress || DEFAULT_APP_SETTINGS.companyAddress).trim(),
  senderName: (settings.senderName || DEFAULT_APP_SETTINGS.senderName).trim(),
  replyToEmail: (settings.replyToEmail || "").trim(),
  tawkPropertyId: (settings.tawkPropertyId || DEFAULT_APP_SETTINGS.tawkPropertyId).trim(),
  tawkWidgetId: (settings.tawkWidgetId || DEFAULT_APP_SETTINGS.tawkWidgetId).trim()
});

export const mergeAppSettings = (current: AppSettings, updates: Partial<AppSettings>): AppSettings =>
  normalizeAppSettings({ ...current, ...updates });

export const loadLocalAppSettings = (): AppSettings => {
  if (typeof window === "undefined") return DEFAULT_APP_SETTINGS;
  return normalizeAppSettings(safeParse<Partial<AppSettings>>(window.localStorage.getItem(SETTINGS_STORAGE_KEY), DEFAULT_APP_SETTINGS));
};

export const saveLocalAppSettings = (settings: AppSettings) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(SETTINGS_STORAGE_KEY, JSON.stringify(normalizeAppSettings(settings)));
};
