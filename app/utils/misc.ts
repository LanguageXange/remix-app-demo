import { useLocation, useMatches } from "@remix-run/react";
import { useLayoutEffect, useMemo, useEffect, useState, useRef } from "react";
export function useMatchesData(id: string) {
  const matches = useMatches();
  const route = useMemo(
    () => matches.find((match) => match.id === id),
    [matches, id]
  );
  return route?.data;
}

export function classNames(...names: Array<string | undefined>) {
  const className = names.reduce(
    (acc, name) => (name ? `${acc} ${name}` : acc),
    ""
  );
  return className || "";
}

export function isRunningOnServer() {
  return typeof window === "undefined";
}

export const useServerLayoutEffect = isRunningOnServer()
  ? useEffect
  : useLayoutEffect;

// we want this hook to return true the moment React is hydrated
// to achieve this, need to reference a variable outside
// the first time useHydrated is called, `hasHydrated` will be set to true
// every other time this will return true immediately
let hasHydrated = false;
export function useIsHydrated() {
  const [isHydrated, setIsHydrated] = useState(hasHydrated);
  // React useEffect doesn't run during server rendering
  // if an effect runs then we know React is successfully hydrated on the client
  useEffect(() => {
    hasHydrated = true;
    setIsHydrated(true);
  }, []);

  return isHydrated;
}

export function useDebouncedFunction<T extends Array<any>>(
  fn: (...args: T) => unknown,
  time: number
) {
  const timeoutid = useRef<number>(); // if we use useState, it will trigger re-render everytime timtout id changes
  const deboundedFn = (...args: T) => {
    window.clearTimeout(timeoutid.current); // cancel the timeout and restart it when debouncedFn is called
    timeoutid.current = window.setTimeout(() => fn(...args), time); // we want to call this fn until debouncedFn hasn't been called for this amount of time
  };

  return deboundedFn;
}

export function useBuildSearchParams() {
  const location = useLocation();

  return (name: string, value: string) => {
    const searchParams = new URLSearchParams(location.search);
    searchParams.set(name, value);

    return `?${searchParams.toString()}`;
  };
}
