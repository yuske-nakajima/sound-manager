import * as fs from 'node:fs'
import type { NumberMapping } from '../types/index.js'

const CURRENT_VERSION = 1

/**
 * 空の番号マッピングを作成する
 */
export function createEmptyMapping(): NumberMapping {
  return {
    version: CURRENT_VERSION,
    lastNumber: 0,
    mappings: {},
  }
}

/**
 * JSON ファイルから番号マッピングを読み込む
 * ファイルが存在しない場合は空のマッピングを返す
 */
export function loadNumberMapping(jsonPath: string): NumberMapping {
  if (!fs.existsSync(jsonPath)) {
    return createEmptyMapping()
  }

  const content = fs.readFileSync(jsonPath, 'utf-8')
  const data = JSON.parse(content) as NumberMapping

  // バージョンチェック（将来の拡張用）
  if (data.version !== CURRENT_VERSION) {
    throw new Error(
      `Unsupported mapping version: ${data.version}. Expected: ${CURRENT_VERSION}`,
    )
  }

  return data
}

/**
 * 番号マッピングを JSON ファイルに保存する
 */
export function saveNumberMapping(
  jsonPath: string,
  mapping: NumberMapping,
): void {
  const content = JSON.stringify(mapping, null, 2)
  fs.writeFileSync(jsonPath, content, 'utf-8')
}

/**
 * 番号を4桁のゼロ埋め文字列に変換する
 */
export function formatNumber(num: number): string {
  return num.toString().padStart(4, '0')
}
