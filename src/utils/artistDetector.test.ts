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
      const result = parseArtistFilename('artist_shiina-ringo_kohukuron_133.wav')
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
  })
})

describe('transformArtistFilename', () => {
  describe('正常系', () => {
    it('基本形式を変換する', () => {
      const result = transformArtistFilename('artist_shiina-ringo_kohukuron_133.wav')
      expect(result).toBe('artist/shiina-ringo/kohukuron_133.wav')
    })

    it('大文字を含む形式を変換する', () => {
      const result = transformArtistFilename('ARTIST_Band-Name_Song-Title_120.wav')
      expect(result).toBe('artist/Band-Name/Song-Title_120.wav')
    })

    it('MP3 ファイルを変換する', () => {
      const result = transformArtistFilename('artist_test_track_90.mp3')
      expect(result).toBe('artist/test/track_90.mp3')
    })
  })

  describe('異常系', () => {
    it('artist_ で始まらない場合は null', () => {
      expect(transformArtistFilename('hihat_sample.wav')).toBeNull()
    })

    it('不正な形式は null', () => {
      expect(transformArtistFilename('artist_invalid.wav')).toBeNull()
    })
  })
})
