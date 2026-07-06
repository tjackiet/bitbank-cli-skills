# 技術ブログ骨子案: MCPサーバ・CLI ベータ版公開（2026-07-10 公開予定）

コーポレートリリース「MCPサーバ・CLI のベータ版を公開し実証実験を開始」と同時公開する技術ブログの骨子。
構成の参考: [J-Quants CLIリリース記事（Qiita）](https://qiita.com/j_quants/items/f9d3cd091bb9f8b81227)
（リリース告知 → 何ができるか → すぐ試せる導入 → AIエージェント連携の実例 → フィードバック募集、の流れ）。

## 記事の前提・方針

- **1本の記事で MCP / CLI の両方を扱う**（リリース側の「技術ブログ」リンクが1つのため）。
  冒頭に「使い分け早見」を置き、読者が自分に合う方のクイックスタートへジャンプできる構成にする
- **技術の内部の話はしない**。アーキテクチャ・実装（Zod / Result パターン / HMAC 等）には触れず、
  コードは「コピペで動く導入コマンド」と「AIに話しかける言葉」だけにする
- **すぐ使える**: 各ツール「5分で試す」を最短経路（npx / npm 一発）で書く
- **意図とユースケースが伝わる**: なぜ2つあるのか（gitbook の使い分け）、誰の何が楽になるのか、を軸にする
- 想定読者: リリースを見て興味を持った開発者・botter・AIツール好き（bitbank API 未経験でも試せるトーン）

---

## タイトル案

1. AIエージェントから bitbank を使う — MCPサーバ・CLI（ベータ版）を OSS 公開しました
2. 「BTC の今の市場状況を分析して」で動く — bitbank-lab-mcp / bitbank-lab-cli ベータ版公開
3. bitbank MCPサーバ・CLI ベータ版リリース 〜 AIエージェントと暗号資産取引の実証実験 〜

（1 推し。リリースタイトルと対になり、記事の主語が「開発者が使う体験」になる）

---

## 構成案

### リード（はじめに）

- コーポレートリリースの要約（AIエージェント経由の新しい取引体験の実証実験として、
  MCPサーバと CLI のベータ版を OSS 公開）+ リリースへのリンク
- この記事でわかること 3 点:
  1. 何ができるツールなのか（デモ会話 or スクショを1枚先出し）
  2. MCP と CLI のどちらを使えばいいか
  3. 5分で試す手順
- ベータ版・自己責任・免責事項リンクをここで一度明示（詳細は末尾）

### 1. 何を公開したのか（全体像）

- 2つの OSS（いずれも MIT / npm 公開済み / ローカル動作 / Node.js 22+）
  - **bitbank-lab-mcp** — Claude Desktop などの MCP 対応 AI チャットから、自然言語で市場分析
  - **bitbank-lab-cli** — Claude Code / Cursor / Codex などのコーディングエージェントから、
    データ取得と柔軟な分析（Agent Skills 同梱）
- 図解1枚: 「AIクライアント ⇔ MCP / CLI ⇔ bitbank 公開API」の位置づけ
  （ローカルで動く・利用者の API キーで動く、を視覚で伝える）
- 「bitbank-mcp-server という別リポジトリとは無関係。本実証実験の対象は bitbank-lab-*」の注記
  （リリースの（注）と整合させる）

### 2. どちらを使えばいい？（MCP と CLI の使い分け）

gitbook「[bitbank-lab-docs](https://bitbank-lab.gitbook.io/bitbank-lab-docs)」の枠組みをそのまま採用:

| | MCPサーバ | CLI |
|---|---|---|
| おすすめ | トレード初〜中級者 | 中〜上級者・開発者 |
| 分析の仕方 | サーバ側で計算済みの結果を返す | 生データを渡し、計算は LLM / 自分で設計 |
| 得意なこと | すぐ使える指標分析・可視化・取引実行 | 指標パラメータやロジックの完全カスタマイズ |
| 推奨クライアント | Claude Desktop | Claude Code / Cursor / Codex |

- 一言まとめ: 「迷ったら MCP。分析を自分の手で組みたくなったら CLI」
- 姉妹プロジェクトで**同じ bitbank 公開 API への真逆のアプローチ**、という設計意図を1段落で

### 3. bitbank-lab-mcp を5分で試す

- 前提: Node.js 22+ / Claude Desktop
- `claude_desktop_config.json` に貼るだけの最小設定（Public のみ・API キー不要の「A」パターンのみ掲載。
  B/C は README / gitbook へ誘導）

```json
{
  "mcpServers": {
    "bitbank-lab": { "command": "npx", "args": ["-y", "bitbank-lab-mcp"] }
  }
}
```

- 話しかける例（そのままコピペできる日本語）:
  - 「BTC の今の市場状況を分析して」
  - 「ビットコインは買いと売りどちらが優勢？」
  - 「ここ 30 日のボラ推移をチャートで見せて」
- **スクショ2枚**: 分析結果の会話 / SVG チャート
- できることダイジェスト（列挙のみ・深掘りしない）:
  テクニカル指標・フロー分析・板圧力・パターン検出・総合スコア・チャート生成（Public 32 ツール）
- 発展: API キーを設定すると資産確認・ポートフォリオ分析・発注まで（48 ツール）。
  **権限は「参照」のみ推奨・「出金」権限は付けない**、を1行で（詳細は Private API ガイドへ）
- 「何を聞けばいいかわからない」→ 同梱プロンプト集（docs/prompts-table.md）へ誘導。
  「おはようレポート」を1行紹介

### 4. bitbank-lab-cli を5分で試す

- 前提: Node.js 22+
- ターミナルで動作確認:

```bash
npm i -g bitbank-lab-cli
bitbank ticker btc_jpy
bitbank candles btc_jpy --type=1day --format=table
```

- 本命は**コーディングエージェントから自然言語で使う**体験。Claude Code の例:

```
/plugin marketplace add bitbankinc/bitbank-lab-cli
/plugin install bitbank-lab-cli@bitbank-lab-cli
```

- 話しかける例:
  - 「BTC の RSI を見て」（indicator-analysis）
  - 「SMA クロス戦略をバックテストして」（backtest）
  - 「BTC を仮想で 0.01 買って」（paper-trade）
  - 「買う前にざっと見て」（recipe-pre-trade-check）
- **スクショ or 会話ログ1〜2枚**: Skill がコマンドを組み立てて分析を返す様子
- Agent Skills ダイジェスト: 分析系7・ペーパートレード・ユーティリティ2・recipe 2 の「一覧表」だけ載せる
  （個々の説明は README / gitbook へ）
- Skill は**自分で追加・編集して育てる前提**であること（`skills/<name>/SKILL.md` を置くだけ）を1段落
  — 「意図」が伝わる重要ポイント

### 5. ユースケース例（こんな使い方）

意図を伝えるパート。各 3〜5 行 + 可能ならスクショ:

1. **朝のキャッチアップ**（MCP）: 「おはようレポート」で寝ている間の相場変動を要約
2. **買う前の総点検**（CLI）: recipe-pre-trade-check が保有資産・ボラ・データ品質・指標を順に確認し
   GO / WAIT / NO-GO を提示（最終判断は人間）
3. **仮想資金で AI 売買の練習**（CLI）: paper trade はライブ価格 × 仮想資金。実 API は public のみで安全に試せる
4. **自分の分析への取り込み**（CLI）: `--format=csv` でローソク足を吐いて手元の分析へ / 自作 Skill・自作指標の検証

### 6. 安全性への考え方

技術詳細ではなく「思想」を伝える:

- ローカル完結。API キーは利用者自身が発行・管理（最小権限: 「参照」のみ推奨、「出金」権限は不要・非推奨）
- お金が動く操作には**二段階の確認**を必ず挟む設計
  - MCP: preview → execute の 2 ステップ + ホスト承認
  - CLI: デフォルトはドライラン。`--execute` + 固定フレーズ `--confirm` の両方が揃って初めて実行
- それでもベータ版であり、安全対策は補助機能。利用は自己責任で（免責事項へ）

### 7. 今後の展開

リリース文と整合させて短く:

- まずはローカル版で「AI がマーケット・資産情報を安全に扱えるか」を検証
- リモート MCP サーバ（まずはパブリックデータ）→ プライベートデータ・取引機能・動的 UI へ段階的に
- 将来像: 方針・リスク許容度に基づき AI が分析〜注文まで担う取引体験

### 8. フィードバック募集

- GitHub Issues（両リポ）
- ビボラボ Discord `#mcp-cli-contributors`: 感想・ユースケースのアイデア・「こんな Skill 作った」歓迎
- X ハッシュタグ #bitbanktechblog（別投稿の導線と整合）

### 免責事項

- リリースの「ご留意事項」と同内容 + README の免責事項リンク
  （ベータ / 情報提供目的・投資助言ではない / 投資判断は自己責任 / API キー管理は利用者責任）

---

## 執筆メモ

### 素材の所在（コピー元）

| 内容 | 場所 |
|---|---|
| MCP 導入 JSON・話しかけ例・A/B/C 3段階設定 | bitbank-lab-mcp README「クイックスタート」 |
| プロンプト集（9種・🔰付き） | bitbank-lab-mcp docs/prompts-table.md |
| MCP ツール一覧と使い分け | bitbank-lab-mcp docs/tools.md |
| CLI クイックスタート・plugin install 手順 | bitbank-lab-cli README |
| Skills 一覧（12本）と代表トリガー | bitbank-lab-cli README「Agent Skills」/ skills/INDEX.md |
| 使い分けの言い回し | gitbook トップ（docs/gitbook/README.md）|
| 免責事項の文言 | 両 README「免責事項」（リリースと同トーン） |

### 準備物

- [ ] スクショ: Claude Desktop での分析会話（MCP）
- [ ] スクショ: SVG チャート出力（MCP）
- [ ] スクショ or ログ: Claude Code で Skill が発火する様子（CLI）
- [ ] 図解: AIクライアント ⇔ MCP/CLI ⇔ bitbank API の位置づけ 1 枚
- [ ] リリース側の「技術ブログ：[※リンクを追記]」に記事 URL を渡す（7/10 公開に間に合わせる）

### PR 確認結果（2026-07-06 時点）

- bitbankinc/bitbank-lab-mcp #9（open）: 個人リポ v0.1.3 相当の同期。実装変更ほぼなし
  （README 再編 A/B/C・依存更新・リリース基盤）
- bitbankinc/bitbank-lab-cli #7（open）: 個人リポ v0.1.4〜v0.1.6 相当の同期
  （README 再構成・status 404 修正・依存更新・Node 22+・Antigravity CLI 対応）
- → どちらもマージ後の README / gitbook を前提に書けばよい。**PR 自体を記事で紹介する必要はない**

### 避けること

- 内部実装の解説（Zod・Result パターン・リトライ設計・テスト戦略など）
- コマンドリファレンスの網羅（README / gitbook に委ねる）
- 投資判断に踏み込む表現（「儲かる」「勝てる」等）。分析例の数値はあくまで例示と明記
- bitbank-mcp-server（別リポ）との混同を招く記述
