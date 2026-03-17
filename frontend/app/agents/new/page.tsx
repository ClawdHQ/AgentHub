import Link from "next/link";

export default function NewAgentPage() {
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-12">
      <div className="max-w-2xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-white/60 hover:text-white text-sm">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2">Create New Agent</h1>
        <p className="text-white/60 mb-8">
          Deploy an AI-controlled DeFi agent with Guardian protection
        </p>
        <div className="rounded-xl border border-white/10 p-8 text-center">
          <p className="text-white/60">
            Connect your wallet to create an agent
          </p>
        </div>
      </div>
    </main>
  );
}
