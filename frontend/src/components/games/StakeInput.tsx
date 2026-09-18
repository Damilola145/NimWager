import { AlertCircle, Loader2 } from "lucide-react"
import { formatNim } from "@/lib/format"
import { cn } from "@/lib/utils"

const PRESETS = [100, 250, 500, 1000]

interface StakeInputProps {
  value: string
  onChange: (value: string) => void
  balance: number
  disabled?: boolean
  insufficient: boolean
}

export function StakeInput({ value, onChange, balance, disabled, insufficient }: StakeInputProps) {
  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <label htmlFor="stake" className="text-sm font-medium text-muted-foreground">
          Stake amount
        </label>
        <span className="text-xs text-muted-foreground">
          Balance: <span className="font-semibold text-foreground">{Number.isFinite(balance) ? formatNim(balance) : "—"}</span>
        </span>
      </div>
      <div
        className={cn(
          "flex items-center gap-2 rounded-xl border bg-input px-4 py-3 transition",
          insufficient ? "border-danger/60" : "border-border focus-within:border-primary/60",
        )}
      >
        <input
          id="stake"
          inputMode="decimal"
          disabled={disabled}
          value={value}
          onChange={(e) => {
            const v = e.target.value
            if (v === "" || /^\d*\.?\d*$/.test(v)) onChange(v)
          }}
          placeholder="0"
          className="w-full bg-transparent text-lg font-bold text-foreground outline-none placeholder:text-muted-foreground/60"
        />
        <span className="shrink-0 text-sm font-semibold text-muted-foreground">NIM</span>
      </div>

      <div className="mt-2 flex flex-wrap gap-2">
        {PRESETS.map((p) => (
          <button
            key={p}
            type="button"
            disabled={disabled}
            onClick={() => onChange(String(p))}
            className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-50"
          >
            {p}
          </button>
        ))}
        <button
          type="button"
          disabled={disabled || balance <= 0}
          onClick={() => onChange(String(Math.max(0, Math.floor(balance))))}
          className="rounded-lg border border-border bg-muted/40 px-2.5 py-1 text-xs font-medium text-muted-foreground transition hover:border-primary/40 hover:text-foreground disabled:opacity-50"
        >
          Max
        </button>
      </div>

      {insufficient && (
        <p className="mt-2 flex items-center gap-1.5 text-xs text-danger">
          <AlertCircle className="h-3.5 w-3.5" /> Insufficient NIM balance for this stake.
        </p>
      )}
    </div>
  )
}
