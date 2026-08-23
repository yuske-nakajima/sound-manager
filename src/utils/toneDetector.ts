import * as path from 'node:path'
import { getSupportedExtension, hasPrefix, isNameField } from './filenameFields.js'

/**
 * 単音（クロマチック用）ファイル情報
 */
export interface ToneFileInfo {
  instrument: string
  key: string
  octave: string
  variation?: string
}

/**
 * 単音ファイル名から抽出した検証済みの生フィールド。
 * `parseToneFilename` と `transformToneFilename` の両方から利用され、
 * バリデーションロジックの重複を避ける。
 */
interface ToneRawParts {
  instrument: string
  key: string
  octave: string
  variation?: string
  ext: string
}

/**
 * キー + オクターブの検証パターン
 * `A`-`G` の1文字 + 任意の `#`/`b` + 1桁の数字（オクターブは必須）
 */
const KEY_OCTAVE_PATTERN = /^([A-G][#b]?)([0-9])$/

/**
 * TONE_ プレフィックス
 */
const TONE_PREFIX = 'tone_'

/**
 * ファイル名が単音（クロマチック用）形式かどうかを判定
 * @param filename ファイル名（パスの一部でもよい）
 * @returns 単音形式の場合 true
 */
export function isTone(filename: string): boolean {
  if (!filename) {
    return false
  }
  return hasPrefix(path.basename(filename), TONE_PREFIX)
}

/**
 * 単音ファイル名を解析し、検証済みの生フィールドを取得する内部処理。
 * @param filename ファイル名
 * @returns 検証済みの生フィールド、または null
 */
function parseToneParts(filename: string): ToneRawParts | null {
  if (!isTone(filename)) {
    return null
  }

  const ext = getSupportedExtension(filename)
  if (!ext) {
    return null
  }

  const basename = path.basename(filename, ext)

  // tone_楽器_キーオクターブ[_バリエーション] の形式を解析
  // フィールド区切りはアンダースコア。3フィールドまたは4フィールド
  const parts = basename.split('_')
  if (parts.length !== 3 && parts.length !== 4) {
    return null
  }

  const [, instrument, keyOctave, variation] = parts

  if (instrument === undefined || keyOctave === undefined) {
    return null
  }

  if (!isNameField(instrument)) {
    return null
  }

  const match = KEY_OCTAVE_PATTERN.exec(keyOctave)
  if (!match) {
    return null
  }
  const [, key, octave] = match
  if (key === undefined || octave === undefined) {
    return null
  }

  if (parts.length === 4) {
    if (variation === undefined || !isNameField(variation)) {
      return null
    }
    return { instrument, key, octave, variation, ext }
  }

  return { instrument, key, octave, ext }
}

/**
 * 単音ファイル名を解析
 * 形式: tone_楽器_キーオクターブ[_バリエーション].拡張子（フィールドは3個または4個）
 * @param filename ファイル名
 * @returns 解析結果、または null
 */
export function parseToneFilename(filename: string): ToneFileInfo | null {
  const parts = parseToneParts(filename)
  if (!parts) {
    return null
  }

  const { instrument, key, octave, variation } = parts
  if (variation !== undefined) {
    return { instrument, key, octave, variation }
  }
  return { instrument, key, octave }
}

/**
 * 単音ファイル名を変換
 * @param filename 元のファイル名 (例: tone_guitar_C3.wav)
 * @returns 変換後のパス (例: CM/guitar/C3.wav) または null
 */
export function transformToneFilename(filename: string): string | null {
  const parts = parseToneParts(filename)
  if (!parts) {
    return null
  }

  const suffix = parts.variation ? `_${parts.variation}` : ''

  // CM/楽器/キーオクターブ[_バリエーション].ext
  return `CM/${parts.instrument}/${parts.key}${parts.octave}${suffix}${parts.ext}`
}
