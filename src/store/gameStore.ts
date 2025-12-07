import { create } from "zustand";
import planetsData from "../data/planets.json";
import visitorsData from "../data/visitors.json";

export interface Planet {
	id: string;
	name: string;
	development: number;
	rebellion: number;
	leaderId: string;
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
}

export type SpecialEffect =
	| "wizard_gamble"
	| "prophet_pay"
	| "tax_collector"
	| "start_bandit_contract"
	| "bandit_continue_contract"
	| "start_war_defend"
	| "start_war_attack"
	| "war_invest_more"
	| "war_surrender"
	| "god_deny"
	| "science_chain_start"
	| "science_chain_continue"
	| "science_chain_complete"
	| "jester_hired";

export interface VisitorOptionEffects {
	coins?: number;
	happiness?: number;
	addPlanetId?: string;
	taxRateDelta?: number;
	rebellionDelta?: number;
	special?: SpecialEffect;
	warOurPlanetId?: string;
	warEnemyPlanetId?: string;
}

export interface VisitorOption {
	id: string;
	text: string;
	effects?: VisitorOptionEffects;
	reaction?: string;
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
	dayStartHappiness: number;
	dayStartRebellion: number;
	banditContractActive: boolean;
	banditNextReportDay: number | null;
	reactionText: string | null;
	gameOver: boolean;
	gameOverReason: string | null;
	ownedPlanetsCount: () => number;
	nextVisitor: () => void;
	chooseOption: (option: VisitorOption) => void;
	acknowledgeDaySummary: () => void;
	visitorsSeenToday: string[];
	warActive: boolean;
	warType: "attack" | "defense" | null;
	warOurPlanetId: string | null;
	warEnemyPlanetId: string | null;
	warDaysElapsed: number;
	warInvestment: number;
	warPendingReport: string | null;
	godDenied: boolean;
	jesterHired: boolean;
	pendingDaySummary: boolean;
	resetGame: () => void;
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
	rebellionChance: 0,
	jesterHired: false,
	visitsToday: 0,
	maxVisitorsPerDay: 5,
	showDaySummary: false,
	lastDaySummary: null,
	dayStartCoins: 100,
	dayStartHappiness: 50,
	dayStartRebellion: 0,
	banditContractActive: false,
	banditNextReportDay: null,
	scientistStep: 0,
	reactionText: null,
	gameOver: false,
	gameOverReason: null,
	visitorsSeenToday: [],
	warActive: false,
	warType: null,
	warOurPlanetId: null,
	warEnemyPlanetId: null,
	warDaysElapsed: 0,
	warInvestment: 0,
	warPendingReport: null,
	godDenied: false,
	pendingDaySummary: false,
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
	if (c.minTaxRate !== undefined && state.taxRate < c.minTaxRate) return false;
	if (c.maxTaxRate !== undefined && state.taxRate > c.maxTaxRate) return false;
	if (c.minRebellionChance !== undefined && state.rebellionChance < c.minRebellionChance) return false;
	if (c.maxRebellionChance !== undefined && state.rebellionChance > c.maxRebellionChance) return false;
	if (
		c.requiresOwnedPlanet !== undefined &&
		!state.planets.some((p) => p.id === c.requiresOwnedPlanet && p.owned)
	)
		return false;
	if (
		c.requiresPlanetNotOwned !== undefined &&
		state.planets.some((p) => p.id === c.requiresPlanetNotOwned && p.owned)
	)
		return false;

