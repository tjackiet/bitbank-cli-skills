# Private API リファレンス

## 認証設定

### .env ファイル

```
BITBANK_API_KEY=your_api_key
BITBANK_API_SECRET=your_api_secret
```

### 実行方法

```bash
npx tsx --env-file=.env cli/index.ts <command> --format=json
```

## assets レスポンス形式

```json
{
  "success": 1,
  "data": {
    "assets": [
      {
        "asset": "btc",
        "amount_precision": 8,
        "onhand_amount": "0.15000000",
        "locked_amount": "0.00000000",
        "free_amount": "0.15000000",
        "stop_deposit": false,
        "stop_withdrawal": false,
        "withdrawal_fee": {
          "under": "0.00060000",
          "over": "0.00100000",
          "threshold": "30000.0000"
        }
      }
    ]
  }
}
```

**フィールド説明:**
- `onhand_amount`: 総保有量（注文ロック分を含む）
- `locked_amount`: 注文でロックされている量
- `free_amount`: 利用可能量（= onhand - locked）
- すべて**文字列**

## trade-history レスポンス形式

```json
{
  "success": 1,
  "data": {
    "trades": [
      {
        "trade_id": 123456,
        "pair": "btc_jpy",
        "order_id": 789012,
        "side": "buy",
        "type": "limit",
        "amount": "0.01000000",
        "price": "9000000",
        "maker_taker": "maker",
        "fee_amount_base": "0.00000000",
        "fee_amount_quote": "0",
        "executed_at": 1709251200000
      }
    ]
  }
}
```

**フィールド説明:**
- `side`: `"buy"` または `"sell"`
- `amount`: 取引量（文字列）
- `price`: 約定価格（文字列）
- `maker_taker`: `"maker"` または `"taker"`（手数料率が異なる）
- `fee_amount_base`: ベース通貨の手数料（例: BTC）
- `fee_amount_quote`: クォート通貨の手数料（例: JPY）
- `executed_at`: 約定時刻（ミリ秒 UNIX タイムスタンプ）

### オプション

| パラメータ | 説明 |
|---|---|
| `--pair` | ペア名（必須） |
| `--count` | 取得件数（デフォルト: 全件） |
| `--order-id` | 特定注文の履歴のみ |
| `--since` | 開始タイムスタンプ（ミリ秒） |
| `--end` | 終了タイムスタンプ（ミリ秒） |
| `--order` | ソート順（`asc` or `desc`） |

**制限:** 1回のリクエストで最大1000件。件数が多い場合は `--since` / `--end` で期間を分割して取得する。

## ticker レスポンス形式

```json
{
  "success": 1,
  "data": {
    "sell": "9300000",
    "buy": "9250000",
    "high": "9400000",
    "low": "9100000",
    "open": "9200000",
    "last": "9280000",
    "vol": "1234.5678",
    "timestamp": 1709251200000
  }
}
```

- `last`: 最終取引価格。ポートフォリオ評価には `last` を使う
- すべて**文字列**

## エラーコード

| コード | 意味 | 対処 |
|---|---|---|
| 20001 | 認証失敗 | `.env` の API キー/シークレットを確認 |
| 20002 | API キー不正 | bitbank でキーを再生成 |
| 20003 | 権限不足 | API キーの権限設定を確認（参照権限が必要） |
| 60001 | レート制限 | 1秒待ってリトライ |

## 平均取得単価の計算方法

取引履歴から加重平均を計算:

```
買いトレードのみ抽出
平均取得単価 = Σ(price × amount) / Σ(amount)

※ 売りトレードは平均取得単価に影響しない（FIFO ではなく移動平均法）
※ 手数料は別途考慮: 実質取得単価 = 平均取得単価 + (手数料合計 / 保有量)
```
