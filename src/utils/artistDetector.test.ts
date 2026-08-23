import { describe, expect, it } from 'vitest'
import {
  isArtist,
  parseArtistFilename,
  transformArtistFilename,
} from './artistDetector.js'

describe('isArtist', () => {
  describe('正常系', () => {
    it('artist_ で始まるファイルを検出する', () => {
      expect(isArtist('artist_shiina-ringo_kohukuron_133.wav')).toBe(true)
    })

    it('大文字の ARTIST_ でも検出する', () => {
      expect(isArtist('ARTIST_Band-Name_Song_120.wav')).toBe(true)
    })

    it('混合ケース Artist_ でも検出する', () => {
      expect(isArtist('Artist_Name_Track_100.wav')).toBe(true)
    })

    it('サブディレクトリを含むパスでもベース名で判定する', () => {
      expect(isArtist('sub/artist_shiina-ringo_kohukuron_133.wav')).toBe(true)
    })
  })

  describe('異常系', () => {
    it('artist_ で始まらないファイルは false', () => {
      expect(isArtist('hihat_sample.wav')).toBe(false)
    })

    it('途中に artist_ が含まれるファイルは false', () => {
      expect(isArtist('my_artist_file.wav')).toBe(false)
    })

    it('空文字は false', () => {
      expect(isArtist('')).toBe(false)
    })
  })
})

describe('parseArtistFilename', () => {
  describe('正常系', () => {
    it('基本形式を解析する', () => {
      const result = parseArtistFilename(
        'artist_shiina-ringo_kohukuron_133.wav',
      )
      expect(result).toEqual({
        artistName: 'shiina-ringo',
        trackName: 'kohukuron',
        bpm: 133,
      })
    })

    it('大文字を含む形式を解析する', () => {
      const result = parseArtistFilename('ARTIST_Band-Name_Song-Title_120.wav')
      expect(result).toEqual({
        artistName: 'Band-Name',
        trackName: 'Song-Title',
        bpm: 120,
      })
    })

    it('MP3 ファイルを解析する', () => {
      const result = parseArtistFilename('artist_test_track_90.mp3')
      expect(result).toEqual({
        artistName: 'test',
        trackName: 'track',
        bpm: 90,
      })
    })

    it('.WAV / .MP3 大文字拡張子を解析する', () => {
      expect(parseArtistFilename('artist_a_b_120.WAV')).toEqual({
        artistName: 'a',
        trackName: 'b',
        bpm: 120,
      })
      expect(parseArtistFilename('artist_a_b_120.MP3')).toEqual({
        artistName: 'a',
        trackName: 'b',
        bpm: 120,
      })
    })
  })

  describe('異常系', () => {
    it('artist_ で始まらない場合は null', () => {
      expect(parseArtistFilename('hihat_sample.wav')).toBeNull()
    })

    it('アンダースコアが不足している場合は null', () => {
      expect(parseArtistFilename('artist_name_120.wav')).toBeNull()
    })

    it('BPM が数値でない場合は null', () => {
      expect(parseArtistFilename('artist_name_track_abc.wav')).toBeNull()
    })

    it('空文字は null', () => {
      expect(parseArtistFilename('')).toBeNull()
    })

    it('フィールド数が不足している場合は null（3 フィールド）', () => {
      expect(parseArtistFilename('artist_name_120.wav')).toBeNull()
    })

    it('フィールド数が過多の場合は null（5 フィールド、中間パーツを黙って捨てない）', () => {
      expect(
        parseArtistFilename('artist_band-name_song_title_120.wav'),
      ).toBeNull()
    })

    it('BPM が先頭ゼロの場合は null', () => {
      expect(parseArtistFilename('artist_name_track_0120.wav')).toBeNull()
    })

    it('BPM が 0 のみの場合は null', () => {
      expect(parseArtistFilename('artist_name_track_0.wav')).toBeNull()
    })

    it('BPM に数字以外の文字を含む場合は null', () => {
      expect(parseArtistFilename('artist_name_track_120x.wav')).toBeNull()
    })

    it('アーティスト名が空文字の場合は null', () => {
      expect(parseArtistFilename('artist__track_120.wav')).toBeNull()
    })

    it('曲名が空文字の場合は null', () => {
      expect(parseArtistFilename('artist_name__120.wav')).toBeNull()
    })

    it('アーティスト名にハイフン以外の記号を含む場合は null', () => {
      expect(parseArtistFilename('artist_na#me_track_120.wav')).toBeNull()
    })

    it('非対応拡張子（.txt）の場合は null', () => {
      expect(parseArtistFilename('artist_name_track_120.txt')).toBeNull()
    })

    it('拡張子なしの場合は null', () => {
      expect(parseArtistFilename('artist_name_track_120')).toBeNull()
    })
  })
})

describe('transformArtistFilename', () => {
  describe('正常系', () => {
    it('基本形式を変換する', () => {
      const result = transformArtistFilename(
        'artist_shiina-ringo_kohukuron_133.wav',
      )
      expect(result).toBe('AT/shiina-ringo/kohukuron_133.wav')
    })

    it('大文字を含む形式を変換する', () => {
      const result = transformArtistFilename(
        'ARTIST_Band-Name_Song-Title_120.wav',
      )
      expect(result).toBe('AT/Band-Name/Song-Title_120.wav')
    })

    it('MP3 ファイルを変換する', () => {
      const result = transformArtistFilename('artist_test_track_90.mp3')
      expect(result).toBe('AT/test/track_90.mp3')
    })

    it('.WAV / .MP3 大文字拡張子を変換する', () => {
      expect(transformArtistFilename('artist_a_b_120.WAV')).toBe(
        'AT/a/b_120.WAV',
      )
      expect(transformArtistFilename('artist_a_b_120.MP3')).toBe(
        'AT/a/b_120.MP3',
      )
    })

    it('Number.MAX_SAFE_INTEGER を超える BPM でも入力表記のまま出力する（回帰）', () => {
      const result = transformArtistFilename(
        'artist_a_b_9999999999999999999.wav',
      )
      expect(result).toBe('AT/a/b_9999999999999999999.wav')
    })
  })

  describe('異常系', () => {
    it('artist_ で始まらない場合は null', () => {
      expect(transformArtistFilename('hihat_sample.wav')).toBeNull()
    })

    it('不正な形式は null', () => {
      expect(transformArtistFilename('artist_invalid.wav')).toBeNull()
    })

    it('非対応拡張子（.txt）の場合は null', () => {
      expect(transformArtistFilename('artist_a_b_120.txt')).toBeNull()
    })

    it('拡張子なしの場合は null', () => {
      expect(transformArtistFilename('artist_a_b_120')).toBeNull()
    })
  })
})
