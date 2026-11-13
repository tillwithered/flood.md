import { useEffect, useState } from "react";

export const phoneViewport = "(max-width: 36rem)";
export const touchPhone = `${phoneViewport} and (pointer: coarse)`;
export const compactNavigation = "(max-width: 50rem)";

export function useStudioMedia(query: string) {
  const [matches, setMatches] = useState(false);
  useEffect(() => {
    const media = window.matchMedia(query);
    const update = () => setMatches(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, [query]);
  return matches;
}
