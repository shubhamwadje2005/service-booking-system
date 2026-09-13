"use client";

import { useState, useEffect } from "react";

/**
 * Custom hook that delays updating the debounced value until after `delay` milliseconds
 * have elapsed since the last time the value changed.
 * Prevents hammering backend APIs and databases on every keystroke.
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;
