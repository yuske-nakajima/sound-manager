import { describe, expect, it } from 'vitest'
import type { ExportResult } from '../types/index.js'
import { formatExportResult } from './exportResultOutput.js'

const result: ExportResult = {
  copiedFiles: [{ from: '/sounds/kick.wav', to: '/output/KICK__0001.wav' }],
  skippedFiles: [{ file: '/sounds/snare.wav', reason: 'already exists' }],
  errors: [],
}

describe('formatExportResult', () => {
  it('通常実行では処理件数と出力先を表示する', () => {
    expect(
      formatExportResult(result, {
        dryRun: false,
        jsonPath: '/sounds.json',
        outputDir: '/output',
        logDir: '/logs',
      }),
    ).toEqual([
      '\n📦 エクスポート完了',
      'コピー: 1件',
      'スキップ: 1件',
      '出力先: /output',
      '番号管理JSON: /sounds.json',
      'ログ: /logs',
    ])
  })

  it('dry-runではコピー予定のファイルを表示する', () => {
    expect(
      formatExportResult(result, {
        dryRun: true,
        jsonPath: '/sounds.json',
        outputDir: '/output',
        logDir: '/logs',
      }),
    ).toContain('  /sounds/kick.wav → /output/KICK__0001.wav')
  })
})
