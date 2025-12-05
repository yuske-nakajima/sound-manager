import * as fs from 'node:fs'
import * as path from 'node:path'
import { SUPPORTED_EXTENSIONS } from '../types/index'

const NUMBER_SUFFIX_PATTERN = /__(\d{4})\.\w+$/

/**
 * 指定ディレクトリ直下の音声ファイル(.wav, .mp3)一覧を取得
 */
export function getAudioFiles(dirPath: string): string[] {
  const entries = fs.readdirSync(dirPath, { withFileTypes: true })

  return entries
    .filter((entry) => {
      if (!entry.isFile()) return false
      const ext = path.extname(entry.name).toLowerCase()
      return SUPPORTED_EXTENSIONS.includes(
        ext as (typeof SUPPORTED_EXTENSIONS)[number],
      )
    })
    .map((entry) => entry.name)
}

/**
 * ファイル名に __xxxx の番号サフィックスがあるか判定
 */
export function hasNumberSuffix(filename: string): boolean {
  return NUMBER_SUFFIX_PATTERN.test(filename)
}

/**
 * ファイル一覧から既存の最大番号を抽出
 */
export function extractMaxNumber(files: string[]): number {
  let max = 0

  for (const file of files) {
    const match = file.match(NUMBER_SUFFIX_PATTERN)
    if (match?.[1]) {
      const num = Number.parseInt(match[1], 10)
      if (num > max) {
        max = num
      }
    }
  }

  return max
}

/**
 * ファイル名に __xxxx の番号サフィックスを付与
 */
export function addNumberSuffix(filename: string, num: number): string {
  const ext = path.extname(filename)
  const baseName = filename.slice(0, -ext.length)
  const paddedNum = num.toString().padStart(4, '0')

  return `${baseName}__${paddedNum}${ext}`
}
