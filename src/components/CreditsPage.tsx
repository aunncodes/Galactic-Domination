import {useButtonSounds} from "../hooks/useButtonSounds.ts";

interface CreditsPageProps {
	onBack: () => void;
}

export default function CreditsPage({ onBack }: CreditsPageProps) {
	const { playHover, playClick } = useButtonSounds();
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
					minWidth: 320,
					textAlign: "center",
				}}
			>
				<h1 style={{ marginBottom: 16 }}>Credits</h1>

				<p style={{ opacity: 0.8, marginBottom: -10 }}>Programmed by</p>
				<p style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Aunn</p>

				<p style={{ opacity: 0.8, marginBottom: -10 }}>Art</p>
				<p style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Clod</p>

				<p style={{ opacity: 0.8, marginBottom: -10 }}>Play Testing</p>
				<p style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>Aeshgetem</p>

				<p style={{ opacity: 0.8, marginBottom: -10 }}>Music</p>
				<p style={{ fontSize: 20, fontWeight: 700, marginBottom: 16 }}>SubspaceAudio</p>

				<p style={{ opacity: 0.8, marginBottom: -10 }}>Moral Support</p>
				<p style={{ fontSize: 20, fontWeight: 700, marginBottom: 20 }}>CaptainTomato</p>

				<button
					type="button"
					onMouseEnter={playHover}
					onClick={() => {
						playClick();
						onBack();
					}}
					style={{
						marginTop: 12,
						width: "100%",
						padding: "8px 12px",
						borderRadius: 4,
						border: "1px solid #1e3a8a",
						backgroundColor: "#2563eb",
						color: "white",
						cursor: "pointer",
						fontWeight: 600,
					}}
				>
					Back
				</button>
			</div>
		</div>
	);
}
