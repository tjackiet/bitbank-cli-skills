// 100行超: 出金は資金移動を伴うため、入力検証 + allowlist チェック +
// bitbank API でのラベル解決 + dry-run + --confirm 対話の 5 ガードを 1
// ファイルに集約。--uuid 直書きは廃止し、--to=<bitbank ラベル> のみ受け付ける
// （allowlist は UUID を持たないため、ローカル改ざんで UUID 捏造はできない）。
import * as readline from "node:readline";
import { z } from "zod";
import { type PrivatePostOptions, privatePost } from "../../http-private-post.js";
import { type PrivateHttpOptions, privateGet } from "../../http-private.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { AssetSchema, PositiveDecimalSchema } from "../../validators.js";
import {
  type WithdrawalAllowlist,
  loadAllowlist as defaultLoadAllowlist,
} from "../../withdrawal-allowlist.js";
import { dryRunResult } from "./dry-run.js";

const WithdrawResponseSchema = z.object({
  uuid: z.string(),
  asset: z.string(),
  amount: z.union([z.string(), z.number()]),
  status: z.string(),
});

const WithdrawInputSchema = z.object({
  asset: AssetSchema,
  to: z.string({ required_error: "to is required. Example: --to=cold-wallet" }).trim().min(1),
  amount: PositiveDecimalSchema,
  token: z.string().min(1).optional(),
});

const AccountSchema = z.object({
  uuid: z.string(),
  label: z.string(),
  address: z.string(),
});
const AccountsResponseSchema = z.object({ accounts: z.array(AccountSchema) });

export type WithdrawResponse = z.infer<typeof WithdrawResponseSchema>;
type WithdrawInput = z.infer<typeof WithdrawInputSchema>;

export type WithdrawArgs = Partial<WithdrawInput> & {
  execute?: boolean;
  confirm?: boolean;
};

export type WithdrawOptions = PrivatePostOptions &
  PrivateHttpOptions & {
    input?: NodeJS.ReadableStream;
    output?: NodeJS.WritableStream;
    skipConfirmPrompt?: boolean;
    loadAllowlist?: () => Result<WithdrawalAllowlist>;
  };

function askConfirmation(
  input: NodeJS.ReadableStream,
  output: NodeJS.WritableStream,
): Promise<boolean> {
  const rl = readline.createInterface({ input, output });
  return new Promise((resolve) => {
    rl.question("\n⚠️  本当に出金しますか？ (yes/no): ", (answer) => {
      rl.close();
      resolve(answer.trim().toLowerCase() === "yes");
    });
  });
}

async function resolveLabel(
  asset: string,
  label: string,
  opts: WithdrawOptions | undefined,
): Promise<Result<{ uuid: string; address: string }>> {
  const raw = await privateGet<unknown>("/user/withdrawal_account", { asset }, opts);
  const parsed = parseResponse(raw, AccountsResponseSchema, "accounts");
  if (!parsed.success) return parsed;
  const matches = parsed.data.filter((a) => a.label === label);
  if (matches.length === 0) {
    return {
      success: false,
      error: `Label "${label}" not found among registered ${asset} withdrawal accounts on bitbank. Register/rename it on bitbank Web UI first.`,
    };
  }
  if (matches.length > 1) {
    return {
      success: false,
      error: `Ambiguous: ${matches.length} accounts share label "${label}" for ${asset}. Rename them on bitbank Web UI to be unique.`,
    };
  }
  const m = matches[0];
  return { success: true, data: { uuid: m.uuid, address: m.address } };
}

export async function withdraw(
  args: WithdrawArgs,
  opts?: WithdrawOptions,
): Promise<Result<WithdrawResponse | { dryRun: true }>> {
  const parsed = WithdrawInputSchema.safeParse({
    asset: args.asset,
    to: args.to,
    amount: args.amount,
    token: args.token,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: msg };
  }

  const loadAllowlist = opts?.loadAllowlist ?? defaultLoadAllowlist;
  const allowlist = loadAllowlist();
  if (!allowlist.success) return allowlist;
  if (!allowlist.data.labels.includes(parsed.data.to)) {
    return {
      success: false,
      error: `Label "${parsed.data.to}" is not in withdrawal allowlist. Add it to the allowlist file first (see .claude/rules/trading-safety.md).`,
    };
  }

  if (!args.execute) {
    return dryRunResult({
      command: "withdraw",
      endpoint: "/v1/user/request_withdrawal",
      body: {
        asset: parsed.data.asset,
        to: parsed.data.to,
        amount: parsed.data.amount,
        ...(parsed.data.token ? { token: parsed.data.token } : {}),
      },
      args: { asset: args.asset, to: args.to, amount: args.amount, token: args.token },
      extraFlags: ["--execute", "--confirm"],
    });
  }

  if (!args.confirm) {
    return {
      success: false,
      error: "withdraw requires both --execute and --confirm. Add --confirm to proceed.",
    };
  }

  const resolved = await resolveLabel(parsed.data.asset, parsed.data.to, opts);
  if (!resolved.success) return resolved;

  if (!opts?.skipConfirmPrompt) {
    process.stdout.write(
      `\n⚠️  出金リクエスト\n  資産: ${parsed.data.asset}\n  ラベル: ${parsed.data.to}\n  解決アドレス: ${resolved.data.address}\n  金額: ${parsed.data.amount}\n`,
    );
    const input = opts?.input ?? process.stdin;
    const output = opts?.output ?? process.stdout;
    const confirmed = await askConfirmation(input, output);
    if (!confirmed) {
      return { success: false, error: "Withdrawal cancelled" };
    }
  }

  const body: Record<string, unknown> = {
    asset: parsed.data.asset,
    uuid: resolved.data.uuid,
    amount: parsed.data.amount,
  };
  if (parsed.data.token) body.token = parsed.data.token;

  const result = await privatePost<unknown>("/user/request_withdrawal", body, opts);
  return parseResponse(result, WithdrawResponseSchema);
}
