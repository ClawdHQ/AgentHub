import { createHash } from "crypto";
import { NextRequest, NextResponse } from "next/server";

// Rate limiting: in-memory store (per IP, per hour)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000; // 1 hour

// Protocol registry: name → Hub testnet address
const PROTOCOL_REGISTRY: Record<string, string> = {
  "DOT Staking": "0x0000000000000000000000000000000000000804",
  "Hub DEX": "0x0000000000000000000000000000000000000000",
  "Test Protocol": "0x0000000000000000000000000000000000000000",
};

/**
 * Convert a function signature string to a 4-byte selector
 */
function toSelector(sig: string): string {
  const hash = createHash("sha3-256").update(sig).digest("hex");
  return "0x" + hash.slice(0, 8);
}

export async function POST(request: NextRequest) {
  // Rate limiting
  const ip = request.headers.get("x-forwarded-for") ?? "unknown";
  const now = Date.now();
  const rateLimit = rateLimitMap.get(ip);

  if (rateLimit) {
    if (now < rateLimit.resetTime) {
      if (rateLimit.count >= RATE_LIMIT) {
        return NextResponse.json({ error: "Rate limit exceeded" }, { status: 429 });
      }
      rateLimit.count++;
    } else {
      rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
    }
  } else {
    rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW_MS });
  }

  let body: { strategy?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { strategy } = body;

  if (!strategy || typeof strategy !== "string") {
    return NextResponse.json({ error: "Missing strategy field" }, { status: 400 });
  }

  if (strategy.length < 20 || strategy.length > 1000) {
    return NextResponse.json(
      { error: "Strategy must be 20-1000 characters" },
      { status: 400 }
    );
  }

  try {
    // Default conservative policy without AI for now
    const tier = 0; // CONSERVATIVE
    const maxSingleTxValue = "1000000000000000000"; // 1 ETH in wei
    const maxDailyVolume = "5000000000000000000"; // 5 ETH in wei
    const allowedProtocolNames = ["DOT Staking"];
    const allowedSelectors = ["stake(uint256)", "withdraw(uint256)"].map(toSelector);
    const xcmEnabled = false;
    const reasoning = "Defaulting to conservative tier for safety";

    // Map protocol names to addresses
    const allowedProtocols = allowedProtocolNames
      .map((name) => PROTOCOL_REGISTRY[name])
      .filter(Boolean);

    return NextResponse.json({
      tier,
      maxSingleTxValue,
      maxDailyVolume,
      allowedProtocols,
      allowedSelectors,
      xcmEnabled,
      reasoning,
    });
  } catch (error) {
    console.error("Policy interpretation error:", error);
    return NextResponse.json({ error: "Failed to interpret policy" }, { status: 500 });
  }
}
