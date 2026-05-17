import { cpSync, existsSync, mkdirSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const scriptDir = dirname(fileURLToPath(import.meta.url))
const appRoot = resolve(scriptDir, '..')
const hoistedSource = resolve(appRoot, '../../node_modules/tinymce')
const localSource = resolve(appRoot, 'node_modules/tinymce')
const sourceDir = existsSync(hoistedSource) ? hoistedSource : localSource
const targetDir = resolve(appRoot, 'public/tinymce')

if (!existsSync(sourceDir)) {
  throw new Error(`TinyMCE package not found: ${sourceDir}`)
}

mkdirSync(resolve(appRoot, 'public'), { recursive: true })
cpSync(sourceDir, targetDir, { recursive: true, force: true })