#!/usr/bin/env node
import * as path from 'node:path'
import { Command } from 'commander'
import { exportCommand } from './commands/export.js'
import { numberCommand } from './commands/number.js'
import { formatExportResult } from './utils/exportResultOutput.js'
import { formatNumberResult } from './utils/numberResultOutput.js'

const program = new Command()

const DEFAULT_LOG_DIR = path.join(process.cwd(), 'logs')
const DEFAULT_MAPPING_PATH = path.join(process.cwd(), 'config', 'mapping.yaml')

program
  .name('sound-manager')
  .description('SP-404 MK2 にインポートする音源を管理するCLIツール')
  .version('1.0.0')

// number コマンド
program
  .command('number')
  .description('音声ファイルに連番を付与する')
  .argument('<dir>', '対象ディレクトリ')
  .requiredOption('--json <path>', '番号管理JSONファイルのパス')
  .option('-d, --dry-run', 'ファイルを変更せずに結果をプレビュー', false)
  .option('--log-dir <path>', 'ログディレクトリ', DEFAULT_LOG_DIR)
  .action(
    async (
      dir: string,
      options: { json: string; dryRun: boolean; logDir: string },
    ) => {
      const absoluteDir = path.resolve(dir)
      const absoluteJsonPath = path.resolve(options.json)

      const result = await numberCommand(absoluteDir, {
        jsonPath: absoluteJsonPath,
        dryRun: options.dryRun,
        logDir: options.logDir,
      })

      if (result.errors.length > 0) {
        console.log('\n❌ エラー:')
        for (const error of result.errors) {
          console.log(`  - ${error}`)
        }
        process.exit(1)
      }

      for (const line of formatNumberResult(result, {
        dryRun: options.dryRun,
        jsonPath: absoluteJsonPath,
        logDir: options.logDir,
      })) {
        console.log(line)
      }
    },
  )

// export コマンド
program
  .command('export')
  .description('番号管理JSONに従ってファイルをエクスポートする')
  .argument('<to>', '出力先ディレクトリ')
  .requiredOption('--json <path>', '番号管理JSONファイルのパス')
  .option('-d, --dry-run', 'ファイルをコピーせずに結果をプレビュー', false)
  .option('-o, --overwrite', '既存ファイルを上書き', false)
  .option(
    '-m, --mapping <path>',
    'マッピングファイルのパス',
    DEFAULT_MAPPING_PATH,
  )
  .option('--log-dir <path>', 'ログディレクトリ', DEFAULT_LOG_DIR)
  .action(
    async (
      to: string,
      options: {
        json: string
        dryRun: boolean
        overwrite: boolean
        mapping: string
        logDir: string
      },
    ) => {
      const absoluteJsonPath = path.resolve(options.json)
      const absoluteTo = path.resolve(to)

      const result = await exportCommand(absoluteTo, {
        jsonPath: absoluteJsonPath,
        dryRun: options.dryRun,
        overwrite: options.overwrite,
        mappingPath: options.mapping,
        logDir: options.logDir,
      })

      if (result.errors.length > 0) {
        console.log('\n❌ エラー:')
        for (const error of result.errors) {
          console.log(`  - ${error}`)
        }
        process.exit(1)
      }

      for (const line of formatExportResult(result, {
        dryRun: options.dryRun,
        jsonPath: absoluteJsonPath,
        outputDir: absoluteTo,
        logDir: options.logDir,
      })) {
        console.log(line)
      }
    },
  )

program.parse()
