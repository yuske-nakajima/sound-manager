import * as path from 'node:path'

/**
 * アーティストファイル情報
 */
export interface ArtistFileInfo {
  artistName: string
  trackName: string
  bpm: number
}

/**
 * ファイル名がアーティスト形式かどうかを判定
 * @param filename ファイル名
 * @returns アーティスト形式の場合 true
 */
export function isArtist(filename: string): boolean {
  if (!filename) {
    return false
  }
  return filename.toLowerCase().startsWith('artist_')
}

/**
 * アーティストファイル名を解析
 * 形式: artist_アーティスト名_曲名_bpm.wav
 * @param filename ファイル名
 * @returns 解析結果、または null
 */
export function parseArtistFilename(filename: string): ArtistFileInfo | null {
  if (!isArtist(filename)) {
    return null
  }

  const ext = path.extname(filename)
  const basename = path.basename(filename, ext)

  // artist_アーティスト名_曲名_bpm の形式を解析
  const parts = basename.split('_')

  // artist + アーティスト名 + 曲名 + bpm = 最低4パーツ必要
  if (parts.length < 4) {
    return null
  }

  // 最後の要素が BPM
  const bpmStr = parts[parts.length - 1]
  if (bpmStr === undefined) {
    return null
  }
  const bpm = Number.parseInt(bpmStr, 10)
  if (Number.isNaN(bpm)) {
    return null
  }

  // 最初の要素は "artist"、最後は BPM なので、中間を取得
  // parts[1] がアーティスト名、parts[length-2] が曲名
  const artistName = parts[1]
  const trackName = parts[parts.length - 2]

  if (artistName === undefined || trackName === undefined) {
    return null
  }

  if (artistName === '' || trackName === '') {
    return null
  }

  return {
    artistName,
    trackName,
    bpm,
  }
}

/**
 * アーティストファイル名を変換
 * @param filename 元のファイル名 (例: artist_shiina-ringo_kohukuron_133.wav)
 * @returns 変換後のパス (例: artist/shiina-ringo/kohukuron_133.wav) または null
 */
export function transformArtistFilename(filename: string): string | null {
  const parsed = parseArtistFilename(filename)
  if (!parsed) {
    return null
  }

  const ext = path.extname(filename)

  // artist/アーティスト名/曲名_bpm.ext
  return `artist/${parsed.artistName}/${parsed.trackName}_${parsed.bpm}${ext}`
}
