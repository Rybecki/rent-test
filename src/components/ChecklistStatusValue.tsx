import type { ChecklistStatusInfo } from '../lib/documentChecklistStatus'
import { formatChecklistStatus } from '../lib/documentChecklistStatus'

export function ChecklistStatusValue({ info }: { info: ChecklistStatusInfo }) {
  return (
    <span
      className={`font-semibold ${
        info.complete ? 'text-emerald-400' : 'text-red-400'
      }`}
    >
      {formatChecklistStatus(info)}
    </span>
  )
}
