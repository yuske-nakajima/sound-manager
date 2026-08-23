# Sound Manager

[![Check](https://github.com/yuske-nakajima/sound-manager/actions/workflows/check.yml/badge.svg)](https://github.com/yuske-nakajima/sound-manager/actions/workflows/check.yml)
[![Test](https://github.com/yuske-nakajima/sound-manager/actions/workflows/test.yml/badge.svg)](https://github.com/yuske-nakajima/sound-manager/actions/workflows/test.yml)

SP-404 MK2 にインポートする音源を管理するための CLI ツール。

## 機能

- **採番 (number)**: 音声ファイルに連番を割り当て、番号管理 JSON へ登録（実ファイル名は変更しない）
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

指定ディレクトリ内の音声ファイルに連番（`0001`, `0002`, ...）を割り当て、番号管理 JSON ファイルへ登録します。
実ファイル名は変更されません。番号は JSON ファイルで一元管理され、異なるディレクトリで作業しても重複しません。

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
# ✅ 登録済み:
#   hihat_Am_sample.wav → 0001
#   kick_heavy.mp3 → 0002
#
# ⏭️ スキップ（採番済み）:
#   snare__0001.wav
#
# 📊 結果: 2 ファイルを登録, 1 ファイルをスキップ
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

1. 既に `__XXXX` 形式の番号が付いているファイルはスキップ（参照元のファイル名に番号サフィックスが付いていないことが正常な状態であり、`number` コマンド自体はファイル名にサフィックスを付与しない）
2. JSON ファイルの `lastNumber` + 1 から採番を開始
3. 番号は4桁ゼロ埋め（例: `0001`, `0099`, `1234`）
4. JSON ファイルが存在しない場合は自動で新規作成
5. dry-run モードでは JSON ファイルは更新されない
6. 重複登録の判定は、番号管理 JSON 内の各エントリが持つ `originalName`（ファイル名）と `directory`（対象ディレクトリの絶対パス）の組み合わせで行われる。同一の組み合わせが既に登録されていれば、そのファイルはスキップされる

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
#   /sounds-a/hihat_Am_sample__0001.wav → SP/SP_Am__0001.wav
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
├── AT/
│   └── shina-ringo/
│       └── kohukuron_133.wav
└── CM/
    └── guitar/
        └── C3.wav
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
| `hihat_Am_sample__0001.wav` | `SP_Am__0001.wav` | `SP/` | `sample`（6文字）が `hihat`（5文字）より長く最長一致で優先されるため SP、キー Am を保持 |
| `kick_heavy__0002.mp3` | `KK__0002.mp3` | `KK/` | kick → KK, キーなし |
| `bass_Cm_loop__0010.wav` | `LP-M__0010.wav` | `LP-M/` | ループ判定、ファイル名に BPM 表記がないため BPM 部分は省略 |
| `drum_120_loop__0005.wav` | `LP-D-120__0005.wav` | `LP-D/` | ドラムループ、BPM 120 |
| `artist_shina-ringo_kohukuron_133.wav` | `kohukuron_133.wav` | `AT/shina-ringo/` | アーティスト音源（詳細は[アーティスト音源の命名規則](#アーティスト音源の命名規則)を参照） |
| `tone_guitar_C3.wav` | `C3.wav` | `CM/guitar/` | 単音サンプル（詳細は[単音サンプルの命名規則](#単音サンプルの命名規則)を参照） |

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

<a id="アーティスト音源の命名規則"></a>
### アーティスト音源の命名規則

`artist_` で始まるファイルは、アーティスト音源として特別に処理され、アーティスト名ごとのサブディレクトリに配置されます。

```
参照元:  artist_<アーティスト名>_<曲名>_<BPM>.<拡張子>
出力先:  AT/<アーティスト名>/<曲名>_<BPM>.<拡張子>
```

| 項目 | 規則 |
| --- | --- |
| プレフィックス | `artist`（大文字小文字を区別しない） |
| フィールド区切り | アンダースコア。ちょうど 3 個（全体で 4 フィールド） |
| アーティスト名 | 英数字とハイフン。アンダースコア不可。空文字不可 |
| 曲名 | 英数字とハイフン。アンダースコア不可。空文字不可 |
| BPM | 正の整数。ゼロ埋め不可。先頭ゼロ不可 |
| 拡張子 | 対応フォーマット（`.wav` / `.mp3`）に準ずる |

単語の区切りにはハイフンを使います（例: `song-title`、`song-title-vocals`）。アンダースコアはフィールド区切りとして予約されているため、アーティスト名・曲名には使用できません。

規則を外れたファイル名は変換対象外となり、`export` 実行時にスキップされます。

出力名には番号サフィックスが付きません。ただし `number` コマンドによる番号管理 JSON への登録自体は、他のファイルと同様に行われます。

#### 変換例（正常系）

| 変換前 | 変換後 | 配置先ディレクトリ |
|--------|--------|-------------------|
| `artist_shiina-ringo_kohukuron_133.wav` | `kohukuron_133.wav` | `AT/shiina-ringo/` |
| `ARTIST_Band-Name_Song-Title_120.wav` | `Song-Title_120.wav` | `AT/Band-Name/` |
| `artist_test_track_90.mp3` | `track_90.mp3` | `AT/test/` |

#### 変換例（異常系、変換対象外）

| ファイル名 | 理由 |
|-----------|------|
| `artist_name_120.wav` | フィールド不足（3 フィールドしかない） |
| `artist_band-name_song_title_120.wav` | フィールド過多（5 フィールド。曲名にアンダースコアは使えない） |
| `artist_name_track_abc.wav` | BPM が数値でない |
| `artist_name_track_0120.wav` | BPM の先頭ゼロは不可 |
| `artist__track_120.wav` | アーティスト名が空文字 |
| `artist_name__120.wav` | 曲名が空文字 |

いずれも規則違反のため変換対象外となり、`export` 実行時に「no mapping found」としてスキップされます。

<a id="単音サンプルの命名規則"></a>
### 単音（クロマチック用）サンプルの命名規則

`tone_` で始まるファイルは、SP-404 MK2 のクロマチックモードで演奏するための単音サンプルとして特別に処理され、楽器ごとのサブディレクトリに配置されます。クロマチックモードでは元のピッチ（キーとオクターブ）どおりに半音単位で再マッピングされるため、ファイル名から元のピッチを一意に復元できる必要があります。そのためオクターブの指定は必須です。

```
参照元:  tone_<楽器>_<キー><オクターブ>[_<バリエーション>].<拡張子>
出力先:  CM/<楽器>/<キー><オクターブ>[_<バリエーション>].<拡張子>
```

`CM` は Chromatic に由来する出力フォルダ名です。`config/mapping.yaml` のカテゴリ値、および `AT` を含む既存の出力先フォルダ名と衝突しません。

| 項目 | 規則 |
| --- | --- |
| プレフィックス | `tone`（大文字小文字を区別しない） |
| フィールド区切り | アンダースコア。3 フィールドまたは 4 フィールド |
| 楽器 | 英数字とハイフン。アンダースコア不可。空文字不可 |
| キー | `A` から `G` の 1 文字 + 任意の `#` または `b` |
| オクターブ | 1 桁の数字。**必須** |
| バリエーション | 任意。英数字とハイフン。アンダースコア不可 |
| 拡張子 | 対応フォーマット（`.wav` / `.mp3`）に準ずる |

**大文字小文字の扱い**: 大文字小文字を区別しないのはプレフィックス（`tone` / `TONE` / `Tone` など）のみです。キー（`A`-`G`）とフラット記号の `b` は大文字小文字を区別します。`b` を大文字の `B` にすると規則外（`A`-`G` + 任意の `#`/`b` + オクターブ という形式に一致しない）となり変換対象外としてスキップされるため、フラットは必ず小文字の `b` で表記してください。

規則を外れた `tone_` プレフィックス付きファイルは変換対象外となり、`export` 実行時にスキップされます。

出力名には番号サフィックスが付きません。ただし `number` コマンドによる番号管理 JSON への登録自体は、他のファイルと同様に行われます。

`tone_` プレフィックスを持たないファイルの解決順序・カテゴリ判定・キー検出（`keyDetector.ts` の `KEY_PATTERN`）は一切変わりません。キー検出パターンにオクターブ対応を追加することはありません（オクターブは `tone_` 専用のパースでのみ扱われます）。既存の出力先には `HH_Am__0001.wav` のようなオクターブなしキー表記のファイルが存在しており、キー検出を変更するとこれらの出力名が変わってしまうためです。

#### 変換例（正常系）

| 変換前 | 変換後 | 配置先ディレクトリ |
|--------|--------|-------------------|
| `tone_guitar_C3.wav` | `C3.wav` | `CM/guitar/` |
| `tone_piano_F#4_soft.wav` | `F#4_soft.wav` | `CM/piano/` |
| `tone_bass_Bb2.wav` | `Bb2.wav` | `CM/bass/` |
| `TONE_Guitar_C3.wav` | `C3.wav` | `CM/Guitar/` |
| `tone_electric-guitar_A5.wav` | `A5.wav` | `CM/electric-guitar/` |

#### 変換例（異常系、変換対象外）

| ファイル名 | 理由 |
|-----------|------|
| `tone_guitar_C.wav` | オクターブがない |
| `tone_guitar_C10.wav` | オクターブが 2 桁以上 |
| `tone_guitar_H3.wav` | キーが `A`-`G` の範囲外 |
| `tone_guitar_c3.wav` | キーが小文字（キーは大文字小文字を区別する） |
| `tone__C3.wav` | 楽器名が空文字 |

いずれも規則違反のため変換対象外となり、`export` 実行時に「no mapping found」としてスキップされます。

#### 判定順序

出力先の解決は以下の順序で判定されます。アーティスト → 単音 → ループ → カテゴリマッピングの順に判定し、最初に一致した規則が採用されます。

1. アーティスト判定（`artist_` プレフィックス）
2. 単音判定（`tone_` プレフィックス）
3. ループ判定（BPM または `loop` を含むか）
4. カテゴリマッピング（`config/mapping.yaml` によるキーワード一致）

単音判定をループ判定より前に置いているのは、`tone_bass_Bb2.wav` のようなファイル名にオクターブの数字が含まれ、ループ判定が先に走ると BPM として誤解釈される恐れがあるためです。

### 運用上の注意

#### `artist/` → `AT/` の移行

アーティスト音源の出力先ディレクトリ名は `artist/` から `AT/` に変更されています。既に `artist/` へ出力済みの出力先ディレクトリには旧ディレクトリがそのまま残ります。再度 `export` を実行すると、同じ音源が新たに `AT/` にも生成されるため、`artist/` と `AT/` の両方に同じ音源が存在する二重状態になります。旧 `artist/` ディレクトリは手動で削除するか、`AT/` にリネームしてください。

#### 非準拠の `tone_` / `artist_` ファイル

`tone_` / `artist_` プレフィックスが一致していても、フィールド数・文字種・BPM やオクターブの表記など規則を外れたファイル名は変換対象外です。この場合、`config/mapping.yaml` によるカテゴリ変換にはフォールバックせず、`export` 実行時にそのままスキップされます。

#### 出力名の衝突

`AT/` と `CM/` の出力名には（他のカテゴリ出力と異なり）連番の番号サフィックスが付きません。そのため、別々のソースディレクトリに置かれた参照元でもアーティスト名・曲名・BPM（または楽器・キー・オクターブ・バリエーション）が同一であれば、同一の出力パスに解決されます。`--overwrite` を指定しない場合は 2 件目以降がスキップされ（`already exists`）、`--overwrite` を指定した場合は後から処理された方で上書きされます。

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
│   ├── filenameFields.ts  # ファイル名フィールドの共通検証
│   ├── filenameFields.test.ts
│   ├── keyDetector.ts     # 音楽キー検出
│   ├── keyDetector.test.ts
│   ├── loopDetector.ts    # ループ検出
│   ├── loopDetector.test.ts
│   ├── mapper.ts          # 名前変換
│   ├── mapper.test.ts
│   ├── numberMapping.ts   # 番号管理JSON操作
│   ├── numberMapping.test.ts
│   ├── toneDetector.ts    # 単音（クロマチック用）サンプル検出
│   ├── toneDetector.test.ts
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
