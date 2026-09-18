import { createContext, useCallback, useContext, useState, type ReactNode } from "react"
import { CheckCircle2, XCircle, Info, Loader2, X } from "lucide-react"
import { cn } from "@/lib/utils"

type ToastVariant = "success" | "error" | "info" | "pending"

interface ToastItem {
  id: string
  title: string
  description?: string
  variant: ToastVariant
}

interface ToastOptions {
  title: string
  description?: string
  variant?: ToastVariant
  /** ms before auto-dismiss; pending toasts stay until dismissed. */
  duration?: number
}

interface ToastContextValue {
  toast: (opts: ToastOptions) => string
  dismiss: (id: string) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

export function useToast(): ToastContextValue {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error("useToast must be used within <ToastProvider>")
  return ctx
}

const icons: Record<ToastVariant, ReactNode> = {
  success: <CheckCircle2 className="h-5 w-5 text-success" />,
  error: <XCircle className="h-5 w-5 text-danger" />,
  info: <Info className="h-5 w-5 text-accent" />,
  pending: <Loader2 className="h-5 w-5 animate-spin text-primary" />,
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([])

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  const toast = useCallback(
    ({ title, description, variant = "info", duration }: ToastOptions) => {
      const id = Math.random().toString(36).slice(2)
      setToasts((prev) => [...prev, { id, title, description, variant }])
      const ttl = duration ?? (variant === "pending" ? 0 : 4500)
      if (ttl > 0) setTimeout(() => dismiss(id), ttl)
      return id
    },
    [dismiss],
  )

  return (
    <ToastContext.Provider value={{ toast, dismiss }}>
      {children}
      <div className="pointer-events-none fixed inset-x-0 top-4 z-[100] flex flex-col items-center gap-2 px-4 sm:bottom-4 sm:right-4 sm:left-auto sm:top-auto sm:items-end">
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={cn(
              "pointer-events-auto flex w-full max-w-sm items-start gap-3 rounded-xl border bg-card/95 p-4 shadow-xl backdrop-blur animate-scale-in",
              t.variant === "success" && "border-success/40",
              t.variant === "error" && "border-danger/40",
              t.variant === "pending" && "border-primary/40",
            )}
          >
            <div className="mt-0.5 shrink-0">{icons[t.variant]}</div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-card-foreground">{t.title}</p>
              {t.description && (
                <p className="mt-0.5 break-words text-xs text-muted-foreground">{t.description}</p>
              )}
            </div>
            <button
              onClick={() => dismiss(t.id)}
              className="shrink-0 rounded-md p-1 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}
