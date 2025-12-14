import * as fs from 'node:fs'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it } from 'vitest'
import { findMatch, loadMapping, transformFilename } from './mapper'

const TEST_DIR = path.join(process.cwd(), '.tmp', 'test-mapper')

describe('mapper', () => {
  beforeEach(() => {
    fs.mkdirSync(TEST_DIR, { recursive: true })
  })

  afterEach(() => {
    fs.rmSync(TEST_DIR, { recursive: true, force: true })
  })

  describe('loadMapping', () => {
    it('YAML からマッピングを読み込む', () => {
      const yamlPath = path.join(TEST_DIR, 'mapping.yaml')
      fs.writeFileSync(
        yamlPath,
        `
hihat: HH
kick: KK
snare: SN
`,
      )

      const mapping = loadMapping(yamlPath)

      expect(mapping.get('hihat')).toBe('HH')
      expect(mapping.get('kick')).toBe('KK')
      expect(mapping.get('snare')).toBe('SN')
    })

    it('空の YAML は空の Map を返す', () => {
      const yamlPath = path.join(TEST_DIR, 'empty.yaml')
      fs.writeFileSync(yamlPath, '')

      const mapping = loadMapping(yamlPath)

      expect(mapping.size).toBe(0)
    })

    it('存在しないファイルでエラーを投げる', () => {
      expect(() => loadMapping(path.join(TEST_DIR, 'notfound.yaml'))).toThrow()
    })
  })

  describe('findMatch', () => {
    it('最長一致が機能する', () => {
      const mapping = new Map([
        ['hat', 'H'],
        ['hihat', 'HH'],
        ['hihat_open', 'HHO'],
      ])

      expect(findMatch('hihat_open_sample.wav', mapping)).toBe('HHO')
      expect(findMatch('hihat_closed.wav', mapping)).toBe('HH')
      expect(findMatch('hat_sample.wav', mapping)).toBe('H')
    })

    it('大文字小文字を区別しない', () => {
      const mapping = new Map([['hihat', 'HH']])

      expect(findMatch('HiHat_sample.wav', mapping)).toBe('HH')
      expect(findMatch('HIHAT_SAMPLE.wav', mapping)).toBe('HH')
    })

    it('マッチなしで null を返す', () => {
      const mapping = new Map([['hihat', 'HH']])

      expect(findMatch('kick_sample.wav', mapping)).toBeNull()
    })

    it('空のマッピングでは null を返す', () => {
      const mapping = new Map<string, string>()

      expect(findMatch('hihat_sample.wav', mapping)).toBeNull()
    })
  })

  describe('transformFilename', () => {
    it('変換後のファイル名が正しい形式', () => {
      const mapping = new Map([['hihat', 'HH']])

      const result = transformFilename('hihat_Am_sample__0001.wav', mapping)

      expect(result).toBe('HH_Am__0001.wav')
    })

    it('キーがない場合も正しく変換する', () => {
      const mapping = new Map([['kick', 'KK']])

      const result = transformFilename('kick_sample__0005.wav', mapping)

      expect(result).toBe('KK__0005.wav')
    })

    it('マッピングがない場合は null を返す', () => {
      const mapping = new Map([['hihat', 'HH']])

      const result = transformFilename('snare_sample__0001.wav', mapping)

      expect(result).toBeNull()
    })

    it('番号サフィックスがない場合は null を返す', () => {
      const mapping = new Map([['hihat', 'HH']])

      const result = transformFilename('hihat_sample.wav', mapping)

      expect(result).toBeNull()
    })

    it('mp3 ファイルも正しく変換する', () => {
      const mapping = new Map([['bass', 'BS']])

      const result = transformFilename('bass_sample__0010.mp3', mapping)

      expect(result).toBe('BS__0010.mp3')
    })
  })

  describe('transformFilename - ループ変換', () => {
    it('ドラムループ（BPMあり）は LP-D-{BPM} 形式に変換', () => {
      const mapping = new Map([['loop', 'LP']])

      const result = transformFilename(
        '91V_PUKG_130_drum_top_loop__0001.wav',
        mapping,
      )

      expect(result).toBe('LP-D-130__0001.wav')
    })

    it('ドラムループ（loopなし、BPMあり）も LP-D-{BPM} 形式に変換', () => {
      const mapping = new Map([['loop', 'LP']])

      const result = transformFilename(
        'DS_VPT_100_drum_full_machine__0002.wav',
        mapping,
      )

      expect(result).toBe('LP-D-100__0002.wav')
    })

    it('ドラムループ（BPM 90）も正しく変換', () => {
      const mapping = new Map([['loop', 'LP']])

      const result = transformFilename(
        'SLS_CSP_90_drum_kit_rnb__0008.wav',
        mapping,
      )

      expect(result).toBe('LP-D-90__0008.wav')
    })

    it('その他ミュージックループは LP-M-{BPM} 形式に変換', () => {
      const mapping = new Map([['loop', 'LP']])

      const result = transformFilename('synth_loop_100_pad__0001.wav', mapping)

      expect(result).toBe('LP-M-100__0001.wav')
    })

    it('ベースループは LP-M-{BPM} 形式に変換', () => {
      const mapping = new Map([['loop', 'LP']])

      const result = transformFilename(
        'bass_120_loop_groove__0005.wav',
        mapping,
      )

      expect(result).toBe('LP-M-120__0005.wav')
    })

    it('BPMなしのloopファイルはBPM部分を省略', () => {
      const mapping = new Map([['loop', 'LP']])

      const result = transformFilename('drum_loop_groove__0001.wav', mapping)

      expect(result).toBe('LP-D__0001.wav')
    })

    it('ループでないファイルは既存マッピングを使用', () => {
      const mapping = new Map([
        ['loop', 'LP'],
        ['kick', 'KK'],
      ])

      const result = transformFilename('kick_sample__0001.wav', mapping)

      expect(result).toBe('KK__0001.wav')
    })

    it('ループでない + キーありのファイルは既存マッピングを使用', () => {
      const mapping = new Map([
        ['loop', 'LP'],
        ['hihat', 'HH'],
      ])

      const result = transformFilename('hihat_Am_sample__0001.wav', mapping)

      expect(result).toBe('HH_Am__0001.wav')
    })
  })
})
