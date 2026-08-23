import { describe, expect, it } from 'vitest'
import {
  isTone,
  parseToneFilename,
  transformToneFilename,
} from './toneDetector.js'

describe('isTone', () => {
  describe('正常系', () => {
    it('tone_ で始まるファイルを検出する', () => {
      expect(isTone('tone_guitar_C3.wav')).toBe(true)
    })

    it('大文字の TONE_ でも検出する', () => {
      expect(isTone('TONE_Guitar_C3.wav')).toBe(true)
    })

    it('混合ケース Tone_ でも検出する', () => {
      expect(isTone('Tone_piano_F#4_soft.wav')).toBe(true)
    })

    it('サブディレクトリを含むパスでもベース名で判定する', () => {
      expect(isTone('sub/tone_guitar_C3.wav')).toBe(true)
    })
  })

  describe('異常系', () => {
    it('tone_ を持たないファイルは false', () => {
      expect(isTone('hihat_sample.wav')).toBe(false)
    })

    it('途中に tone_ を含むファイルは false', () => {
      expect(isTone('my_tone_file.wav')).toBe(false)
    })

    it('空文字は false', () => {
      expect(isTone('')).toBe(false)
    })
  })
})

describe('parseToneFilename', () => {
  describe('正常系', () => {
    it('3 フィールド形式（バリエーションなし）を解析する', () => {
      const result = parseToneFilename('tone_guitar_C3.wav')
      expect(result).toEqual({
        instrument: 'guitar',
        key: 'C',
        octave: '3',
        variation: undefined,
      })
    })

    it('4 フィールド形式（バリエーションあり）を解析する', () => {
      const result = parseToneFilename('tone_piano_F#4_soft.wav')
      expect(result).toEqual({
        instrument: 'piano',
        key: 'F#',
        octave: '4',
        variation: 'soft',
      })
    })

    it('大文字プレフィックスを解析する', () => {
      const result = parseToneFilename('TONE_Guitar_C3.wav')
      expect(result).toEqual({
        instrument: 'Guitar',
        key: 'C',
        octave: '3',
        variation: undefined,
      })
    })

    it('フラット付きキーを解析する', () => {
      const result = parseToneFilename('tone_bass_Bb2.wav')
      expect(result).toEqual({
        instrument: 'bass',
        key: 'Bb',
        octave: '2',
        variation: undefined,
      })
    })

    it('楽器名にハイフンを含む形式を解析する', () => {
      const result = parseToneFilename('tone_e-guitar_A3.wav')
      expect(result).toEqual({
        instrument: 'e-guitar',
        key: 'A',
        octave: '3',
        variation: undefined,
      })
    })

    it('mp3 拡張子を解析する', () => {
      const result = parseToneFilename('tone_gtr_C3.mp3')
      expect(result).toEqual({
        instrument: 'gtr',
        key: 'C',
        octave: '3',
        variation: undefined,
      })
    })

    it('.WAV / .MP3 大文字拡張子を解析する', () => {
      expect(parseToneFilename('tone_guitar_C3.WAV')).toEqual({
        instrument: 'guitar',
        key: 'C',
        octave: '3',
        variation: undefined,
      })
      expect(parseToneFilename('tone_guitar_C3.MP3')).toEqual({
        instrument: 'guitar',
        key: 'C',
        octave: '3',
        variation: undefined,
      })
    })

    it('オクターブ境界（下限 0）を解析する', () => {
      const result = parseToneFilename('tone_guitar_C0.wav')
      expect(result).toEqual({
        instrument: 'guitar',
        key: 'C',
        octave: '0',
        variation: undefined,
      })
    })

    it('オクターブ境界（上限 9）を解析する', () => {
      const result = parseToneFilename('tone_guitar_C9.wav')
      expect(result).toEqual({
        instrument: 'guitar',
        key: 'C',
        octave: '9',
        variation: undefined,
      })
    })
  })

  describe('異常系', () => {
    it('オクターブなしの場合は null', () => {
      expect(parseToneFilename('tone_guitar_C.wav')).toBeNull()
    })

    it('オクターブが 2 桁の場合は null', () => {
      expect(parseToneFilename('tone_guitar_C10.wav')).toBeNull()
    })

    it('キーが範囲外の場合は null', () => {
      expect(parseToneFilename('tone_guitar_H3.wav')).toBeNull()
    })

    it('キーが小文字の場合は null', () => {
      expect(parseToneFilename('tone_guitar_c3.wav')).toBeNull()
    })

    it('フィールド数が 2 の場合は null', () => {
      expect(parseToneFilename('tone_guitar.wav')).toBeNull()
    })

    it('フィールド数が 5 の場合は null', () => {
      expect(parseToneFilename('tone_guitar_C3_soft_extra.wav')).toBeNull()
    })

    it('楽器名が空文字の場合は null', () => {
      expect(parseToneFilename('tone__C3.wav')).toBeNull()
    })

    it('楽器名にハイフン以外の記号を含む場合は null', () => {
      expect(parseToneFilename('tone_gu#tar_C3.wav')).toBeNull()
    })

    it('バリエーションが空文字の場合は null', () => {
      expect(parseToneFilename('tone_guitar_C3_.wav')).toBeNull()
    })

    it('バリエーションに不正な文字を含む場合は null', () => {
      expect(parseToneFilename('tone_guitar_C3_so#t.wav')).toBeNull()
    })

    it('tone_ を持たない場合は null', () => {
      expect(parseToneFilename('hihat_sample.wav')).toBeNull()
    })

    it('空文字は null', () => {
      expect(parseToneFilename('')).toBeNull()
    })

    it('フラットの大文字表記 BB2 は null（README の記述どおり）', () => {
      expect(parseToneFilename('tone_bass_BB2.wav')).toBeNull()
    })

    it('非対応拡張子（.txt）の場合は null', () => {
      expect(parseToneFilename('tone_guitar_C3.txt')).toBeNull()
    })

    it('拡張子なしの場合は null', () => {
      expect(parseToneFilename('tone_guitar_C3')).toBeNull()
    })
  })
})

