import { describe, expect, it } from 'vitest'
import {
  isOrigin,
  parseOriginFilename,
  transformOriginFilename,
} from './originDetector.js'

describe('isOrigin', () => {
  describe('正常系', () => {
    it('ORIGIN_ で始まるファイルを検出する', () => {
      expect(isOrigin('ORIGIN_my-song_pattern-a.wav')).toBe(true)
    })

    it('サブディレクトリを含むパスでもベース名で判定する', () => {
      expect(isOrigin('sub/ORIGIN_my-song_pattern-a.wav')).toBe(true)
    })
  })

  describe('異常系', () => {
    it('ORIGIN_ で始まらないファイルは false', () => {
      expect(isOrigin('hihat_sample.wav')).toBe(false)
    })

    it('途中に ORIGIN_ が含まれるファイルは false', () => {
      expect(isOrigin('my_ORIGIN_file.wav')).toBe(false)
    })

    it('小文字の origin_ は大文字完全一致ではないため false（既存の一般ファイルの挙動を変えないための仕様）', () => {
      expect(isOrigin('origin_my-song_pattern-a.wav')).toBe(false)
    })

    it('混合ケース Origin_ も大文字完全一致ではないため false', () => {
      expect(isOrigin('Origin_my-song_pattern-a.wav')).toBe(false)
    })

    it('original_break_120.wav は false（末尾アンダースコアによる誤検出防止の要）', () => {
      expect(isOrigin('original_break_120.wav')).toBe(false)
    })

    it('originals.wav は false（末尾アンダースコアによる誤検出防止の要）', () => {
      expect(isOrigin('originals.wav')).toBe(false)
    })

    it('空文字は false', () => {
      expect(isOrigin('')).toBe(false)
    })
  })
})

describe('parseOriginFilename', () => {
  describe('正常系', () => {
    it('基本形式を解析する', () => {
      const result = parseOriginFilename('ORIGIN_my-song_pattern-a.wav')
      expect(result).toEqual({
        songName: 'my-song',
        patternName: 'pattern-a',
      })
    })

    it('大文字を含む形式を解析する', () => {
      const result = parseOriginFilename('ORIGIN_My-Song_Pattern-A.wav')
      expect(result).toEqual({
        songName: 'My-Song',
        patternName: 'Pattern-A',
      })
    })

    it('MP3 ファイルを解析する', () => {
      const result = parseOriginFilename('ORIGIN_my-song_pattern-a.mp3')
      expect(result).toEqual({
        songName: 'my-song',
        patternName: 'pattern-a',
      })
    })

    it('.WAV / .MP3 大文字拡張子を解析する', () => {
      expect(parseOriginFilename('ORIGIN_my-song_pattern-a.WAV')).toEqual({
        songName: 'my-song',
        patternName: 'pattern-a',
      })
      expect(parseOriginFilename('ORIGIN_my-song_pattern-a.MP3')).toEqual({
        songName: 'my-song',
        patternName: 'pattern-a',
      })
    })
  })

  describe('異常系', () => {
    it('フィールド数が不足している場合は null（2 フィールド）', () => {
      expect(parseOriginFilename('ORIGIN_song.wav')).toBeNull()
    })

    it('フィールド数が過多の場合は null（4 フィールド、中間パーツを黙って捨てない）', () => {
      expect(parseOriginFilename('ORIGIN_my_song_pattern.wav')).toBeNull()
    })

    it('曲名が空文字の場合は null', () => {
      expect(parseOriginFilename('ORIGIN__pattern.wav')).toBeNull()
    })

    it('パターン名が空文字の場合は null', () => {
      expect(parseOriginFilename('ORIGIN_song_.wav')).toBeNull()
    })

    it('記号を含む場合は null', () => {
      expect(parseOriginFilename('ORIGIN_my#song_pattern.wav')).toBeNull()
    })

    it('ハイフンのみの場合は null', () => {
      expect(parseOriginFilename('ORIGIN_-_pattern.wav')).toBeNull()
    })

    it('アンダースコアのみの場合は null', () => {
      expect(parseOriginFilename('ORIGIN_.wav')).toBeNull()
    })

    it('非対応拡張子（.txt）の場合は null', () => {
      expect(parseOriginFilename('ORIGIN_a_b.txt')).toBeNull()
    })

    it('拡張子なしの場合は null', () => {
      expect(parseOriginFilename('ORIGIN_a_b')).toBeNull()
    })

    it('空文字は null', () => {
      expect(parseOriginFilename('')).toBeNull()
    })

    it('採番サフィックス付きは変換対象外（既存 artist_ と同一挙動）', () => {
      expect(
        parseOriginFilename('ORIGIN_my-song_pattern-a__0001.wav'),
      ).toBeNull()
    })
  })
})

