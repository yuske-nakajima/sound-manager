/**
 * 音楽キーのパターン
 * A-G + オプションで # または b + オプションで m または maj/min + オプションで 7
 * 例: Am, C#, Bbm, Dmaj7, Fmin7, G#m
 */
const KEY_PATTERN = /(?:^|_)([A-G][#b]?(?:m|maj|min)?7?)(?:_|\.)/

/**
 * ファイル名から音楽キーを抽出
 * @param filename ファイル名
 * @returns 検出されたキー、または null
 */
export function detectKey(filename: string): string | null {
  const match = filename.match(KEY_PATTERN)
  return match?.[1] ?? null
}
