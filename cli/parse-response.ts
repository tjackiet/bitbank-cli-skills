import type { z } from "zod";
import type { Result } from "./types.js";

export function parseResponse<T>(
  result: Result<unknown>,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
): Result<T>;
export function parseResponse<T, K extends keyof T>(
  result: Result<unknown>,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  key: K,
): Result<T[K]>;
export function parseResponse<T, K extends keyof T>(
  result: Result<unknown>,
  schema: z.ZodType<T, z.ZodTypeDef, unknown>,
  key?: K,
): Result<T> | Result<T[K]> {
  if (!result.success) return result;
  const parsed = schema.safeParse(result.data);
  if (!parsed.success) {
    return { success: false, error: `Invalid response: ${parsed.error.message}` };
  }
  if (key != null) {
    return { success: true, data: parsed.data[key] };
  }
  return { success: true, data: parsed.data };
}
