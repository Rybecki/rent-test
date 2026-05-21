import sharp from 'sharp'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const src = join(
  process.env.USERPROFILE,
  '.cursor/projects/d-WORKSPACE-Wypo-yczalnia-Ja-Yhymm/assets/c__Users_patry_AppData_Roaming_Cursor_User_workspaceStorage_31b678cbc34d58e58be5b6d561cf0938_images_RENT_A_BO_CO...-10b874ac-0472-4fee-884d-5cda1dfa6df2.png',
)
const out = join(__dirname, '..', 'public', 'logo.png')

const BLACK_MAX = 20
const NEAR_RADIUS = 4

function isBlack(r, g, b) {
  return r <= BLACK_MAX && g <= BLACK_MAX && b <= BLACK_MAX
}

function isLogoColor(r, g, b) {
  return (
    (r > 200 && g > 200 && b > 200) ||
    (r > 200 && g > 150 && b < 120)
  )
}

async function main() {
  const { data, info } = await sharp(src).ensureAlpha().raw().toBuffer({
    resolveWithObject: true,
  })
  const w = info.width
  const h = info.height
  const buf = Buffer.from(data)

  const at = (x, y) => {
    const i = (y * w + x) * 4
    return [buf[i], buf[i + 1], buf[i + 2]]
  }

  const nearLogo = (x, y) => {
    for (let dy = -NEAR_RADIUS; dy <= NEAR_RADIUS; dy++) {
      for (let dx = -NEAR_RADIUS; dx <= NEAR_RADIUS; dx++) {
        const nx = x + dx
        const ny = y + dy
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue
        if (isLogoColor(...at(nx, ny))) return true
      }
    }
    return false
  }

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 4
      const r = buf[i]
      const g = buf[i + 1]
      const b = buf[i + 2]
      if (isBlack(r, g, b) && !nearLogo(x, y)) {
        buf[i + 3] = 0
      } else {
        buf[i + 3] = 255
      }
    }
  }

  await sharp(buf, { raw: { width: w, height: h, channels: 4 } })
    .png()
    .toFile(out)

  const m = await sharp(out).metadata()
  console.log('OK:', out, m.format, 'hasAlpha', m.hasAlpha)
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
