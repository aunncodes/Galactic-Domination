import { useState } from "react";
import { useGameStore } from "../store/gameStore";
import {useButtonSounds} from "../hooks/useButtonSounds.ts";

interface MainMenuProps {
	onStartGame: () => void;
	onCredits: () => void;
}

export default function MainMenu({ onStartGame, onCredits }: MainMenuProps) {
	const setPlayerInfo = useGameStore((state) => state.setPlayerInfo);
	const { playClick } = useButtonSounds();
	const [name, setName] = useState("");
	const [gender, setGender] = useState<"male" | "female" | "">("");
	const canStart = name.trim().length < 20 && name.trim().length > 0 && gender !== "";
	const handleStart = () => {
		if (!canStart) return;
		setPlayerInfo(name.trim(), gender as "male" | "female");
		onStartGame();
	};

	return (
		<div
			style={{
				height: "100vh",
				width: "100vw",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "#020617",
				color: "white",
				fontFamily: "system-ui, sans-serif",
			}}
		>
			<div
				style={{
					padding: 24,
					borderRadius: 12,
					border: "1px solid #1e3a8a",
					backgroundColor: "#020f3a",
					maxWidth: 600,
				}}
			>
				<h1 style={{ marginBottom: 16, textAlign: "center" }}>I Was Reincarnated as a Warlord Duck in Space and Now I’m Trying to Grow My Empire</h1>

				<div style={{ marginBottom: 12 }}>
					<label style={{ display: "block", marginBottom: 4 }}>Name</label>
					<input
						type="text"
						value={name}
						onChange={(e) => setName(e.target.value)}
						style={{
							width: "100%",
							padding: "6px 8px",
							borderRadius: 4,
							border: "1px solid #334155",
							backgroundColor: "#020617",
							color: "white",
							outline: "none",
						}}
					/>
				</div>

				<div style={{ marginBottom: 16 }}>
					<div style={{ marginBottom: 4 }}>Gender</div>
					<div style={{ display: "flex", gap: 8 }}>
						<button
							type="button"
							onClick={() => {
								playClick();
								setGender("male");
							}}
							aria-pressed={gender === "male"}
							style={{
								flex: 1,
								padding: "6px 8px",
								borderRadius: 4,
								border: "1px solid #334155",
								backgroundColor: gender === "male" ? "#1e3a8a" : "#0b1120",
								color: "white",
								cursor: "pointer",
								fontWeight: 400,
								transition: "0.15s",
							}}
						>
							Male
						</button>

						<button
							type="button"
							onClick={() => {
								playClick();
								setGender("female");
							}}
							aria-pressed={gender === "female"}
							style={{
								flex: 1,
								padding: "6px 8px",
								borderRadius: 4,
								border: "1px solid #334155",
								backgroundColor: gender === "female" ? "#831843" : "#0b1120",
								color: "white",
								cursor: "pointer",
								fontWeight: 400,
								transition: "0.15s",
							}}
						>
							Female
						</button>
					</div>
				</div>

				<button
					type="button"
					disabled={!canStart}
					onClick={() => {
						playClick();
						handleStart();
					}}
					style={{
						width: "100%",
						padding: "8px 12px",
						borderRadius: 4,
						border: "1px solid #1e3a8a",
						backgroundColor: canStart ? "#2563eb" : "#1f2937",
						color: "white",
						cursor: canStart ? "pointer" : "not-allowed",
						fontWeight: 600,
					}}
				>
					Play
				</button>
				<button
					type="button"
					onClick={() => {
						playClick();
						onCredits();
					}}
					style={{
						width: "100%",
						padding: "8px 12px",
						borderRadius: 4,
						border: "1px solid #1e3a8a",
						backgroundColor: "#2563eb",
						color: "white",
						cursor: "pointer",
						marginTop: 8,
					}}
				>
					Credits
				</button>
			</div>
		</div>
	);
}