describe('transformOriginFilename', () => {
  describe('正常系', () => {
    it('基本形式を変換する', () => {
      const result = transformOriginFilename('ORIGIN_my-song_pattern-a.wav')
      expect(result).toBe('ORIGIN/my-song/pattern-a.wav')
    })

    it('曲名・パターン名・拡張子の大文字小文字を保持する', () => {
      const result = transformOriginFilename('ORIGIN_My-Song_Pattern-A.WAV')
      expect(result).toBe('ORIGIN/My-Song/Pattern-A.WAV')
    })

    it('.mp3 / .MP3 拡張子を保持する', () => {
      expect(transformOriginFilename('ORIGIN_my-song_pattern-a.mp3')).toBe(
        'ORIGIN/my-song/pattern-a.mp3',
      )
      expect(transformOriginFilename('ORIGIN_my-song_pattern-a.MP3')).toBe(
        'ORIGIN/my-song/pattern-a.MP3',
      )
    })

    it('パス付き入力を渡しても入力側ディレクトリを引きずらない', () => {
      const result = transformOriginFilename(
        'sub/dir/ORIGIN_my-song_pattern-a.wav',
      )
      expect(result).toBe('ORIGIN/my-song/pattern-a.wav')
    })

    it('出力名に番号サフィックスが付かない', () => {
      const result = transformOriginFilename('ORIGIN_my-song_pattern-a.wav')
      expect(result).not.toMatch(/__\d{4}/)
    })

    it('曲名・パターン名が先頭ハイフンでも isNameField を通るため変換される（現状の既知の挙動）', () => {
      const result = transformOriginFilename('ORIGIN_-a_b.wav')
      expect(result).toBe('ORIGIN/-a/b.wav')
    })
  })

  describe('異常系', () => {
    it('ORIGIN_ で始まらない場合は null', () => {
      expect(transformOriginFilename('hihat_sample.wav')).toBeNull()
    })

    it('小文字の origin_ は大文字完全一致ではないため null（既存の一般ファイルの挙動を変えないための仕様）', () => {
      expect(transformOriginFilename('origin_my-song_pattern-a.wav')).toBeNull()
    })

    it('不正な形式は null', () => {
      expect(transformOriginFilename('ORIGIN_invalid.wav')).toBeNull()
    })

    it('非対応拡張子（.txt）の場合は null', () => {
      expect(transformOriginFilename('ORIGIN_a_b.txt')).toBeNull()
    })

    it('拡張子なしの場合は null', () => {
      expect(transformOriginFilename('ORIGIN_a_b')).toBeNull()
    })

    it('採番サフィックス付きは null', () => {
      expect(
        transformOriginFilename('ORIGIN_my-song_pattern-a__0001.wav'),
      ).toBeNull()
    })

    it('二重拡張子は拡張子直前の部分がフィールドとして扱われ isNameField（"." を含む）を通らないため null', () => {
      expect(
        transformOriginFilename('ORIGIN_my-song_pattern-a.tmp.wav'),
      ).toBeNull()
    })
  })
})

describe('parseOriginFilename の境界値', () => {
  it('パス付き入力を解析できる', () => {
    const result = parseOriginFilename('sub/ORIGIN_a_b.wav')
    expect(result).toEqual({ songName: 'a', patternName: 'b' })
  })

  it('二重拡張子は拡張子直前の部分がフィールドとして扱われ isNameField（"." を含む）を通らないため null', () => {
    const result = parseOriginFilename('ORIGIN_my-song_pattern-a.tmp.wav')
    expect(result).toBeNull()
  })

  it('曲名・パターン名が先頭ハイフンでも isNameField を通るため解析される（現状の既知の挙動）', () => {
    const result = parseOriginFilename('ORIGIN_-a_b.wav')
    expect(result).toEqual({ songName: '-a', patternName: 'b' })
  })
})
