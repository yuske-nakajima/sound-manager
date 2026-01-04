#!/usr/bin/env node
import * as path from 'node:path'
import { Command } from 'commander'
import { exportCommand } from './commands/export.js'
import { numberCommand } from './commands/number.js'

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
      console.log(`\n📁 対象ディレクトリ: ${absoluteDir}`)
      console.log(`📄 番号管理JSON: ${absoluteJsonPath}`)
      if (options.dryRun) {
        console.log('🔍 DRY-RUN モード（ファイルは変更されません）\n')
      }

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

      if (result.registeredFiles.length > 0) {
        console.log('\n✅ 登録済み:')
        for (const { file, numberKey } of result.registeredFiles) {
          console.log(`  ${file} → ${numberKey}`)
        }
      }

      if (result.skippedFiles.length > 0) {
        console.log('\n⏭️ スキップ（採番済み）:')
        for (const file of result.skippedFiles) {
          console.log(`  ${file}`)
        }
      }

      console.log(
        `\n📊 結果: ${result.registeredFiles.length} ファイルを登録, ${result.skippedFiles.length} ファイルをスキップ`,
      )
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
      console.log(`\n📄 番号管理JSON: ${absoluteJsonPath}`)
      console.log(`📁 出力先: ${absoluteTo}`)
      console.log(`📄 マッピング: ${options.mapping}`)
      if (options.dryRun) {
        console.log('🔍 DRY-RUN モード（ファイルはコピーされません）')
      }
      if (options.overwrite) {
        console.log('⚠️ 上書きモード')
      }
      console.log('')

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

      if (result.copiedFiles.length > 0) {
        console.log('✅ コピー済み:')
        for (const { from, to } of result.copiedFiles) {
          console.log(`  ${from} → ${to}`)
        }
      }

      if (result.skippedFiles.length > 0) {
        console.log('\n⏭️ スキップ:')
        for (const { file, reason } of result.skippedFiles) {
          console.log(`  ${file} (${reason})`)
        }
      }

      console.log(
        `\n📊 結果: ${result.copiedFiles.length} ファイルをコピー, ${result.skippedFiles.length} ファイルをスキップ`,
      )
    },
  )

program.parse()
