import { useMatches } from "@remix-run/react";
import { useMemo } from "react";
export function useMatchesData(id: string) {
  const matches = useMatches();
  const route = useMemo(
    () => matches.find((match) => match.id === id),
    [matches, id]
  );
  return route?.data;
}
