// vite's library build emits JS and CSS; the hand-written declaration file is
// the package's public contract and is copied across unchanged.
import { copyFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
copyFileSync(`${root}src/index.d.ts`, `${root}dist/index.d.ts`)
console.log('copied index.d.ts')
