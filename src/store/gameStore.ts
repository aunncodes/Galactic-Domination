import { create } from "zustand";
import planetsData from "../data/planets.json";
import visitorsData from "../data/visitors.json";

export interface Planet {
	id: string;
	name: string;
	owned: boolean;
}

export interface VisitorConditions {
	minCoins?: number;
	maxCoins?: number;
	minHappiness?: number;
	maxHappiness?: number;
	requiresOwnedPlanet?: string;
	requiresPlanetNotOwned?: string;
	minTaxRate?: number;
	maxTaxRate?: number;
	minRebellionChance?: number;
	maxRebellionChance?: number;
	godDenied?: boolean;
	scienceStep?: number;
	jesterHired?: boolean;
	internHired?: boolean;
	refugeeBanned?: boolean;
	bountyContractActive?: boolean;
	warDiscountActive?: boolean;
	witchHired?: boolean;
}

export type SpecialEffect =
	| "wizard_gamble"
	| "prophet_pay"
	| "tax_collector"
	| "start_bounty_contract"
	| "bounty_continue_contract"
	| "start_war_defend"
	| "start_war_attack"
	| "war_surrender"
	| "god_deny"
	| "science_chain_start"
	| "science_chain_continue"
	| "science_chain_complete"
	| "jester_hired"
	| "intern_hired"
	| "refugee_ban"
	| "war_discount";

export interface VisitorOptionEffects {
	coins?: number;
	happiness?: number;
	taxRateDelta?: number;
	rebellionDelta?: number;
	special?: SpecialEffect;
	warOurPlanetId?: string;
	warEnemyPlanetId?: string;
	warInvestment?: number;
}

export interface VisitorOption {
	text: string;
	effects?: VisitorOptionEffects;
	reaction: string;
}

export interface Visitor {
	id: string;
	name: string;
	sprite: string;
	text: string;
	weight?: number;
	conditions?: VisitorConditions;
	options: VisitorOption[];
}

export interface Player {
	name: string;
	gender: "male" | "female" | null;
	coins: number;
	happiness: number;
}

export interface DaySummary {
	day: number;
	coinsChange: number;
	happinessChange: number;
	rebellionChange: number;
}

const planets: Planet[] = planetsData as Planet[];
const visitors: Visitor[] = visitorsData as Visitor[];

interface GameState {
	player: Player;
	planets: Planet[];
	setPlayerInfo: (name: string, gender: "male" | "female") => void;
	day: number;
	currentVisitor: Visitor | null;
	taxRate: number;
	rebellionChance: number;
	visitsToday: number;
	maxVisitorsPerDay: number;
	scientistStep: number;
	showDaySummary: boolean;
	lastDaySummary: DaySummary | null;
	dayStartCoins: number;
	warDiscount: number;
	dayStartHappiness: number;
	dayStartRebellion: number;
	bountyContractActive: boolean;
	bountyNextReportDay: number | null;
	reactionText: string | null;
	gameOver: boolean;
	gameOverReason: string | null;
	ownedPlanetsCount: () => number;
	nextVisitor: () => void;
	chooseOption: (option: VisitorOption) => void;
	acknowledgeDaySummary: () => void;
	visitorsSeenToday: string[];
	godDenied: boolean;
	jesterHired: boolean;
	internHired: boolean;
	refugeeBanned: boolean;
	pendingDaySummary: boolean;
	resetGame: () => void;
	witchHired: boolean;
}

const initialState = {
	player: {
		name: "",
		gender: null,
		coins: 100,
		happiness: 50,
	},
	planets,
	day: 1,
	currentVisitor: null,
	taxRate: 0.15,
	warDiscount: 1,
	rebellionChance: 0,
	jesterHired: false,
	internHired: false,
	refugeeBanned: false,
	visitsToday: 0,
	maxVisitorsPerDay: 5,
	showDaySummary: false,
	lastDaySummary: null,
	dayStartCoins: 100,
	dayStartHappiness: 50,
	dayStartRebellion: 0,
	bountyContractActive: false,
	bountyNextReportDay: null,
	scientistStep: 0,
	reactionText: null,
	gameOver: false,
	gameOverReason: null,
	visitorsSeenToday: [],
	godDenied: false,
	pendingDaySummary: false,
	witchHired: false,
};

