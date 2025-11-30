import { useState } from "react";
import GameView from "./components/GameView";
import MainMenu from "./components/MainMenu";

function App() {
	const [screen, setScreen] = useState<"menu" | "game">("menu");

	if (screen === "menu") {
		return <MainMenu onStartGame={() => setScreen("game")} />;
	}

	return <GameView />;
}

export default App;
