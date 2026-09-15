import type { ExportResult } from '../types/index.js'

const PREVIEW_LIMIT = 10

interface ExportResultOutputOptions {
  dryRun: boolean
  jsonPath: string
  outputDir: string
  logDir: string
}

/**
 * エクスポートコマンドの結果を通常利用向けのコンソール出力へ整形する
 */
export function formatExportResult(
  result: ExportResult,
  options: ExportResultOutputOptions,
): string[] {
  const lines = [
    `\n📦 ${options.dryRun ? 'エクスポートプレビュー' : 'エクスポート完了'}`,
    `コピー: ${result.copiedFiles.length}件`,
    `スキップ: ${result.skippedFiles.length}件`,
    `出力先: ${options.outputDir}`,
  ]

  if (options.dryRun && result.copiedFiles.length > 0) {
    lines.push('', `コピー予定（最大${PREVIEW_LIMIT}件）:`)
    for (const { from, to } of result.copiedFiles.slice(0, PREVIEW_LIMIT)) {
      lines.push(`  ${from} → ${to}`)
    }

    const remaining = result.copiedFiles.length - PREVIEW_LIMIT
    if (remaining > 0) {
      lines.push(`  …ほか ${remaining}件`)
    }
  }

  lines.push(`番号管理JSON: ${options.jsonPath}`, `ログ: ${options.logDir}`)

  return lines
}
