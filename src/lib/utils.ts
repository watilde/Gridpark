/**
 * Common Utility Functions
 *
 * Reusable utility functions used across the application.
 */

/**
 * Debounce function - delays execution until after wait time has elapsed
 * since the last invocation.
 *
 * @param func - Function to debounce
 * @param wait - Milliseconds to wait
 * @returns Debounced function with cancel method
 *
 * @example
 * const debouncedSave = debounce(() => save(), 1000);
 * debouncedSave(); // Will execute after 1s of no more calls
 * debouncedSave.cancel(); // Cancel pending execution
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): T & { cancel: () => void } {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  const debounced = function (this: any, ...args: Parameters<T>) {
    const context = this;

    // Clear previous timeout
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    // Set new timeout
    timeoutId = setTimeout(() => {
      timeoutId = null;
      func.apply(context, args);
    }, wait);
  } as T & { cancel: () => void };

  // Add cancel method
  debounced.cancel = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
      timeoutId = null;
    }
  };

  return debounced;
}

/**
 * Throttle function - limits execution to once per specified time period.
 *
 * @param func - Function to throttle
 * @param limit - Minimum milliseconds between executions
 * @returns Throttled function
 *
 * @example
 * const throttledScroll = throttle(() => handleScroll(), 100);
 * window.addEventListener('scroll', throttledScroll);
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean = false;

  return function (this: any, ...args: Parameters<T>) {
    const context = this;

    if (!inThrottle) {
      func.apply(context, args);
      inThrottle = true;
      setTimeout(() => {
        inThrottle = false;
      }, limit);
    }
  };
}