function getRandom(arr: Visitor[]): Visitor {
	const totalWeight = arr.reduce((sum, v) => sum + (v.weight ?? 1), 0);

	let r = Math.random() * totalWeight;
	for (const v of arr) {
		const w = v.weight ?? 1;
		if (r < w) {
			return v;
		}
		r -= w;
	}

	return arr[arr.length - 1];
}

function visitorMatchesConditions(visitor: Visitor, state: GameState): boolean {
	const c = visitor.conditions;
	if (!c) return true;

	if (c.minCoins !== undefined && state.player.coins < c.minCoins) return false;
	if (c.maxCoins !== undefined && state.player.coins > c.maxCoins) return false;
	if (c.godDenied !== undefined && c.godDenied !== state.godDenied) return false;
	if (c.scienceStep !== undefined && c.scienceStep !== state.scientistStep) return false;
	if (c.minHappiness !== undefined && state.player.happiness < c.minHappiness) return false;
	if (c.maxHappiness !== undefined && state.player.happiness > c.maxHappiness) return false;
	if (c.jesterHired !== undefined && c.jesterHired !== state.jesterHired) return false;
	if (c.internHired !== undefined && c.internHired !== state.internHired) return false;
	if (c.bountyContractActive !== undefined && c.bountyContractActive !== state.bountyContractActive) return false;
	if (c.witchHired !== undefined && c.witchHired !== state.witchHired) return false;
	if (c.warDiscountActive !== undefined && c.warDiscountActive !== state.warDiscount < 1) return false;
	if (c.refugeeBanned !== undefined && c.refugeeBanned !== state.refugeeBanned) return false;
	if (c.minTaxRate !== undefined && state.taxRate < c.minTaxRate) return false;
	if (c.maxTaxRate !== undefined && state.taxRate > c.maxTaxRate) return false;
	if (c.minRebellionChance !== undefined && state.rebellionChance < c.minRebellionChance) return false;
	if (c.maxRebellionChance !== undefined && state.rebellionChance > c.maxRebellionChance) return false;
	if (c.requiresOwnedPlanet !== undefined && !state.planets.some((p) => p.id === c.requiresOwnedPlanet && p.owned)) return false;
	return !(c.requiresPlanetNotOwned !== undefined && state.planets.some((p) => p.id === c.requiresPlanetNotOwned && p.owned));
}

function standardRand<T>(arr: T[]): T {
	return arr[Math.floor(Math.random() * arr.length)];
}

function getRandomOwnedPlanet(planets: Planet[]): Planet | null {
	const owned = planets.filter((p) => p.owned);
	if (owned.length === 0) return null;
	return standardRand(owned);
}

function getRandomUnownedPlanet(planets: Planet[]): Planet | null {
	const unowned = planets.filter((p) => !p.owned);
	if (unowned.length === 0) return null;
	return standardRand(unowned);
}

