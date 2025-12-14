/**
 * ファイル名がドラム系かどうかを判定する
 * ドラム系キーワードを含む場合はtrueを返す
 */

const DRUM_KEYWORDS = [
  'drum',
  'drums',
  'kick',
  'snare',
  'hihat',
  'clap',
  'rim',
  'tom',
  'cymbal',
  'ride',
  'crash',
  'shaker',
  'tambourine',
  'perc',
]

export function isDrum(filename: string): boolean {
  const lowerFilename = filename.toLowerCase()

  return DRUM_KEYWORDS.some((keyword) => lowerFilename.includes(keyword))
}
