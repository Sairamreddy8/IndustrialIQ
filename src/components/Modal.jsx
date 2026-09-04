import { useEffect, useRef } from 'react'

/**
 * Built on the native <dialog> element, so focus trapping, the backdrop, the
 * inertness of the page behind, and Esc-to-close all come from the platform
 * rather than from hand-rolled key and focus handling.
 *
 * A visible close button sits alongside Esc — Esc alone is not discoverable.
 */
export default function Modal({ open, onClose, title, subtitle, children }) {
  const dialogRef = useRef(null)

  useEffect(() => {
    const dialog = dialogRef.current
    if (!dialog) return
    if (open && !dialog.open) dialog.showModal()
    if (!open && dialog.open) dialog.close()
  }, [open])

  // The page behind must not scroll while the panel is up.
  useEffect(() => {
    if (!open) return
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  return (
    <dialog
      ref={dialogRef}
      aria-labelledby="modal-title"
      onCancel={(event) => {
        event.preventDefault()
        onClose()
      }}
      // A click landing on the dialog itself rather than its contents is a
      // backdrop click, since the inner wrapper covers the whole panel.
      onClick={(event) => {
        if (event.target === dialogRef.current) onClose()
      }}
      className="m-0 h-dvh max-h-dvh w-dvw max-w-none bg-transparent p-0 backdrop:bg-black/40 sm:mx-auto sm:my-8 sm:h-auto sm:max-h-[calc(100dvh-4rem)] sm:w-[min(64rem,calc(100vw-3rem))]"
    >
      {open && (
        <div className="flex h-dvh flex-col bg-surface sm:h-auto sm:max-h-[calc(100dvh-4rem)] sm:rounded-xl sm:border sm:border-hairline sm:shadow-xl">
          <header className="flex shrink-0 items-start justify-between gap-4 border-b border-hairline px-4 py-3.5 sm:px-5">
            <div className="min-w-0">
              <h2 id="modal-title" className="truncate text-lg font-semibold tracking-tight text-ink">
                {title}
              </h2>
              {subtitle && <p className="mt-0.5 text-xs text-ink-3">{subtitle}</p>}
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label="Close"
              className="-mr-1 shrink-0 rounded-lg p-1.5 text-ink-3 hover:bg-plane hover:text-ink"
            >
              <svg viewBox="0 0 20 20" className="size-5" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden="true">
                <path d="M5 5l10 10M15 5L5 15" strokeLinecap="round" />
              </svg>
            </button>
          </header>

          <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain bg-plane p-4 sm:p-5">
            {children}
          </div>
        </div>
      )}
    </dialog>
  )
}
