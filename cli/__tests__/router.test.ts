import { describe, expect, it, vi } from "vitest";
import { COMMANDS, TRADE_COMMANDS } from "../commands/registry.js";
import { handleSpecialCommand, resolveCommand, runCommandHelp } from "../router.js";

describe("resolveCommand", () => {
  it("既知の public コマンドを正しく振り分ける", () => {
    const r = resolveCommand(["ticker"]);
    expect(r.isTrade).toBe(false);
    expect(r.command).toBe("ticker");
    expect(r.entry).toBe(COMMANDS.ticker);
  });

  it("既知のハイフン付きコマンドを正しく振り分ける", () => {
    const r = resolveCommand(["tickers-jpy"]);
    expect(r.isTrade).toBe(false);
    expect(r.entry).toBe(COMMANDS["tickers-jpy"]);
  });

  it("不明な public コマンドは entry が undefined", () => {
    const r = resolveCommand(["nonexistent"]);
    expect(r.isTrade).toBe(false);
    expect(r.command).toBe("nonexistent");
    expect(r.entry).toBeUndefined();
  });

  it("引数なし（空配列）は entry が undefined", () => {
    const r = resolveCommand([]);
    expect(r.isTrade).toBe(false);
    expect(r.command).toBeUndefined();
    expect(r.entry).toBeUndefined();
  });

  it("trade 単独は isTrade=true で entry undefined", () => {
    const r = resolveCommand(["trade"]);
    expect(r.isTrade).toBe(true);
    expect(r.command).toBeUndefined();
    expect(r.entry).toBeUndefined();
  });

  it("trade <unknown> は entry が undefined", () => {
    const r = resolveCommand(["trade", "nonexistent"]);
    expect(r.isTrade).toBe(true);
    expect(r.command).toBe("nonexistent");
    expect(r.entry).toBeUndefined();
  });

  it("trade <known> は TRADE_COMMANDS の entry を返す", () => {
    const r = resolveCommand(["trade", "create-order"]);
    expect(r.isTrade).toBe(true);
    expect(r.command).toBe("create-order");
    expect(r.entry).toBe(TRADE_COMMANDS["create-order"]);
  });

  it("trade と同名の public コマンドは存在せず干渉しない", () => {
    expect(COMMANDS["create-order"]).toBeUndefined();
    const r = resolveCommand(["create-order"]);
    expect(r.isTrade).toBe(false);
    expect(r.entry).toBeUndefined();
  });

  it("追加の positionals があっても先頭2要素のみ参照", () => {
    const r = resolveCommand(["trade", "create-order", "extra", "args"]);
    expect(r.isTrade).toBe(true);
    expect(r.command).toBe("create-order");
    expect(r.entry).toBe(TRADE_COMMANDS["create-order"]);
  });
});

describe("handleSpecialCommand", () => {
  it("'profiles' は true を返し profilesHandler を実行する", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const handled = await handleSpecialCommand("profiles", [], {}, "json");
    writeSpy.mockRestore();
    expect(handled).toBe(true);
  });

  it("'schema' は true を返し schemaHandler を実行する", async () => {
    const writeSpy = vi.spyOn(process.stdout, "write").mockImplementation(() => true);
    const handled = await handleSpecialCommand("schema", [], {}, "json");
    writeSpy.mockRestore();
    expect(handled).toBe(true);
  });

  it("不明なコマンドは false を返す", async () => {
    const handled = await handleSpecialCommand("ticker", [], {}, "json");
    expect(handled).toBe(false);
  });

  it("空文字列は false を返す", async () => {
    const handled = await handleSpecialCommand("", [], {}, "json");
    expect(handled).toBe(false);
  });
});

describe("runCommandHelp", () => {
  it("既知コマンドは true を返しヘルプを出力する", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const handled = await runCommandHelp("ticker", "Get ticker for a pair");
    logSpy.mockRestore();
    expect(handled).toBe(true);
  });

  it("未登録コマンドは false を返す", async () => {
    const logSpy = vi.spyOn(console, "log").mockImplementation(() => {});
    const handled = await runCommandHelp("nonexistent-xyz", "desc");
    logSpy.mockRestore();
    expect(handled).toBe(false);
  });
});
