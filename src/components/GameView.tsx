import { useEffect } from "react";
import { useGameStore } from "../store/gameStore";
import VisitorPanel from "./VisitorPanel";
import background from "../assets/background.png";

interface GameViewProps {
	onGameOver: () => void;
}

export default function GameView({ onGameOver }: GameViewProps) {
	const coins = useGameStore((state) => state.player.coins);
	const happiness = useGameStore((state) => state.player.happiness);
	const gender = useGameStore((state) => state.player.gender);
	const day = useGameStore((state) => state.day);
	const ownedPlanetsCount = useGameStore((state) => state.ownedPlanetsCount);
	const taxRate = useGameStore((state) => state.taxRate);
	const nextVisitor = useGameStore((state) => state.nextVisitor);
	const gameOver = useGameStore((state) => state.gameOver);
	const gameOverReason = useGameStore((state) => state.gameOverReason);
	const totalPlanets = useGameStore((state) => state.planets.length);
	const showDaySummary = useGameStore((state) => state.showDaySummary);
	const lastDaySummary = useGameStore((state) => state.lastDaySummary);
	const acknowledgeDaySummary = useGameStore((state) => state.acknowledgeDaySummary);
	const resetGame = useGameStore((state) => state.resetGame);

	useEffect(() => {
		nextVisitor();
	}, [nextVisitor]);

	const taxPercent = Math.round(taxRate * 100);

	return (
		<div
			style={{
				height: "100vh",
				width: "100vw",
				fontFamily: "system-ui, sans-serif",
				color: "white",
				display: "flex",
				flexDirection: "column",
				position: "relative",
				overflow: "hidden",
				backgroundImage: `url(${background})`,
				backgroundSize: "cover",
				backgroundPosition: "center",
				backgroundRepeat: "no-repeat",
			}}
		>
			<div
				style={{
					flexShrink: 0,
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					padding: "10px 20px",
					backgroundColor: "#0b1120",
					borderBottom: "1px solid #1d4ed8",
					zIndex: 2,
					fontSize: 14,
				}}
			>
				<div>Day: {day}</div>
				<div>Coins: {coins}</div>
				<div>Happiness: {happiness}</div>
				<div>
					Planets: {ownedPlanetsCount()}/{totalPlanets}
				</div>
				<div>Tax rate: {taxPercent}%</div>
			</div>

			<div
				style={{
					flex: 1,
					display: "flex",
					alignItems: "stretch",
					justifyContent: "space-between",
					padding: "0 40px 20px 40px",
					boxSizing: "border-box",
				}}
			>
				<div
					style={{
						width: "30%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						position: "relative",
					}}
				>
					<div
						style={{
							width: 260,
							height: 360,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							borderRadius: 16,
							backgroundColor: "#020617",
							border: "1px solid #1d4ed8",
							boxShadow: "0 20px 50px rgba(0,0,0,0.6)",
						}}
					>
					<img
						src={gender === "female"
							? "characters/thronefemale.png"
							: "characters/thronemale.png"}
						alt="Overlord on throne"
						style={{
							maxWidth: "100%",
							maxHeight: "100%",
							objectFit: "contain",
						}}
					/>
					</div>
				</div>

				<div
					style={{
						flex: 1,
						display: "flex",
						flexDirection: "column",
						justifyContent: "flex-end",
						position: "relative",
					}}
				>
					<VisitorPanel />
				</div>
			</div>

			{showDaySummary && !gameOver && lastDaySummary && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						backgroundColor: "rgba(15,23,42,0.9)",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						textAlign: "center",
						padding: 24,
						zIndex: 4,
					}}
				>
					<h2>Day {lastDaySummary.day} Summary</h2>

					<div style={{ marginTop: 4 }}>
						<p>Coins change: {lastDaySummary.coinsChange}</p>
						<p>Happiness change: {lastDaySummary.happinessChange}</p>
					</div>

					<button
						onClick={() => acknowledgeDaySummary()}
						style={{
							marginTop: 20,
							padding: "8px 16px",
							backgroundColor: "#1d4ed8",
							color: "white",
							border: "1px solid #3b82f6",
							borderRadius: 4,
							cursor: "pointer",
							fontWeight: 600,
						}}
					>
						Start next day
					</button>
				</div>
			)}

			{gameOver && (
				<div
					style={{
						position: "absolute",
						inset: 0,
						backgroundColor: "rgba(15,23,42,0.95)",
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						textAlign: "center",
						padding: 24,
						zIndex: 5,
					}}
				>
					<h1>Game Over</h1>
					<p style={{ maxWidth: 480, marginTop: 12 }}>{gameOverReason}</p>

					<button
						type="button"
						onClick={() => {
							resetGame();
							onGameOver();
						}}
						style={{
							marginTop: 24,
							padding: "8px 16px",
							borderRadius: 4,
							border: "1px solid #3b82f6",
							backgroundColor: "#1d4ed8",
							color: "white",
							cursor: "pointer",
							fontWeight: 600,
						}}
					>
						Return to menu
					</button>
				</div>
			)}
		</div>
	);
}
