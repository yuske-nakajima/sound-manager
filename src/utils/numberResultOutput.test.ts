import { describe, expect, it } from 'vitest'
import type { NumberResult } from '../types/index.js'
import { formatNumberResult } from './numberResultOutput.js'

const result: NumberResult = {
  registeredFiles: [
    { file: 'kick.wav', numberKey: '1000' },
    { file: 'snare.wav', numberKey: '1001' },
  ],
  skippedFiles: ['already-registered.wav'],
  errors: [],
}

describe('formatNumberResult', () => {
  it('通常実行では処理件数と保存先を表示する', () => {
    expect(
      formatNumberResult(result, {
        dryRun: false,
        jsonPath: '/sounds.json',
        logDir: '/logs',
      }),
    ).toEqual([
      '\n🎵 採番完了',
      '新規登録: 2件',
      'スキップ: 1件',
      '付与番号: 1000〜1001',
      '番号管理JSON: /sounds.json',
      'ログ: /logs',
    ])
  })

  it('dry-runでは登録予定のファイルを表示する', () => {
    expect(
      formatNumberResult(result, {
        dryRun: true,
        jsonPath: '/sounds.json',
        logDir: '/logs',
      }),
    ).toContain('  1000  kick.wav')
  })
})
