import { useState, useRef, useEffect } from "react";
import GameView from "./components/GameView";
import MainMenu from "./components/MainMenu";
import Intro from "./components/Intro";
import CreditsPage from "./components/CreditsPage.tsx";

function App() {
	const [screen, setScreen] = useState<"intro" | "menu" | "game" | "credits">("intro");

	const audioRef = useRef<HTMLAudioElement | null>(null);
	const hasStartedMusic = useRef(false);

	useEffect(() => {
		if (screen === "menu" && !hasStartedMusic.current) {
			hasStartedMusic.current = true;

			if (audioRef.current) {
				audioRef.current.loop = true;
				audioRef.current.volume = 0.1;

				audioRef.current.play().catch(() => {});
			}
		}
	}, [screen]);

	if (screen === "intro") {
		return <Intro onContinue={() => setScreen("menu")} />;
	}

	if (screen === "menu") {
		return (
			<>
				<audio ref={audioRef} src="menu.wav" />
				<MainMenu onStartGame={() => setScreen("game")} onCredits={() => setScreen("credits")} />
			</>
		);
	}

	if (screen === "credits") {
		return (
			<>
				<audio ref={audioRef} src="menu.wav" />
				<CreditsPage onBack={() => setScreen("menu")} />
			</>
		);
	}

	return (
		<>
			<audio ref={audioRef} src="menu.wav" />
			<GameView onGameOver={() => setScreen("menu")} />
		</>
	);
}

export default App;
