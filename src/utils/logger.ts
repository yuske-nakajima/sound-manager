import * as fs from 'node:fs'
import * as path from 'node:path'
import type { Logger, LogLevel } from '../types/index'

/**
 * ロガーを作成
 * @param logDir ログディレクトリのパス
 * @returns Logger インスタンス
 */
export function createLogger(logDir: string): Logger {
  // ログディレクトリを作成
  if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true })
  }

  const log = (level: LogLevel, command: string, message: string): void => {
    const now = new Date()
    const dateStr = now.toISOString().split('T')[0]
    const timestamp = now.toISOString()
    const levelUpper = level.toUpperCase()

    const logLine = `[${timestamp}] [${levelUpper}] [${command}] ${message}\n`

    const logFile = path.join(logDir, `${dateStr}.log`)
    fs.appendFileSync(logFile, logLine, 'utf-8')
  }

  return {
    log,
    info: (command: string, message: string) => log('info', command, message),
    warn: (command: string, message: string) => log('warn', command, message),
    error: (command: string, message: string) => log('error', command, message),
    debug: (command: string, message: string) => log('debug', command, message),
  }
}
