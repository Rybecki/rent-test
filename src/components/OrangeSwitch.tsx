type OrangeSwitchProps = {
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  id?: string
  'aria-label'?: string
}

export function OrangeSwitch({
  checked,
  onChange,
  disabled = false,
  id,
  'aria-label': ariaLabel,
}: OrangeSwitchProps) {
  return (
    <button
      type="button"
      role="switch"
      id={id}
      aria-checked={checked}
      aria-label={ariaLabel}
      disabled={disabled}
      onClick={(e) => {
        e.stopPropagation()
        if (!disabled) onChange(!checked)
      }}
      className={`relative inline-flex h-7 w-12 shrink-0 rounded-full border-2 transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-graphite-900 disabled:cursor-not-allowed disabled:opacity-40 ${
        checked
          ? 'border-primary bg-primary'
          : 'border-white/25 bg-white/10'
      }`}
    >
      <span
        aria-hidden
        className={`absolute top-1/2 size-[1.125rem] -translate-y-1/2 rounded-full shadow-sm transition-all duration-200 ${
          checked
            ? 'left-[calc(100%-1.375rem)] bg-dark'
            : 'left-0.5 bg-white'
        }`}
      />
    </button>
  )
}
