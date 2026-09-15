import type { NumberResult } from '../types/index.js'

const PREVIEW_LIMIT = 10

interface NumberResultOutputOptions {
  dryRun: boolean
  jsonPath: string
  logDir: string
}

/**
 * 採番コマンドの結果を通常利用向けのコンソール出力へ整形する
 */
export function formatNumberResult(
  result: NumberResult,
  options: NumberResultOutputOptions,
): string[] {
  const lines = [
    `\n🎵 ${options.dryRun ? '採番プレビュー' : '採番完了'}`,
    `新規登録: ${result.registeredFiles.length}件`,
    `スキップ: ${result.skippedFiles.length}件`,
  ]

  if (result.registeredFiles.length > 0) {
    const first = result.registeredFiles.at(0)
    const last = result.registeredFiles.at(-1)
    if (first && last) {
      lines.push(`付与番号: ${first.numberKey}〜${last.numberKey}`)
    }
  }

  if (options.dryRun && result.registeredFiles.length > 0) {
    lines.push('', `登録予定（最大${PREVIEW_LIMIT}件）:`)
    for (const { file, numberKey } of result.registeredFiles.slice(
      0,
      PREVIEW_LIMIT,
    )) {
      lines.push(`  ${numberKey}  ${file}`)
    }

    const remaining = result.registeredFiles.length - PREVIEW_LIMIT
    if (remaining > 0) {
      lines.push(`  …ほか ${remaining}件`)
    }
  }

  if (!options.dryRun) {
    lines.push(`番号管理JSON: ${options.jsonPath}`)
  }
  lines.push(`ログ: ${options.logDir}`)

  return lines
}
