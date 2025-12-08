import { useEffect, useRef, useCallback } from "react";
import selectSfx from "../assets/select.wav";

export function useButtonSounds() {
  const clickRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    clickRef.current = new Audio(selectSfx);
  }, []);

  const playClick = useCallback(() => {
    const a = clickRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => {});
  }, []);

  return { playClick };
}
