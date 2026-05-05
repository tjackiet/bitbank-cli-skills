/**
 * bitbank で取引可能なペア一覧の単一ソース。
 * shell 補完など、API を叩かずにペア候補が必要な箇所で再利用する。
 *
 * 実 API のペア定義は `bitbank pairs` で取得できるが、補完経路では
 * ネットワーク I/O を避けるため静的リストを保持する。
 *
 * 出典: `.claude/skills/_shared/references/pair-classification.md`
 *       （取引停止中のペアは含めない）
 */
export const KNOWN_PAIRS: readonly string[] = [
  "btc_jpy",
  "xrp_jpy",
  "eth_jpy",
  "doge_jpy",
  "sol_jpy",
  "ltc_jpy",
  "ada_jpy",
  "avax_jpy",
  "dot_jpy",
  "bnb_jpy",
  "sui_jpy",
  "link_jpy",
  "mona_jpy",
  "bcc_jpy",
  "xlm_jpy",
  "qtum_jpy",
  "bat_jpy",
  "omg_jpy",
  "xym_jpy",
  "boba_jpy",
  "enj_jpy",
  "astr_jpy",
  "axs_jpy",
  "flr_jpy",
  "sand_jpy",
  "gala_jpy",
  "ape_jpy",
  "chz_jpy",
  "oas_jpy",
  "mana_jpy",
  "grt_jpy",
  "dai_jpy",
  "op_jpy",
  "arb_jpy",
  "klay_jpy",
  "imx_jpy",
  "mask_jpy",
  "pol_jpy",
  "cyber_jpy",
  "render_jpy",
  "trx_jpy",
  "lpt_jpy",
  "atom_jpy",
  "sky_jpy",
];
