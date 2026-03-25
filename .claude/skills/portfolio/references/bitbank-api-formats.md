# bitbank API フォーマットリファレンス

## ペア名規則

- 形式: `{asset}_{currency}`（例: `btc_jpy`, `eth_jpy`, `xrp_jpy`）
- **小文字のみ**。大文字は API エラーになる
- 主要ペア: `btc_jpy`, `eth_jpy`, `xrp_jpy`, `ltc_jpy`, `mona_jpy`, `bcc_jpy`, `xlm_jpy`, `bat_jpy`, `omg_jpy`, `matic_jpy`, `dot_jpy`, `doge_jpy`, `sol_jpy`, `avax_jpy`, `flr_jpy`, `sand_jpy`, `axs_jpy`, `mkr_jpy`, `ape_jpy`, `gala_jpy`, `chz_jpy`, `astr_jpy`, `ada_jpy`, `link_jpy`, `dal_jpy`, `atom_jpy`

## candles コマンド

### 時間軸（`--type`）

`1min`, `5min`, `15min`, `30min`, `1hour`, `4hour`, `8hour`, `12hour`, `1day`, `1week`, `1month`

### 日付形式（`--date`）

| 時間軸 | 日付形式 | 例 |
|---|---|---|
| `1month` | `YYYY` | `2024` |
| それ以外 | `YYYYMMDD` | `20240101` |
| 未指定 | 当日データ | — |

### レスポンス形式

```json
{
  "success": 1,
  "data": {
    "candlestick": [{
      "type": "1day",
      "ohlcv": [
        ["open", "high", "low", "close", "volume", timestamp],
        ...
      ]
    }]
  }
}
```

**注意:**
- `open`, `high`, `low`, `close`, `volume` は**文字列**で返る → `parseFloat()` が必要
- `timestamp` はミリ秒 UNIX タイムスタンプ（数値）
- 配列は**古い順**（先頭が最も古いデータ）

## レスポンス共通

- `success: 1` で成功、`success: 0` でエラー
- 価格・数量は**すべて文字列**で返る（数値変換が必要）
- エラー時: `{ "success": 0, "data": { "code": 10000 } }`

## エラーコード（主要）

| コード | 意味 |
|---|---|
| 10000 | URL が存在しない |
| 10001 | システムエラー |
| 10002 | 不正なJSON |
| 10005 | タイムアウト |
| 20001 | 認証失敗 |
| 20002 | API キー不正 |
| 20003 | 権限不足 |
| 30006 | 注文が見つからない |
| 30009 | 引き出し先が見つからない |
| 40001 | 残高不足 |
| 60001 | レート制限超過 |
| 70001 | システムエラー（内部） |

## レート制限

- **QUERY（読み取り）:** 10 calls/sec
- **UPDATE（書き込み）:** 6 calls/sec
- 超過すると `60001` エラー。1秒待ってリトライすればよい
