import * as path from 'node:path'
import { getSupportedExtension, isNameField } from './filenameFields.js'

/**
 * 自作パターン（ORIGIN）ファイル情報
 */
export interface OriginFileInfo {
  songName: string
  patternName: string
}

/**
 * 自作パターンファイル名から抽出した検証済みの生フィールド。
 * `parseOriginFilename` と `transformOriginFilename` の両方から利用され、
 * バリデーションロジックの重複を避ける。
 */
interface OriginRawParts {
  songName: string
  patternName: string
  ext: string
}

/**
 * ORIGIN_ プレフィックス（末尾アンダースコアを含む）。
 * アンダースコアを含めないと `original_break_120.wav` のような一般的な
 * サンプル名を誤検出するため、区切りごと定数に含める
 */
const ORIGIN_PREFIX = 'ORIGIN_'

/**
 * ファイル名が自作パターン（ORIGIN）形式かどうかを判定
 *
 * `artist_` / `tone_` とは異なり、ORIGIN のプレフィックス判定は大文字小文字を
 * 区別する完全一致（`ORIGIN_` のみ）とする。小文字の `origin_` で始まる一般
 * ファイル（例: `origin_120_loop.wav`）はループ判定などの既存経路で扱われる
 * ものであり、大文字小文字を区別しない判定にすると出力先が変わってしまうため、
 * 意図的に大文字完全一致に限定している
 * @param filename ファイル名（パスの一部でもよい）
 * @returns ORIGIN 形式の場合 true
 */
export function isOrigin(filename: string): boolean {
  if (!filename) {
    return false
  }
  return path.basename(filename).startsWith(ORIGIN_PREFIX)
}

/**
 * 自作パターンファイル名を解析し、検証済みの生フィールドを取得する内部処理。
 * `parseOriginFilename` と `transformOriginFilename` の両方から利用され、
 * バリデーションロジックの重複を避ける。
 * @param filename ファイル名
 * @returns 検証済みの生フィールド、または null
 */
function parseOriginParts(filename: string): OriginRawParts | null {
  if (!isOrigin(filename)) {
    return null
  }

  const ext = getSupportedExtension(filename)
  if (!ext) {
    return null
  }

  const basename = path.basename(filename, ext)

  // ORIGIN_曲名_パターン名 の形式を解析
  // フィールド区切りはアンダースコアちょうど2個（全体で3フィールド）
  const parts = basename.split('_')
  if (parts.length !== 3) {
    return null
  }

  const [, songName, patternName] = parts

  if (songName === undefined || patternName === undefined) {
    return null
  }

  if (!isNameField(songName) || !isNameField(patternName)) {
    return null
  }

  return { songName, patternName, ext }
}

/**
 * 自作パターンファイル名を解析
 * 形式: ORIGIN_曲名_パターン名.拡張子（フィールドはちょうど3個）
 * @param filename ファイル名
 * @returns 解析結果、または null
 */
export function parseOriginFilename(filename: string): OriginFileInfo | null {
  const parts = parseOriginParts(filename)
  if (!parts) {
    return null
  }

  return {
    songName: parts.songName,
    patternName: parts.patternName,
  }
}

/**
 * 自作パターンファイル名を変換
 * @param filename 元のファイル名 (例: ORIGIN_my-song_pattern-a.wav)
 * @returns 変換後のパス (例: ORIGIN/my-song/pattern-a.wav) または null
 */
export function transformOriginFilename(filename: string): string | null {
  const parts = parseOriginParts(filename)
  if (!parts) {
    return null
  }

  // ORIGIN/曲名/パターン名.ext
  return `ORIGIN/${parts.songName}/${parts.patternName}${parts.ext}`
}
