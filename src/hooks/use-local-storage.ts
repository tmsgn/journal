"use client";

import { useEffect, useRef, useState } from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue);
  const [hydrated, setHydrated] = useState(false);
  const hasReadInitial = useRef(false);

  useEffect(() => {
    if (typeof window === "undefined" || hasReadInitial.current) {
      return;
    }

    hasReadInitial.current = true;

    try {
      const raw = window.localStorage.getItem(key);
      if (raw !== null) {
        setValue(JSON.parse(raw) as T);
      }
    } catch {
      setValue(initialValue);
    } finally {
      setHydrated(true);
    }
  }, [key, initialValue]);

  useEffect(() => {
    if (typeof window === "undefined" || !hydrated) {
      return;
    }

    window.localStorage.setItem(key, JSON.stringify(value));
  }, [key, value, hydrated]);

  return { value, setValue, hydrated };
}
