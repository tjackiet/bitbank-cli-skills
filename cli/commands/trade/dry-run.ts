export type DryRunInfo = {
  endpoint: string;
  body: Record<string, unknown>;
  executeHint: string;
};

export function printDryRun(info: DryRunInfo): void {
  const lines = [
    "🔍 DRY RUN（実際のAPIは叩きません）",
    "",
    "リクエスト内容:",
    `  エンドポイント: POST ${info.endpoint}`,
    "  ボディ:",
  ];
  const sensitiveKeys = new Set(["token", "otp_token"]);
  for (const [k, v] of Object.entries(info.body)) {
    const display = sensitiveKeys.has(k) ? '"***"' : JSON.stringify(v);
    lines.push(`    ${k}: ${display}`);
  }
  lines.push("");
  lines.push("実行するには --execute を付けてください:");
  lines.push(`  ${info.executeHint}`);
  process.stdout.write(`${lines.join("\n")}\n`);
}
