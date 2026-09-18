import { Link } from "react-router-dom"
import { ArrowRight, Wallet, Swords, Coins, ShieldCheck } from "lucide-react"
import { Button } from "@/components/ui/Button"
import { StatsTicker } from "@/components/landing/StatsTicker"
import { GameIcon } from "@/components/games/GameIcon"
import { GAME_LIST } from "@/lib/games"
import { useWallet } from "@/wallet/useWallet"
import { useUiStore } from "@/store/uiStore"

const steps = [
  { icon: Wallet, title: "Connect & stake", body: "Link your Nimiq wallet and lock an amount of NIM into a wager." },
  { icon: Swords, title: "Match up", body: "An opponent joins your open wager and stakes the same amount." },
  { icon: Coins, title: "Winner takes the pool", body: "The game settles on-chain and the pooled NIM pays out instantly." },
]

export function LandingPage() {
  const { isConnected } = useWallet()
  const openConnectModal = useUiStore((s) => s.openConnectModal)

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-grid opacity-40" aria-hidden />
        <div className="absolute left-1/2 top-0 h-72 w-72 -translate-x-1/2 rounded-full bg-primary/20 blur-3xl" aria-hidden />
        <div className="relative mx-auto max-w-6xl px-4 pb-16 pt-20 text-center sm:px-6 sm:pt-28">
          <div className="mx-auto mb-5 inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 animate-pulse-glow rounded-full bg-success" />
            Live PvP wagering on the Nimiq blockchain
          </div>
          <h1 className="mx-auto max-w-3xl text-balance text-4xl font-bold leading-tight tracking-tight sm:text-6xl">
            Stake NIM. Play head-to-head. <span className="text-gradient-gold">Winner takes it all.</span>
          </h1>
          <p className="mx-auto mt-5 max-w-xl text-pretty text-base text-muted-foreground sm:text-lg">
            NimWager pairs you against another player on quick games of chance and nerve. Equal stakes,
            instant on-chain payout, no house edge.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
            {isConnected ? (
              <Link to="/lobby">
                <Button size="lg" className="gap-2">
                  Enter the lobby <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
            ) : (
              <Button size="lg" className="gap-2" onClick={openConnectModal}>
                <Wallet className="h-5 w-5" /> Connect wallet to play
              </Button>
            )}
            <Link to="/lobby">
              <Button size="lg" variant="outline">
                Browse open wagers
              </Button>
            </Link>
          </div>
        </div>
      </section>

      <StatsTicker />

      {/* How it works */}
      <section className="mx-auto max-w-6xl px-4 py-16 sm:px-6">
        <div className="mb-10 text-center">
          <h2 className="text-2xl font-bold sm:text-3xl">How wagering works</h2>
          <p className="mx-auto mt-2 max-w-lg text-muted-foreground">
            Three steps from wallet to payout. Everything settles on Nimiq — the pool only moves when a
            winner is decided.
          </p>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {steps.map((s, i) => (
            <div key={s.title} className="relative rounded-2xl border border-border bg-card p-6">
              <span className="absolute right-5 top-5 font-mono text-sm text-muted-foreground">
                0{i + 1}
              </span>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/15 text-primary">
                <s.icon className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-semibold">{s.title}</h3>
              <p className="mt-1.5 text-sm text-muted-foreground">{s.body}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Games preview */}
      <section className="mx-auto max-w-6xl px-4 pb-16 sm:px-6">
        <div className="mb-8 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-bold sm:text-3xl">Pick your game</h2>
            <p className="mt-2 text-muted-foreground">Fast rounds. Even odds. Real stakes.</p>
          </div>
          <Link to="/lobby" className="hidden items-center gap-1 text-sm font-medium text-primary hover:underline sm:inline-flex">
            All games <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-3">
          {GAME_LIST.map((g) => (
            <Link
              key={g.kind}
              to="/lobby"
              className="group rounded-2xl border border-border bg-card p-6 transition hover:border-primary/40 hover:bg-card/80"
            >
              <div
                className={`mb-4 flex h-12 w-12 items-center justify-center rounded-xl ${
                  g.accent === "gold" ? "bg-primary/15 text-primary" : "bg-accent/15 text-accent"
                }`}
              >
                <GameIcon kind={g.kind} className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold">{g.name}</h3>
              <p className="mt-1 text-sm font-medium text-muted-foreground">{g.tagline}</p>
              <p className="mt-3 text-sm text-muted-foreground">{g.rules}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-primary opacity-0 transition group-hover:opacity-100">
                Play now <ArrowRight className="h-4 w-4" />
              </span>
            </Link>
          ))}
        </div>
      </section>

      {/* Trust strip */}
      <section className="border-t border-border bg-card/30">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 px-4 py-10 text-center sm:px-6">
          <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-success/15 text-success">
            <ShieldCheck className="h-5 w-5" />
          </div>
          <h2 className="text-xl font-bold">Non-custodial by design</h2>
          <p className="max-w-lg text-sm text-muted-foreground">
            NimWager never holds your keys. You sign every stake in your own wallet, and payouts settle
            directly on-chain to the winner.
          </p>
        </div>
      </section>
    </div>
  )
}
