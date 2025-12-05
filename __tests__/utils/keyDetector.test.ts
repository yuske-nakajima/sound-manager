import { describe, expect, it } from 'vitest'
import { detectKey } from '../../src/utils/keyDetector'

describe('keyDetector', () => {
  describe('detectKey', () => {
    it('_Am_ からキーを抽出する', () => {
      expect(detectKey('sample_Am_loop.wav')).toBe('Am')
    })

    it('_C#_ からキーを抽出する', () => {
      expect(detectKey('sample_C#_loop.wav')).toBe('C#')
    })

    it('_Bbm_ からキーを抽出する', () => {
      expect(detectKey('sample_Bbm_bass.mp3')).toBe('Bbm')
    })

    it('_Dmaj7_ からキーを抽出する', () => {
      expect(detectKey('sample_Dmaj7_chord.wav')).toBe('Dmaj7')
    })

    it('_Fmin7_ からキーを抽出する', () => {
      expect(detectKey('sample_Fmin7_pad.wav')).toBe('Fmin7')
    })

    it('_Eb_ からキーを抽出する', () => {
      expect(detectKey('track_Eb_melody.wav')).toBe('Eb')
    })

    it('_G#m_ からキーを抽出する', () => {
      expect(detectKey('track_G#m_lead.mp3')).toBe('G#m')
    })

    it('キーなしのファイル名は null を返す', () => {
      expect(detectKey('sample_loop.wav')).toBeNull()
      expect(detectKey('drum_pattern.mp3')).toBeNull()
    })

    it('ファイル名末尾のキーも検出する', () => {
      expect(detectKey('sample_Am.wav')).toBe('Am')
    })

    it('ファイル名先頭のキーも検出する', () => {
      expect(detectKey('Am_sample.wav')).toBe('Am')
    })

    it('複数のキーがある場合は最初のキーを返す', () => {
      expect(detectKey('Am_transpose_to_Dm.wav')).toBe('Am')
    })

    it('大文字小文字を正しく扱う', () => {
      expect(detectKey('sample_am_loop.wav')).toBeNull()
      expect(detectKey('sample_AM_loop.wav')).toBeNull()
    })
  })
})
