import { PinPad } from './PinPad'
import { APP_LOGIN_PIN, APP_NAME } from '../appConfig'
import { LOGO_SRC } from '../logo'

type LoginScreenProps = {
  onAuthenticated: () => void
}

export function LoginScreen({ onAuthenticated }: LoginScreenProps) {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-8 p-4">
      <img
        src={LOGO_SRC}
        alt={APP_NAME}
        className="block h-auto max-h-[5rem] w-full max-w-[320px] bg-transparent object-contain"
      />
      <div className="glass-card w-full max-w-md rounded-2xl p-6 shadow-2xl sm:p-8">
        <p className="mb-5 text-center text-sm text-white/70">
          Wprowadź PIN, aby kontynuować
        </p>
        <PinPad correctPin={APP_LOGIN_PIN} onSuccess={onAuthenticated} />
      </div>
    </div>
  )
}
