import Link from "next/link";

export default function GovernancePage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-white/60 hover:text-white text-sm">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2">Governance</h1>
        <p className="text-white/60 mb-8">
          AgentHub DAO — powered by AHT token voting
        </p>
        <div className="rounded-xl border border-white/10 p-8 text-center">
          <p className="text-white/60">
            No active proposals
          </p>
        </div>
      </div>
    </main>
  );
}
