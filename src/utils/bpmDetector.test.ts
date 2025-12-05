import { describe, expect, it } from 'vitest'
import { detectBpm } from './bpmDetector'

describe('detectBpm', () => {
  describe('BPMを正しく抽出する', () => {
    it('_100_ 形式のBPMを抽出', () => {
      expect(detectBpm('DS_VPT_100_drum_full_machine.wav')).toBe(100)
    })

    it('_130_ 形式のBPMを抽出', () => {
      expect(detectBpm('91V_PUKG_130_drum_top_loop.wav')).toBe(130)
    })

    it('_90_ 形式のBPMを抽出', () => {
      expect(detectBpm('SLS_CSP_90_drum_kit.wav')).toBe(90)
    })

    it('_135_ 形式のBPMを抽出', () => {
      expect(detectBpm('KMB_drum_loop_mosh_135.wav')).toBe(135)
    })

    it('ファイル名末尾のBPMを抽出', () => {
      expect(detectBpm('some_loop_120.wav')).toBe(120)
    })
  })

  describe('60未満のBPMはnullを返す', () => {
    it('BPM 59 はnullを返す', () => {
      expect(detectBpm('sample_59_beat.wav')).toBeNull()
    })

    it('BPM 50 はnullを返す', () => {
      expect(detectBpm('oneshot_50_kick.wav')).toBeNull()
    })
  })

  describe('60以上のBPMは返す', () => {
    it('BPM 60 は返す', () => {
      expect(detectBpm('loop_60_slow.wav')).toBe(60)
    })

    it('BPM 200 は返す', () => {
      expect(detectBpm('fast_200_dnb.wav')).toBe(200)
    })
  })

  describe('BPMがない場合はnullを返す', () => {
    it('数字がないファイル名', () => {
      expect(detectBpm('kick_sample.wav')).toBeNull()
    })

    it('BPMらしくない数字（4桁以上）', () => {
      expect(detectBpm('sample_1234_test.wav')).toBeNull()
    })

    it('BPMらしくない数字（1桁）', () => {
      expect(detectBpm('sample_5_test.wav')).toBeNull()
    })
  })

  describe('番号サフィックスと区別する', () => {
    it('__0001 形式の番号はBPMとして扱わない', () => {
      expect(detectBpm('kick__0001.wav')).toBeNull()
    })

    it('BPMと番号サフィックスが両方ある場合、BPMを抽出', () => {
      expect(detectBpm('loop_100_drum__0001.wav')).toBe(100)
    })
  })
})
