// Singleton toast notifier — separated from App.tsx to satisfy React Fast Refresh
// (Fast Refresh requires file to export ONLY components OR only non-components)

type ToastType = 'success' | 'error' | 'info'
let _notify: ((msg: string, type: ToastType) => void) | null = null

export function registerToastNotifier(fn: (msg: string, type: ToastType) => void) {
  _notify = fn
}

export function showToast(msg: string, type: ToastType = 'success') {
  _notify?.(msg, type)
}

