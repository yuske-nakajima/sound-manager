import * as fs from 'node:fs'
import * as path from 'node:path'
import type { ExportResult, NumberMapping } from '../types/index'
import { createLogger } from '../utils/logger.js'
import {
  extractCategory,
  loadMapping,
  transformFilename,
} from '../utils/mapper.js'
import { loadNumberMapping } from '../utils/numberMapping.js'

interface ExportCommandOptions {
  jsonPath: string
  dryRun: boolean
  overwrite: boolean
  mappingPath: string
  logDir: string
}

/**
 * エクスポートコマンド
 * 番号管理JSONに従ってファイルを変換・コピーする
 */
export async function exportCommand(
  toDir: string,
  options: ExportCommandOptions,
): Promise<ExportResult> {
  const result: ExportResult = {
    copiedFiles: [],
    skippedFiles: [],
    errors: [],
  }

  const logger = createLogger(options.logDir)

  // 番号管理JSONを読み込み
  let numberMapping: NumberMapping
  try {
    numberMapping = loadNumberMapping(options.jsonPath)
  } catch {
    const errorMsg = `Failed to load number mapping: ${options.jsonPath}`
    result.errors.push(errorMsg)
    logger.error('export', errorMsg)
    return result
  }

  // マッピングが空の場合
  if (Object.keys(numberMapping.mappings).length === 0) {
    const errorMsg = 'Number mapping is empty'
    result.errors.push(errorMsg)
    logger.error('export', errorMsg)
    return result
  }

  // 出力先ディレクトリを作成
  if (!options.dryRun && !fs.existsSync(toDir)) {
    fs.mkdirSync(toDir, { recursive: true })
  }

  // カテゴリマッピングを読み込み
  let categoryMapping: Map<string, string>
  try {
    categoryMapping = loadMapping(options.mappingPath)
  } catch {
    const errorMsg = `Failed to load category mapping: ${options.mappingPath}`
    result.errors.push(errorMsg)
    logger.error('export', errorMsg)
    return result
  }

  // 番号管理JSONの各エントリを処理
  for (const [numberKey, entry] of Object.entries(numberMapping.mappings)) {
    const { originalName, directory } = entry

    // 採番後のファイル名を構築
    const ext = path.extname(originalName)
    const baseName = path.basename(originalName, ext)
    const numberedFileName = `${baseName}__${numberKey}${ext}`
    const srcPath = path.join(directory, numberedFileName)

    // ソースファイルの存在確認
    if (!fs.existsSync(srcPath)) {
      result.skippedFiles.push({ file: srcPath, reason: 'file not found' })
      logger.debug('export', `Skipped (file not found): ${srcPath}`)
      continue
    }

    // ファイル名を変換
    const newName = transformFilename(numberedFileName, categoryMapping)
    if (!newName) {
      result.skippedFiles.push({ file: srcPath, reason: 'no mapping found' })
      logger.debug('export', `Skipped (no mapping): ${srcPath}`)
      continue
    }

    // カテゴリを抽出してサブディレクトリパスを構築
    const category = extractCategory(newName)
    if (!category) {
      result.skippedFiles.push({ file: srcPath, reason: 'no category found' })
      logger.debug('export', `Skipped (no category): ${srcPath}`)
      continue
    }

    const categoryDir = path.join(toDir, category)
    const destPath = path.join(categoryDir, newName)
    const relativePath = path.join(category, newName)

    // 既存ファイルのチェック
    if (!options.overwrite && fs.existsSync(destPath)) {
      result.skippedFiles.push({ file: srcPath, reason: 'already exists' })
      logger.debug(
        'export',
        `Skipped (already exists): ${srcPath} -> ${relativePath}`,
      )
      continue
    }

    if (!options.dryRun) {
      // カテゴリディレクトリを作成
      if (!fs.existsSync(categoryDir)) {
        fs.mkdirSync(categoryDir, { recursive: true })
      }
      // ファイルをコピー
      fs.copyFileSync(srcPath, destPath)
    }

    result.copiedFiles.push({ from: srcPath, to: relativePath })
    logger.info(
      'export',
      `${options.dryRun ? '[DRY-RUN] ' : ''}Copied: ${srcPath} -> ${relativePath}`,
    )
  }

  return result
}
