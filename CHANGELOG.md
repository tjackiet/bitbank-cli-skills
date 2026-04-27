# Changelog

[Keep a Changelog](https://keepachangelog.com/ja/1.1.0/) 形式で管理しています。  
[Semantic Versioning](https://semver.org/lang/ja/) に準拠します。

## [Unreleased]

### Added

- `volatility-profile` skill: リターン分布・ファットテール・時間帯別出来高などリスク特性を定量化
- `signal-explorer` skill: シグナル候補の予測力評価（相関・Z-score・ラグ相関・冗長性チェック）
- `correlation-analysis` skill: 複数銘柄間の相関・β・環境別相関・ラグ相関
- `data-verification` skill: ローソク足の欠損・整合性・異常値・重複の品質検証
- `indicator-analysis` skill に ATR と ROC を追加
- `.claude/skills/_shared/references/` に共通参照資料（`bitbank-api-formats.md` / `pair-classification.md`）を集約

### Changed

- README / `docs/phases.md` / `docs/customization-guide.md` / `.claude/rules/skills.md` を 7 Skill 構成と `_shared/references/` 運用に合わせて更新
