import * as fs from 'node:fs'
import type { NumberMapping, NumberResult } from '../types/index'
import { getAudioFiles, hasNumberSuffix } from '../utils/fileUtils.js'
import { createLogger } from '../utils/logger.js'
import {
  formatNumber,
  loadNumberMapping,
  saveNumberMapping,
} from '../utils/numberMapping.js'

interface NumberOptions {
  jsonPath: string
  dryRun: boolean
  logDir: string
}

/**
 * ファイルが既にマッピングに登録済みかチェック
 * O(n) で全エントリを走査
 */
function isAlreadyRegistered(
  mapping: NumberMapping,
  fileName: string,
  directory: string,
): boolean {
  for (const entry of Object.values(mapping.mappings)) {
    if (entry.originalName === fileName && entry.directory === directory) {
      return true
    }
  }
  return false
}

/**
 * 採番コマンド
 * 指定ディレクトリ内の音声ファイルに連番を割り当ててJSONに記録する
 * ファイル名は変更せず、元のファイル名を保持する
 */
export async function numberCommand(
  dirPath: string,
  options: NumberOptions,
): Promise<NumberResult> {
  const result: NumberResult = {
    registeredFiles: [],
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

  // 番号マッピングを読み込み（存在しなければ新規作成）
  const mapping = loadNumberMapping(options.jsonPath)
  let currentNumber = mapping.lastNumber

  // 音声ファイル一覧を取得
  const files = getAudioFiles(dirPath)

  // ファイルをソートして処理（順序を安定させるため）
  const sortedFiles = [...files].sort()

  for (const file of sortedFiles) {
    // 既に採番済みならスキップ（ファイル名にサフィックスがある場合）
    if (hasNumberSuffix(file)) {
      result.skippedFiles.push(file)
      logger.debug('number', `Skipped (already numbered): ${file}`)
      continue
    }

    // 既にJSONに登録済みならスキップ（重複防止）
    if (isAlreadyRegistered(mapping, file, dirPath)) {
      result.skippedFiles.push(file)
      logger.debug('number', `Skipped (already registered): ${file}`)
      continue
    }

    // 次の番号を割り当て
    currentNumber++
    const numberKey = formatNumber(currentNumber)

    if (!options.dryRun) {
      // マッピングに追記（ファイル名は変更しない）
      mapping.mappings[numberKey] = {
        originalName: file,
        directory: dirPath,
      }
      mapping.lastNumber = currentNumber
    }

    result.registeredFiles.push({ file, numberKey })
    logger.info(
      'number',
      `${options.dryRun ? '[DRY-RUN] ' : ''}Registered: ${file} -> ${numberKey}`,
    )
  }

  // JSONファイルを保存（dry-run時は保存しない）
  if (!options.dryRun && result.registeredFiles.length > 0) {
    saveNumberMapping(options.jsonPath, mapping)
    logger.info('number', `Saved mapping to: ${options.jsonPath}`)
  }

  return result
}
