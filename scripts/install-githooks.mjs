#!/usr/bin/env node
import { execSync } from 'node:child_process'
import { chmodSync, existsSync } from 'node:fs'
import { join } from 'node:path'

const root = process.cwd()
const hookPath = join(root, '.githooks', 'pre-commit')

if (!existsSync(hookPath)) {
  console.error('Brak .githooks/pre-commit')
  process.exit(1)
}

try {
  chmodSync(hookPath, 0o755)
} catch {
  // Windows — ignore chmod
}

execSync('git config core.hooksPath .githooks', { cwd: root, stdio: 'inherit' })
console.log('Git hooks installed (core.hooksPath=.githooks)')
