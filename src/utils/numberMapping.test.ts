import * as fs from 'node:fs'
import * as os from 'node:os'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import type { NumberMapping } from '../types/index.js'
import {
  createEmptyMapping,
  formatNumber,
  loadNumberMapping,
  saveNumberMapping,
} from './numberMapping.js'

describe('numberMapping', () => {
  let tempDir: string

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'numberMapping-test-'))
  })

  afterEach(() => {
    fs.rmSync(tempDir, { recursive: true, force: true })
  })

  describe('createEmptyMapping', () => {
    it('空のマッピングを作成する', () => {
      const mapping = createEmptyMapping()

      expect(mapping.version).toBe(1)
      expect(mapping.lastNumber).toBe(0)
      expect(mapping.mappings).toEqual({})
    })
  })

  describe('loadNumberMapping', () => {
    it('ファイルが存在しない場合、空のマッピングを返す', () => {
      const jsonPath = path.join(tempDir, 'not-exist.json')
      const mapping = loadNumberMapping(jsonPath)

      expect(mapping.version).toBe(1)
      expect(mapping.lastNumber).toBe(0)
      expect(mapping.mappings).toEqual({})
    })

    it('既存のJSONファイルを読み込む', () => {
      const jsonPath = path.join(tempDir, 'mapping.json')
      const data: NumberMapping = {
        version: 1,
        lastNumber: 5,
        mappings: {
          '0001': { originalName: 'sample.wav', directory: '/dir-a' },
          '0002': { originalName: 'kick.wav', directory: '/dir-a' },
        },
      }
      fs.writeFileSync(jsonPath, JSON.stringify(data), 'utf-8')

      const mapping = loadNumberMapping(jsonPath)

      expect(mapping.version).toBe(1)
      expect(mapping.lastNumber).toBe(5)
      expect(mapping.mappings['0001']).toEqual({
        originalName: 'sample.wav',
        directory: '/dir-a',
      })
    })

    it('サポートされないバージョンでエラーをスロー', () => {
      const jsonPath = path.join(tempDir, 'mapping.json')
      const data = {
        version: 999,
        lastNumber: 0,
        mappings: {},
      }
      fs.writeFileSync(jsonPath, JSON.stringify(data), 'utf-8')

      expect(() => loadNumberMapping(jsonPath)).toThrow(
        'Unsupported mapping version: 999',
      )
    })
  })

  describe('saveNumberMapping', () => {
    it('マッピングをJSONファイルに保存する', () => {
      const jsonPath = path.join(tempDir, 'mapping.json')
      const mapping: NumberMapping = {
        version: 1,
        lastNumber: 3,
        mappings: {
          '0001': { originalName: 'test.wav', directory: '/test' },
        },
      }

      saveNumberMapping(jsonPath, mapping)

      expect(fs.existsSync(jsonPath)).toBe(true)
      const content = fs.readFileSync(jsonPath, 'utf-8')
      const saved = JSON.parse(content)
      expect(saved).toEqual(mapping)
    })

    it('既存ファイルを上書きする', () => {
      const jsonPath = path.join(tempDir, 'mapping.json')
      const oldMapping: NumberMapping = {
        version: 1,
        lastNumber: 1,
        mappings: {},
      }
      saveNumberMapping(jsonPath, oldMapping)

      const newMapping: NumberMapping = {
        version: 1,
        lastNumber: 5,
        mappings: {
          '0005': { originalName: 'new.wav', directory: '/new' },
        },
      }
      saveNumberMapping(jsonPath, newMapping)

      const content = fs.readFileSync(jsonPath, 'utf-8')
      const saved = JSON.parse(content)
      expect(saved.lastNumber).toBe(5)
    })
  })

  describe('formatNumber', () => {
    it('番号を4桁のゼロ埋めに変換する', () => {
      expect(formatNumber(1)).toBe('0001')
      expect(formatNumber(10)).toBe('0010')
      expect(formatNumber(100)).toBe('0100')
      expect(formatNumber(1000)).toBe('1000')
      expect(formatNumber(9999)).toBe('9999')
    })
  })
})
