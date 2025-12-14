import { describe, expect, it } from 'vitest'
import { isLoop } from './loopDetector'

describe('isLoop', () => {
  describe('loopを含む場合はtrueを返す', () => {
    it('drum_loop を含む', () => {
      expect(isLoop('MB_LHD_100_drum_loop.wav')).toBe(true)
    })

    it('loop_ を含む', () => {
      expect(isLoop('loop_07_drums.wav')).toBe(true)
    })

    it('_loop. を含む', () => {
      expect(isLoop('synth_loop.wav')).toBe(true)
    })

    it('大文字Loop を含む', () => {
      expect(isLoop('Loop_07_Drums_100_PL.wav')).toBe(true)
    })
  })

  describe('BPM >= 60 の場合はtrueを返す', () => {
    it('BPM 100 でloopなし', () => {
      expect(isLoop('DS_VPT_100_drum_full_machine.wav')).toBe(true)
    })

    it('BPM 130 でloopなし', () => {
      expect(isLoop('ZEN_KBB_130_drum_groove.wav')).toBe(true)
    })

    it('BPM 90 でloopなし', () => {
      expect(isLoop('SLS_CSP_90_drum_kit.wav')).toBe(true)
    })

    it('BPM 60（境界値）', () => {
      expect(isLoop('sample_60_beat.wav')).toBe(true)
    })
  })

  describe('loopもBPM >= 60もない場合はfalseを返す', () => {
    it('ワンショットキック', () => {
      expect(isLoop('kick_sample.wav')).toBe(false)
    })

    it('BPM 50（60未満）', () => {
      expect(isLoop('oneshot_50_kick.wav')).toBe(false)
    })

    it('数字なし、loopなし', () => {
      expect(isLoop('snare_hit.wav')).toBe(false)
    })
  })

  describe('番号サフィックスがあっても正しく判定', () => {
    it('loopあり + 番号サフィックス', () => {
      expect(isLoop('drum_loop__0001.wav')).toBe(true)
    })

    it('BPMあり + 番号サフィックス', () => {
      expect(isLoop('drum_100_full__0002.wav')).toBe(true)
    })

    it('loopもBPMもなし + 番号サフィックス', () => {
      expect(isLoop('kick__0001.wav')).toBe(false)
    })
  })
})
