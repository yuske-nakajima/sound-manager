import * as fs from 'node:fs'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { NumberMapping } from '../types/index.js'
import { exportCommand } from './export'

const TEST_DIR = path.join(process.cwd(), '.tmp', 'test-export')
const SOURCE_DIR_A = path.join(TEST_DIR, 'source-a')
const SOURCE_DIR_B = path.join(TEST_DIR, 'source-b')
const TO_DIR = path.join(TEST_DIR, 'to')
const LOG_DIR = path.join(TEST_DIR, 'logs')
const CONFIG_DIR = path.join(TEST_DIR, 'config')
const JSON_PATH = path.join(TEST_DIR, 'number-mapping.json')

describe('exportCommand', () => {
  beforeEach(() => {
    fs.mkdirSync(SOURCE_DIR_A, { recursive: true })
    fs.mkdirSync(SOURCE_DIR_B, { recursive: true })
    fs.mkdirSync(TO_DIR, { recursive: true })
    fs.mkdirSync(LOG_DIR, { recursive: true })
    fs.mkdirSync(CONFIG_DIR, { recursive: true })

    // マッピングファイルを作成
    fs.writeFileSync(
      path.join(CONFIG_DIR, 'mapping.yaml'),
      `
hihat: HH
kick: KK
snare: SN
bass: BS
`,
    )
  })

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
  })

  describe('正常系', () => {
    it('番号管理JSONに基づいてファイルがコピーされる', async () => {
      // ソースファイルを作成（採番後のファイル名）
      fs.writeFileSync(
        path.join(SOURCE_DIR_A, 'hihat_sample__0001.wav'),
        'data',
      )

      // 番号管理JSONを作成
      const mapping: NumberMapping = {
        version: 1,
        lastNumber: 1,
        mappings: {
          '0001': { originalName: 'hihat_sample.wav', directory: SOURCE_DIR_A },
        },
      }
      fs.writeFileSync(JSON_PATH, JSON.stringify(mapping), 'utf-8')

      const result = await exportCommand(TO_DIR, {
        jsonPath: JSON_PATH,
        dryRun: false,
        overwrite: false,
        mappingPath: path.join(CONFIG_DIR, 'mapping.yaml'),
        logDir: LOG_DIR,
      })

      expect(result.copiedFiles).toHaveLength(1)
      expect(result.copiedFiles[0]?.to).toBe('HH__0001.wav')
      expect(fs.existsSync(path.join(TO_DIR, 'HH__0001.wav'))).toBe(true)
    })

    it('異なるディレクトリのファイルを一括エクスポート', async () => {
      // 異なるディレクトリにソースファイルを作成
      fs.writeFileSync(
        path.join(SOURCE_DIR_A, 'hihat_sample__0001.wav'),
        'data1',
      )
      fs.writeFileSync(
        path.join(SOURCE_DIR_B, 'kick_sample__0002.wav'),
        'data2',
      )

      // 番号管理JSONを作成
      const mapping: NumberMapping = {
        version: 1,
        lastNumber: 2,
        mappings: {
          '0001': { originalName: 'hihat_sample.wav', directory: SOURCE_DIR_A },
          '0002': { originalName: 'kick_sample.wav', directory: SOURCE_DIR_B },
        },
      }
      fs.writeFileSync(JSON_PATH, JSON.stringify(mapping), 'utf-8')

      const result = await exportCommand(TO_DIR, {
        jsonPath: JSON_PATH,
        dryRun: false,
        overwrite: false,
        mappingPath: path.join(CONFIG_DIR, 'mapping.yaml'),
        logDir: LOG_DIR,
      })

      expect(result.copiedFiles).toHaveLength(2)
      expect(fs.existsSync(path.join(TO_DIR, 'HH__0001.wav'))).toBe(true)
      expect(fs.existsSync(path.join(TO_DIR, 'KK__0002.wav'))).toBe(true)
    })

    it('キーが正しく抽出・変換される', async () => {
      fs.writeFileSync(
        path.join(SOURCE_DIR_A, 'bass_Am_sample__0005.wav'),
        'data',
      )

      const mapping: NumberMapping = {
        version: 1,
        lastNumber: 5,
        mappings: {
          '0005': {
            originalName: 'bass_Am_sample.wav',
            directory: SOURCE_DIR_A,
          },
        },
      }
      fs.writeFileSync(JSON_PATH, JSON.stringify(mapping), 'utf-8')

      const result = await exportCommand(TO_DIR, {
        jsonPath: JSON_PATH,
        dryRun: false,
        overwrite: false,
        mappingPath: path.join(CONFIG_DIR, 'mapping.yaml'),
        logDir: LOG_DIR,
      })

      expect(result.copiedFiles).toHaveLength(1)
      expect(result.copiedFiles[0]?.to).toBe('BS_Am__0005.wav')
    })

    it('mp3 ファイルも正しくコピーされる', async () => {
      fs.writeFileSync(path.join(SOURCE_DIR_A, 'kick_sample__0002.mp3'), 'data')

      const mapping: NumberMapping = {
        version: 1,
        lastNumber: 2,
        mappings: {
          '0002': { originalName: 'kick_sample.mp3', directory: SOURCE_DIR_A },
        },
      }
      fs.writeFileSync(JSON_PATH, JSON.stringify(mapping), 'utf-8')

      const result = await exportCommand(TO_DIR, {
        jsonPath: JSON_PATH,
        dryRun: false,
        overwrite: false,
        mappingPath: path.join(CONFIG_DIR, 'mapping.yaml'),
        logDir: LOG_DIR,
      })

      expect(result.copiedFiles).toHaveLength(1)
      expect(result.copiedFiles[0]?.to).toBe('KK__0002.mp3')
      expect(fs.existsSync(path.join(TO_DIR, 'KK__0002.mp3'))).toBe(true)
    })
  })

  describe('スキップケース', () => {
    it('存在しないファイルはスキップ', async () => {
      // ファイルを作成しない（JSONには登録されているが実際のファイルがない）
      const mapping: NumberMapping = {
        version: 1,
        lastNumber: 1,
        mappings: {
          '0001': { originalName: 'hihat_sample.wav', directory: SOURCE_DIR_A },
        },
      }
      fs.writeFileSync(JSON_PATH, JSON.stringify(mapping), 'utf-8')

      const result = await exportCommand(TO_DIR, {
        jsonPath: JSON_PATH,
        dryRun: false,
        overwrite: false,
        mappingPath: path.join(CONFIG_DIR, 'mapping.yaml'),
        logDir: LOG_DIR,
      })

      expect(result.copiedFiles).toHaveLength(0)
      expect(result.skippedFiles).toHaveLength(1)
      expect(result.skippedFiles[0]?.reason).toContain('file not found')
    })

    it('マッピングなしファイルはスキップ', async () => {
      fs.writeFileSync(
        path.join(SOURCE_DIR_A, 'unknown_sample__0001.wav'),
        'data',
      )

      const mapping: NumberMapping = {
        version: 1,
        lastNumber: 1,
        mappings: {
          '0001': {
            originalName: 'unknown_sample.wav',
            directory: SOURCE_DIR_A,
          },
        },
      }
      fs.writeFileSync(JSON_PATH, JSON.stringify(mapping), 'utf-8')

      const result = await exportCommand(TO_DIR, {
        jsonPath: JSON_PATH,
        dryRun: false,
        overwrite: false,
        mappingPath: path.join(CONFIG_DIR, 'mapping.yaml'),
        logDir: LOG_DIR,
      })

      expect(result.copiedFiles).toHaveLength(0)
      expect(result.skippedFiles).toHaveLength(1)
      expect(result.skippedFiles[0]?.reason).toContain('no mapping')
    })

    it('既存ファイルはスキップ（overwrite=false）', async () => {
      fs.writeFileSync(path.join(SOURCE_DIR_A, 'hihat_sample__0001.wav'), 'new')
      fs.writeFileSync(path.join(TO_DIR, 'HH__0001.wav'), 'old')

      const mapping: NumberMapping = {
        version: 1,
        lastNumber: 1,
        mappings: {
          '0001': { originalName: 'hihat_sample.wav', directory: SOURCE_DIR_A },
        },
      }
      fs.writeFileSync(JSON_PATH, JSON.stringify(mapping), 'utf-8')

      const result = await exportCommand(TO_DIR, {
        jsonPath: JSON_PATH,
        dryRun: false,
        overwrite: false,
        mappingPath: path.join(CONFIG_DIR, 'mapping.yaml'),
        logDir: LOG_DIR,
      })

      expect(result.copiedFiles).toHaveLength(0)
      expect(result.skippedFiles).toHaveLength(1)
      expect(result.skippedFiles[0]?.reason).toContain('already exists')

      // 元のファイルは上書きされていない
      expect(fs.readFileSync(path.join(TO_DIR, 'HH__0001.wav'), 'utf-8')).toBe(
        'old',
      )
    })
  })

  describe('overwrite オプション', () => {
    it('overwrite=true で既存ファイルを上書き', async () => {
      fs.writeFileSync(path.join(SOURCE_DIR_A, 'hihat_sample__0001.wav'), 'new')
      fs.writeFileSync(path.join(TO_DIR, 'HH__0001.wav'), 'old')

      const mapping: NumberMapping = {
        version: 1,
        lastNumber: 1,
        mappings: {
          '0001': { originalName: 'hihat_sample.wav', directory: SOURCE_DIR_A },
        },
      }
      fs.writeFileSync(JSON_PATH, JSON.stringify(mapping), 'utf-8')

      const result = await exportCommand(TO_DIR, {
        jsonPath: JSON_PATH,
        dryRun: false,
        overwrite: true,
        mappingPath: path.join(CONFIG_DIR, 'mapping.yaml'),
        logDir: LOG_DIR,
      })

      expect(result.copiedFiles).toHaveLength(1)
      expect(fs.readFileSync(path.join(TO_DIR, 'HH__0001.wav'), 'utf-8')).toBe(
        'new',
      )
    })
  })

  describe('dry-run モード', () => {
    it('dry-run モードでファイルはコピーされない', async () => {
      fs.writeFileSync(
        path.join(SOURCE_DIR_A, 'hihat_sample__0001.wav'),
        'data',
      )

      const mapping: NumberMapping = {
        version: 1,
        lastNumber: 1,
        mappings: {
          '0001': { originalName: 'hihat_sample.wav', directory: SOURCE_DIR_A },
        },
      }
      fs.writeFileSync(JSON_PATH, JSON.stringify(mapping), 'utf-8')

      const result = await exportCommand(TO_DIR, {
        jsonPath: JSON_PATH,
        dryRun: true,
        overwrite: false,
        mappingPath: path.join(CONFIG_DIR, 'mapping.yaml'),
        logDir: LOG_DIR,
      })

      expect(result.copiedFiles).toHaveLength(1)
      expect(fs.existsSync(path.join(TO_DIR, 'HH__0001.wav'))).toBe(false)
    })
  })

  describe('エラーケース', () => {
    it('番号管理JSONが空の場合はエラー', async () => {
      const mapping: NumberMapping = {
        version: 1,
        lastNumber: 0,
        mappings: {},
      }
      fs.writeFileSync(JSON_PATH, JSON.stringify(mapping), 'utf-8')

      const result = await exportCommand(TO_DIR, {
        jsonPath: JSON_PATH,
        dryRun: false,
        overwrite: false,
        mappingPath: path.join(CONFIG_DIR, 'mapping.yaml'),
        logDir: LOG_DIR,
      })

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('empty')
    })
  })
})
