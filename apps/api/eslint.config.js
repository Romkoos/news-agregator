import baseConfig from '@repo/config/eslint'
import tseslint from 'typescript-eslint'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

export default tseslint.config(
  ...baseConfig,
  {
    languageOptions: {
      parserOptions: {
        project: true,
        tsconfigRootDir: __dirname,
      },
    },
  },
  {
    ignores: ['dist/**', 'node_modules/**'],
  },
)
