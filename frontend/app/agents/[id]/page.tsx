import Link from "next/link";

interface AgentPageProps {
  params: Promise<{ id: string }>;
}

export default async function AgentPage({ params }: AgentPageProps) {
  const { id } = await params;
  return (
    <main className="min-h-screen bg-[#0a0a0a] px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <Link href="/" className="text-white/60 hover:text-white text-sm">
            ← Back to Dashboard
          </Link>
        </div>
        <h1 className="text-3xl font-bold mb-2 font-mono">
          Agent {id.slice(0, 8)}...
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <div className="rounded-xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4">Guardian Status</h2>
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-full bg-green-400" />
              <span className="text-green-400 font-semibold">ACTIVE</span>
            </div>
          </div>
          <div className="rounded-xl border border-white/10 p-6">
            <h2 className="text-lg font-semibold mb-4">Activity</h2>
            <p className="text-white/60 text-sm">No recent activity</p>
          </div>
        </div>
      </div>
    </main>
  );
}
