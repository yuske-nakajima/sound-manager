import * as fs from 'node:fs'
import * as YAML from 'yaml'
import { hasNumberSuffix } from './fileUtils.js'
import { detectKey } from './keyDetector.js'

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
 * @param filename ファイル名 (例: hihat_Am_sample__0001.wav)
 * @param mapping マッピング
 * @returns 変換後のファイル名 (例: HH_Am__0001.wav) または null
 */
export function transformFilename(
  filename: string,
  mapping: Map<string, string>,
): string | null {
  // 番号サフィックスがなければ変換対象外
  if (!hasNumberSuffix(filename)) {
    return null
  }

  // マッピングを検索
  const category = findMatch(filename, mapping)
  if (!category) {
    return null
  }

  // キーを検出
  const key = detectKey(filename)

  // 番号サフィックスを抽出
  const numberMatch = filename.match(/__(\d{4})\.(\w+)$/)
  if (!numberMatch) {
    return null
  }

  const [, number, ext] = numberMatch

  // 新しいファイル名を構築
  if (key) {
    return `${category}_${key}__${number}.${ext}`
  }
  return `${category}__${number}.${ext}`
}