function resolveWar(params: {
	type: "defense" | "attack";
	yourInvestment: number;
	enemyPlanetId?: string | null;
	ourPlanetId?: string | null;
	coins: number;
	happiness: number;
	planets: Planet[];
}): {
	coins: number;
	happiness: number;
	planets: Planet[];
	resultText: string;
} {
	const { type, yourInvestment, enemyPlanetId, ourPlanetId } = params;

	const baseEnemy = type === "defense" ? 30 : 50;
	const enemyRandom = Math.floor(Math.random() * 40);
	const enemyInvestment = baseEnemy + enemyRandom;

	let winChance = yourInvestment / (yourInvestment / 1.5 + enemyInvestment);

	if (type === "defense") {
		winChance += 0.15;
	}

	if (type === "defense" && yourInvestment >= enemyInvestment) {
		winChance = Math.max(winChance, 0.85);
	}

	winChance = Math.max(0.05, Math.min(0.95, winChance));

	const roll = Math.random();
	const youWin = roll < winChance;

	const newCoins = params.coins;
	let newHappiness: number;
	let newPlanets = params.planets;
	let resultText: string;

	if (youWin) {
		if (type === "defense") {
			resultText = "Your forces prevail and the planet is successfully defended.";
			newHappiness = Math.min(100, params.happiness + 5);
		} else {
			if (enemyPlanetId) {
				newPlanets = params.planets.map((p) => (p.id === enemyPlanetId ? { ...p, owned: true } : p));
				resultText = "Your army conquers the enemy world and adds it to your empire.";
			} else {
				resultText = "Your attack is successful.";
			}
			newHappiness = Math.min(100, params.happiness + 5);
		}
	} else {
		if (type === "defense") {
			if (ourPlanetId) {
				newPlanets = params.planets.map((p) => (p.id === ourPlanetId ? { ...p, owned: false } : p));
				resultText = "Despite your efforts, the enemy overwhelms your defenses and the planet is lost.";
			} else {
				resultText = "Your forces are defeated and you lose the battle.";
			}
			newHappiness = Math.max(0, params.happiness - 10);
		} else {
			resultText = "The campaign fails and your forces are driven back.";
			newHappiness = Math.max(0, params.happiness - 5);
		}
	}

	return {
		coins: newCoins,
		happiness: newHappiness,
		planets: newPlanets,
		resultText,
	};
}

