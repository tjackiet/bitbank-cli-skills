import {
  COMMANDS,
  PAPER_COMMANDS,
  PROFILE_COMMANDS,
  TRADE_COMMANDS,
} from "../commands/registry.js";
import { COMMON_OPTIONS } from "../common-options.js";
import { KNOWN_PAIRS } from "../pairs.js";

export type CompletionData = {
  topLevel: string[];
  tradeSubcommands: string[];
  paperSubcommands: string[];
  profileSubcommands: string[];
  pairs: string[];
  formats: string[];
  /** Commands whose options include `pair` (i.e. accept a pair argument). */
  pairCommands: string[];
  /** Commands whose options include `pair` under `trade <sub>`. */
  pairTradeSubcommands: string[];
  /** Commands whose options include `pair` under `paper <sub>`. */
  pairPaperSubcommands: string[];
  /** Per-command long flags for `--<flag>` completion. */
  optionsByCommand: Record<string, string[]>;
  optionsByTradeSub: Record<string, string[]>;
  optionsByPaperSub: Record<string, string[]>;
  optionsByProfileSub: Record<string, string[]>;
  commonOptions: string[];
};

const SPECIAL = ["completion", "profiles", "schema"];

function pickPairCommands(entries: Record<string, { options?: object }>): string[] {
  return Object.entries(entries)
    .filter(([, e]) => e.options && Object.hasOwn(e.options, "pair"))
    .map(([name]) => name);
}

function optionsOf(entries: Record<string, { options?: object }>): Record<string, string[]> {
  const out: Record<string, string[]> = {};
  for (const [name, e] of Object.entries(entries)) {
    out[name] = e.options ? Object.keys(e.options) : [];
  }
  return out;
}

export function buildCompletionData(): CompletionData {
  const topLevel = [...Object.keys(COMMANDS), "trade", "paper", "profile", ...SPECIAL].sort();
  const tradeSubcommands = Object.keys(TRADE_COMMANDS).sort();
  const paperSubcommands = Object.keys(PAPER_COMMANDS).sort();
  const profileSubcommands = Object.keys(PROFILE_COMMANDS).sort();
  return {
    topLevel,
    tradeSubcommands,
    paperSubcommands,
    profileSubcommands,
    pairs: [...KNOWN_PAIRS],
    formats: ["json", "table", "csv"],
    pairCommands: pickPairCommands(COMMANDS).sort(),
    pairTradeSubcommands: pickPairCommands(TRADE_COMMANDS).sort(),
    pairPaperSubcommands: pickPairCommands(PAPER_COMMANDS).sort(),
    optionsByCommand: optionsOf(COMMANDS),
    optionsByTradeSub: optionsOf(TRADE_COMMANDS),
    optionsByPaperSub: optionsOf(PAPER_COMMANDS),
    optionsByProfileSub: optionsOf(PROFILE_COMMANDS),
    commonOptions: Object.keys(COMMON_OPTIONS).sort(),
  };
}
