import * as path from 'node:path'
import { getSupportedExtension, hasPrefix, isNameField } from './filenameFields.js'

/**
 * アーティストファイル情報
 */
export interface ArtistFileInfo {
  artistName: string
  trackName: string
  bpm: number
}

/**
 * アーティストファイル名から抽出した検証済みの生フィールド。
 * BPM は元の文字列表記のまま保持し、出力ファイル名の構築で使用する
 * （数値変換すると `Number.MAX_SAFE_INTEGER` 超で桁が変わるため）。
 */
interface ArtistRawParts {
  artistName: string
  trackName: string
  bpmStr: string
  ext: string
}

/**
 * BPM フィールドの検証パターン。正の整数のみを許可し、ゼロ埋め・先頭ゼロを禁止する
 */
const BPM_PATTERN = /^[1-9][0-9]*$/

/**
 * ARTIST_ プレフィックス
 */
const ARTIST_PREFIX = 'artist_'

/**
 * ファイル名がアーティスト形式かどうかを判定
 * @param filename ファイル名（パスの一部でもよい）
 * @returns アーティスト形式の場合 true
 */
export function isArtist(filename: string): boolean {
  if (!filename) {
    return false
  }
  return hasPrefix(path.basename(filename), ARTIST_PREFIX)
}

/**
 * アーティストファイル名を解析し、検証済みの生フィールドを取得する内部処理。
 * `parseArtistFilename` と `transformArtistFilename` の両方から利用され、
 * バリデーションロジックの重複を避ける。
 * @param filename ファイル名
 * @returns 検証済みの生フィールド、または null
 */
function parseArtistParts(filename: string): ArtistRawParts | null {
  if (!isArtist(filename)) {
    return null
  }

  const ext = getSupportedExtension(filename)
  if (!ext) {
    return null
  }

  const basename = path.basename(filename, ext)

  // artist_アーティスト名_曲名_bpm の形式を解析
  // フィールド区切りはアンダースコアちょうど3個（全体で4フィールド）
  const parts = basename.split('_')
  if (parts.length !== 4) {
    return null
  }

  const [, artistName, trackName, bpmStr] = parts

  if (
    artistName === undefined ||
    trackName === undefined ||
    bpmStr === undefined
  ) {
    return null
  }

  if (!isNameField(artistName) || !isNameField(trackName)) {
    return null
  }

  if (!BPM_PATTERN.test(bpmStr)) {
    return null
  }

  return { artistName, trackName, bpmStr, ext }
}

/**
 * アーティストファイル名を解析
 * 形式: artist_アーティスト名_曲名_bpm.wav（フィールドはちょうど4個）
 * @param filename ファイル名
 * @returns 解析結果、または null
 */
export function parseArtistFilename(filename: string): ArtistFileInfo | null {
  const parts = parseArtistParts(filename)
  if (!parts) {
    return null
  }

  return {
    artistName: parts.artistName,
    trackName: parts.trackName,
    bpm: Number.parseInt(parts.bpmStr, 10),
  }
}

/**
 * アーティストファイル名を変換
 * @param filename 元のファイル名 (例: artist_shiina-ringo_kohukuron_133.wav)
 * @returns 変換後のパス (例: AT/shiina-ringo/kohukuron_133.wav) または null
 */
export function transformArtistFilename(filename: string): string | null {
  const parts = parseArtistParts(filename)
  if (!parts) {
    return null
  }

  // BPM は元の文字列表記をそのまま使う（数値変換による桁崩れを避けるため）
  // AT/アーティスト名/曲名_bpm.ext
  return `AT/${parts.artistName}/${parts.trackName}_${parts.bpmStr}${parts.ext}`
}
