"use client";

import { useLocalStorage } from "./use-local-storage";

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

export function useSettings() {
  const {
    value: settings,
    setValue: setSettings,
    hydrated,
  } = useLocalStorage<JournalSettings>(
    "ifvg_journal_settings",
    defaultSettings,
  );

  type ArrayKeys = {
    [K in keyof JournalSettings]: JournalSettings[K] extends string[]
      ? K
      : never;
  }[keyof JournalSettings];

  const addOption = (key: ArrayKeys, option: string) => {
    const list = settings[key];
    if (Array.isArray(list) && !list.includes(option)) {
      setSettings((prev) => ({ ...prev, [key]: [...list, option] }));
    }
  };

  const removeOption = (key: ArrayKeys, option: string) => {
    setSettings((prev) => {
      const list = prev[key];
      if (Array.isArray(list)) {
        return { ...prev, [key]: list.filter((o) => o !== option) };
      }
      return prev;
    });
  };

  return {
    settings,
    setSettings,
    hydrated,
    addOption,
    removeOption,
  };
}
