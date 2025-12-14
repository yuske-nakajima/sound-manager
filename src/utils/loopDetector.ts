import { detectBpm } from './bpmDetector'

/**
 * ファイル名がループ素材かどうかを判定する
 * 条件（OR）:
 * 1. "loop" という文字列を含む（大文字小文字区別なし）
 * 2. BPM >= 60 の数値が含まれる
 */
export function isLoop(filename: string): boolean {
  const lowerFilename = filename.toLowerCase()

  // "loop" を含むか
  if (lowerFilename.includes('loop')) {
    return true
  }

  // BPM >= 60 を含むか
  const bpm = detectBpm(filename)
  if (bpm !== null) {
    return true
  }

  return false
}
