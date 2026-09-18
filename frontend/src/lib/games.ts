import type { GameKind } from "@/types"

export interface GameChoiceOption {
  value: string
  label: string
  /** Short glyph used in choice pickers and result reveals. */
  glyph: string
}

export interface GameMeta {
  kind: GameKind
  name: string
  tagline: string
  rules: string
  accent: "gold" | "blue"
  choicePrompt: string
  choices: GameChoiceOption[]
}

export const GAMES: Record<GameKind, GameMeta> = {
  coinflip: {
    kind: "coinflip",
    name: "Coin Flip",
    tagline: "Fifty-fifty. Pure nerve.",
    rules: "Pick heads or tails. Your opponent takes the other side. One flip decides who takes the pool.",
    accent: "gold",
    choicePrompt: "Call it",
    choices: [
      { value: "heads", label: "Heads", glyph: "H" },
      { value: "tails", label: "Tails", glyph: "T" },
    ],
  },
  rps: {
    kind: "rps",
    name: "Rock Paper Scissors",
    tagline: "Read your rival. Commit. Reveal.",
    rules:
      "Pick rock, paper, or scissors. Picks are hidden with commit-reveal until both players lock in, then the winner takes the pool.",
    accent: "blue",
    choicePrompt: "Throw your hand",
    choices: [
      { value: "rock", label: "Rock", glyph: "✊" },
      { value: "paper", label: "Paper", glyph: "✋" },
      { value: "scissors", label: "Scissors", glyph: "✌️" },
    ],
  },
  dice: {
    kind: "dice",
    name: "Roll the Dice",
    tagline: "Call your number. Closest wins.",
    rules:
      "Pick a number 1–6. A single die is rolled — closest guess to the result wins. Equal distance refunds both players.",
    accent: "gold",
    choicePrompt: "Pick your number",
    choices: [
      { value: "1", label: "1", glyph: "⚀" },
      { value: "2", label: "2", glyph: "⚁" },
      { value: "3", label: "3", glyph: "⚂" },
      { value: "4", label: "4", glyph: "⚃" },
      { value: "5", label: "5", glyph: "⚄" },
      { value: "6", label: "6", glyph: "⚅" },
    ],
  },
}

export const GAME_LIST: GameMeta[] = [GAMES.coinflip, GAMES.rps, GAMES.dice]

export function gameName(kind: GameKind): string {
  return GAMES[kind]?.name ?? kind
}

export function choiceLabel(kind: GameKind, value: string): string {
  return GAMES[kind]?.choices.find((c) => c.value === value)?.label ?? value
}

export function choiceGlyph(kind: GameKind, value: string): string {
  return GAMES[kind]?.choices.find((c) => c.value === value)?.glyph ?? value
}
