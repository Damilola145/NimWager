import { Link, NavLink } from "react-router-dom"
import { cn } from "@/lib/utils"
import { WalletButton } from "@/components/wallet/WalletButton"
import { Logo } from "./Logo"

const links = [
  { to: "/lobby", label: "Lobby" },
  { to: "/profile", label: "Profile" },
]

export function Navbar() {
  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/80 backdrop-blur-lg">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6">
        <Link to="/" className="flex items-center gap-2.5">
          <Logo className="h-8 w-8" />
          <span className="text-lg font-bold tracking-tight">
            Nim<span className="text-primary">Wager</span>
          </span>
        </Link>

        <nav className="hidden items-center gap-1 sm:flex">
          {links.map((l) => (
            <NavLink
              key={l.to}
              to={l.to}
              className={({ isActive }) =>
                cn(
                  "rounded-lg px-3 py-2 text-sm font-medium transition",
                  isActive ? "text-primary" : "text-muted-foreground hover:text-foreground",
                )
              }
            >
              {l.label}
            </NavLink>
          ))}
        </nav>

        <WalletButton />
      </div>
    </header>
  )
}
