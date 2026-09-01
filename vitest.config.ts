import { configDefaults, defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // .tmp は一時ファイル置き場であり、ソースツリーの複製が置かれると
    // 同名テストが二重実行されてフィクスチャを奪い合うため収集対象から外す
    exclude: [...configDefaults.exclude, '**/.tmp/**'],
  },
})
