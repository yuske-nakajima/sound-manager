import * as fs from 'node:fs'
import * as path from 'node:path'
import type { NumberResult } from '../types/index.js'
import {
  addNumberSuffix,
  extractMaxNumber,
  getAudioFiles,
  hasNumberSuffix,
} from '../utils/fileUtils.js'
import { createLogger } from '../utils/logger.js'

interface NumberOptions {
  dryRun: boolean
  logDir: string
}

/**
 * 採番コマンド
 * 指定ディレクトリ内の音声ファイルに連番を付与する
 */
export async function numberCommand(
  dirPath: string,
  options: NumberOptions,
): Promise<NumberResult> {
  const result: NumberResult = {
    renamedFiles: [],
    skippedFiles: [],
    errors: [],
  }

  const logger = createLogger(options.logDir)

  // ディレクトリの存在確認
  if (!fs.existsSync(dirPath)) {
    const errorMsg = `Directory not found: ${dirPath}`
    result.errors.push(errorMsg)
    logger.error('number', errorMsg)
    return result
  }

  // 音声ファイル一覧を取得
  const files = getAudioFiles(dirPath)

  // 既存の最大番号を取得
  let currentNumber = extractMaxNumber(files)

  // ファイルをソートして処理（順序を安定させるため）
  const sortedFiles = [...files].sort()

  for (const file of sortedFiles) {
    // 既に採番済みならスキップ
    if (hasNumberSuffix(file)) {
      result.skippedFiles.push(file)
      logger.debug('number', `Skipped (already numbered): ${file}`)
      continue
    }

    // 次の番号を割り当て
    currentNumber++
    const newName = addNumberSuffix(file, currentNumber)

    if (!options.dryRun) {
      // 実際にリネーム
      const oldPath = path.join(dirPath, file)
      const newPath = path.join(dirPath, newName)
      fs.renameSync(oldPath, newPath)
    }

    result.renamedFiles.push({ from: file, to: newName })
    logger.info(
      'number',
      `${options.dryRun ? '[DRY-RUN] ' : ''}Renamed: ${file} -> ${newName}`,
    )
  }

  return result
}
