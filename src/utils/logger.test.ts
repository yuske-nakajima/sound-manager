import * as fs from 'node:fs'
import * as path from 'node:path'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { createLogger } from './logger'

const TEST_LOG_DIR = path.join(process.cwd(), '.tmp', 'test-logs')

describe('logger', () => {
  beforeEach(() => {
    fs.mkdirSync(TEST_LOG_DIR, { recursive: true })
    vi.useFakeTimers()
    vi.setSystemTime(new Date('2024-01-15T10:30:45.000Z'))
  })

  afterEach(() => {
    vi.useRealTimers()
    fs.rmSync(TEST_LOG_DIR, { recursive: true, force: true })
  })

  describe('createLogger', () => {
    it('logs/ ディレクトリが自動作成される', () => {
      const logDir = path.join(TEST_LOG_DIR, 'logs')
      const logger = createLogger(logDir)

      logger.info('test', 'test message')

      expect(fs.existsSync(logDir)).toBe(true)
    })

    it('日付ベースのファイル名でログが作成される', () => {
      const logDir = path.join(TEST_LOG_DIR, 'logs')
      const logger = createLogger(logDir)

      logger.info('test', 'test message')

      const expectedFilename = '2024-01-15.log'
      const logFile = path.join(logDir, expectedFilename)
      expect(fs.existsSync(logFile)).toBe(true)
    })

    it('ログフォーマットが正しい', () => {
      const logDir = path.join(TEST_LOG_DIR, 'logs')
      const logger = createLogger(logDir)

      logger.info('number', 'Renamed file test.wav to test__0001.wav')

      const logFile = path.join(logDir, '2024-01-15.log')
      const content = fs.readFileSync(logFile, 'utf-8')

      expect(content).toContain('[2024-01-15T10:30:45.000Z]')
      expect(content).toContain('[INFO]')
      expect(content).toContain('[number]')
      expect(content).toContain('Renamed file test.wav to test__0001.wav')
    })

    it('異なるログレベルが正しく記録される', () => {
      const logDir = path.join(TEST_LOG_DIR, 'logs')
      const logger = createLogger(logDir)

      logger.info('cmd', 'info message')
      logger.warn('cmd', 'warn message')
      logger.error('cmd', 'error message')
      logger.debug('cmd', 'debug message')

      const logFile = path.join(logDir, '2024-01-15.log')
      const content = fs.readFileSync(logFile, 'utf-8')

      expect(content).toContain('[INFO]')
      expect(content).toContain('[WARN]')
      expect(content).toContain('[ERROR]')
      expect(content).toContain('[DEBUG]')
    })

    it('複数のログが追記される', () => {
      const logDir = path.join(TEST_LOG_DIR, 'logs')
      const logger = createLogger(logDir)

      logger.info('test', 'first message')
      logger.info('test', 'second message')

      const logFile = path.join(logDir, '2024-01-15.log')
      const content = fs.readFileSync(logFile, 'utf-8')
      const lines = content.trim().split('\n')

      expect(lines).toHaveLength(2)
    })
  })
})
