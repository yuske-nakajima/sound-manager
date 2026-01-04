import * as fs from 'node:fs'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { NumberMapping } from '../types/index.js'
import { numberCommand } from './number'

const TEST_DIR = path.join(process.cwd(), '.tmp', 'test-number')
const LOG_DIR = path.join(TEST_DIR, 'logs')
const JSON_PATH = path.join(TEST_DIR, 'number-mapping.json')

describe('numberCommand', () => {
  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true })
    fs.mkdirSync(LOG_DIR, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
  })

  describe('正常系', () => {
    it('未採番ファイルが登録される（ファイル名は変更されない）', async () => {
      fs.writeFileSync(path.join(TEST_DIR, 'sample.wav'), '')

      const result = await numberCommand(TEST_DIR, {
        jsonPath: JSON_PATH,
        dryRun: false,
        logDir: LOG_DIR,
      })

      expect(result.registeredFiles).toHaveLength(1)
      expect(result.registeredFiles[0]?.file).toBe('sample.wav')
      expect(result.registeredFiles[0]?.numberKey).toBe('0001')
      // ファイル名は変更されない
      expect(fs.existsSync(path.join(TEST_DIR, 'sample.wav'))).toBe(true)
    })

    it('mp3 ファイルも登録される', async () => {
      fs.writeFileSync(path.join(TEST_DIR, 'sample.mp3'), '')

      const result = await numberCommand(TEST_DIR, {
        jsonPath: JSON_PATH,
        dryRun: false,
        logDir: LOG_DIR,
      })

      expect(result.registeredFiles).toHaveLength(1)
      expect(result.registeredFiles[0]?.file).toBe('sample.mp3')
      expect(result.registeredFiles[0]?.numberKey).toBe('0001')
    })

    it('JSON の lastNumber + 1 から開始', async () => {
      // 既存のJSONを用意
      const existingMapping: NumberMapping = {
        version: 1,
        lastNumber: 10,
        mappings: {
          '0010': { originalName: 'old.wav', directory: '/old' },
        },
      }
      fs.writeFileSync(JSON_PATH, JSON.stringify(existingMapping), 'utf-8')
      fs.writeFileSync(path.join(TEST_DIR, 'new.wav'), '')

      const result = await numberCommand(TEST_DIR, {
        jsonPath: JSON_PATH,
        dryRun: false,
        logDir: LOG_DIR,
      })

      expect(result.registeredFiles).toHaveLength(1)
      expect(result.registeredFiles[0]?.numberKey).toBe('0011')
    })

    it('既に採番済みのファイルはスキップされる', async () => {
      fs.writeFileSync(path.join(TEST_DIR, 'a__0001.wav'), '')

      const result = await numberCommand(TEST_DIR, {
        jsonPath: JSON_PATH,
        dryRun: false,
        logDir: LOG_DIR,
      })

      expect(result.registeredFiles).toHaveLength(0)
      expect(result.skippedFiles).toContain('a__0001.wav')
    })

    it('複数の未採番ファイルに連番が付与される', async () => {
      fs.writeFileSync(path.join(TEST_DIR, 'a.wav'), '')
      fs.writeFileSync(path.join(TEST_DIR, 'b.mp3'), '')
      fs.writeFileSync(path.join(TEST_DIR, 'c.wav'), '')

      const result = await numberCommand(TEST_DIR, {
        jsonPath: JSON_PATH,
        dryRun: false,
        logDir: LOG_DIR,
      })

      expect(result.registeredFiles).toHaveLength(3)
      const files = result.registeredFiles.map((r) => r.file).sort()
      expect(files).toContain('a.wav')
      expect(files).toContain('b.mp3')
      expect(files).toContain('c.wav')
      const numberKeys = result.registeredFiles.map((r) => r.numberKey).sort()
      expect(numberKeys).toContain('0001')
      expect(numberKeys).toContain('0002')
      expect(numberKeys).toContain('0003')
    })
  })

  describe('JSON ファイル管理', () => {
    it('JSON ファイルが存在しない場合、新規作成される', async () => {
      fs.writeFileSync(path.join(TEST_DIR, 'sample.wav'), '')

      await numberCommand(TEST_DIR, {
        jsonPath: JSON_PATH,
        dryRun: false,
        logDir: LOG_DIR,
      })

      expect(fs.existsSync(JSON_PATH)).toBe(true)
      const content = fs.readFileSync(JSON_PATH, 'utf-8')
      const mapping = JSON.parse(content) as NumberMapping
      expect(mapping.version).toBe(1)
      expect(mapping.lastNumber).toBe(1)
      expect(mapping.mappings['0001']).toEqual({
        originalName: 'sample.wav',
        directory: TEST_DIR,
      })
    })

    it('既存の JSON ファイルに追記される', async () => {
      const existingMapping: NumberMapping = {
        version: 1,
        lastNumber: 5,
        mappings: {
          '0005': { originalName: 'old.wav', directory: '/old' },
        },
      }
      fs.writeFileSync(JSON_PATH, JSON.stringify(existingMapping), 'utf-8')
      fs.writeFileSync(path.join(TEST_DIR, 'new.wav'), '')

      await numberCommand(TEST_DIR, {
        jsonPath: JSON_PATH,
        dryRun: false,
        logDir: LOG_DIR,
      })

      const content = fs.readFileSync(JSON_PATH, 'utf-8')
      const mapping = JSON.parse(content) as NumberMapping
      expect(mapping.lastNumber).toBe(6)
      expect(mapping.mappings['0005']).toEqual({
        originalName: 'old.wav',
        directory: '/old',
      })
      expect(mapping.mappings['0006']).toEqual({
        originalName: 'new.wav',
        directory: TEST_DIR,
      })
    })

    it('異なるディレクトリからの採番で重複しない', async () => {
      const dir1 = path.join(TEST_DIR, 'dir1')
      const dir2 = path.join(TEST_DIR, 'dir2')
      fs.mkdirSync(dir1, { recursive: true })
      fs.mkdirSync(dir2, { recursive: true })
      fs.writeFileSync(path.join(dir1, 'a.wav'), '')
      fs.writeFileSync(path.join(dir2, 'b.wav'), '')

      // dir1 で採番
      await numberCommand(dir1, {
        jsonPath: JSON_PATH,
        dryRun: false,
        logDir: LOG_DIR,
      })

      // dir2 で採番
      await numberCommand(dir2, {
        jsonPath: JSON_PATH,
        dryRun: false,
        logDir: LOG_DIR,
      })

      const content = fs.readFileSync(JSON_PATH, 'utf-8')
      const mapping = JSON.parse(content) as NumberMapping
      expect(mapping.lastNumber).toBe(2)
      expect(mapping.mappings['0001']?.directory).toBe(dir1)
      expect(mapping.mappings['0002']?.directory).toBe(dir2)
      // ファイル名は変更されない
      expect(fs.existsSync(path.join(dir1, 'a.wav'))).toBe(true)
      expect(fs.existsSync(path.join(dir2, 'b.wav'))).toBe(true)
    })
  })

  describe('dry-run モード', () => {
    it('dry-run モードで登録情報が返される', async () => {
      fs.writeFileSync(path.join(TEST_DIR, 'sample.wav'), '')

      const result = await numberCommand(TEST_DIR, {
        jsonPath: JSON_PATH,
        dryRun: true,
        logDir: LOG_DIR,
      })

      expect(result.registeredFiles).toHaveLength(1)
      expect(result.registeredFiles[0]?.file).toBe('sample.wav')
      expect(result.registeredFiles[0]?.numberKey).toBe('0001')
      expect(fs.existsSync(path.join(TEST_DIR, 'sample.wav'))).toBe(true)
    })

    it('dry-run モードで JSON ファイルは更新されない', async () => {
      fs.writeFileSync(path.join(TEST_DIR, 'sample.wav'), '')

      await numberCommand(TEST_DIR, {
        jsonPath: JSON_PATH,
        dryRun: true,
        logDir: LOG_DIR,
      })

      expect(fs.existsSync(JSON_PATH)).toBe(false)
    })
  })

  describe('エラーケース', () => {
    it('存在しないフォルダでエラー', async () => {
      const nonExistent = path.join(TEST_DIR, 'nonexistent')

      const result = await numberCommand(nonExistent, {
        jsonPath: JSON_PATH,
        dryRun: false,
        logDir: LOG_DIR,
      })

      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('not found')
    })
  })
})
