import { useToast } from '../state/ToastContext.jsx'

const TYPE_STYLES = {
  success: { border: 'border-l-fresh-500', icon: '✅' },
  info: { border: 'border-l-neutral-400', icon: 'ℹ️' },
  error: { border: 'border-l-red-500', icon: '⚠️' },
}

// Pile de notifications toast. Fixée en haut sur mobile (la barre d'actions
// de plusieurs pages est fixée en bas), en bas sur desktop.
export default function Toast() {
  const { toasts, dismissToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed z-[100] top-4 sm:top-auto sm:bottom-6 inset-x-0 flex flex-col items-center gap-2 px-4 pointer-events-none">
      {toasts.map((toast) => {
        const style = TYPE_STYLES[toast.type] || TYPE_STYLES.success
        return (
          <button
            key={toast.id}
            type="button"
            onClick={() => dismissToast(toast.id)}
            className={`pointer-events-auto animate-popIn max-w-sm w-full sm:w-auto bg-white rounded-xl2 shadow-cardHover border border-neutral-100 border-l-4 ${style.border} px-4 py-3 flex items-center gap-2.5 text-sm text-neutral-800 text-left`}
          >
            <span aria-hidden>{style.icon}</span>
            <span className="flex-1">{toast.message}</span>
          </button>
        )
      })}
    </div>
  )
}
