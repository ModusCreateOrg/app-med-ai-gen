import { useCallback, useEffect, useRef } from 'react';

/**
 * Custom hook for handling setTimeout with cleanup
 */
export const useTimeout = () => {
  const timeoutRef = useRef<number | null>(null);

  // Clear the timeout when component unmounts or when called manually
  const clearTimeout = useCallback(() => {
    if (timeoutRef.current) {
      window.clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  }, []);

  // Set a new timeout
  const setTimeout = useCallback((callback: () => void, delay: number) => {
    // Clear any existing timeout first
    clearTimeout();
    // Set the new timeout
    timeoutRef.current = window.setTimeout(callback, delay);
  }, [clearTimeout]);

  // Clean up on unmount
  useEffect(() => {
    return clearTimeout;
  }, [clearTimeout]);

  return { setTimeout, clearTimeout };
};