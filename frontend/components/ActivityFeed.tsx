interface ActivityEvent {
  id: string;
  type: "executed" | "blocked";
  target: string;
  value: string;
  timestamp: string;
  txHash?: string;
}

interface ActivityFeedProps {
  events?: ActivityEvent[];
}

export default function ActivityFeed({ events = [] }: ActivityFeedProps) {
  if (events.length === 0) {
    return (
      <div className="rounded-xl border border-white/10 p-6">
        <h3 className="font-semibold mb-4">Recent Activity</h3>
        <p className="text-white/40 text-sm text-center py-8">No recent activity</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-white/10 p-6">
      <h3 className="font-semibold mb-4">Recent Activity</h3>
      <div className="space-y-3">
        {events.map((event) => (
          <div
            key={event.id}
            className="flex items-start gap-3 py-2 border-b border-white/5 last:border-0"
          >
            <span
              className={`mt-0.5 h-2 w-2 rounded-full flex-shrink-0 ${
                event.type === "executed" ? "bg-green-400" : "bg-red-400"
              }`}
            />
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between">
                <span
                  className={`text-xs font-semibold ${
                    event.type === "executed" ? "text-green-400" : "text-red-400"
                  }`}
                >
                  {event.type === "executed" ? "EXECUTED" : "BLOCKED"}
                </span>
                <span className="text-xs text-white/40">{event.timestamp}</span>
              </div>
              <p className="text-xs text-white/60 font-mono truncate mt-0.5">
                {event.target}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
