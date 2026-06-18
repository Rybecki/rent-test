const DEMO_NOTICE_KEY = 'rentally-demo-notice-seen-v1'

export function hasSeenDemoNotice(): boolean {
  if (typeof localStorage === 'undefined') return true
  try {
    return localStorage.getItem(DEMO_NOTICE_KEY) === '1'
  } catch {
    return true
  }
}

export function markDemoNoticeSeen(): void {
  if (typeof localStorage === 'undefined') return
  try {
    localStorage.setItem(DEMO_NOTICE_KEY, '1')
  } catch {}
}
