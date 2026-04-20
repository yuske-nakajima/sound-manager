# Sound Manager

[![Check](https://github.com/yuske-nakajima/sound-manager/actions/workflows/check.yml/badge.svg)](https://github.com/yuske-nakajima/sound-manager/actions/workflows/check.yml)
[![Test](https://github.com/yuske-nakajima/sound-manager/actions/workflows/test.yml/badge.svg)](https://github.com/yuske-nakajima/sound-manager/actions/workflows/test.yml)

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
pnpm install
```

## 実行方法

### 採番コマンド (number)

指定ディレクトリ内の音声ファイルに連番（`__0001`, `__0002`, ...）を付与します。
番号は JSON ファイルで一元管理され、異なるディレクトリで作業しても重複しません。

```bash
# 基本的な使い方
pnpm run start -- number <対象ディレクトリ> --json <番号管理JSONファイル>

# 例: ./sounds ディレクトリ内のファイルに採番
pnpm run start -- number ./sounds --json ./number-mapping.json
```

#### オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `--json <path>` | 番号管理JSONファイルのパス | **必須** |
| `-d, --dry-run` | ファイルを変更せずに結果をプレビュー | `false` |
| `--log-dir <path>` | ログ出力先ディレクトリ | `./logs` |

#### 使用例

```bash
# dry-run で変更内容を確認（実際にはファイルを変更しない）
pnpm run start -- number ./sounds --json ./number-mapping.json --dry-run

# 異なるディレクトリで同じJSONを使用（番号が重複しない）
pnpm run start -- number ./sounds-a --json ./number-mapping.json
pnpm run start -- number ./sounds-b --json ./number-mapping.json

# 実行結果の例
# 📁 対象ディレクトリ: /path/to/sounds
# 📄 番号管理JSON: /path/to/number-mapping.json
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

#### 番号管理JSONファイルの形式

```json
{
  "version": 1,
  "lastNumber": 3,
  "mappings": {
    "0001": {
      "originalName": "hihat_Am_sample.wav",
      "directory": "/path/to/sounds-a"
    },
    "0002": {
      "originalName": "kick_heavy.mp3",
      "directory": "/path/to/sounds-a"
    },
    "0003": {
      "originalName": "snare.wav",
      "directory": "/path/to/sounds-b"
    }
  }
}
```

#### 動作仕様

1. 既に `__XXXX` 形式の番号が付いているファイルはスキップ
2. JSON ファイルの `lastNumber` + 1 から採番を開始
3. 番号は4桁ゼロ埋め（例: `__0001`, `__0099`, `__1234`）
4. JSON ファイルが存在しない場合は自動で新規作成
5. dry-run モードでは JSON ファイルは更新されない

---

### エクスポートコマンド (export)

番号管理 JSON ファイルに登録されたファイルを、マッピングルールに従って変換しながら出力先ディレクトリにコピーします。
異なるディレクトリに散らばったファイルを一括でエクスポートできます。
ファイルはカテゴリ（マッピング先の名称）ごとにサブディレクトリに分けて配置されます。

```bash
# 基本的な使い方
pnpm run start -- export --json <番号管理JSONファイル> <出力先ディレクトリ>

# 例: number-mapping.json に登録されたファイルを ./output へエクスポート
pnpm run start -- export --json ./number-mapping.json ./output
```

#### オプション

| オプション | 説明 | デフォルト |
|-----------|------|-----------|
| `--json <path>` | 番号管理JSONファイルのパス | **必須** |
| `-d, --dry-run` | ファイルをコピーせずに結果をプレビュー | `false` |
| `-o, --overwrite` | 出力先に同名ファイルがあれば上書き | `false` |
| `-m, --mapping <path>` | マッピングファイルのパス | `./config/mapping.yaml` |
| `--log-dir <path>` | ログ出力先ディレクトリ | `./logs` |

#### 使用例

```bash
# dry-run でエクスポート内容を確認
pnpm run start -- export --json ./number-mapping.json ./output --dry-run

# カスタムマッピングファイルを使用
pnpm run start -- export --json ./number-mapping.json ./output -m ./my-mapping.yaml

# 既存ファイルを上書きしてエクスポート
pnpm run start -- export --json ./number-mapping.json ./output --overwrite

# 実行結果の例
# 📄 番号管理JSON: /path/to/number-mapping.json
# 📁 出力先: /path/to/output
# 📄 マッピング: /path/to/config/mapping.yaml
#
# ✅ コピー済み:
#   /sounds-a/hihat_Am_sample__0001.wav → HH/HH_Am__0001.wav
#   /sounds-b/kick_heavy__0002.mp3 → KK/KK__0002.mp3
#
# ⏭️ スキップ:
#   /sounds-a/unknown_sample__0003.wav (no mapping found)
#   /sounds-b/missing__0004.wav (file not found)
#
# 📊 結果: 2 ファイルをコピー, 2 ファイルをスキップ
```

#### 出力ディレクトリ構造

エクスポート後のディレクトリ構造は以下のようになります：

```
output/
├── HH/
│   ├── HH_Am__0001.wav
│   └── HH__0010.wav
├── KK/
│   └── KK__0002.mp3
├── SN/
│   └── SN__0003.wav
├── BS/
│   └── BS_Cm__0004.wav
├── LP-D/
│   └── LP-D-120__0005.wav
├── LP-M/
│   └── LP-M-100__0006.wav
└── artist/
    └── shina-ringo/
        └── kohukuron_133.wav
```

#### 動作仕様

1. 番号管理 JSON に登録されたファイルがエクスポート対象
2. 各ファイルの `directory` フィールドからソースパスを特定
3. マッピングルールに一致しないファイルはスキップ
4. ファイル名に含まれる音楽キー（Am, C#, Bbm など）は保持される
5. カテゴリ（マッピング先の名称）ごとにサブディレクトリを自動作成
6. 出力先に同名ファイルがある場合はスキップ（`--overwrite` で上書き可）
7. 存在しないファイル（削除済みなど）はスキップ

#### ファイル名変換の例

| 変換前 | 変換後 | 配置先 | 説明 |
|--------|--------|--------|------|
| `hihat_Am_sample__0001.wav` | `HH_Am__0001.wav` | `HH/` | hihat → HH, キー Am を保持 |
| `kick_heavy__0002.mp3` | `KK__0002.mp3` | `KK/` | kick → KK, キーなし |
| `bass_Cm_loop__0010.wav` | `LP-M-120__0010.wav` | `LP-M/` | ループ判定、BPM 120 |
| `drum_120_loop__0005.wav` | `LP-D-120__0005.wav` | `LP-D/` | ドラムループ、BPM 120 |
| `artist_shina-ringo_kohukuron_133.wav` | `kohukuron_133.wav` | `artist/shina-ringo/` | アーティスト音源 |

---

## マッピング設定

`config/mapping.yaml` でカテゴリ変換ルールを定義します。

- **キー**: ファイル名に含まれるキーワード（大文字小文字区別なし）
- **値**: 変換後のカテゴリ名
- **最長一致**: `hihat_open` と `hihat` の両方が定義されている場合、より長い `hihat_open` が優先

### 現在のマッピング一覧（更新日: 2025-12-20）

#### ドラム系

| キーワード | 変換後 | 説明 |
|-----------|--------|------|
| hihat_open | HHO | ハイハット（オープン） |
| hihat_closed | HHC | ハイハット（クローズ） |
| open_hat | HHO | ハイハット（オープン） |
| closed_hat | HHC | ハイハット（クローズ） |
| hihat | HH | ハイハット |
| hat | HH | ハイハット |
| kick | KK | キック |
| snare | SN | スネア |
| clap | CP | クラップ |
| snap | CP | スナップ |
| rim | RM | リムショット |
| tom | TM | タム |
| cymbal | CY | シンバル |
| ride | RD | ライド |
| crash | CR | クラッシュ |
| shaker | SK | シェイカー |
| tambourine | TB | タンバリン |
| tamb | TB | タンバリン（略称） |
| cowbell | CB | カウベル |
| drums | DM | ドラム |
| perc | PC | パーカッション |

#### ベース系

| キーワード | 変換後 | 説明 |
|-----------|--------|------|
| bass | BS | ベース |
| _bs_ | BS | ベース（略称） |
| sub | SUB | サブベース |

#### シンセ・リード系

| キーワード | 変換後 | 説明 |
|-----------|--------|------|
| synth | SY | シンセ |
| lead | LD | リード |
| pad | PD | パッド |
| arp | AR | アルペジオ |
| pluck | PL | プラック |
| stab | ST | スタブ |

#### ブラス・管楽器系

| キーワード | 変換後 | 説明 |
|-----------|--------|------|
| trumpet | TP | トランペット |
| brass | BR | ブラス |
| horn | HR | ホルン |
| sax | SX | サックス |
| saxophone | SX | サックス |

#### エフェクト系

| キーワード | 変換後 | 説明 |
|-----------|--------|------|
| fx | FX | エフェクト |
| riser | RS | ライザー |
| impact | IM | インパクト |
| hit | IM | ヒット |
| slam | IM | スラム |
| boom | IM | ブーム |
| bang | IM | バング |
| beep | FX | ビープ |
| ting | FX | ティング |
| noise | NS | ノイズ |
| ambient | AM | アンビエント |
| firework | FX | 花火 |
| game | FX | ゲーム音 |
| jump | FX | ジャンプ音 |
| walk | FX | 足音 |
| foot | FX | 足音 |
| step | FX | 足音 |
| rain | AM | 雨 |
| bird | AM | 鳥 |
| field_recording | AM | フィールドレコーディング |
| powerup | FX | パワーアップ音 |

#### ボーカル系

| キーワード | 変換後 | 説明 |
|-----------|--------|------|
| vocal | VO | ボーカル |
| vox | VO | ボーカル |
| voice | VO | ボイス |
| chop | CH | チョップ |

#### 弦楽器系

| キーワード | 変換後 | 説明 |
|-----------|--------|------|
| violin | VN | バイオリン |
| guitar | GT | ギター |
| gtr | GT | ギター（略称） |

#### 鍵盤系

| キーワード | 変換後 | 説明 |
|-----------|--------|------|
| piano | PN | ピアノ |
| keys | KY | キーボード |

#### ベル・チャイム系

| キーワード | 変換後 | 説明 |
|-----------|--------|------|
| chime | BL | チャイム |
| bells | BL | ベル |
| bell | BL | ベル |

#### パーカッション系

| キーワード | 変換後 | 説明 |
|-----------|--------|------|
| sansula | PC | サンスラ |
| tongue_drum | PC | タングドラム |
| kalimba | PC | カリンバ |
| knock | PC | ノック |
| wood | PC | ウッド |
| wooden | PC | ウッド |
| conga | PC | コンガ |
| bongo | PC | ボンゴ |
| marimba | PC | マリンバ |
| xylophone | PC | シロフォン |

#### メロディ系

| キーワード | 変換後 | 説明 |
|-----------|--------|------|
| melody | ML | メロディ |

#### その他

| キーワード | 変換後 | 説明 |
|-----------|--------|------|
| loop | LP | ループ |
| sample | SP | サンプル |
| one_shot | OS | ワンショット |
| chord | CD | コード |

### ループ素材の特別変換

BPM情報（60以上）または「loop」を含むファイルは、自動的にループ素材として判定され、以下の形式に変換されます：

| 条件 | 変換形式 | 例 |
|------|---------|-----|
| ドラム系 + BPMあり | `LP-D-{BPM}__{番号}.wav` | `LP-D-120__0001.wav` |
| ドラム系 + BPMなし | `LP-D__{番号}.wav` | `LP-D__0001.wav` |
| その他 + BPMあり | `LP-M-{BPM}__{番号}.wav` | `LP-M-100__0001.wav` |
| その他 + BPMなし | `LP-M__{番号}.wav` | `LP-M__0001.wav` |

### アーティスト音源の特別変換

`artist_` で始まるファイルは、アーティスト音源として特別に処理され、アーティスト名ごとのサブディレクトリに配置されます。

#### ファイル名形式

```
artist_{アーティスト名}_{曲名}_{BPM}.wav
```

- **接頭辞**: `artist_`（大文字小文字区別なし）
- **アーティスト名**: アルファベット、ハイフン可
- **曲名**: アルファベット、ハイフン可
- **BPM**: 数値

#### 変換例

| 変換前 | 変換後 | 配置先ディレクトリ |
|--------|--------|-------------------|
| `artist_shina-ringo_kohukuron_133.wav` | `kohukuron_133.wav` | `artist/shina-ringo/` |
| `ARTIST_Band-Name_Song-Title_120.wav` | `Song-Title_120.wav` | `artist/Band-Name/` |
| `artist_test_track_90.mp3` | `track_90.mp3` | `artist/test/` |

---

## 開発方法

### 前提条件

- Node.js 24.x (`.mise.toml` で固定)
- pnpm 10.x (`.mise.toml` で固定)

### 開発コマンド

```bash
# 依存関係のインストール
pnpm install

# テスト実行
pnpm test

# テスト（ウォッチモード）
pnpm run test:watch

# 型チェック + リント + フォーマット
pnpm run check

# リントのみ
pnpm run lint

# フォーマットのみ
pnpm run format
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
│   ├── artistDetector.ts  # アーティスト音源検出
│   ├── artistDetector.test.ts
│   ├── bpmDetector.ts     # BPM検出
│   ├── bpmDetector.test.ts
│   ├── drumDetector.ts    # ドラム検出
│   ├── drumDetector.test.ts
│   ├── fileUtils.ts       # ファイル操作ユーティリティ
│   ├── fileUtils.test.ts
│   ├── keyDetector.ts     # 音楽キー検出
│   ├── keyDetector.test.ts
│   ├── loopDetector.ts    # ループ検出
│   ├── loopDetector.test.ts
│   ├── mapper.ts          # 名前変換
│   ├── mapper.test.ts
│   ├── numberMapping.ts   # 番号管理JSON操作
│   ├── numberMapping.test.ts
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
pnpm test

# 特定ファイルのテスト
pnpm test -- src/utils/fileUtils.test.ts
```
