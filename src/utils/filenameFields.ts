import * as path from 'node:path'
import { SUPPORTED_EXTENSIONS } from '../types/index.js'
import type { SupportedExtension } from '../types/index.js'

/**
 * ファイル名フィールドの共通文字集合を検証する。
 *
 * アーティスト名・曲名・楽器名・バリエーションは、アンダースコアを
 * フィールド区切りとして予約するため、英数字とハイフンのみを許可し
 * 空文字を禁止する共通仕様を持つ。また、ハイフンのみで構成される
 * フィールド（`-` / `--` など）は実質的に無名であり、出力先ディレクトリ名
 * として不適切なため、英数字を 1 文字以上含むことを要求する。
 * この関数はその仕様を集約し、各検出器（artistDetector.ts / toneDetector.ts）
 * から共有される。
 * @param value 検証対象のフィールド文字列
 * @returns 英数字とハイフンのみで構成され、英数字を 1 文字以上含む場合 true
 */
export function isNameField(value: string): boolean {
  return /^[A-Za-z0-9-]+$/.test(value) && /[A-Za-z0-9]/.test(value)
}

/**
 * ファイル名（のベース名部分）が、指定したプレフィックスで始まるかどうかを
 * 大文字小文字を区別せずに判定する。
 *
 * `artist_` / `tone_` のようなプレフィックス判定は artistDetector.ts /
 * toneDetector.ts で共通の仕様を持つため、この関数に集約する。
 * @param filename 判定対象のファイル名（パス区切りを含まないベース名を渡すこと）
 * @param prefix 判定するプレフィックス（例: `'tone_'`）
 * @returns 大文字小文字を区別せずにプレフィックスと一致する場合 true
 */
export function hasPrefix(filename: string, prefix: string): boolean {
  if (!filename) {
    return false
  }
  return filename.toLowerCase().startsWith(prefix.toLowerCase())
}

/**
 * ファイル名の拡張子が対応フォーマット（`SUPPORTED_EXTENSIONS`）かどうかを
 * 大文字小文字を区別せずに検証する。
 * @param filename 検証対象のファイル名
 * @returns 対応フォーマットの場合は元の大文字小文字を保持した拡張子（例: `.WAV`）、
 * 非対応または拡張子なしの場合は null
 */
export function getSupportedExtension(filename: string): string | null {
  const ext = path.extname(filename)
  if (!ext) {
    return null
  }
  const lowerExt = ext.toLowerCase() as SupportedExtension
  return SUPPORTED_EXTENSIONS.includes(lowerExt) ? ext : null
}
