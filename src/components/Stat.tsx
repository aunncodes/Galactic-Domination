import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface StatProps {
  label: string;
  value: number;
  suffix?: string;
  positiveIsBad?: boolean;
}

export default function Stat({ label, value, suffix, positiveIsBad }: StatProps) {
  const prevValueRef = useRef<number | null>(null);
  const [delta, setDelta] = useState<number | null>(null);

  useEffect(() => {
    const prev = prevValueRef.current;

    if (prev !== null) {
      const change = value - prev;
      if (change !== 0) {
        setDelta(change);
      }
    }

    prevValueRef.current = value;
  }, [value]);

  useEffect(() => {
    if (delta === null) return;

    const timeout = setTimeout(() => {
      setDelta(null);
    }, 1500);

    return () => clearTimeout(timeout);
  }, [delta]);

  const isPositive = delta !== null && delta > 0;

  let color = "#fff";
  if (delta !== null) {
    if (positiveIsBad) {
      color = isPositive ? "#f87171" : "#4ade80";
    } else {
      color = isPositive ? "#4ade80" : "#f87171";
    }
  }

  return (
    <div style={{ position: "relative", paddingRight: 30 }}>
      <span>
        {label}: {value}
        {suffix}
      </span>

      <AnimatePresence>
        {delta !== null && (
          <motion.span
            key={`${value}-${delta}`}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.25 }}
            style={{
              position: "absolute",
              right: 0,
              top: "10%",
              fontSize: 12,
              fontWeight: 700,
              color,
              pointerEvents: "none",
            }}
          >
            {delta > 0 ? `+${delta}` : delta}
          </motion.span>
        )}
      </AnimatePresence>
    </div>
  );
}
