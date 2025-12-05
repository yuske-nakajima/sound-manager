// サポートする音声ファイルの拡張子
export const SUPPORTED_EXTENSIONS = ['.wav', '.mp3'] as const
export type SupportedExtension = (typeof SUPPORTED_EXTENSIONS)[number]

// 採番コマンドの結果
export interface NumberResult {
  renamedFiles: Array<{
    from: string
    to: string
  }>
  skippedFiles: string[]
  errors: string[]
}

// エクスポートコマンドのオプション
export interface ExportOptions {
  dryRun: boolean
  overwrite: boolean
  mappingPath: string
  keysPath?: string
}

// エクスポートコマンドの結果
export interface ExportResult {
  copiedFiles: Array<{
    from: string
    to: string
  }>
  skippedFiles: Array<{
    file: string
    reason: string
  }>
  errors: string[]
}

// ログレベル
export type LogLevel = 'info' | 'warn' | 'error' | 'debug'

// ロガーインターフェース
export interface Logger {
  log: (level: LogLevel, command: string, message: string) => void
  info: (command: string, message: string) => void
  warn: (command: string, message: string) => void
  error: (command: string, message: string) => void
  debug: (command: string, message: string) => void
}