describe('transformToneFilename', () => {
  describe('正常系', () => {
    it('基本形式を変換する', () => {
      expect(transformToneFilename('tone_guitar_C3.wav')).toBe(
        'CM/guitar/C3.wav',
      )
    })

    it('バリエーションありの形式を変換する', () => {
      expect(transformToneFilename('tone_piano_F#4_soft.wav')).toBe(
        'CM/piano/F#4_soft.wav',
      )
    })

    it('フラット付きキーの形式を変換する', () => {
      expect(transformToneFilename('tone_bass_Bb2.wav')).toBe('CM/bass/Bb2.wav')
    })

    it('大文字プレフィックスの形式を変換する', () => {
      expect(transformToneFilename('TONE_Guitar_C3.wav')).toBe(
        'CM/Guitar/C3.wav',
      )
    })

    it('.WAV / .MP3 大文字拡張子を変換する', () => {
      expect(transformToneFilename('tone_guitar_C3.WAV')).toBe(
        'CM/guitar/C3.WAV',
      )
      expect(transformToneFilename('tone_guitar_C3.MP3')).toBe(
        'CM/guitar/C3.MP3',
      )
    })
  })

  describe('異常系', () => {
    it('規則外は null を返す', () => {
      expect(transformToneFilename('tone_guitar_C.wav')).toBeNull()
    })

    it('tone_ を持たない場合は null を返す', () => {
      expect(transformToneFilename('hihat_sample.wav')).toBeNull()
    })

    it('フラットの大文字表記 BB2 は null（README の記述どおり）', () => {
      expect(transformToneFilename('tone_bass_BB2.wav')).toBeNull()
    })

    it('非対応拡張子（.txt）の場合は null。拡張子なしのファイルは生成されない（回帰）', () => {
      expect(transformToneFilename('tone_guitar_C3.txt')).toBeNull()
    })

    it('拡張子なしの場合は null', () => {
      expect(transformToneFilename('tone_guitar_C3')).toBeNull()
    })

    it('全ハイフンの楽器名は null（`-` ディレクトリが生成されない回帰）', () => {
      expect(transformToneFilename('tone_-_C3.wav')).toBeNull()
    })
  })
})
