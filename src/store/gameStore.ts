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

export interface Leader {
  id: string;
  name: string;
  loyalty: number;
  fear: number;
  greed: number;
  planet: string;
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
}

export type SpecialEffect =
  | "wizard_gamble"
  | "prophet_pay"
  | "tax_collector"
  | "start_bandit_contract"
  | "bandit_continue_contract";

export interface VisitorOptionEffects {
  coins?: number;
  happiness?: number;
  addPlanetId?: string;
  taxRateDelta?: number;
  rebellionDelta?: number;
  special?: SpecialEffect;
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
  conditions?: VisitorConditions;
  options: VisitorOption[];
}

export interface Player {
  coins: number;
  happiness: number;
}

interface Flags {
  celebrationTriggered: boolean;
}

export interface DaySummary {
  day: number;
  coinsChange: number;
  happinessChange: number;
  rebellionChange: number;
}

interface GameState {
  player: Player;
  planets: Planet[];

  day: number;
  currentVisitor: Visitor | null;
  flags: Flags;

  taxRate: number;
  rebellionChance: number;

  visitsToday: number;
  maxVisitorsPerDay: number;

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
}

const planets: Planet[] = planetsData as Planet[];
const visitors: Visitor[] = visitorsData as Visitor[];

function getRandom<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function visitorMatchesConditions(visitor: Visitor, state: GameState): boolean {
  const c = visitor.conditions;
  if (!c) return true;

  if (c.minCoins !== undefined && state.player.coins < c.minCoins) return false;
  if (c.maxCoins !== undefined && state.player.coins > c.maxCoins) return false;

  if (
    c.minHappiness !== undefined &&
    state.player.happiness < c.minHappiness
  ) {
    return false;
  }
  if (
    c.maxHappiness !== undefined &&
    state.player.happiness > c.maxHappiness
  ) {
    return false;
  }

  if (c.minTaxRate !== undefined && state.taxRate < c.minTaxRate) return false;
  if (c.maxTaxRate !== undefined && state.taxRate > c.maxTaxRate) return false;

  if (
    c.minRebellionChance !== undefined &&
    state.rebellionChance < c.minRebellionChance
  ) {
    return false;
  }
  if (
    c.maxRebellionChance !== undefined &&
    state.rebellionChance > c.maxRebellionChance
  ) {
    return false;
  }

  if (c.requiresOwnedPlanet) {
    const hasPlanet = state.planets.some(
      p => p.id === c.requiresOwnedPlanet && p.owned
    );
    if (!hasPlanet) return false;
  }

  if (c.requiresPlanetNotOwned) {
    const hasPlanet = state.planets.some(
      p => p.id === c.requiresPlanetNotOwned && p.owned
    );
    if (hasPlanet) return false;
  }

  return true;
}

