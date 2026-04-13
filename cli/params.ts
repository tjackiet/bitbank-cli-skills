/**
 * undefined の値を除外して Record<string, string> を構築する。
 * キー名の変換が必要な場合はオブジェクトリテラルで渡す。
 */
export function compactParams(obj: Record<string, string | undefined>): Record<string, string> {
  const result: Record<string, string> = {};
  for (const [k, v] of Object.entries(obj)) {
    if (v !== undefined) result[k] = v;
  }
  return result;
}
