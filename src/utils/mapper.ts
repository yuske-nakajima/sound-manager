import * as fs from 'node:fs'
import * as path from 'node:path'
import * as YAML from 'yaml'
import { detectBpm } from './bpmDetector.js'
import { isDrum } from './drumDetector.js'
import { detectKey } from './keyDetector.js'
import { isLoop } from './loopDetector.js'

/**
 * YAML ファイルからマッピングを読み込む
 */
export function loadMapping(yamlPath: string): Map<string, string> {
  const content = fs.readFileSync(yamlPath, 'utf-8')
  const parsed = YAML.parse(content)

  if (!parsed || typeof parsed !== 'object') {
    return new Map()
  }

  return new Map(Object.entries(parsed))
}

/**
 * ファイル名に対して最長一致でマッピングを検索
 * @param filename ファイル名
 * @param mapping マッピング
 * @returns マッチした値、または null
 */
export function findMatch(
  filename: string,
  mapping: Map<string, string>,
): string | null {
  const lowerFilename = filename.toLowerCase()
  let longestMatch = ''
  let matchedValue: string | null = null

  for (const [key, value] of mapping) {
    const lowerKey = key.toLowerCase()
    if (lowerFilename.includes(lowerKey) && key.length > longestMatch.length) {
      longestMatch = key
      matchedValue = value
    }
  }

  return matchedValue
}

/**
 * ファイル名を変換
 * @param originalFilename 元のファイル名 (例: hihat_Am_sample.wav)
 * @param mapping マッピング
 * @param numberKey 連番キー (例: 0001)
 * @returns 変換後のファイル名 (例: HH_Am__0001.wav) または null
 */
export function transformFilename(
  originalFilename: string,
  mapping: Map<string, string>,
  numberKey: string,
): string | null {
  const ext = path.extname(originalFilename).slice(1) // .wav -> wav

  // ループ判定
  if (isLoop(originalFilename)) {
    return transformLoopFilename(originalFilename, numberKey, ext)
  }

  // ループでない場合は既存のマッピングロジック
  return transformNonLoopFilename(originalFilename, mapping, numberKey, ext)
}

/**
 * ループファイルの変換
 * ドラムループ: LP-D-{BPM}__{番号}.{ext}
 * その他ループ: LP-M-{BPM}__{番号}.{ext}
 */
function transformLoopFilename(
  filename: string,
  number: string,
  ext: string,
): string {
  const drumOrMusic = isDrum(filename) ? 'D' : 'M'
  const bpm = detectBpm(filename)

  if (bpm !== null) {
    return `LP-${drumOrMusic}-${bpm}__${number}.${ext}`
  }
  return `LP-${drumOrMusic}__${number}.${ext}`
}

/**
 * 変換後のファイル名からカテゴリを抽出
 * @param filename 変換後のファイル名 (例: HH_Am__0001.wav, LP-D-120__0001.wav)
 * @returns カテゴリ (例: HH, LP-D) または null
 */
export function extractCategory(filename: string): string | null {
  if (!filename) {
    return null
  }

  // ループファイル: LP-D-120__0001.wav または LP-D__0001.wav
  const loopMatch = filename.match(/^(LP-[DM])(?:-\d+)?__\d{4}\.\w+$/)
  if (loopMatch?.[1]) {
    return loopMatch[1]
  }

  // 通常ファイル: HH_Am__0001.wav または HH__0001.wav または HH_Cmaj7__0001.wav
  const normalMatch = filename.match(/^([A-Z]+)(?:_[A-Za-z#0-9]+)?__\d{4}\.\w+$/)
  if (normalMatch?.[1]) {
    return normalMatch[1]
  }

  return null
}

/**
 * ループでないファイルの変換（既存ロジック）
 */
function transformNonLoopFilename(
  filename: string,
  mapping: Map<string, string>,
  number: string,
  ext: string,
): string | null {
  // マッピングを検索
  const category = findMatch(filename, mapping)
  if (!category) {
    return null
  }

  // キーを検出
  const key = detectKey(filename)

  // 新しいファイル名を構築
  if (key) {
    return `${category}_${key}__${number}.${ext}`
  }
  return `${category}__${number}.${ext}`
}
