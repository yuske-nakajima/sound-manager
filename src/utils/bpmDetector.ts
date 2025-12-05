/**
 * ファイル名からBPMを抽出する
 * BPMは2-3桁の数字で、アンダースコアまたはファイル名境界で区切られている
 * 60以上のBPMのみ返し、それ以外はnullを返す
 */

// BPMパターン: 2-3桁の数字（60-999を想定）
// 番号サフィックス（__0001）は除外
const BPM_PATTERN = /(?:^|_)(\d{2,3})(?:_|\.)/

export function detectBpm(filename: string): number | null {
  // 番号サフィックスを除去してから検索
  const filenameWithoutSuffix = filename.replace(/__\d{4}\.\w+$/, '')

  const match = filenameWithoutSuffix.match(BPM_PATTERN)
  if (!match?.[1]) {
    return null
  }

  const bpm = parseInt(match[1], 10)

  // 60未満は除外（oneshotなどの可能性）
  if (bpm < 60) {
    return null
  }

  // 999より大きい値は除外（BPMとして現実的でない）
  if (bpm > 999) {
    return null
  }

  return bpm
}
