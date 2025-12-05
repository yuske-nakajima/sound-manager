import * as fs from 'node:fs'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { numberCommand } from './number'

const TEST_DIR = path.join(process.cwd(), '.tmp', 'test-number')
const LOG_DIR = path.join(TEST_DIR, 'logs')

describe('numberCommand', () => {
  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true })
    fs.mkdirSync(LOG_DIR, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
  })

  describe('正常系', () => {
    it('未採番ファイルに番号が付与される', async () => {
      fs.writeFileSync(path.join(TEST_DIR, 'sample.wav'), '')

      const result = await numberCommand(TEST_DIR, {
        dryRun: false,
        logDir: LOG_DIR,
      })

      expect(result.renamedFiles).toHaveLength(1)
      expect(result.renamedFiles[0]?.from).toBe('sample.wav')
      expect(result.renamedFiles[0]?.to).toBe('sample__0001.wav')
      expect(fs.existsSync(path.join(TEST_DIR, 'sample__0001.wav'))).toBe(true)
      expect(fs.existsSync(path.join(TEST_DIR, 'sample.wav'))).toBe(false)
    })

    it('mp3 ファイルにも番号が付与される', async () => {
      fs.writeFileSync(path.join(TEST_DIR, 'sample.mp3'), '')

      const result = await numberCommand(TEST_DIR, {
        dryRun: false,
        logDir: LOG_DIR,
      })

      expect(result.renamedFiles).toHaveLength(1)
      expect(result.renamedFiles[0]?.to).toBe('sample__0001.mp3')
    })

    it('既存の最大値 + 1 から開始', async () => {
      fs.writeFileSync(path.join(TEST_DIR, 'a__0005.wav'), '')
      fs.writeFileSync(path.join(TEST_DIR, 'b__0010.wav'), '')
      fs.writeFileSync(path.join(TEST_DIR, 'c.wav'), '')

      const result = await numberCommand(TEST_DIR, {
        dryRun: false,
        logDir: LOG_DIR,
      })

      expect(result.renamedFiles).toHaveLength(1)
      expect(result.renamedFiles[0]?.to).toBe('c__0011.wav')
    })

    it('既に採番済みのファイルはスキップされる', async () => {
      fs.writeFileSync(path.join(TEST_DIR, 'a__0001.wav'), '')

      const result = await numberCommand(TEST_DIR, {
        dryRun: false,
        logDir: LOG_DIR,
      })

      expect(result.renamedFiles).toHaveLength(0)
      expect(result.skippedFiles).toContain('a__0001.wav')
    })

    it('複数の未採番ファイルに連番が付与される', async () => {
      fs.writeFileSync(path.join(TEST_DIR, 'a.wav'), '')
      fs.writeFileSync(path.join(TEST_DIR, 'b.mp3'), '')
      fs.writeFileSync(path.join(TEST_DIR, 'c.wav'), '')

      const result = await numberCommand(TEST_DIR, {
        dryRun: false,
        logDir: LOG_DIR,
      })

      expect(result.renamedFiles).toHaveLength(3)
      const toNames = result.renamedFiles.map((r) => r.to).sort()
      expect(toNames).toContain('a__0001.wav')
      expect(toNames).toContain('b__0002.mp3')
      expect(toNames).toContain('c__0003.wav')
    })
  })

  describe('dry-run モード', () => {
    it('dry-run モードでファイルは変更されない', async () => {
      fs.writeFileSync(path.join(TEST_DIR, 'sample.wav'), '')

      const result = await numberCommand(TEST_DIR, {
        dryRun: true,
        logDir: LOG_DIR,
      })

      expect(result.renamedFiles).toHaveLength(1)
      expect(fs.existsSync(path.join(TEST_DIR, 'sample.wav'))).toBe(true)
      expect(fs.existsSync(path.join(TEST_DIR, 'sample__0001.wav'))).toBe(false)
    })
  })

  describe('エラーケース', () => {
    it('存在しないフォルダでエラー', async () => {
      const nonExistent = path.join(TEST_DIR, 'nonexistent')

      const result = await numberCommand(nonExistent, {
        dryRun: false,
        logDir: LOG_DIR,
      })

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('not found')
    })
  })
})