	return true;
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

function createWarStatusVisitor(state: GameState): Visitor | null {
	if (!state.warActive || !state.warEnemyPlanetId) return null;

	const enemy = state.planets.find((p) => p.id === state.warEnemyPlanetId);
	const ours = state.warOurPlanetId ? state.planets.find((p) => p.id === state.warOurPlanetId) : undefined;

	const warDailyCost = 40;
	const advantage = state.warInvestment - state.warDaysElapsed * warDailyCost;
	const winning = advantage >= 0;
	let text: string;

	if (state.warType === "defense") {
		if (winning) {
			text = `Lord, we are winning the war at ${ours?.name ?? "our planet"}. We have the upper hand against ${enemy?.name}`;
		} else {
			text = `Lord, we are struggling to defend ${ours?.name ?? "our planet"}. We need more coins to stop ${enemy?.name}.`;
		}
	} else {
		if (winning) {
			text = `Lord, we are close to defeating ${enemy?.name}.`;
		} else {
			text = `Lord, the defense at ${enemy?.name} is too strong. We must invest more coins to turn the tide.`;
		}
	}

	return {
		id: "war_general_status",
		name: "War General",
		sprite: "war_general.png",
		text: text,
		options: [
			{
				id: "war_invest_more",
				text: `Commit ${warDailyCost} more coins to the war.`,
				effects: {
					coins: -warDailyCost,
					special: "war_invest_more",
				},
				reaction: "Thank you. Reinforcements and supplies are on the way.",
			},
			{
				id: "war_hold_or_surrender",
				text:
					state.warType === "defense"
						? "We cannot spare more. Hold if you can."
						: "I cannot. Call off the campaign.",
				effects: {
					special: "war_surrender",
				},
				reaction:
					state.warType === "defense"
						? "Alright, but I warn you this will likely not go well."
						: "Very well, we will retreat.",
			},
		],
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
						id: "royal_advisor_acknowledge",
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
						id: "royal_advisor_acknowledge",
						text: "Alright!",
						reaction: "I wish you luck in your journey!",
					},
					{
						id: "royal_advisor_more_tutorial",
						text: "Awesome!",
						reaction: "I wish you luck in your journey!",
					},
				],
			};
			set({ currentVisitor: royalAdvisor });
			return;
		}

		if (state.warPendingReport) {
			const reportVisitor: Visitor = {
				id: "war_general_report",
				name: "War General",
				sprite: "war_general.png",
				text: state.warPendingReport,
				options: [
					{
						id: "war_report_acknowledge",
						text: "Understood.",
						reaction: "I will return to the barracks.",
					},
				],
			};
			set({
				currentVisitor: reportVisitor,
				warPendingReport: null,
			});
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
						id: "god_accept_fate",
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
						id: "jester_perform",
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

		if (state.scientistStep === 1 && Math.random() < 0.3) {
			const ScientistVisitor: Visitor = {
				id: "scientist_more_funding",
				name: "Scientist",
				sprite: "scientist.png",
				text: "Lord, we are close! Just a little more funding, and we will be able to make a breakthrough!",
				options: [
					{
						id: "fund_science",
						text: "Alright, take the funds. (-40 coins)",
						effects: {
							coins: -40,
							happiness: 10,
							special: "science_chain_continue",
						},
						reaction: "Thank you, my lord! I shall come back shortly with my findings!",
					},
					{
						id: "decline_funding",
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
						id: "accept",
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

		if (state.warActive && state.visitsToday === 0) {
			const warVisitor = createWarStatusVisitor(state);
			if (warVisitor) {
				set({ currentVisitor: warVisitor });
				return;
			}
		}

		if (
			state.banditContractActive &&
			state.banditNextReportDay !== null &&
			state.day >= state.banditNextReportDay &&
			state.visitsToday === 0
		) {
			const baseBandit = visitors.find((v) => v.id === "bandit_hunter");
			const name = baseBandit?.name ?? "Bounty Huntress";
			const sprite = baseBandit?.sprite ?? "bandit_huntress.png";

			const success = Math.random() < 0.6;

			if (success) {
				const resultVisitor: Visitor = {
					id: "bandit_result_success",
					name,
					sprite,
					text: "Overlord, I have found the criminal and dealt with them. Your subjects are safer now.",
					options: [
						{
							id: "bandit_success_ack",
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
					banditContractActive: false,
					banditNextReportDay: null,
				});
			} else {
				const resultVisitor: Visitor = {
					id: "bandit_result_fail",
					name,
					sprite,
					text: "I have not yet found the criminal, overlord. They are elusive. Shall I continue the hunt?",
					options: [
						{
							id: "bandit_fail_continue",
							text: "Yes, keep hunting.",
							effects: {
								coins: -40,
								rebellionDelta: -5,
								special: "bandit_continue_contract",
							},
							reaction: "Understood. I will keep tracking them. My fee rises with every passing day.",
						},
						{
							id: "bandit_fail_stop",
							text: "No. Stand down.",
							effects: {
								happiness: -10,
								rebellionDelta: 15,
							},
							reaction:
								"Then whatever they do next is on your head, overlord. Your people know you let the criminal walk.",
						},
					],
				};

				set({
					currentVisitor: resultVisitor,
				});
			}

			return;
		}

		if (state.day % 5 === 0 && state.visitsToday === 0 && ownedCount > 0) {
			const taxCollector: Visitor = {
				id: "tax_collector",
				name: "Imperial Tax Collector",
				sprite: "tax_officer.png",
				text: "Lord {user}, your citizens have paid their taxes. Their bread now fills your vaults.",
				conditions: {
					minCoins: 0,
				},
				options: [
					{
						id: "accept_taxes",
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

		if (!state.warActive && Math.random() < 0.1 && state.day !== 1) {
			const ourPlanet = getRandomOwnedPlanet(state.planets);
			const enemyPlanet = getRandomUnownedPlanet(state.planets);
			if (ourPlanet && enemyPlanet) {
				const defendCost = 60;
				const warOfferVisitor: Visitor = {
					id: "war_general_defend_offer",
					name: "War General",
					sprite: "war_general.png",
					text: `Lord, our planet ${ourPlanet.name} is being attacked by ${enemyPlanet.name}. We must defend for ${defendCost} coins or we will lose it.`,
					options: [
						{
							id: "defend_planet",
							text: `Defend ${ourPlanet.name} (-${defendCost} coins)`,
							effects: {
								coins: -defendCost,
								special: "start_war_defend",
								warOurPlanetId: ourPlanet.id,
								warEnemyPlanetId: enemyPlanet.id,
							},
							reaction: "We will do our best.",
						},
						{
							id: "abandon_planet",
							text: `We cannot afford it. Abandon ${ourPlanet.name}.`,
							effects: {
								special: "war_surrender",
								warOurPlanetId: ourPlanet.id,
								warEnemyPlanetId: enemyPlanet.id,
							},
							reaction: `Very well, ${ourPlanet.name} will fall.`,
						},
					],
				};

				set({ currentVisitor: warOfferVisitor });
				return;
			}
		}

		if (!state.warActive && state.player.coins >= 200 && Math.random() < 0.3) {
			const enemyPlanet = getRandomUnownedPlanet(state.planets);
			if (enemyPlanet) {
				const attackCost = 80;
				const warAttackVisitor: Visitor = {
					id: "war_general_attack_offer",
					name: "War General",
					sprite: "war_general.png",
					text: `Lord, for ${attackCost} coins we can attack ${enemyPlanet.name}.`,
					options: [
						{
							id: "start_attack",
							text: `Alright, attack ${enemyPlanet.name} (-${attackCost} coins)`,
							effects: {
								coins: -attackCost,
								special: "start_war_attack",
								warEnemyPlanetId: enemyPlanet.id,
							},
							reaction: "We will attack at the quack of dawn.",
						},
						{
							id: "decline_attack",
							text: "Not now.",
							reaction: "Alright. The military will remain on standby.",
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
			let planets = prev.planets;
			let banditContractActive = prev.banditContractActive;
			let banditNextReportDay = prev.banditNextReportDay;
			let pendingDaySummary = prev.pendingDaySummary;
			let warActive = prev.warActive;
			let warType = prev.warType;
			let warOurPlanetId = prev.warOurPlanetId;
			let warEnemyPlanetId = prev.warEnemyPlanetId;
			let warDaysElapsed = prev.warDaysElapsed;
			let warInvestment = prev.warInvestment;
			let warPendingReport = prev.warPendingReport;
			let godDenied = prev.godDenied;

			const currentVisitorId = prev.currentVisitor?.id || null;
			const effects = option.effects || {};
			const special = effects.special;
			let coins = prev.player.coins + (effects.coins ?? 0);
			let happiness = prev.player.happiness + (effects.happiness ?? 0);
			let taxRate = prev.taxRate + (effects.taxRateDelta ?? 0);
			let rebellionChance = prev.rebellionChance + (effects.rebellionDelta ?? 0);

			if (effects.addPlanetId) {
				planets = prev.planets.map((p) => (p.id === effects.addPlanetId ? { ...p, owned: true } : p));
			}
			const ownedPlanets = planets.filter((p) => p.owned);
			const ownedCount = ownedPlanets.length;
			coins = Math.max(0, coins);
			happiness = Math.max(0, happiness);
			taxRate = Math.max(0, Math.min(0.5, taxRate));
			rebellionChance = Math.max(0, rebellionChance);

			if (special === "start_bandit_contract") {
				banditContractActive = true;
				banditNextReportDay = prev.day + 1;
			}

			if (special === "bandit_continue_contract") {
				banditContractActive = true;
				banditNextReportDay = prev.day + 1;
			}

			if (special === "god_deny") {
				godDenied = true;
			}

			if (special === "jester_hired") {
				jesterHired = true;
			}

			const baseReaction = option.reaction || "";
			const extraReactionParts: string[] = [];

			if (special === "wizard_gamble") {
				const win = Math.random() < 0.5;
				if (win) {
					coins += 150;
					happiness = Math.min(100, happiness + 10);
					rebellionChance -= 5;
					extraReactionParts.push(
						"You are an eggstraordinary being. Your vaults are now filled to the brim."
					);
				} else {
					coins = Math.max(0, coins - 75);
					happiness = Math.max(0, happiness - 15);
					rebellionChance += 5;
					extraReactionParts.push(
						"Your empire is slowly quacking apart. Your wealth and reputation are flying away."
					);
				}
			}

			if (special === "prophet_pay") {
				let prophecy: string;
				if (rebellionChance >= 30) {
					prophecy = "Rebellion is coming. Try to make your citizens happy, or you will be overthrown.";
				} else if (rebellionChance >= 20) {
					prophecy =
						"Ire blazes in the hearts of your ducks. The talons of rebellion may soon clutch your empire.";
				} else {
					prophecy = "Your rule is stable. Your subjects are content under your reign.";
				}
				extraReactionParts.push(prophecy);
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

			if (special === "start_war_defend") {
				warActive = true;
				warType = "defense";
				warOurPlanetId = effects.warOurPlanetId ?? null;
				warEnemyPlanetId = effects.warEnemyPlanetId ?? null;
				warDaysElapsed = 0;
				const investNow = -(effects.coins ?? 0);
				if (investNow > 0) {
					warInvestment = investNow;
				} else {
					warInvestment = 0;
				}
			}

			if (special === "start_war_attack") {
				warActive = true;
				warType = "attack";
				warOurPlanetId = null;
				warEnemyPlanetId = effects.warEnemyPlanetId ?? null;
				warDaysElapsed = 0;
				const investNow = -(effects.coins ?? 0);
				if (investNow > 0) {
					warInvestment = investNow;
				} else {
					warInvestment = 0;
				}
			}

			if (special === "war_invest_more") {
				const investMore = -(effects.coins ?? 0);
				if (investMore > 0) {
					warInvestment = prev.warInvestment + investMore;
				}
				warDaysElapsed = prev.warDaysElapsed + 1;
			}

			if (special === "war_surrender") {
				if (!prev.warActive && effects.warOurPlanetId) {
					planets = planets.map((p) => (p.id === effects.warOurPlanetId ? { ...p, owned: false } : p));
					warPendingReport = "We abandon the world. The enemy occupies it completely.";
				}

				if (prev.warActive) {
					if (prev.warType === "defense" && prev.warOurPlanetId) {
						planets = planets.map((p) => (p.id === prev.warOurPlanetId ? { ...p, owned: false } : p));
						warPendingReport = "Our defending world is lost to the enemy.";
					} else if (prev.warType === "attack" && prev.warEnemyPlanetId) {
						warPendingReport = "We retreat. The enemy planet remains unconquered.";
					}
				}

				warActive = false;
				warType = null;
				warOurPlanetId = null;
				warEnemyPlanetId = null;
				warDaysElapsed = 0;
				warInvestment = 0;
			}

			if (warActive) {
				const maxWarDays = 3;

				if (special !== "war_invest_more") {
					warDaysElapsed = prev.warDaysElapsed + 1;
				}

				if (coins === 0) {
					if (warType === "defense" && warOurPlanetId) {
						planets = planets.map((p) => (p.id === warOurPlanetId ? { ...p, owned: false } : p));
						warPendingReport = "Without coins, we fail to defend and lose the planet.";
					} else if (warType === "attack" && warEnemyPlanetId) {
						warPendingReport = "Without money, we failed to seize the enemy world.";
					}
					warActive = false;
					warType = null;
					warOurPlanetId = null;
					warEnemyPlanetId = null;
					warDaysElapsed = 0;
					warInvestment = 0;
				} else if (warDaysElapsed >= maxWarDays) {
					const strength = warInvestment + Math.random() * 60;
					const difficulty = 80;

					if (strength >= difficulty) {
						if (warType === "defense") {
							warPendingReport = "The enemy retreated and we protected the planet.";
						} else if (warType === "attack" && warEnemyPlanetId) {
							planets = planets.map((p) => (p.id === warEnemyPlanetId ? { ...p, owned: true } : p));
							warPendingReport = "Victory. The enemy planet falls and joins your empire.";
						}
					} else {
						if (warType === "defense" && warOurPlanetId) {
							planets = planets.map((p) => (p.id === warOurPlanetId ? { ...p, owned: false } : p));
							warPendingReport = "We are overwhelmed. The defending world is lost.";
						} else if (warType === "attack") {
							warPendingReport = "The campaign fails and the enemy lives.";
						}
					}

					warActive = false;
					warType = null;
					warOurPlanetId = null;
					warEnemyPlanetId = null;
					warDaysElapsed = 0;
					warInvestment = 0;
				}
			}

			if (coins === 0 && !gameOver) {
				gameOver = true;
				gameOverReason =
					"Your treasury is empty. With no coins left, your empire collapses under debt and chaos.";
			}

			if (ownedCount === 0 && !gameOver) {
				gameOver = true;
				gameOverReason =
					"You have lost all your planets. With no worlds to call your own, your reign is at an end.";
			}

			if (happiness === 0 && !gameOver) {
				gameOver = true;
				gameOverReason =
					"Your subjects are utterly miserable. Revolts spread across every world and you are overthrown.";
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

				if (currentVisitorId !== "jester_entertainment" && currentVisitorId !== "war_general_report")
					visitsToday += 1;

				const endOfDay = visitsToday >= prev.maxVisitorsPerDay;

				if (endOfDay) {
					if (happiness >= 80) {
						coins += ownedCount * 5;
					}

					if (happiness < 20) {
						rebellionChance = Math.min(100, rebellionChance + 5);
					}

					const rebellionThreshold = 30;
					if (rebellionChance >= rebellionThreshold && !gameOver) {
						const canLoseCoins = coins >= 100;

						if (canLoseCoins) {
							coins -= 100;
							const lost = ownedPlanets[Math.floor(Math.random() * ownedCount)];
							planets = planets.map((p) => (p.id === lost.id ? { ...p, owned: false } : p));
							rebellionChance = 0;
							extraReactionParts.push(
								`Rebellion erupts on ${lost.name}. You lose 100 coins and control of the world.`
							);
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
				banditContractActive,
				banditNextReportDay,
				reactionText,
				gameOver,
				gameOverReason,
				visitorsSeenToday,
				warActive,
				warType,
				warOurPlanetId,
				warEnemyPlanetId,
				warDaysElapsed,
				warInvestment,
				warPendingReport,
				godDenied,
				jesterHired,
				pendingDaySummary,
			};
		});

		const after = get();
		if (!after.gameOver && !after.showDaySummary) {
			return;
		}
	},

	acknowledgeDaySummary() {
		const state = get();
		if (state.gameOver) return;
		set({ showDaySummary: false, pendingDaySummary: false, reactionText: null, currentVisitor: null });
		get().nextVisitor();
	},

	resetGame() {
		set({ ...initialState });
	}
}));
