import { EXIT } from "./exit-codes.js";

export const ERROR_CODES: Record<number, string> = {
  10000: "URL不正",
  20001: "API認証失敗",
  20002: "APIキー不正",
  20003: "APIキー権限不足",
  30001: "注文数量不正",
  30006: "注文数量下限",
  30007: "注文数量上限",
  30012: "残高不足",
  40001: "不正なパラメータ",
  50003: "現在取引不可",
  50004: "注文不可（板寄せ中）",
  50009: "注文不可（サーキットブレーカー）",
  60001: "レート制限",
  70001: "システムエラー",
};

export function apiErrorExitCode(code: number): (typeof EXIT)[keyof typeof EXIT] {
  if (code >= 20001 && code <= 20003) return EXIT.AUTH;
  if (code === 60001) return EXIT.RATE_LIMIT;
  if (code >= 30001 && code <= 40001) return EXIT.PARAM;
  return EXIT.GENERAL;
}

export function formatApiError(code: number): string {
  const msg = ERROR_CODES[code];
  return msg ? `${code}: ${msg}` : `API error: ${code}`;
}
