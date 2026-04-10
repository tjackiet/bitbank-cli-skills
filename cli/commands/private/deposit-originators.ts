import { z } from "zod";
import { type PrivateHttpOptions, privateGet } from "../../http-private.js";
import type { Result } from "../../types.js";

const OriginatorSchema = z.object({
  uuid: z.string(),
  label: z.string(),
  address: z.string(),
  asset: z.string(),
  network: z.string().optional(),
});

const ResponseSchema = z.object({
  originators: z.array(OriginatorSchema),
});

export type DepositOriginator = z.infer<typeof OriginatorSchema>;

export async function depositOriginators(
  args: { asset: string | undefined },
  opts?: PrivateHttpOptions,
): Promise<Result<DepositOriginator[]>> {
  const { asset } = args;
  if (!asset) {
    return { success: false, error: "asset is required. Example: --asset=btc" };
  }
  const params: Record<string, string> = { asset };

  const result = await privateGet<unknown>("/user/deposit_originators", params, opts);
  if (!result.success) return result;

  const parsed = ResponseSchema.safeParse(result.data);
  if (!parsed.success) {
    return { success: false, error: `Invalid response: ${parsed.error.message}` };
  }
  return { success: true, data: parsed.data.originators };
}
