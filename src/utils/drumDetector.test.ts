import { describe, expect, it } from 'vitest'
import { isDrum } from './drumDetector'

describe('isDrum', () => {
  describe('drum/drumsを含む場合はtrueを返す', () => {
    it('drum_loop を含む', () => {
      expect(isDrum('MB_LHD_100_drum_loop.wav')).toBe(true)
    })

    it('drum_full を含む', () => {
      expect(isDrum('DS_VPT_100_drum_full_machine.wav')).toBe(true)
    })

    it('drum_groove を含む', () => {
      expect(isDrum('ZEN_KBB_130_drum_groove.wav')).toBe(true)
    })

    it('drum_kit を含む', () => {
      expect(isDrum('SLS_CSP_90_drum_kit.wav')).toBe(true)
    })

    it('drums を含む（大文字）', () => {
      expect(isDrum('Loop_07_Drums_100_PL.wav')).toBe(true)
    })

    it('drums_mixready を含む', () => {
      expect(isDrum('OLIVER_100_drums_mixready.wav')).toBe(true)
    })
  })

  describe('ドラムパーツキーワードを含む場合はtrueを返す', () => {
    it('kick を含む', () => {
      expect(isDrum('kick_sample.wav')).toBe(true)
    })

    it('snare を含む', () => {
      expect(isDrum('snare_hit.wav')).toBe(true)
    })

    it('hihat を含む', () => {
      expect(isDrum('hihat_closed.wav')).toBe(true)
    })

    it('clap を含む', () => {
      expect(isDrum('clap_layer.wav')).toBe(true)
    })

    it('rim を含む', () => {
      expect(isDrum('rim_shot.wav')).toBe(true)
    })

    it('tom を含む', () => {
      expect(isDrum('tom_low.wav')).toBe(true)
    })

    it('cymbal を含む', () => {
      expect(isDrum('cymbal_crash.wav')).toBe(true)
    })

    it('ride を含む', () => {
      expect(isDrum('ride_loop.wav')).toBe(true)
    })

    it('crash を含む', () => {
      expect(isDrum('crash_hit.wav')).toBe(true)
    })

    it('shaker を含む', () => {
      expect(isDrum('shaker_loop.wav')).toBe(true)
    })

    it('tambourine を含む', () => {
      expect(isDrum('tambourine_hit.wav')).toBe(true)
    })

    it('perc を含む', () => {
      expect(isDrum('perc_latin.wav')).toBe(true)
    })
  })

  describe('ドラム系キーワードがない場合はfalseを返す', () => {
    it('シンセ', () => {
      expect(isDrum('synth_pad.wav')).toBe(false)
    })

    it('ベース', () => {
      expect(isDrum('bass_loop.wav')).toBe(false)
    })

    it('ボーカル', () => {
      expect(isDrum('vocal_chop.wav')).toBe(false)
    })

    it('FX', () => {
      expect(isDrum('fx_riser.wav')).toBe(false)
    })
  })

  describe('大文字小文字を区別しない', () => {
    it('DRUM（大文字）', () => {
      expect(isDrum('DRUM_LOOP.wav')).toBe(true)
    })

    it('Kick（キャメルケース）', () => {
      expect(isDrum('Kick_Sample.wav')).toBe(true)
    })
  })
})
