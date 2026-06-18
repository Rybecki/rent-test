#!/usr/bin/env node
/**
 * Scans staged git files for likely secrets before commit.
 * Usage: node scripts/check-secrets.mjs [--all]
 */
import { execSync } from 'node:child_process'
import { readFileSync, existsSync } from 'node:fs'
import { relative } from 'node:path'

const BLOCKED_PATHS = [
  /^\.env$/,
  /^\.env\./,
  /^api\/config\.php$/,
]

const ALLOWED_PATHS = [
  /^scripts\/check-secrets\.mjs$/,
  /^\.cursor\/rules\//,
]

const SECRET_PATTERNS = [
  {
    name: 'hardcoded password string',
    re: /password\s*[:=]\s*['"][^'"{}\s][^'"]{2,}['"]/gi,
    skip: (line) =>
      /process\.env|password_hash|type\s*=\s*["']password|autoComplete|Podaj e-mail|Nieprawidłowy|placeholder|changeme|\.\.\./i.test(
        line,
      ),
  },
  {
    name: 'hardcoded SMTP/DB pass',
    re: /(?:SMTP_PASS|DB_PASSWORD|MIGRATE_USERS)\s*=\s*\S+/gi,
    skip: (line) => /=\s*$|=\s*#|=\s*""|=\s*''|process\.env/i.test(line),
  },
  {
    name: 'PHP smtp_pass with value',
    re: /['"]smtp_pass['"]\s*=>\s*['"][^'"]{3,}['"]/gi,
    skip: () => false,
  },
  {
    name: 'auth pass in object literal',
    re: /auth\s*:\s*\{[^}]*\bpass\s*:\s*['"][^'"]{3,}['"]/gi,
    skip: (line) => /process\.env/i.test(line),
  },
]

function git(cmd) {
  return execSync(cmd, { encoding: 'utf8' }).trim()
}

function listStagedFiles() {
  const out = git('git diff --cached --name-only --diff-filter=ACM')
  return out ? out.split(/\r?\n/).filter(Boolean) : []
}

function listAllTrackedFiles() {
  const out = git('git ls-files')
  return out ? out.split(/\r?\n/).filter(Boolean) : []
}

function isBlockedPath(file) {
  return BLOCKED_PATHS.some((re) => re.test(file.replace(/\\/g, '/')))
}

function scanFile(file) {
  if (ALLOWED_PATHS.some((re) => re.test(file.replace(/\\/g, '/')))) {
    return []
  }
  if (!existsSync(file)) return []

  const findings = []
  const content = readFileSync(file, 'utf8')
  const lines = content.split(/\r?\n/)

  if (isBlockedPath(file)) {
    findings.push({ file, line: 0, rule: 'blocked file path', snippet: file })
    return findings
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]
    for (const { name, re, skip } of SECRET_PATTERNS) {
      re.lastIndex = 0
      if (re.test(line) && !skip(line)) {
        findings.push({
          file,
          line: i + 1,
          rule: name,
          snippet: line.trim().slice(0, 120),
        })
      }
    }
  }

  return findings
}

const files = process.argv.includes('--all') ? listAllTrackedFiles() : listStagedFiles()

if (files.length === 0) {
  process.exit(0)
}

const findings = files.flatMap(scanFile)

if (findings.length === 0) {
  console.log(`check-secrets: OK (${files.length} file(s) scanned)`)
  process.exit(0)
}

console.error('check-secrets: possible secrets detected — commit blocked:\n')
for (const f of findings) {
  const loc = f.line > 0 ? `${relative(process.cwd(), f.file)}:${f.line}` : f.file
  console.error(`  • ${loc} [${f.rule}]`)
  if (f.snippet) console.error(`    ${f.snippet}`)
}
console.error('\nUse environment variables (.env locally, never committed).')
console.error('Rotate any credential that was already pushed to a remote.')
process.exit(1)
