import type { Config } from 'prettier'

const config: Config = {
  objectWrap: 'collapse',
  printWidth: 120,
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'es5',
  overrides: [{ files: '*.md', options: { proseWrap: 'always', printWidth: 80 } }],
}

/* oxlint-disable no-default-export */
export default config
