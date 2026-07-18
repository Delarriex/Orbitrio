import { useState, useEffect } from "react";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { SiteContent, AppSettings } from "../../types";
import {
  USE_MOCK_DATA,
  loadLocalAppSettings,
  saveLocalAppSettings,
  mergeAppSettings,
  normalizeAppSettings,
  DEFAULT_SITE_CONTENT
} from "../../services";

/**
 * Site-wide content (marketing copy) and business settings (support email,
 * Tawk widget IDs, etc). Backed entirely by Supabase's `site_content` and
 * `app_settings` tables — singleton rows keyed by `key`. No Firebase.
 */
export function useSiteSettings(supabase: SupabaseClient) {
  const [siteContent, setSiteContent] = useState<SiteContent>(DEFAULT_SITE_CONTENT);
  const [appSettings, setAppSettings] = useState<AppSettings>(() => loadLocalAppSettings());

  const updateSiteContent = async (newContent: Partial<SiteContent>) => {
    const merged = { ...siteContent, ...newContent };
    setSiteContent(merged);
    if (USE_MOCK_DATA) return;

    try {
      const { error } = await supabase
        .from("site_content")
        .upsert({ key: "texts", value: merged }, { onConflict: "key" });
      if (error) throw error;
    } catch (error) {
      console.error("Failed to update site content:", error);
    }
  };

  const updateAppSettings = async (settings: Partial<AppSettings>) => {
    const nextSettings = mergeAppSettings(appSettings, settings);
    setAppSettings(nextSettings);
    saveLocalAppSettings(nextSettings);

    if (USE_MOCK_DATA) return;

    try {
      const { error } = await supabase
        .from("app_settings")
        .upsert({ key: "business", value: nextSettings }, { onConflict: "key" });
      if (error) throw error;
    } catch (error) {
      console.error("Failed to update app settings:", error);
      throw error;
    }
  };

  useEffect(() => {
    if (USE_MOCK_DATA) return;

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("site_content")
        .select("value")
        .eq("key", "texts")
        .maybeSingle();

      if (!cancelled) {
        if (error) {
          console.error("Failed to load site content:", error);
        } else if (data) {
          setSiteContent(prev => ({ ...prev, ...(data.value as Partial<SiteContent>) }));
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (USE_MOCK_DATA) {
      setAppSettings(loadLocalAppSettings());
      return;
    }

    let cancelled = false;
    (async () => {
      const { data, error } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "business")
        .maybeSingle();

      if (!cancelled) {
        if (error) {
          console.error("Failed to load app settings:", error);
        } else if (data) {
          const nextSettings = normalizeAppSettings(data.value as Partial<AppSettings>);
          setAppSettings(nextSettings);
          saveLocalAppSettings(nextSettings);
        }
      }
    })();

    return () => { cancelled = true; };
  }, []);

  return { siteContent, appSettings, updateSiteContent, updateAppSettings };
}