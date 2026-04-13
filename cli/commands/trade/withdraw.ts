import * as readline from "node:readline";
import { z } from "zod";
import { type PrivatePostOptions, privatePost } from "../../http-private-post.js";
import { parseResponse } from "../../parse-response.js";
import type { Result } from "../../types.js";
import { printDryRun } from "./dry-run.js";

const WithdrawResponseSchema = z.object({
  uuid: z.string(),
  asset: z.string(),
  amount: z.union([z.string(), z.number()]),
  status: z.string(),
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
  if (!args.asset) return { success: false, error: "asset is required. Example: --asset=btc" };
  if (!args.uuid) return { success: false, error: "uuid is required. Example: --uuid=xxx-yyy" };
  if (!args.amount) return { success: false, error: "amount is required. Example: --amount=0.5" };
  if (Number(args.amount) <= 0) return { success: false, error: "amount must be > 0" };

  const body: Record<string, unknown> = {
    asset: args.asset,
    uuid: args.uuid,
    amount: args.amount,
  };
  if (args.token) body.token = args.token;

  if (!args.execute) {
    const tokenHint = args.token ? " --token=***" : "";
    printDryRun({
      endpoint: "/v1/user/request_withdrawal",
      body,
      executeHint:
        `npx bitbank withdraw --asset=${args.asset} --uuid=${args.uuid}` +
        ` --amount=${args.amount}${tokenHint} --execute --confirm`,
    });
    return { success: true, data: { dryRun: true } };
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
      return { success: false, error: "出金がキャンセルされました" };
    }
  }

  const result = await privatePost<unknown>("/user/request_withdrawal", body, opts);
  return parseResponse(result, WithdrawResponseSchema);
}
