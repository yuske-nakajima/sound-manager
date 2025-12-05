# Sound Manager

SP-404 MK2 にインポートする音源を管理するための CLI ツール。

## 機能

- **採番 (number)**: 音声ファイルに `__0001` 形式の連番を付与
- **エクスポート (export)**: マッピングルールに従ってファイル名を変換してコピー

## 対応フォーマット

- `.wav` / `.WAV`
- `.mp3` / `.MP3`

## セットアップ

```bash
# 依存関係のインストール
npm install
```

## 実行方法

### 採番コマンド (number)

指定ディレクトリ内の音声ファイルに連番（`__0001`, `__0002`, ...）を付与します。

```bash
# 基本的な使い方
npm run start -- number <対象ディレクトリ>

# 例: ./sounds ディレクトリ内のファイルに採番
npm run start -- number ./sounds
```

#### オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `-d, --dry-run` | ファイルを変更せずに結果をプレビュー | `false` |
| `--log-dir <path>` | ログ出力先ディレクトリ | `./logs` |

#### 使用例

```bash
# dry-run で変更内容を確認（実際にはファイルを変更しない）
npm run start -- number ./sounds --dry-run

# 実行結果の例
# 📁 対象ディレクトリ: /path/to/sounds
# 🔍 DRY-RUN モード（ファイルは変更されません）
#
# ✅ リネーム済み:
#   hihat_Am_sample.wav → hihat_Am_sample__0001.wav
#   kick_heavy.mp3 → kick_heavy__0002.mp3
#
# ⏭️ スキップ（採番済み）:
#   snare__0001.wav
#
# 📊 結果: 2 ファイルをリネーム, 1 ファイルをスキップ
```

#### 動作仕様

1. 既に `__XXXX` 形式の番号が付いているファイルはスキップ
2. 既存ファイルの最大番号 + 1 から採番を開始
3. 番号は4桁ゼロ埋め（例: `__0001`, `__0099`, `__1234`）

---

### エクスポートコマンド (export)

マッピングファイルに従って、ファイル名を変換しながら別ディレクトリにコピーします。

```bash
# 基本的な使い方
npm run start -- export <ソースディレクトリ> <出力先ディレクトリ>

# 例: ./sounds から ./output へエクスポート
npm run start -- export ./sounds ./output
```

#### オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `-d, --dry-run` | ファイルをコピーせずに結果をプレビュー | `false` |
| `-o, --overwrite` | 出力先に同名ファイルがあれば上書き | `false` |
| `-m, --mapping <path>` | マッピングファイルのパス | `./config/mapping.yaml` |
| `--log-dir <path>` | ログ出力先ディレクトリ | `./logs` |

#### 使用例

```bash
# dry-run でエクスポート内容を確認
npm run start -- export ./sounds ./output --dry-run

# カスタムマッピングファイルを使用
npm run start -- export ./sounds ./output -m ./my-mapping.yaml

# 既存ファイルを上書きしてエクスポート
npm run start -- export ./sounds ./output --overwrite

# 実行結果の例
# 📁 ソース: /path/to/sounds
# 📁 出力先: /path/to/output
# 📄 マッピング: /path/to/config/mapping.yaml
#
# ✅ コピー済み:
#   hihat_Am_sample__0001.wav → HH_Am__0001.wav
#   kick_heavy__0002.mp3 → KK__0002.mp3
#
# ⏭️ スキップ:
#   unknown_sample__0003.wav (no mapping found)
#   snare_sample.wav (not numbered)
#
# 📊 結果: 2 ファイルをコピー, 2 ファイルをスキップ
```

#### 動作仕様

1. **採番済みファイルのみ** がエクスポート対象（`__XXXX` 形式）
2. マッピングルールに一致しないファイルはスキップ
3. ファイル名に含まれる音楽キー（Am, C#, Bbm など）は保持される
4. 出力先に同名ファイルがある場合はスキップ（`--overwrite` で上書き可）

#### ファイル名変換の例

| 変換前 | 変換後 | 説明 |
|--------|--------|------|
| `hihat_Am_sample__0001.wav` | `HH_Am__0001.wav` | hihat → HH, キー Am を保持 |
| `kick_heavy__0002.mp3` | `KK__0002.mp3` | kick → KK, キーなし |
| `bass_Cm_loop__0010.wav` | `BS_Cm__0010.wav` | bass → BS, キー Cm を保持 |

---

## マッピング設定

`config/mapping.yaml` でカテゴリ変換ルールを定義します。

```yaml
# ドラム系
hihat: HH
kick: KK
snare: SN
clap: CP

# ベース系
bass: BS

# シンセ系
synth: SY
lead: LD
pad: PD
```

- **キー**: ファイル名に含まれるキーワード（大文字小文字区別なし）
- **値**: 変換後のカテゴリ名
- **最長一致**: `hihat_open` と `hihat` の両方が定義されている場合、より長い `hihat_open` が優先

---

## 開発方法

### 前提条件

- Node.js 22.x

### 開発コマンド

```bash
# 依存関係のインストール
npm install

# テスト実行
npm test

# テスト（ウォッチモード）
npm run test:watch

# 型チェック + リント + フォーマット
npm run check

# リントのみ
npm run lint

# フォーマットのみ
npm run format
```

### ディレクトリ構成

```
src/
├── commands/
│   ├── number.ts          # 採番コマンド
│   ├── number.test.ts
│   ├── export.ts          # エクスポートコマンド
│   └── export.test.ts
├── utils/
│   ├── fileUtils.ts       # ファイル操作ユーティリティ
│   ├── fileUtils.test.ts
│   ├── keyDetector.ts     # 音楽キー検出
│   ├── keyDetector.test.ts
│   ├── mapper.ts          # 名前変換
│   ├── mapper.test.ts
│   ├── logger.ts          # ロガー
│   └── logger.test.ts
├── types/
│   └── index.ts           # 型定義
└── index.ts               # CLIエントリーポイント

config/
├── mapping.yaml           # カテゴリマッピング設定
└── keys.yaml              # キー簡略化ルール（将来用）

logs/                      # ログ出力先（git管理外）
```

### テスト

TDD で開発されています。テストファイルはソースファイルと同じディレクトリに配置（コロケーション）。

```bash
# 全テスト実行
npm test

# 特定ファイルのテスト
npm test -- src/utils/fileUtils.test.ts
```
