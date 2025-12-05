import * as fs from 'node:fs'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { exportCommand } from './export'

const TEST_DIR = path.join(process.cwd(), '.tmp', 'test-export')
const FROM_DIR = path.join(TEST_DIR, 'from')
const TO_DIR = path.join(TEST_DIR, 'to')
const LOG_DIR = path.join(TEST_DIR, 'logs')
const CONFIG_DIR = path.join(TEST_DIR, 'config')

describe('exportCommand', () => {
  beforeEach(() => {
    fs.mkdirSync(FROM_DIR, { recursive: true })
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
    it('マッピングに従ってファイルがコピーされる', async () => {
      fs.writeFileSync(path.join(FROM_DIR, 'hihat_sample__0001.wav'), 'data')

      const result = await exportCommand(FROM_DIR, TO_DIR, {
        dryRun: false,
        overwrite: false,
        mappingPath: path.join(CONFIG_DIR, 'mapping.yaml'),
        logDir: LOG_DIR,
      })

      expect(result.copiedFiles).toHaveLength(1)
      expect(result.copiedFiles[0]?.to).toBe('HH__0001.wav')
      expect(fs.existsSync(path.join(TO_DIR, 'HH__0001.wav'))).toBe(true)
    })

    it('キーが正しく抽出・変換される', async () => {
      fs.writeFileSync(path.join(FROM_DIR, 'bass_Am_loop__0005.wav'), 'data')

      const result = await exportCommand(FROM_DIR, TO_DIR, {
        dryRun: false,
        overwrite: false,
        mappingPath: path.join(CONFIG_DIR, 'mapping.yaml'),
        logDir: LOG_DIR,
      })

      expect(result.copiedFiles).toHaveLength(1)
      expect(result.copiedFiles[0]?.to).toBe('BS_Am__0005.wav')
    })

    it('mp3 ファイルも正しくコピーされる', async () => {
      fs.writeFileSync(path.join(FROM_DIR, 'kick_sample__0002.mp3'), 'data')

      const result = await exportCommand(FROM_DIR, TO_DIR, {
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
    it('未採番ファイルはスキップ', async () => {
      fs.writeFileSync(path.join(FROM_DIR, 'hihat_sample.wav'), 'data')

      const result = await exportCommand(FROM_DIR, TO_DIR, {
        dryRun: false,
        overwrite: false,
        mappingPath: path.join(CONFIG_DIR, 'mapping.yaml'),
        logDir: LOG_DIR,
      })

      expect(result.copiedFiles).toHaveLength(0)
      expect(result.skippedFiles).toHaveLength(1)
      expect(result.skippedFiles[0]?.reason).toContain('not numbered')
    })

    it('マッピングなしファイルはスキップ', async () => {
      fs.writeFileSync(path.join(FROM_DIR, 'unknown_sample__0001.wav'), 'data')

      const result = await exportCommand(FROM_DIR, TO_DIR, {
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
      fs.writeFileSync(path.join(FROM_DIR, 'hihat_sample__0001.wav'), 'new')
      fs.writeFileSync(path.join(TO_DIR, 'HH__0001.wav'), 'old')

      const result = await exportCommand(FROM_DIR, TO_DIR, {
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
      fs.writeFileSync(path.join(FROM_DIR, 'hihat_sample__0001.wav'), 'new')
      fs.writeFileSync(path.join(TO_DIR, 'HH__0001.wav'), 'old')

      const result = await exportCommand(FROM_DIR, TO_DIR, {
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
      fs.writeFileSync(path.join(FROM_DIR, 'hihat_sample__0001.wav'), 'data')

      const result = await exportCommand(FROM_DIR, TO_DIR, {
        dryRun: true,
        overwrite: false,
        mappingPath: path.join(CONFIG_DIR, 'mapping.yaml'),
        logDir: LOG_DIR,
      })

      expect(result.copiedFiles).toHaveLength(1)
      expect(fs.existsSync(path.join(TO_DIR, 'HH__0001.wav'))).toBe(false)
    })
  })
})
