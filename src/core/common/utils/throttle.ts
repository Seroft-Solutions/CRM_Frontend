/**
 * Throttle utility
 *
 * A utility function for throttling function calls.
 */

/**
 * Creates a throttled function that only invokes the provided function
 * at most once per every wait milliseconds.
 *
 * @param func - The function to throttle
 * @param wait - The number of milliseconds to throttle invocations to
 * @param options - The options object
 * @returns The throttled function
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  wait: number,
  options: {
    leading?: boolean;
    trailing?: boolean;
  } = {}
): (...args: Parameters<T>) => ReturnType<T> | undefined {
  let context: any;
  let args: Parameters<T> | null = null;
  let result: ReturnType<T> | undefined;
  let timeout: NodeJS.Timeout | null = null;
  let previous = 0;

  const leading = options.leading !== false;
  const trailing = options.trailing !== false;

  const later = function () {
    previous = options.leading === false ? 0 : Date.now();
    timeout = null;
    result = func.apply(context, args as Parameters<T>);
    if (!timeout) {
      context = args = null;
    }
  };

  return function (this: any, ...funcArgs: Parameters<T>): ReturnType<T> | undefined {
    const now = Date.now();

    if (!previous && !leading) {
      previous = now;
    }

    const remaining = wait - (now - previous);

    context = this;
    args = funcArgs;

    if (remaining <= 0 || remaining > wait) {
      if (timeout) {
        clearTimeout(timeout);
        timeout = null;
      }

      previous = now;
      result = func.apply(context, args);

      if (!timeout) {
        context = args = null;
      }
    } else if (!timeout && trailing) {
      timeout = setTimeout(later, remaining);
    }

    return result;
  };
}
