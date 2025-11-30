import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore, type VisitorOption } from "../store/gameStore";

export default function VisitorPanel() {
  const visitor = useGameStore(state => state.currentVisitor);
  const chooseOption = useGameStore(state => state.chooseOption);
  const coins = useGameStore(state => state.player.coins);
  const gameOver = useGameStore(state => state.gameOver);
  const reactionText = useGameStore(state => state.reactionText);
  const nextVisitor = useGameStore(state => state.nextVisitor);
  const showDaySummary = useGameStore(state => state.showDaySummary);

  const [displayedText, setDisplayedText] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const activeText = reactionText ?? visitor?.text ?? "";

  useEffect(() => {
    if (!visitor) {
      return;
    }

    const fullText = activeText;
    let idx = 0;

    const interval = setInterval(() => {
        if (idx === 0) {
            setIsTyping(true);
            setDisplayedText("");
        }
        idx += 1;
        setDisplayedText(fullText.slice(0, idx));

        if (idx >= fullText.length) {
            clearInterval(interval);
            setIsTyping(false);
        }
    }, 30);

    return () => clearInterval(interval);
  }, [visitor, activeText]);

  useEffect(() => {
    if (!reactionText) return;
    if (showDaySummary) return;
    if (gameOver) return;
    if (isTyping) return;
    const timeout = setTimeout(() => {
      nextVisitor();
    }, 1000);
    return () => clearTimeout(timeout);
  }, [reactionText, showDaySummary, gameOver, nextVisitor, isTyping]);

  if (!visitor) {
    return (
      <div
        style={{
          height: 450,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#ccc"
        }}
      >
        <p>No visitors right now. Click "Next visitor" to continue.</p>
      </div>
    );
  }

  const handleOptionClick = (option: VisitorOption) => {
    if (gameOver || reactionText) return;
    chooseOption(option);
  };

  const showOptions = !reactionText;

  return (
    <div
      style={{
        position: "relative",
        height: 450,
        borderRadius: 16,
        border: "1px solid #333",
        background:
          "linear-gradient(to top, #050509 0, #111 35%, #181818 100%)",
        overflow: "hidden",
        padding: "20px 40px",
        boxSizing: "border-box"
      }}
    >

      <motion.div
        key={visitor.id}
        initial={{ x: 700 }}
        animate={{ x: 0 }}
        transition={{ duration: 1.3, ease: "easeOut" }}
        style={{
          position: "absolute",
          bottom: 60,
          right: 40,
          width: 180,
          height: 220,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          borderRadius: 14,
          backgroundColor: "#000",
          border: "1px solid #555",
          overflow: "hidden",
          boxShadow: "0 4px 20px rgba(0,0,0,0.6)"
        }}
      >
        <img
          src={`characters/${visitor.sprite}`}
          alt={visitor.name}
          style={{ width: "100%", objectFit: "contain" }}
        />
      </motion.div>

      <div
        style={{
          position: "absolute",
          bottom: 300,
          right: 40,
          maxWidth: 420,
          padding: "12px 14px",
          backgroundColor: "#111",
          borderRadius: 12,
          border: "1px solid #555",
          boxShadow: "0 4px 18px rgba(0,0,0,0.8)",
          fontSize: 15
        }}
      >
        <div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>
          {visitor.name}
        </div>
        <div>
          {displayedText}
          {isTyping && <span style={{ opacity: 0.85 }}>▌</span>}
        </div>
      </div>

      {showOptions && (
        <div
          style={{
            position: "absolute",
            left: 40,
            bottom: 20,
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-end",
            gap: 10,
            padding: "0 10px",
            maxWidth: "40%",
            pointerEvents: "auto"
          }}
        >
          {visitor.options.map(option => {
            const delta = option.effects?.coins ?? 0;
            const notEnoughCoins =
              delta < 0 && coins + delta < 0;

            return (
              <button
                key={option.id}
                onClick={() => handleOptionClick(option)}
                disabled={notEnoughCoins || gameOver}
                style={{
                  display: "block",
                  width: "100%",
                  maxWidth: 260,
                  marginBottom: 10,
                  padding: "10px 14px",
                  fontSize: 15,
                  backgroundColor: "#222",
                  color: "white",
                  border: "1px solid #555",
                  borderRadius: 6,
                  cursor:
                    notEnoughCoins || gameOver ? "not-allowed" : "pointer",
                  textAlign: "left",
                  opacity: notEnoughCoins || gameOver ? 0.5 : 1
                }}
              >
                {option.text}
                {notEnoughCoins ? " (not enough coins)" : ""}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
