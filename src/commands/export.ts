import * as fs from 'node:fs'
import * as path from 'node:path'
import type { ExportResult } from '../types/index'
import { getAudioFiles, hasNumberSuffix } from '../utils/fileUtils.js'
import { createLogger } from '../utils/logger.js'
import { loadMapping, transformFilename } from '../utils/mapper.js'

interface ExportCommandOptions {
  dryRun: boolean
  overwrite: boolean
  mappingPath: string
  logDir: string
}

/**
 * エクスポートコマンド
 * マッピングに従ってファイルを変換・コピーする
 */
export async function exportCommand(
  fromDir: string,
  toDir: string,
  options: ExportCommandOptions,
): Promise<ExportResult> {
  const result: ExportResult = {
    copiedFiles: [],
    skippedFiles: [],
    errors: [],
  }

  const logger = createLogger(options.logDir)

  // ディレクトリの存在確認
  if (!fs.existsSync(fromDir)) {
    const errorMsg = `Source directory not found: ${fromDir}`
    result.errors.push(errorMsg)
    logger.error('export', errorMsg)
    return result
  }

  // 出力先ディレクトリを作成
  if (!options.dryRun && !fs.existsSync(toDir)) {
    fs.mkdirSync(toDir, { recursive: true })
  }

  // マッピングを読み込み
  let mapping: Map<string, string>
  try {
    mapping = loadMapping(options.mappingPath)
  } catch {
    const errorMsg = `Failed to load mapping: ${options.mappingPath}`
    result.errors.push(errorMsg)
    logger.error('export', errorMsg)
    return result
  }

  // 音声ファイル一覧を取得
  const files = getAudioFiles(fromDir)

  for (const file of files) {
    // 未採番ファイルはスキップ
    if (!hasNumberSuffix(file)) {
      result.skippedFiles.push({ file, reason: 'not numbered' })
      logger.debug('export', `Skipped (not numbered): ${file}`)
      continue
    }

    // ファイル名を変換
    const newName = transformFilename(file, mapping)
    if (!newName) {
      result.skippedFiles.push({ file, reason: 'no mapping found' })
      logger.debug('export', `Skipped (no mapping): ${file}`)
      continue
    }

    const destPath = path.join(toDir, newName)

    // 既存ファイルのチェック
    if (!options.overwrite && fs.existsSync(destPath)) {
      result.skippedFiles.push({ file, reason: 'already exists' })
      logger.debug('export', `Skipped (already exists): ${file} -> ${newName}`)
      continue
    }

    if (!options.dryRun) {
      // ファイルをコピー
      const srcPath = path.join(fromDir, file)
      fs.copyFileSync(srcPath, destPath)
    }

    result.copiedFiles.push({ from: file, to: newName })
    logger.info(
      'export',
      `${options.dryRun ? '[DRY-RUN] ' : ''}Copied: ${file} -> ${newName}`,
    )
  }

  return result
}
