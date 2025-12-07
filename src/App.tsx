import { useState } from "react";
import GameView from "./components/GameView";
import MainMenu from "./components/MainMenu";
import Intro from "./components/Intro";

function App() {
	const [screen, setScreen] = useState<"intro" | "menu" | "game">("intro");

	if (screen === "intro") {
		return <Intro onContinue={() => setScreen("menu")} />;
	}

	if (screen === "menu") {
		return <MainMenu onStartGame={() => setScreen("game")} />;
	}

	return <GameView />;
}

export default App;
