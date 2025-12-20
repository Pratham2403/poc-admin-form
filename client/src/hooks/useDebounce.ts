import { useEffect, useRef } from "react";

/**
 * Custom hook for debounced effects
 * @param callback - The function to call after debounce delay
 * @param dependencies - Array of dependencies to watch for changes
 * @param delay - Delay in milliseconds. Can be a number or a function that returns a number for conditional delays
 * @example
 * // Fixed delay
 * useDebouncedEffect(() => loadData(), [searchQuery], 300);
 *
 * // Conditional delay
 * useDebouncedEffect(() => loadData(), [searchQuery], (deps) => deps[0] ? 300 : 0);
 */
export const useDebouncedEffect = (
  callback: () => void,
  dependencies: React.DependencyList,
  delay: number | ((dependencies: React.DependencyList) => number) = 300
) => {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // Clear previous timeout
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Calculate delay (number or function result)
    const delayMs = typeof delay === "function" ? delay(dependencies) : delay;

    // Set new timeout
    timeoutRef.current = setTimeout(() => {
      callback();
    }, delayMs);

    // Cleanup function
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);
};
