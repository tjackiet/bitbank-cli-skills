// 100行超: 出金は資金移動を伴うため、入力検証 + dry-run + --confirm 対話の 3 ガードを 1 ファイルに集約
import * as readline from "node:readline";
import { z } from "zod";
import { type PrivatePostOptions, privatePost } from "../../http-private-post.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { AssetSchema, PositiveDecimalSchema, UuidSchema } from "../../validators.js";
import { dryRunResult } from "./dry-run.js";

const WithdrawResponseSchema = z.object({
  uuid: z.string(),
  asset: z.string(),
  amount: z.union([z.string(), z.number()]),
  status: z.string(),
});

const WithdrawInputSchema = z.object({
  asset: AssetSchema,
  uuid: UuidSchema,
  amount: PositiveDecimalSchema,
  token: z.string().min(1).optional(),
});

export type WithdrawResponse = z.infer<typeof WithdrawResponseSchema>;

export type WithdrawArgs = {
  asset?: string;
  uuid?: string;
  amount?: string;
  token?: string;
  execute?: boolean;
  confirm?: boolean;
};

export type WithdrawOptions = PrivatePostOptions & {
  input?: NodeJS.ReadableStream;
  output?: NodeJS.WritableStream;
  skipConfirmPrompt?: boolean;
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

export async function withdraw(
  args: WithdrawArgs,
  opts?: WithdrawOptions,
): Promise<Result<WithdrawResponse | { dryRun: true }>> {
  const parsed = WithdrawInputSchema.safeParse({
    asset: args.asset,
    uuid: args.uuid,
    amount: args.amount,
    token: args.token,
  });
  if (!parsed.success) {
    const msg = parsed.error.issues.map((i) => i.message).join("; ");
    return { success: false, error: msg };
  }

  const body: Record<string, unknown> = {
    asset: parsed.data.asset,
    uuid: parsed.data.uuid,
    amount: parsed.data.amount,
  };
  if (parsed.data.token) body.token = parsed.data.token;

  if (!args.execute) {
    return dryRunResult({
      command: "withdraw",
      endpoint: "/v1/user/request_withdrawal",
      body,
      args: { asset: args.asset, uuid: args.uuid, amount: args.amount, token: args.token },
      extraFlags: ["--execute", "--confirm"],
    });
  }

  if (!args.confirm) {
    return {
      success: false,
      error: "withdraw requires both --execute and --confirm. Add --confirm to proceed.",
    };
  }

  if (!opts?.skipConfirmPrompt) {
    process.stdout.write(
      `\n⚠️  出金リクエスト\n  資産: ${args.asset}\n  出金先UUID: ${args.uuid}\n  金額: ${args.amount}\n`,
    );
    const input = opts?.input ?? process.stdin;
    const output = opts?.output ?? process.stdout;
    const confirmed = await askConfirmation(input, output);
    if (!confirmed) {
      return { success: false, error: "Withdrawal cancelled" };
    }
  }

  const result = await privatePost<unknown>("/user/request_withdrawal", body, opts);
  return parseResponse(result, WithdrawResponseSchema);
}
