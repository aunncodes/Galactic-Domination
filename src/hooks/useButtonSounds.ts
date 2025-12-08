import { useEffect, useRef, useCallback } from "react";
import hoverSfx from "../assets/menu_hover.wav";
import selectSfx from "../assets/select.wav";

export function useButtonSounds() {
  const hoverRef = useRef<HTMLAudioElement | null>(null);
  const clickRef = useRef<HTMLAudioElement | null>(null);

  useEffect(() => {
    const hover = new Audio(hoverSfx);
    const click = new Audio(selectSfx);

    hoverRef.current = hover;
    clickRef.current = click;
  }, []);

  const playHover = useCallback(() => {
    const a = hoverRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => {
    });
  }, []);

  const playClick = useCallback(() => {
    const a = clickRef.current;
    if (!a) return;
    a.currentTime = 0;
    a.play().catch(() => {});
  }, []);

  return { playHover, playClick };
}
