"use client";

import { create } from "zustand";
import { createClient } from "@/lib/supabase";
import { useEffect } from "react";

export interface JournalSettings {
  timeframes: string[];
  ratings: string[];
  po3Times: string[];
  dols: string[];
  models: string[];
}

const defaultSettings: JournalSettings = {
  timeframes: ["30sec", "1min", "2min", "3min", "4min", "5min"],
  ratings: ["A+", "A", "A-", "B+", "B", "B-"],
  po3Times: ["9:30", "9:45", "10:00", "10:15", "10:30"],
  dols: [
    "ERL",
    "PD-X",
    "PW-X",
    "imbalance",
    "HR",
    "session liquidity",
    "Data-x",
    "1:1",
  ],
  models: ["BNQ", "MECH", "PDI", "CONT"],
};

type ArrayKeys = {
  [K in keyof JournalSettings]: JournalSettings[K] extends string[] ? K : never;
}[keyof JournalSettings];

interface SettingsStore {
  settings: JournalSettings;
  hydrated: boolean;
  userId: string | null;
  setUserId: (id: string | null) => void;
  setHydrated: (h: boolean) => void;
  setSettings: (s: JournalSettings) => void;
  loadSettings: (userId: string) => Promise<void>;
  addOption: (key: ArrayKeys, option: string) => Promise<void>;
  removeOption: (key: ArrayKeys, option: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>((set, get) => ({
  settings: defaultSettings,
  hydrated: false,
  userId: null,
  setUserId: (id) => set({ userId: id }),
  setHydrated: (h) => set({ hydrated: h }),
  setSettings: (s) => set({ settings: s }),

  loadSettings: async (userId: string) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("user_settings")
      .select("settings")
      .eq("user_id", userId)
      .single();

    if (data && data.settings) {
      set({
        settings: {
          ...defaultSettings,
          ...(data.settings as unknown as Partial<JournalSettings>),
        },
        hydrated: true,
      });
    } else {
      set({ settings: defaultSettings, hydrated: true });
      await supabase
        .from("user_settings")
        .insert({ user_id: userId, settings: defaultSettings as any });
    }
  },

  addOption: async (key, option) => {
    const state = get();
    if (!state.userId) return;
    const list = state.settings[key];
    if (Array.isArray(list) && !list.includes(option)) {
      const newSettings = { ...state.settings, [key]: [...list, option] };
      set({ settings: newSettings });

      const supabase = createClient();
      await supabase
        .from("user_settings")
        .update({ settings: newSettings as any })
        .eq("user_id", state.userId);
    }
  },

  removeOption: async (key, option) => {
    const state = get();
    if (!state.userId) return;
    const list = state.settings[key];
    if (Array.isArray(list)) {
      const newSettings = {
        ...state.settings,
        [key]: list.filter((o) => o !== option),
      };
      set({ settings: newSettings });

      const supabase = createClient();
      await supabase
        .from("user_settings")
        .update({ settings: newSettings as any })
        .eq("user_id", state.userId);
    }
  },
}));

export function useSettings() {
  const store = useSettingsStore();

  useEffect(() => {
    if (store.userId) return;

    let mounted = true;
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (!mounted) return;
      if (data.user) {
        store.setUserId(data.user.id);
        store.loadSettings(data.user.id);
      } else {
        store.setHydrated(true);
      }
    });

    return () => {
      mounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store.userId]);

  return {
    settings: store.settings,
    setSettings: store.setSettings,
    hydrated: store.hydrated,
    addOption: store.addOption,
    removeOption: store.removeOption,
  };
}