export const useGameStore = create<GameState>((set, get) => ({
	...initialState,
	setPlayerInfo(name, gender) {
		set((prev) => ({
			...prev,
			player: {
				...prev.player,
				name,
				gender,
			},
		}));
	},

	ownedPlanetsCount() {
		return get().planets.filter((p) => p.owned).length;
	},

	nextVisitor() {
		if (import.meta.env.DEV) {
			console.log(JSON.stringify(useGameStore.getState(), null, 2));
			console.log("Loaded visitors:", visitors);
		}

		const state = get();
		if (state.gameOver || state.showDaySummary) return;

		if (state.pendingDaySummary) {
			set({
				showDaySummary: true,
				pendingDaySummary: false,
				currentVisitor: null,
				reactionText: null,
			});
			return;
		}

		const ownedCount = state.ownedPlanetsCount();

		if (state.currentVisitor && state.reactionText === null) {
			return;
		}

		set({ reactionText: null });

		if (state.visitsToday == 0 && state.day == 1) {
			const royalAdvisor: Visitor = {
				id: "royal_advisor_intro",
				name: "Royal Advisor",
				sprite: "royal_advisor.png",
				text: "Welcome, {user}, to your new role as the ruler of this fledgling space empire. Your journey to galactic domination begins now. May your reign be prosperous and your enemies quack in fear!",
				options: [
					{
						text: "I am ready to lead.",
						reaction: "Excellent! Let me teach you how to play.",
					},
				],
			};
			set({ currentVisitor: royalAdvisor });
			return;
		}
		if (state.visitsToday == 1 && state.day == 1) {
			const royalAdvisor: Visitor = {
				id: "royal_advisor_intro",
				name: "Royal Advisor",
				sprite: "royal_advisor.png",
				text: "To play, you must pick one of the options each visitor gives you. Manage your coins and happiness to avoid rebellion. Expand your empire by acquiring planets, and defend them from enemies. Good luck, {user}!",
				options: [
					{
						text: "Alright!",
						reaction: "I wish you luck in your journey!",
					},
					{
						text: "Awesome!",
						reaction: "I wish you luck in your journey!",
					},
				],
			};
			set({ currentVisitor: royalAdvisor });
			return;
		}

		if (state.visitsToday == state.maxVisitorsPerDay - 1 && state.player.happiness >= 80) {
			const happyCitizen: Visitor = {
				id: "happy_citizen",
				name: "Happy Citizen",
				sprite: "happy_citizen.png",
				text: "You are the coolest lord ever! Me and all my friends pooled together our money to make this donation to you!",
				options: [
					{
						text: "Thank you so much!",
						reaction: "Anything for the greatest lord of all time!",
						effects: {
							coins: ownedCount * 10,
						},
					},
				],
			};
			set({ currentVisitor: happyCitizen });
			return;
		}

		if (state.godDenied) {
			const godVisitor: Visitor = {
				id: "god_attack",
				name: "God",
				sprite: "god.png",
				text: "You have refused to give me a sacrifice. Now you must face my wrath. Say goodbye to 25% of your coins.",
				options: [
					{
						text: "I accept my fate.",
						effects: {
							coins: -Math.round(state.player.coins * 0.25),
						},
						reaction: "So be it.",
					},
				],
			};
			set({ currentVisitor: godVisitor, godDenied: false });
			return;
		}

		if (state.jesterHired && state.visitorsSeenToday.indexOf("jester_entertainment") === -1) {
			const jesterVisitor: Visitor = {
				id: "jester_entertainment",
				name: "Jester",
				sprite: "jester.png",
				text: "My lord, I have prepared some entertainment to lift your spirits!",
				options: [
					{
						text: "Let's see it!",
						effects: {
							happiness: 5,
							rebellionDelta: -3,
						},
						reaction: "I hope you enjoy!",
					},
				],
			};
			set({ currentVisitor: jesterVisitor });
			return;
		}

		if (state.internHired && state.visitorsSeenToday.indexOf("intern_money") === -1) {
			const internTexts = [
				"My lord, I sold my rare minecraft account. Here is your cut!",
				"My lord, I sold a rock. It was a cool rock.",
				"My lord, I vibe coded a multi million dollar company. Here's your cut!",
				"My lord, someone paid me to stop singing. I took the deal.",
				"My lord, I found money on the ground. Finders keepers right?",
				"Hey, I found a really heavy sock. You can have what's in it.",
				"Waiter asked for a tip, I gave him -10 dollars. Here's your share!",
			];
			const internVisitor: Visitor = {
				id: "intern_money",
				name: "Intern",
				sprite: "intern.png",
				text: internTexts[Math.floor(Math.random() * internTexts.length)],
				options: [
					{
						text: "Awesome!",
						effects: {
							coins: 10,
						},
						reaction: "No problem boss!",
					},
				],
			};

			set({ currentVisitor: internVisitor });
			return;
		}

		if (state.scientistStep === 1 && Math.random() < 0.3) {
			const ScientistVisitor: Visitor = {
				id: "scientist_more_funding",
				name: "Scientist",
				sprite: "scientist.png",
				text: "Lord, we are close! Just a little more funding, and we will be able to make a breakthrough!",
				options: [
					{
						text: "Alright, take the funds. (-30 coins)",
						effects: {
							coins: -30,
							happiness: 10,
							special: "science_chain_continue",
						},
						reaction: "Thank you, my lord! I shall come back shortly with my findings!",
					},
					{
						text: "I cannot spare the coins right now.",
						effects: {
							happiness: -5,
							special: "science_chain_complete",
						},
						reaction: "It is a shame I have to give up when I'm so close. But alright.",
					},
				],
			};
			set({ currentVisitor: ScientistVisitor });
			return;
		}

		if (state.scientistStep === 2 && Math.random() < 0.3) {
			const ScientistVisitor: Visitor = {
				id: "scientist_complete",
				name: "Scientist",
				sprite: "scientist.png",
				text: "Thank you for your faith my lord! With your funding, we have achieved greatness!",
				options: [
					{
						text: "Awesome!",
						effects: {
							coins: 100,
							happiness: 50,
							special: "science_chain_complete",
						},
						reaction: "I will do my best to continue achieving glory for the empire!",
					},
				],
			};
			set({ currentVisitor: ScientistVisitor });
			return;
		}

		if (state.bountyContractActive && state.bountyNextReportDay !== null && state.day >= state.bountyNextReportDay && state.visitsToday === 0) {
			const success = Math.random() < 0.6;

			if (success) {
				const resultVisitor: Visitor = {
					id: "bounty_result_success",
					name: "Bounty Huntress",
					sprite: "bounty_huntress.png",
					text: "Overlord, I have found the criminal and dealt with them. Your subjects are safer now.",
					options: [
						{
							text: "Excellent work.",
							effects: {
								happiness: 20,
								rebellionDelta: -15,
							},
							reaction: "As promised, the threat is gone. Payment accepted, my lord.",
						},
					],
				};

				set({
					currentVisitor: resultVisitor,
					bountyContractActive: false,
					bountyNextReportDay: null,
				});
			} else {
				const resultVisitor: Visitor = {
					id: "bounty_result_fail",
					name: "Bounty Huntress",
					sprite: "bounty_huntress.png",
					text: "I have not yet found the criminal, overlord. They are elusive. Shall I continue the hunt?",
					options: [
						{
							text: "Yes, keep hunting. (-30 Coins)",
							effects: {
								coins: -30,
								rebellionDelta: -5,
								special: "bounty_continue_contract",
							},
							reaction: "Understood. I will keep tracking them. My fee rises with every passing day.",
						},
						{
							text: "No. Stand down.",
							effects: {
								happiness: -10,
								rebellionDelta: 15,
							},
							reaction: "Then whatever they do next is on your head, overlord. Your people know you let the criminal walk.",
						},
					],
				};

				set({
					currentVisitor: resultVisitor,
				});
			}

			return;
		}

		if (state.day % 5 === 0 && state.visitorsSeenToday.indexOf("tax_collector") == -1) {
			const taxCollector: Visitor = {
				id: "tax_collector",
				name: "Imperial Tax Collector",
				sprite: "tax_collector.png",
				text: "Lord {user}, your citizens have paid their taxes. Their bread now fills your vaults.",
				options: [
					{
						text: "Good job.",
						effects: {
							special: "tax_collector",
						},
						reaction: "I thank my liege for showing such kindness to a featherbrained individual like me.",
					},
				],
			};
			set({ currentVisitor: taxCollector });
			return;
		}

		if (Math.random() < 0.1 && state.day > 3 && state.visitorsSeenToday.indexOf("war_general") === -1) {
			const ourPlanet = getRandomOwnedPlanet(state.planets);
			const enemyPlanet = getRandomUnownedPlanet(state.planets);
			if (ourPlanet && enemyPlanet) {
				const defendCost = 60;
				const heavyDefendCost = 110;

				const warOfferVisitor: Visitor = {
					id: "war_general",
					name: "War General",
					sprite: "war_general.png",
					text: `Lord, our planet ${ourPlanet.name} is being attacked by ${enemyPlanet.name}. We must decide our investment.`,
					options: [
						{
							text: `Defend ${ourPlanet.name} (-${Math.floor(defendCost * state.warDiscount)} coins)`,
							effects: {
								coins: -Math.floor(defendCost * state.warDiscount),
								special: "start_war_defend",
								warOurPlanetId: ourPlanet.id,
								warEnemyPlanetId: enemyPlanet.id,
								warInvestment: defendCost,
							},
							reaction: "We will do our best with the resources given.",
						},
						{
							text: `Invest heavily in the defense (-${Math.floor(heavyDefendCost * state.warDiscount)} coins)`,
							effects: {
								coins: -Math.floor(heavyDefendCost * state.warDiscount),
								special: "start_war_defend",
								warOurPlanetId: ourPlanet.id,
								warEnemyPlanetId: enemyPlanet.id,
								warInvestment: heavyDefendCost,
							},
							reaction: "We will throw everything we have at the enemy.",
						},
						{
							text: `We cannot afford it. Abandon ${ourPlanet.name}.`,
							effects: {
								special: "war_surrender",
								warOurPlanetId: ourPlanet.id,
								warEnemyPlanetId: enemyPlanet.id,
							},
							reaction: `${ourPlanet.name} will fall without resistance.`,
						},
					],
				};

				set({ currentVisitor: warOfferVisitor });
				return;
			}
		}

		if (state.player.coins >= 150 && Math.random() < 0.3 && state.visitorsSeenToday.indexOf("war_general") === -1) {
			const enemyPlanet = getRandomUnownedPlanet(state.planets);
			if (enemyPlanet) {
				const attackCost = 80;
				const heavyAttackCost = 140;

				const warAttackVisitor: Visitor = {
					id: "war_general",
					name: "War General",
					sprite: "war_general.png",
					text: `Lord, for an investment of coins we can attack ${enemyPlanet.name}. How much shall we commit?`,
					options: [
						{
							text: `Attack ${enemyPlanet.name} (-${Math.floor(attackCost * state.warDiscount)} coins)`,
							effects: {
								coins: -Math.floor(attackCost * state.warDiscount),
								special: "start_war_attack",
								warEnemyPlanetId: enemyPlanet.id,
								warInvestment: attackCost,
							},
							reaction: "We will create a solid force.",
						},
						{
							text: `Launch a massive invasion (-${Math.floor(heavyAttackCost * state.warDiscount)} coins)`,
							effects: {
								coins: -Math.floor(heavyAttackCost * state.warDiscount),
								special: "start_war_attack",
								warEnemyPlanetId: enemyPlanet.id,
								warInvestment: heavyAttackCost,
							},
							reaction: "We will overwhelm them with sheer power.",
						},
						{
							text: "Not now.",
							reaction: "Very well. The army will remain on standby.",
						},
					],
				};

				set({ currentVisitor: warAttackVisitor });
				return;
			}
		}

		const available = visitors.filter((v) => {
			if (!visitorMatchesConditions(v, state)) {
				return false;
			}
			return !state.visitorsSeenToday.includes(v.id);
		});

		if (available.length === 0) {
			set({ currentVisitor: null });
			return;
		}

		const chosen = getRandom(available);
		set({ currentVisitor: chosen });
	},

	chooseOption(option) {
		const stateBefore = get();
		if (stateBefore.gameOver) return;
		if (stateBefore.currentVisitor === null) return;
		if (stateBefore.showDaySummary) return;

		const effects = option.effects || {};
		const costDelta = effects.coins ?? 0;

		if (costDelta < 0 && stateBefore.player.coins + costDelta < 0) {
			return;
		}

		set((prev) => {
			let day = prev.day;
			let visitsToday = prev.visitsToday;
			const showDaySummary = prev.showDaySummary;
			let lastDaySummary = prev.lastDaySummary;
			let dayStartCoins = prev.dayStartCoins;
			let dayStartHappiness = prev.dayStartHappiness;
			let dayStartRebellion = prev.dayStartRebellion;
			let scientistStep = prev.scientistStep;
			let visitorsSeenToday = [...prev.visitorsSeenToday];
			const name = prev.player.name;
			const gender = prev.player.gender;
			let gameOver = prev.gameOver;
			let gameOverReason = prev.gameOverReason;
			let jesterHired = prev.jesterHired;
			let internHired = prev.internHired;
			let planets = prev.planets;
			let bountyContractActive = prev.bountyContractActive;
			let bountyNextReportDay = prev.bountyNextReportDay;
			let pendingDaySummary = prev.pendingDaySummary;
			let godDenied = prev.godDenied;
			let refugeeBanned = prev.refugeeBanned;
			let warDiscount = prev.warDiscount;
			let witchHired = prev.witchHired;

			const currentVisitorId = prev.currentVisitor?.id || null;
			const effects = option.effects || {};
			const special = effects.special;
			let coins = prev.player.coins + (effects.coins ?? 0);
			let happiness = prev.player.happiness + (effects.happiness ?? 0);
			let taxRate = prev.taxRate + (effects.taxRateDelta ?? 0);
			let rebellionChance = prev.rebellionChance + (effects.rebellionDelta ?? 0);

			const ownedPlanets = planets.filter((p) => p.owned);
			let ownedCount = ownedPlanets.length;
			coins = Math.max(0, coins);
			happiness = Math.max(0, happiness);
			taxRate = Math.max(0, Math.min(0.5, taxRate));
			rebellionChance = Math.max(0, rebellionChance);

			if (special === "start_bounty_contract") {
				bountyContractActive = true;
				bountyNextReportDay = prev.day + 1;
			}

			if (special === "bounty_continue_contract") {
				bountyContractActive = true;
				bountyNextReportDay = prev.day + 1;
			}

			if (special === "god_deny") {
				godDenied = true;
			}

			if (special === "jester_hired") {
				jesterHired = true;
			}

			if (special === "intern_hired") {
				internHired = true;
			}

			if (special === "refugee_ban") {
				refugeeBanned = true;
			}

			if (special === "war_discount") {
				warDiscount = 0.85;
			}

			const baseReaction = option.reaction || "";
			const extraReactionParts: string[] = [];

			if (special === "wizard_gamble") {
				const win = Math.random() < 0.5;
				if (win) {
					coins += 150;
					happiness = Math.min(100, happiness + 10);
					rebellionChance -= 5;
					extraReactionParts.push("You are an eggstraordinary being. Your vaults are now filled to the brim.");
				} else {
					coins = Math.max(0, coins - 75);
					happiness = Math.max(0, happiness - 15);
					rebellionChance += 5;
					extraReactionParts.push("Your empire is slowly quacking apart. Your wealth and reputation are flying away.");
				}
			}

			if (special === "prophet_pay") {
				witchHired = true;
			}

			if (special === "science_chain_start") {
				scientistStep = 1;
			}

			if (special === "science_chain_continue") {
				scientistStep = 2;
			}

			if (special === "science_chain_complete") {
				scientistStep = 3;
			}

			if (special === "tax_collector") {
				const baseTaxPerPlanet = 100;
				const taxIncome = Math.round(ownedCount * baseTaxPerPlanet * taxRate);
				coins += taxIncome;
				extraReactionParts.push(`Your ledgers swell by ${taxIncome} coins from your subjects' labor.`);
			}

			if (special === "start_war_defend" || special === "start_war_attack") {
				const type = special === "start_war_defend" ? "defense" : "attack";

				const yourInvestment = effects.warInvestment ?? -(effects.coins ?? 0);

				const result = resolveWar({
					type,
					yourInvestment,
					enemyPlanetId: effects.warEnemyPlanetId ?? null,
					ourPlanetId: effects.warOurPlanetId ?? null,
					coins,
					happiness,
					planets,
				});

				coins = result.coins;
				happiness = result.happiness;
				planets = result.planets;
				extraReactionParts.push(result.resultText);
				ownedCount = planets.filter((p) => p.owned).length;
			}

			if (special === "war_surrender" && effects.warOurPlanetId) {
				planets = planets.map((p) => (p.id === effects.warOurPlanetId ? { ...p, owned: false } : p));
				ownedCount = planets.filter((p) => p.owned).length;
				extraReactionParts.push(`You abandon ${planets.find((p) => p.id === effects.warOurPlanetId)?.name ?? "the world"}.`);
			}

			if (coins === 0 && !gameOver) {
				gameOver = true;
				gameOverReason = "Your treasury is empty. With no coins left, your empire collapses under debt and chaos.";
			}

			if (ownedCount === 0 && !gameOver) {
				gameOver = true;
				gameOverReason = "You have lost all your planets. With no worlds to call your own, your reign is at an end.";
			}

			if (happiness === 0 && !gameOver) {
				gameOver = true;
				gameOverReason = "Your subjects are utterly miserable. Revolts spread across every world and you are overthrown.";
			}

			if (ownedCount === planets.length && !gameOver) {
				gameOver = true;
				gameOverReason =
					"You successfully conquered every planet. You die a hero to your people, and are remembered as the greatest duck overlord of all time.";
			}

			const extraReaction = extraReactionParts.length > 0 ? extraReactionParts.join(" ") : "";
			const combinedReaction = [baseReaction, extraReaction]
				.map((s) => s.trim())
				.filter(Boolean)
				.join(" ");

			let reactionText = combinedReaction.length > 0 ? combinedReaction : null;

			if (!gameOver) {
				if (currentVisitorId && !visitorsSeenToday.includes(currentVisitorId)) {
					visitorsSeenToday.push(currentVisitorId);
				}

				if (currentVisitorId !== "jester_entertainment" && currentVisitorId !== "intern_money" && currentVisitorId !== "tax_collector")
					visitsToday += 1;

				const endOfDay = visitsToday >= prev.maxVisitorsPerDay;

				if (endOfDay) {
					if (happiness < 10) {
						rebellionChance = Math.min(100, rebellionChance + 3);
					}
					const rebellionThreshold = 30;
					if (rebellionChance >= rebellionThreshold && !gameOver) {
						const canLoseCoins = coins >= 100;

						if (canLoseCoins) {
							coins -= 100;
							const lost = ownedPlanets[Math.floor(Math.random() * ownedCount)];
							planets = planets.map((p) => (p.id === lost.id ? { ...p, owned: false } : p));
							rebellionChance = 0;
							extraReactionParts.push(`Rebellion erupts on ${lost.name}. You lose 100 coins and control of the world.`);
							const newExtra = extraReactionParts
								.map((s) => s.trim())
								.filter(Boolean)
								.join(" ");
							reactionText =
								[baseReaction, newExtra]
									.map((s) => s.trim())
									.filter(Boolean)
									.join(" ") || null;
						} else {
							gameOver = true;
							gameOverReason =
								"Rebellion erupts across your empire. With nothing left to lose and nowhere to retreat, you are dragged from your throne and executed.";
						}
					}

					if (!gameOver) {
						const coinsChange = coins - dayStartCoins;
						const happinessChange = happiness - dayStartHappiness;
						const rebellionChange = rebellionChance - dayStartRebellion;

						lastDaySummary = {
							day,
							coinsChange,
							happinessChange,
							rebellionChange,
						};
						pendingDaySummary = true;

						day = prev.day + 1;
						visitsToday = 0;

						dayStartCoins = coins;
						dayStartHappiness = happiness;
						dayStartRebellion = rebellionChance;
						visitorsSeenToday = [];
					}
					rebellionChance = Math.max(0, rebellionChance);
				}
			}

			if (gameOver && extraReactionParts.length > 0) {
				const extraOnly = extraReactionParts
					.map((s) => s.trim())
					.filter(Boolean)
					.join(" ");

				if (extraOnly.length > 0) {
					gameOverReason = gameOverReason ? `${extraOnly} ${gameOverReason}` : extraOnly;
				}

				reactionText = null;
			}

			return {
				...prev,
				player: { name, gender, coins, happiness },
				planets,
				taxRate,
				rebellionChance,
				day,
				visitsToday,
				showDaySummary,
				lastDaySummary,
				scientistStep,
				dayStartCoins,
				dayStartHappiness,
				dayStartRebellion,
				bountyContractActive,
				bountyNextReportDay,
				reactionText,
				gameOver,
				gameOverReason,
				visitorsSeenToday,
				godDenied,
				jesterHired,
				internHired,
				refugeeBanned,
				pendingDaySummary,
				warDiscount,
				witchHired,
			};
		});
	},

	acknowledgeDaySummary() {
		const state = get();
		if (state.gameOver) return;
		set({
			showDaySummary: false,
			pendingDaySummary: false,
			reactionText: null,
			currentVisitor: null,
		});
		get().nextVisitor();
	},

	resetGame() {
		set({ ...initialState });
	},
}));