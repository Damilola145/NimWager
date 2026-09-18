import { Link } from "react-router-dom"
import { NIMIQ_NETWORK } from "@/lib/config"
import { Logo } from "./Logo"

export function Footer() {
  return (
    <footer className="border-t border-border/80 bg-background">
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 py-8 sm:flex-row sm:px-6">
        <div className="flex items-center gap-2">
          <Logo className="h-6 w-6" />
          <span className="text-sm font-semibold">
            Nim<span className="text-primary">Wager</span>
          </span>
          <span className="ml-2 rounded-full border border-border px-2 py-0.5 text-[10px] uppercase tracking-wide text-muted-foreground">
            {NIMIQ_NETWORK === "main" ? "Mainnet" : "Testnet"}
          </span>
        </div>
        <p className="text-center text-xs text-muted-foreground">
          Provably-fair PvP wagering on Nimiq. Play responsibly — stake only what you can lose.
        </p>
        <nav className="flex items-center gap-4 text-xs text-muted-foreground">
          <Link to="/lobby" className="transition hover:text-foreground">
            Lobby
          </Link>
          <Link to="/profile" className="transition hover:text-foreground">
            Profile
          </Link>
        </nav>
      </div>
    </footer>
  )
}
