# Skill 追加手順

## ディレクトリ構造

```
.claude/skills/
  _shared/
    references/
      bitbank-api-formats.md   # 全 Skill 共通の API レスポンス形式
      pair-classification.md   # 全 Skill 共通のペア分類（流動性・カテゴリ等）
  <skill-name>/
    SKILL.md                   # Skill 定義（必須）
    references/                # ドメイン固有の参照資料（任意）
      <domain-specific>.md
```

## SKILL.md テンプレート

```markdown
---
name: <skill-name>
description: |
  Skill の説明。何ができるか、どんなリクエストに対応するか。
  トリガーとなるユーザーの発話例も含める。
compatibility: |
  Requires bitbank CLI (npx tsx cli/index.ts). Node.js 18+.
metadata:
  author: bitbank-aiforge
  version: "1.0"
---

# <Skill 名> Skill

## 実行フロー

（Plan → Validate → Execute の流れを記述）

## Gotchas

（注意点・落とし穴を列挙）
```

## references/ の規約

- 共通資料（`bitbank-api-formats.md`、`pair-classification.md` 等）は
  `.claude/skills/_shared/references/` に集約する。各 Skill 配下にコピーしない
- SKILL.md から共通資料を参照するときは
  `_shared/references/<file>.md` というパスで明示的に書く
- ドメイン固有の資料は `<skill>/references/<domain>-guide.md` や
  `<domain>-patterns.md` で命名
- CLI コマンドの実行例を含め、モデルが正確にコマンドを組み立てられるようにする

## 注意

- Skill に分析ロジックのコードは書かない（CLAUDE.md 禁止事項 1）
- Skill はモデルへの指示書。実行はモデルが CLI を呼び出して行う