export const useGameStore = create<GameState>((set, get) => ({
  player: {
    coins: 100,
    happiness: 50
  },

  planets,

  day: 1,
  currentVisitor: null,
  flags: {
    celebrationTriggered: false
  },

  taxRate: 0.15,
  rebellionChance: 0,

  visitsToday: 0,
  maxVisitorsPerDay: 3,

  showDaySummary: false,
  lastDaySummary: null,
  dayStartCoins: 100,
  dayStartHappiness: 50,
  dayStartRebellion: 0,

  banditContractActive: false,
  banditNextReportDay: null,

  reactionText: null,

  gameOver: false,
  gameOverReason: null,

  ownedPlanetsCount() {
    return get().planets.filter(p => p.owned).length;
  },

  nextVisitor() {
    const state = get();
    if (state.gameOver || state.showDaySummary) return;

    const ownedCount = state.ownedPlanetsCount();

    if (state.currentVisitor && state.reactionText === null) {
      return;
    }

    set({ reactionText: null });

    if (
      state.banditContractActive &&
      state.banditNextReportDay !== null &&
      state.day >= state.banditNextReportDay &&
      state.visitsToday === 0
    ) {
      const baseBandit = visitors.find(v => v.id === "bandit_hunter");
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
                coins: -40,
                happiness: 20,
                rebellionDelta: -15
              },
              reaction:
                "As promised, the threat is gone. Payment accepted, my lord."
            }
          ]
        };

        set({
          currentVisitor: resultVisitor,
          banditContractActive: false,
          banditNextReportDay: null
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
                special: "bandit_continue_contract"
              },
              reaction:
                "Understood. I will not rest until their trail runs cold."
            },
            {
              id: "bandit_fail_stop",
              text: "No. Stand down.",
              effects: {
                happiness: -5,
                rebellionDelta: 5
              },
              reaction:
                "Very well. Just know that whatever they do next is on your head, overlord."
            }
          ]
        };

        set({
          currentVisitor: resultVisitor
        });
      }

      return;
    }

    if (
      state.day % 10 === 0 &&
      state.visitsToday === 0 &&
      ownedCount > 0
    ) {
      const taxCollector = visitors.find(v => v.id === "tax_collector");
      if (taxCollector) {
        set({ currentVisitor: taxCollector });
        return;
      }
    }

    const available = visitors.filter(v => {
      if (v.id === "tax_collector") {
        return false;
      }
      return visitorMatchesConditions(v, state);
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
    const special = effects.special;
    const costDelta = effects.coins ?? 0;

    if (costDelta < 0 && stateBefore.player.coins + costDelta < 0) {
      return;
    }

    set(prev => {
      let coins = prev.player.coins + (effects.coins ?? 0);
      let happiness = prev.player.happiness + (effects.happiness ?? 0);
      let taxRate = prev.taxRate + (effects.taxRateDelta ?? 0);
      let rebellionChance =
        prev.rebellionChance + (effects.rebellionDelta ?? 0);

      coins = Math.max(0, coins);
      happiness = Math.max(0, Math.min(100, happiness));
      taxRate = Math.max(0.01, Math.min(0.5, taxRate));
      rebellionChance = Math.max(0, Math.min(100, rebellionChance));

      let planets = prev.planets;
      if (effects.addPlanetId) {
        planets = prev.planets.map(p =>
          p.id === effects.addPlanetId ? { ...p, owned: true } : p
        );
      }

      const flags: Flags = { ...prev.flags };
      let gameOver = prev.gameOver;
      let gameOverReason = prev.gameOverReason;

      const ownedPlanets = planets.filter(p => p.owned);
      const ownedCount = ownedPlanets.length;

      let banditContractActive = prev.banditContractActive;
      let banditNextReportDay = prev.banditNextReportDay;

      if (special === "start_bandit_contract") {
        banditContractActive = true;
        banditNextReportDay = prev.day + 1;
      }

      if (special === "bandit_continue_contract") {
        banditContractActive = true;
        banditNextReportDay = prev.day + 1;
      }

      const baseReaction = option.reaction || "";
      const extraReactionParts: string[] = [];

      if (special === "wizard_gamble") {
        const win = Math.random() < 0.5;
        if (win) {
          coins += 200;
          happiness = Math.min(100, happiness + 10);
          rebellionChance = Math.max(0, rebellionChance - 5);
          extraReactionParts.push(
            "The void laughs in your favor. Fortune pours into your coffers."
          );
        } else {
          coins = Math.max(0, coins - 100);
          happiness = Math.max(0, happiness - 15);
          rebellionChance = Math.min(100, rebellionChance + 5);
          extraReactionParts.push(
            "The stars flicker cold. Your wealth and goodwill bleed away."
          );
        }
      }

      if (special === "prophet_pay") {
        let prophecy: string;
        if (rebellionChance >= 30) {
          prophecy =
            "Rebellion is brewing in the hearts of your subjects. You stand on the edge of a knife.";
        } else if (rebellionChance >= 20) {
          prophecy =
            "Unease coils beneath the surface. The embers of dissent glow hot.";
        } else {
          prophecy =
            "For now, the galaxy lies quiet. But quiet is only the breath before a scream.";
        }
        extraReactionParts.push(prophecy);
      }

      if (special === "tax_collector" && ownedCount > 0) {
        const baseTaxPerPlanet = 20;
        const taxIncome = Math.round(
          ownedCount * baseTaxPerPlanet * taxRate
        );
        coins += taxIncome;
        extraReactionParts.push(
          `Your ledgers swell by ${taxIncome} coins from your subjects’ labor.`
        );
      }

      if (coins === 0 && !gameOver) {
        gameOver = true;
        gameOverReason =
          "Your treasury is empty. With no coins left, your empire collapses under debt and chaos.";
      }

      if (happiness === 0 && !gameOver) {
        gameOver = true;
        gameOverReason =
          "Your subjects are utterly miserable. Revolts spread across every world and you are overthrown.";
      }

      let day = prev.day;
      let visitsToday = prev.visitsToday;
      let showDaySummary = prev.showDaySummary;
      let lastDaySummary = prev.lastDaySummary;
      let dayStartCoins = prev.dayStartCoins;
      let dayStartHappiness = prev.dayStartHappiness;
      let dayStartRebellion = prev.dayStartRebellion;

      const extraReaction =
        extraReactionParts.length > 0
          ? extraReactionParts.join(" ")
          : "";
      const combinedReaction = [baseReaction, extraReaction]
        .map(s => s.trim())
        .filter(Boolean)
        .join(" ");

      let reactionText =
        combinedReaction.length > 0 ? combinedReaction : null;

      if (!gameOver) {
        visitsToday += 1;

        const endOfDay = visitsToday >= prev.maxVisitorsPerDay;

        if (endOfDay) {
          if (happiness >= 80 && ownedCount > 0) {
            coins += ownedCount * 5;
          }

          if (happiness < 20) {
            rebellionChance = Math.min(100, rebellionChance + 5);
          }

          if (coins >= 500 && !flags.celebrationTriggered) {
            flags.celebrationTriggered = true;
            happiness = Math.min(100, happiness + 20);
          }

          const rebellionThreshold = 40;
          if (rebellionChance >= rebellionThreshold && !gameOver) {
            const canLoseCoins = coins >= 100;
            const canLosePlanet = ownedCount > 0;

            if (canLoseCoins && canLosePlanet) {
              coins -= 100;
              const lost =
                ownedPlanets[
                  Math.floor(Math.random() * ownedPlanets.length)
                ];
              planets = planets.map(p =>
                p.id === lost.id ? { ...p, owned: false } : p
              );
              rebellionChance = 0;
              extraReactionParts.push(
                `Rebellion erupts on ${lost.name}. You lose 100 coins and control of the world.`
              );
              const newExtra = extraReactionParts
                .map(s => s.trim())
                .filter(Boolean)
                .join(" ");
              reactionText = [baseReaction, newExtra]
                .map(s => s.trim())
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
              rebellionChange
            };
            showDaySummary = true;

            day = prev.day + 1;
            visitsToday = 0;

            dayStartCoins = coins;
            dayStartHappiness = happiness;
            dayStartRebellion = rebellionChance;
          }

          if (coins < 0) coins = 0;
          rebellionChance = Math.max(0, Math.min(100, rebellionChance));
        }
      }

      return {
        ...prev,
        player: { coins, happiness },
        planets,
        flags,
        taxRate,
        rebellionChance,
        day,
        visitsToday,
        showDaySummary,
        lastDaySummary,
        dayStartCoins,
        dayStartHappiness,
        dayStartRebellion,
        banditContractActive,
        banditNextReportDay,
        reactionText,
        gameOver,
        gameOverReason
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

    set({ showDaySummary: false, reactionText: null });
    get().nextVisitor();
  }
}));
