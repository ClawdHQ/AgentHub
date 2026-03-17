"use client";

interface PolicyEditorProps {
  policy: {
    tier: number;
    maxSingleTxValue: string;
    maxDailyVolume: string;
    allowedProtocols: string[];
    xcmEnabled: boolean;
  };
  onChange?: (policy: PolicyEditorProps["policy"]) => void;
  readOnly?: boolean;
}

const TIERS = [
  { value: 0, label: "CONSERVATIVE", color: "text-green-400" },
  { value: 1, label: "MODERATE", color: "text-yellow-400" },
  { value: 2, label: "AGGRESSIVE", color: "text-red-400" },
];

export default function PolicyEditor({ policy, onChange, readOnly = false }: PolicyEditorProps) {
  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm text-white/60 mb-2 block">Risk Tier</label>
        <div className="flex gap-2">
          {TIERS.map((tier) => (
            <button
              key={tier.value}
              disabled={readOnly}
              onClick={() => onChange?.({ ...policy, tier: tier.value })}
              className={`flex-1 py-2 rounded-lg text-sm font-semibold border transition-colors ${
                policy.tier === tier.value
                  ? `border-[#E6007A] bg-[#E6007A]/10 ${tier.color}`
                  : "border-white/10 text-white/40 hover:border-white/20"
              }`}
            >
              {tier.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
