import { describe, expect, it } from 'vitest'
import { getSupportedExtension, hasPrefix, isNameField } from './filenameFields.js'

describe('isNameField', () => {
  describe('正常系', () => {
    it('英字のみは true', () => {
      expect(isNameField('guitar')).toBe(true)
    })

    it('数字のみは true', () => {
      expect(isNameField('123')).toBe(true)
    })

    it('英数字混在は true', () => {
      expect(isNameField('guitar123')).toBe(true)
    })

    it('ハイフンを含む場合は true', () => {
      expect(isNameField('band-name')).toBe(true)
    })

    it('先頭がハイフンでも true', () => {
      expect(isNameField('-name')).toBe(true)
    })

    it('末尾がハイフンでも true', () => {
      expect(isNameField('name-')).toBe(true)
    })
  })

  describe('異常系', () => {
    it('空文字は false', () => {
      expect(isNameField('')).toBe(false)
    })

    it('アンダースコアを含む場合は false', () => {
      expect(isNameField('band_name')).toBe(false)
    })

    it('ドットを含む場合は false', () => {
      expect(isNameField('band.name')).toBe(false)
    })

    it('スペースを含む場合は false', () => {
      expect(isNameField('band name')).toBe(false)
    })

    it('# を含む場合は false', () => {
      expect(isNameField('band#name')).toBe(false)
    })

    it('ハイフン1個のみは false（英数字を含まない）', () => {
      expect(isNameField('-')).toBe(false)
    })

    it('ハイフン2個のみは false（英数字を含まない）', () => {
      expect(isNameField('--')).toBe(false)
    })
  })
})

describe('hasPrefix', () => {
  describe('正常系', () => {
    it('プレフィックスと一致する場合は true', () => {
      expect(hasPrefix('tone_guitar_C3.wav', 'tone_')).toBe(true)
    })

    it('大文字小文字を区別せず一致する場合は true', () => {
      expect(hasPrefix('TONE_guitar_C3.wav', 'tone_')).toBe(true)
    })
  })

  describe('異常系', () => {
    it('プレフィックスと一致しない場合は false', () => {
      expect(hasPrefix('hihat_sample.wav', 'tone_')).toBe(false)
    })

    it('途中にプレフィックスを含む場合は false', () => {
      expect(hasPrefix('my_tone_file.wav', 'tone_')).toBe(false)
    })

    it('空文字は false', () => {
      expect(hasPrefix('', 'tone_')).toBe(false)
    })
  })
})

describe('getSupportedExtension', () => {
  describe('正常系', () => {
    it('.wav は拡張子を返す', () => {
      expect(getSupportedExtension('tone_guitar_C3.wav')).toBe('.wav')
    })

    it('.WAV は拡張子を返す（大文字小文字を区別しない）', () => {
      expect(getSupportedExtension('tone_guitar_C3.WAV')).toBe('.WAV')
    })

    it('.mp3 は拡張子を返す', () => {
      expect(getSupportedExtension('tone_guitar_C3.mp3')).toBe('.mp3')
    })

    it('.MP3 は拡張子を返す（大文字小文字を区別しない）', () => {
      expect(getSupportedExtension('tone_guitar_C3.MP3')).toBe('.MP3')
    })
  })

  describe('異常系', () => {
    it('非対応拡張子は null', () => {
      expect(getSupportedExtension('tone_guitar_C3.txt')).toBeNull()
    })

    it('拡張子なしは null', () => {
      expect(getSupportedExtension('tone_guitar_C3')).toBeNull()
    })
  })
})
