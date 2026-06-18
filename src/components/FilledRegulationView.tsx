import type { ReactNode } from 'react'
import {
  FILLED_LINE_CLASS,
  getFilledLineParts,
  REGULATION_LINE_CLASS,
  splitFilledRegulationForDisplay,
  type RegulationFormData,
} from '../lib/fillRegulation'
import type { EquipmentId } from '../types'

type FilledRegulationViewProps = {
  filledText: string
  equipmentId: EquipmentId
  formData: RegulationFormData
  signatureDataUrl: string
}

function renderLine(
  line: string,
  key: number,
  formData: RegulationFormData,
): ReactNode {
  if (line.trim() === '') return <br key={key} />

  const parts = getFilledLineParts(line, formData)
  return (
    <div key={key} className="flex flex-col gap-1">
      {parts.map((part, i) => (
        <span
          key={i}
          className={
            part.kind === 'filled' ? FILLED_LINE_CLASS : REGULATION_LINE_CLASS
          }
        >
          {part.text}
        </span>
      ))}
    </div>
  )
}

function TextBlock({
  text,
  formData,
}: {
  text: string
  formData: RegulationFormData
}) {
  if (!text) return null
  const lines = text.split('\n')
  return (
    <div className="flex flex-col gap-2 break-words text-[0.78rem] leading-relaxed">
      {lines.map((line, i) => renderLine(line, i, formData))}
    </div>
  )
}

export function FilledRegulationView({
  filledText,
  equipmentId,
  formData,
  signatureDataUrl,
}: FilledRegulationViewProps) {
  const { contentBeforeSignature, contentAfterSignature } =
    splitFilledRegulationForDisplay(filledText, equipmentId)

  return (
    <div className="glass-card min-w-0 overflow-x-clip rounded-xl border border-primary/30">
      <h3 className="border-b border-white/10 px-4 py-3 font-display text-base font-semibold text-primary">
        Podgląd regulaminu
      </h3>

      <div className="space-y-4 px-4 py-4">
        <TextBlock text={contentBeforeSignature} formData={formData} />

        <div className="rounded-lg border-2 border-primary/35 bg-white px-3 py-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-graphite-900/70">
            Podpis najemcy
          </p>
          <img
            src={signatureDataUrl}
            alt="Podpis najemcy"
            className="max-h-28 w-full max-w-md object-contain object-left"
          />
        </div>

        {contentAfterSignature ? (
          <TextBlock text={contentAfterSignature} formData={formData} />
        ) : null}
      </div>
    </div>
  )
}
