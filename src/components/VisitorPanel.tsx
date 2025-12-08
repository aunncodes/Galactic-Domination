import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useGameStore, type VisitorOption } from "../store/gameStore";
import { useButtonSounds } from "../hooks/useButtonSounds";

export default function VisitorPanel() {
	const visitor = useGameStore((state) => state.currentVisitor);
	const chooseOption = useGameStore((state) => state.chooseOption);
	const coins = useGameStore((state) => state.player.coins);
	const gameOver = useGameStore((state) => state.gameOver);
	const reactionText = useGameStore((state) => state.reactionText);
	const nextVisitor = useGameStore((state) => state.nextVisitor);
	const showDaySummary = useGameStore((state) => state.showDaySummary);
	const [displayedText, setDisplayedText] = useState("");
	const [isTyping, setIsTyping] = useState(false);
	const { playHover, playClick } = useButtonSounds();

	const playerName = useGameStore((state) => state.player.name);
	function resolveText(text: string): string {
		return text.replaceAll("{user}", playerName || "Duck");
	}

	const activeText = resolveText(reactionText ?? visitor?.text ?? "");

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

	if (!visitor) return null;

	const handleOptionClick = (option: VisitorOption) => {
		if (gameOver || reactionText) return;
		chooseOption(option);
	};

	const showOptions = !reactionText;

	return (
		<div
			style={{
				position: "relative",
				height: 550,
				borderRadius: 16,
				border: "1px solid #1d4ed8",
				backgroundColor: "#020617",
				overflow: "hidden",
				padding: "20px 40px",
				boxSizing: "border-box",
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
					backgroundColor: "#020617",
					border: "1px solid #334155",
					overflow: "hidden",
				}}
			>
				<img src={`characters/${visitor.sprite}`} alt={visitor.name} style={{ width: "100%", objectFit: "contain" }} />
			</motion.div>

			<div
				style={{
					position: "absolute",
					bottom: 300,
					right: 40,
					maxWidth: 420,
					padding: "12px 14px",
					backgroundColor: "#020f3a",
					borderRadius: 12,
					border: "1px solid #1e3a8a",
					fontSize: 15,
				}}
			>
				<div style={{ fontSize: 13, fontWeight: 600, marginBottom: 4 }}>{visitor.name}</div>
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
						pointerEvents: "auto",
					}}
				>
					{visitor.options.map((option) => {
						const delta = option.effects?.coins ?? 0;
						const notEnoughCoins = coins + delta <= 0;
						const text = notEnoughCoins ? option.text.replace(/\([^)]*\)/g, "").trim() : option.text;

						return (
							<button
								onMouseEnter={playHover}
								onClick={() => {
									playClick();
									handleOptionClick(option);
								}}
								disabled={notEnoughCoins || gameOver}
								style={{
									display: "block",
									width: "100%",
									maxWidth: 260,
									marginBottom: 10,
									padding: "10px 14px",
									fontSize: 15,
									backgroundColor: "#0b1120",
									color: "white",
									border: "1px solid #1e3a8a",
									borderRadius: 6,
									cursor: notEnoughCoins || gameOver ? "not-allowed" : "pointer",
									textAlign: "left",
									opacity: notEnoughCoins || gameOver ? 0.5 : 1,
								}}
							>
								{text}
								{notEnoughCoins ? " (Can't Afford)" : ""}
							</button>
						);
					})}
				</div>
			)}
		</div>
	);
}
