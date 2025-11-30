import { useState } from "react";
import { useGameStore } from "../store/gameStore";

interface MainMenuProps {
	onStartGame: () => void;
}

export default function MainMenu({ onStartGame }: MainMenuProps) {
	const setPlayerInfo = useGameStore((state) => state.setPlayerInfo);

	const [name, setName] = useState("");
	const [gender, setGender] = useState<"male" | "female" | "">("");

	const canStart = name.trim().length > 0 && gender !== "";

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
				backgroundColor: "#050508",
				color: "white",
				fontFamily: "system-ui, sans-serif",
			}}
		>
			<div
				style={{
					padding: 24,
					borderRadius: 12,
					border: "1px solid #444",
					background: "radial-gradient(circle at top, rgba(80,80,80,0.5) 0, rgba(0,0,0,0.95) 60%)",
					minWidth: 320,
				}}
			>
				<h1 style={{ marginBottom: 16 }}>Galactic Domination</h1>

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
							border: "1px solid #555",
							backgroundColor: "#111",
							color: "white",
						}}
					/>
				</div>

				<div style={{ marginBottom: 16 }}>
					<div style={{ marginBottom: 4 }}>Gender</div>
					<div style={{ display: "flex", gap: 8 }}>
						<button
							type="button"
							onClick={() => setGender("male")}
							style={{
								flex: 1,
								padding: "6px 8px",
								borderRadius: 4,
								border: gender === "male" ? "2px solid #fff" : "1px solid #555",
								backgroundColor: "#222",
								color: "white",
								cursor: "pointer",
							}}
						>
							Male
						</button>
						<button
							type="button"
							onClick={() => setGender("female")}
							style={{
								flex: 1,
								padding: "6px 8px",
								borderRadius: 4,
								border: gender === "female" ? "2px solid #fff" : "1px solid #555",
								backgroundColor: "#222",
								color: "white",
								cursor: "pointer",
							}}
						>
							Female
						</button>
					</div>
				</div>

				<button
					type="button"
					disabled={!canStart}
					onClick={handleStart}
					style={{
						width: "100%",
						padding: "8px 12px",
						borderRadius: 4,
						border: "1px solid #777",
						backgroundColor: canStart ? "#2b7a2b" : "#333",
						color: "white",
						cursor: canStart ? "pointer" : "not-allowed",
						fontWeight: 600,
					}}
				>
					Play
				</button>
			</div>
		</div>
	);
}
