import {
  cpSync,
  mkdirSync,
  existsSync,
  readdirSync,
  statSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execSync } from 'node:child_process'
import { writePhpConfig } from './write-php-config.mjs'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')
const out = join(root, 'deploy', 'public_html')
const apiRoot = join(root, 'api')

if (existsSync(out)) rmSync(out, { recursive: true, force: true })

function copyDir(src, dest) {
  mkdirSync(dest, { recursive: true })
  for (const name of readdirSync(src)) {
    const s = join(src, name)
    const d = join(dest, name)
    if (statSync(s).isDirectory()) copyDir(s, d)
    else cpSync(s, d, { force: true })
  }
}

const dist = join(root, 'dist')
if (!existsSync(join(dist, 'index.html'))) {
  console.error('Brak dist/ — uruchom: npm run build')
  process.exit(1)
}

try {
  execSync('composer install --no-dev --optimize-autoloader', {
    cwd: apiRoot,
    stdio: 'inherit',
  })
} catch {
  console.warn('Uwaga: composer install nie powiodl sie — na serwerze uruchom w api/: composer install')
}

copyDir(dist, out)

const apiOut = join(out, 'api')
mkdirSync(join(apiOut, 'lib'), { recursive: true })

for (const name of [
  'index.php',
  'bootstrap.php',
  '.htaccess',
  'composer.json',
  'composer.lock',
  'config.example.php',
]) {
  const src = join(apiRoot, name)
  if (existsSync(src)) {
    cpSync(src, join(apiOut, name))
  }
}

copyDir(join(apiRoot, 'lib'), join(apiOut, 'lib'))

const vendor = join(apiRoot, 'vendor')
if (existsSync(vendor)) {
  copyDir(vendor, join(apiOut, 'vendor'))
}

writePhpConfig(join(apiOut, 'config.php'))

writeFileSync(
  join(out, '.htaccess'),
  `<IfModule mod_rewrite.c>
  RewriteEngine On
  RewriteRule ^api(/.*)?$ api/index.php [L,QSA]
  RewriteCond %{REQUEST_FILENAME} !-f
  RewriteCond %{REQUEST_FILENAME} !-d
  RewriteRule ^ index.html [L]
</IfModule>
`,
  'utf8',
)

writeFileSync(
  join(out, 'WGRYWANIE.txt'),
  `SCIEZKA: /domains/twoja-domena.pl/public_html/

Wgraj cala zawartosc tego folderu (nadpisz pliki).

api/config.php zawiera SMTP i baze z lokalnego .env (host bazy na serwerze: localhost).

Jesli brak api/vendor: SSH
cd /domains/twoja-domena.pl/public_html/api
composer install

Test: https://twoja-domena.pl/api/health
`,
  'utf8',
)

console.log('Gotowe:', out)
