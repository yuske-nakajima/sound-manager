import * as fs from 'node:fs'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import {
  addNumberSuffix,
  extractMaxNumber,
  getAudioFiles,
  hasNumberSuffix,
} from './fileUtils'

const TEST_DIR = path.join(process.cwd(), '.tmp', 'test-files')

describe('fileUtils', () => {
  beforeEach(() => {
    // テスト用ディレクトリを作成
    fs.mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    // テスト用ディレクトリを削除
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
  })

  describe('getAudioFiles', () => {
    it('.wav ファイルのみ抽出される', () => {
      fs.writeFileSync(path.join(TEST_DIR, 'test1.wav'), '')
      fs.writeFileSync(path.join(TEST_DIR, 'test2.wav'), '')
      fs.writeFileSync(path.join(TEST_DIR, 'test.txt'), '')

      const files = getAudioFiles(TEST_DIR)

      expect(files).toHaveLength(2)
      expect(files).toContain('test1.wav')
      expect(files).toContain('test2.wav')
      expect(files).not.toContain('test.txt')
    })

    it('.mp3 ファイルも抽出される', () => {
      fs.writeFileSync(path.join(TEST_DIR, 'test1.mp3'), '')
      fs.writeFileSync(path.join(TEST_DIR, 'test2.mp3'), '')

      const files = getAudioFiles(TEST_DIR)

      expect(files).toHaveLength(2)
      expect(files).toContain('test1.mp3')
      expect(files).toContain('test2.mp3')
    })

    it('.wav と .mp3 が混在しても両方抽出される', () => {
      fs.writeFileSync(path.join(TEST_DIR, 'test1.wav'), '')
      fs.writeFileSync(path.join(TEST_DIR, 'test2.mp3'), '')
      fs.writeFileSync(path.join(TEST_DIR, 'test.txt'), '')

      const files = getAudioFiles(TEST_DIR)

      expect(files).toHaveLength(2)
      expect(files).toContain('test1.wav')
      expect(files).toContain('test2.mp3')
    })

    it('サブディレクトリは無視される', () => {
      fs.writeFileSync(path.join(TEST_DIR, 'test.wav'), '')
      const subDir = path.join(TEST_DIR, 'subdir')
      fs.mkdirSync(subDir, { recursive: true })
      fs.writeFileSync(path.join(subDir, 'nested.wav'), '')

      const files = getAudioFiles(TEST_DIR)

      expect(files).toHaveLength(1)
      expect(files).toContain('test.wav')
    })

    it('空のディレクトリでは空配列を返す', () => {
      const files = getAudioFiles(TEST_DIR)
      expect(files).toEqual([])
    })

    it('大文字の拡張子も対応する', () => {
      fs.writeFileSync(path.join(TEST_DIR, 'test1.WAV'), '')
      fs.writeFileSync(path.join(TEST_DIR, 'test2.MP3'), '')

      const files = getAudioFiles(TEST_DIR)

      expect(files).toHaveLength(2)
    })
  })

  describe('hasNumberSuffix', () => {
    it('__0001 形式を正しく検出する', () => {
      expect(hasNumberSuffix('sample__0001.wav')).toBe(true)
      expect(hasNumberSuffix('sample__9999.wav')).toBe(true)
      expect(hasNumberSuffix('sample__0001.mp3')).toBe(true)
    })

    it('番号なしのファイル名を正しく判定する', () => {
      expect(hasNumberSuffix('sample.wav')).toBe(false)
      expect(hasNumberSuffix('sample_test.wav')).toBe(false)
      expect(hasNumberSuffix('sample.mp3')).toBe(false)
    })

    it('不正な形式は false を返す', () => {
      expect(hasNumberSuffix('sample__abc.wav')).toBe(false)
      expect(hasNumberSuffix('sample__12.wav')).toBe(false)
      expect(hasNumberSuffix('sample_0001.wav')).toBe(false)
    })
  })

  describe('extractMaxNumber', () => {
    it('最大値の抽出が正しい', () => {
      const files = ['a__0001.wav', 'b__0010.wav', 'c__0005.mp3']
      expect(extractMaxNumber(files)).toBe(10)
    })

    it('番号付きファイルがない場合は 0 を返す', () => {
      const files = ['a.wav', 'b.mp3', 'c.wav']
      expect(extractMaxNumber(files)).toBe(0)
    })

    it('空配列では 0 を返す', () => {
      expect(extractMaxNumber([])).toBe(0)
    })

    it('混在した場合も正しく最大値を取得する', () => {
      const files = ['a.wav', 'b__0005.wav', 'c__0003.mp3', 'd.mp3']
      expect(extractMaxNumber(files)).toBe(5)
    })
  })

  describe('addNumberSuffix', () => {
    it('番号付与後のファイル名が正しい（4桁ゼロ埋め）', () => {
      expect(addNumberSuffix('sample.wav', 1)).toBe('sample__0001.wav')
      expect(addNumberSuffix('sample.wav', 99)).toBe('sample__0099.wav')
      expect(addNumberSuffix('sample.wav', 999)).toBe('sample__0999.wav')
      expect(addNumberSuffix('sample.wav', 9999)).toBe('sample__9999.wav')
    })

    it('mp3 ファイルにも正しく番号を付与する', () => {
      expect(addNumberSuffix('sample.mp3', 1)).toBe('sample__0001.mp3')
    })

    it('既存の拡張子を保持する', () => {
      expect(addNumberSuffix('test_Am_sample.wav', 42)).toBe(
        'test_Am_sample__0042.wav',
      )
    })

    it('大文字拡張子を保持する', () => {
      expect(addNumberSuffix('sample.WAV', 1)).toBe('sample__0001.WAV')
      expect(addNumberSuffix('sample.MP3', 1)).toBe('sample__0001.MP3')
    })
  })
})
