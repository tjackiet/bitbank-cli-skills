import { z } from "zod";

/** API が文字列で返す数値フィールド用 */
export const numStr = z.string().transform(Number);

/** API が文字列 | null で返す数値フィールド用 */
export const nullableNumStr = z
  .string()
  .nullable()
  .transform((v) => (v === null ? null : Number(v)));
