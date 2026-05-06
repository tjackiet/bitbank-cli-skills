import { describe, expect, it } from "vitest";
import { COMMANDS, PAPER_COMMANDS, TRADE_COMMANDS } from "../../commands/registry.js";
import { generateBash } from "../../completion/bash.js";
import { buildCompletionData } from "../../completion/data.js";
import { generateZsh } from "../../completion/zsh.js";

const data = buildCompletionData();
const bash = generateBash(data);
const zsh = generateZsh(data);

describe("bash completion script", () => {
  it("declares the _bitbank function and registers complete", () => {
    expect(bash).toContain("_bitbank()");
    expect(bash).toContain("complete -F _bitbank bitbank");
  });

  it("contains every registered top-level command", () => {
    for (const name of Object.keys(COMMANDS)) {
      expect(bash, `missing ${name}`).toContain(name);
    }
  });

  it("contains every trade and paper subcommand", () => {
    for (const name of Object.keys(TRADE_COMMANDS)) expect(bash).toContain(name);
    for (const name of Object.keys(PAPER_COMMANDS)) expect(bash).toContain(name);
  });

  it("includes the format values json/table/csv", () => {
    expect(bash).toContain("json table csv");
  });

  it("embeds pair list (e.g. btc_jpy)", () => {
    expect(bash).toContain("btc_jpy");
    expect(bash).toContain("eth_jpy");
  });

  it("does not invoke 'bitbank' itself (no subprocess in completion path)", () => {
    expect(bash).not.toMatch(/\$\(bitbank\b/);
    expect(bash).not.toMatch(/`bitbank\b/);
  });

  it("completes watch positionals (channel = ticker, then pairs)", () => {
    expect(bash).toContain('"$cmd" == "watch" && $COMP_CWORD -eq 2');
    expect(bash).toContain('compgen -W "ticker"');
    expect(bash).toContain('"$cmd" == "watch" && $COMP_CWORD -eq 3');
  });

  it("matches snapshot for stability", () => {
    expect(bash).toMatchSnapshot();
  });
});

describe("zsh completion script", () => {
  it("starts with #compdef bitbank", () => {
    expect(zsh.startsWith("#compdef bitbank")).toBe(true);
  });

  it("contains every registered top-level command", () => {
    for (const name of Object.keys(COMMANDS)) {
      expect(zsh, `missing ${name}`).toContain(name);
    }
  });

  it("contains every trade and paper subcommand", () => {
    for (const name of Object.keys(TRADE_COMMANDS)) expect(zsh).toContain(name);
    for (const name of Object.keys(PAPER_COMMANDS)) expect(zsh).toContain(name);
  });

  it("uses _bitbank function name (no environment pollution)", () => {
    expect(zsh).toContain("_bitbank()");
  });

  it("completes watch positionals (channel = ticker, then pairs)", () => {
    expect(zsh).toContain('"$cmd" == "watch" && CURRENT -eq 3');
    expect(zsh).toContain("compadd ticker");
    expect(zsh).toContain('"$cmd" == "watch" && CURRENT -eq 4');
  });

  it("matches snapshot for stability", () => {
    expect(zsh).toMatchSnapshot();
  });
});
