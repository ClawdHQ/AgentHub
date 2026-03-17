import Link from "next/link";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a]">
      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 px-4 py-1 text-sm text-white/60">
          <span className="h-2 w-2 rounded-full bg-[#E6007A]" />
          Live on Polkadot Hub Testnet
        </div>
        <h1 className="text-5xl font-bold tracking-tight mb-4">
          AI-Powered DeFi Agents{" "}
          <span className="text-[#E6007A]">on Polkadot Hub</span>
        </h1>
        <p className="text-xl text-white/60 max-w-2xl mb-8">
          Your strategy in plain English. Our Guardian enforces it on-chain.
          <br />
          <span className="italic">The AI drives. The Guardian holds the brakes.</span>
        </p>
        <div className="flex gap-4">
          <Link
            href="/agents/new"
            className="rounded-lg bg-[#E6007A] px-6 py-3 font-semibold text-white hover:bg-[#E6007A]/80 transition-colors"
          >
            Launch Agent
          </Link>
          <Link
            href="/governance"
            className="rounded-lg border border-white/10 px-6 py-3 font-semibold text-white/80 hover:border-white/30 transition-colors"
          >
            Governance
          </Link>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="border-t border-white/10 py-8 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Total Agents", value: "—" },
            { label: "Total TVL (DOT)", value: "—" },
            { label: "Ops Today", value: "—" },
            { label: "Protocols Protected", value: "3" },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/10 p-4 text-center"
            >
              <div className="text-2xl font-bold text-[#E6007A]">{stat.value}</div>
              <div className="text-sm text-white/60 mt-1">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Empty State */}
      <section className="max-w-6xl mx-auto px-4 py-12 text-center">
        <div className="rounded-xl border border-white/10 p-12">
          <div className="text-4xl mb-4">🤖</div>
          <h2 className="text-xl font-semibold mb-2">No agents yet</h2>
          <p className="text-white/60 mb-6">
            Create your first AI-controlled DeFi agent
          </p>
          <Link
            href="/agents/new"
            className="inline-block rounded-lg bg-[#E6007A] px-6 py-3 font-semibold text-white hover:bg-[#E6007A]/80 transition-colors"
          >
            Create your first agent
          </Link>
        </div>
      </section>
    </main>
  );
}
