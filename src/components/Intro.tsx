import {useButtonSounds} from "../hooks/useButtonSounds.ts";

interface IntroProps {
	onContinue: () => void;
}

export default function Intro({ onContinue }: IntroProps) {
	const { playClick } = useButtonSounds();
	return (
		<div
			style={{
				height: "100vh",
				width: "100vw",
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				backgroundColor: "#021027",
				color: "white",
				fontFamily: "system-ui, sans-serif",
			}}
		>
			<div
				style={{
					width: "90%",
					maxWidth: 900,
					padding: 24,
					borderRadius: 12,
					border: "1px solid #1f3b75",
					backgroundColor: "#031638",
					boxSizing: "border-box",
				}}
			>
				<div
					style={{
						position: "relative",
						width: "100%",
						paddingTop: "56.25%",
						borderRadius: 10,
						overflow: "hidden",
						backgroundColor: "#000814",
						border: "1px solid #26427f",
					}}
				>
					<video
						controls
						style={{
							position: "absolute",
							top: 0,
							left: 0,
							width: "100%",
							height: "100%",
							objectFit: "cover",
						}}
						src="intro.mov"
					/>
				</div>

				<button
					type="button"
					onClick={() => {
						playClick();
						onContinue();
					}}
					style={{
						marginTop: 20,
						padding: "10px 18px",
						borderRadius: 6,
						border: "1px solid #3b82f6",
						backgroundColor: "#2563eb",
						color: "white",
						cursor: "pointer",
						fontWeight: 600,
					}}
				>
					Continue
				</button>
			</div>
		</div>
	);
}
