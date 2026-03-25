import { z } from "zod";
import { type HttpOptions, publicGet } from "../../http.js";
import type { Result } from "../../types.js";

const TickerSchema = z.object({
  sell: z
    .string()
    .nullable()
    .transform((v) => (v === null ? null : Number(v))),
  buy: z
    .string()
    .nullable()
    .transform((v) => (v === null ? null : Number(v))),
  high: z
    .string()
    .nullable()
    .transform((v) => (v === null ? null : Number(v))),
  low: z
    .string()
    .nullable()
    .transform((v) => (v === null ? null : Number(v))),
  open: z
    .string()
    .nullable()
    .transform((v) => (v === null ? null : Number(v))),
  last: z
    .string()
    .nullable()
    .transform((v) => (v === null ? null : Number(v))),
  vol: z
    .string()
    .nullable()
    .transform((v) => (v === null ? null : Number(v))),
  timestamp: z.number(),
});

export type Ticker = z.infer<typeof TickerSchema>;

export async function ticker(
  pair: string | undefined,
  opts?: HttpOptions,
): Promise<Result<Ticker>> {
  if (!pair) {
    return { success: false, error: "pair is required. Example: npx bitbank ticker btc_jpy" };
  }
  const result = await publicGet<unknown>(`/${pair}/ticker`, opts);
  if (!result.success) return result;

  const parsed = TickerSchema.safeParse(result.data);
  if (!parsed.success) {
    return { success: false, error: `Invalid response: ${parsed.error.message}` };
  }
  return { success: true, data: parsed.data };
}
