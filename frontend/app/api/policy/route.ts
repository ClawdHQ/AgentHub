import OpenAI from "openai";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { keccak256, parseEther, toHex } from "viem";

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();
const RATE_LIMIT = 10;
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;

const PROTOCOL_NAMES = ["DOT Staking", "Hub DEX", "Test Protocol"] as const;
const FUNCTION_SIGNATURES = [
  "stake(uint256)",
  "withdraw(uint256)",
  "swap(uint256,uint256)",
] as const;

type ProtocolName = (typeof PROTOCOL_NAMES)[number];

const PROTOCOL_REGISTRY: Record<ProtocolName, `0x${string}`> = {
  "DOT Staking": "0x0000000000000000000000000000000000000804",
  "Hub DEX": "0x0000000000000000000000000000000000000000",
  "Test Protocol": "0x0000000000000000000000000000000000000000",
};

const dotAmountSchema = z.preprocess(
  (value) => (typeof value === "number" ? value.toString() : value),
  z.string().regex(/^\d+(\.\d{1,18})?$/),
);

const aiPolicySchema = z.object({
  tier: z.number().int().min(0).max(2),
  maxSingleTxValueDot: dotAmountSchema,
  maxDailyVolumeDot: dotAmountSchema,
  allowedProtocolNames: z.array(z.enum(PROTOCOL_NAMES)).min(1),
  allowedFunctionSignatures: z.array(z.enum(FUNCTION_SIGNATURES)).min(1),
  xcmEnabled: z.boolean(),
  reasoning: z.string().min(1).max(500),
});

const OPENROUTER_BASE_URL =
  process.env.OPENROUTER_BASE_URL ?? "https://openrouter.ai/api/v1";
const OPENROUTER_MODEL =
  process.env.OPENROUTER_MODEL ?? "google/gemini-2.5-flash-lite";

const SYSTEM_PROMPT = `
You are a cautious policy compiler for AgentHub, an AI DeFi agent product on Polkadot Hub Testnet.
Convert a user's plain-English strategy into a safe JSON policy.

Rules:
- Return JSON only.
- If the strategy is ambiguous, choose the safest interpretation.
- tier must be:
  0 = conservative
  1 = moderate
  2 = aggressive
- xcmEnabled may be true only if the user explicitly asks for cross-chain or XCM behavior.
- If xcmEnabled is true, tier must be 2.
- maxDailyVolumeDot must be greater than or equal to maxSingleTxValueDot.
- Use only the allowed protocol names and function signatures below.

Allowed protocol names:
- DOT Staking
- Hub DEX
- Test Protocol

Allowed function signatures:
- stake(uint256)
- withdraw(uint256)
- swap(uint256,uint256)

Output schema:
{
  "tier": 0,
  "maxSingleTxValueDot": "1.0",
  "maxDailyVolumeDot": "5.0",
  "allowedProtocolNames": ["DOT Staking"],
  "allowedFunctionSignatures": ["stake(uint256)", "withdraw(uint256)"],
  "xcmEnabled": false,
  "reasoning": "Short explanation"
}
`.trim();

function toSelector(sig: string): string {
  const hash = keccak256(toHex(sig));
  return hash.slice(0, 10);
}

function getOpenRouterClient(request: NextRequest) {
  const apiKey = process.env.OPENROUTER_API_KEY ?? process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("Missing OPENROUTER_API_KEY.");
  }

  return new OpenAI({
    apiKey,
    baseURL: OPENROUTER_BASE_URL,
    defaultHeaders: {
      "HTTP-Referer":
        process.env.OPENROUTER_SITE_URL ??
        process.env.NEXT_PUBLIC_APP_URL ??
        request.nextUrl.origin,
      "X-OpenRouter-Title":
        process.env.OPENROUTER_APP_NAME ?? "AgentHub",
    },
  });
}

function getErrorMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }

  return "Failed to interpret policy";
}

export async function POST(request: NextRequest) {
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
      { status: 400 },
    );
  }

  try {
    const client = getOpenRouterClient(request);
    const completion = await client.chat.completions.create({
      model: OPENROUTER_MODEL,
      temperature: 0.1,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        {
          role: "user",
          content: `Convert this strategy into a policy JSON object:\n${strategy}`,
        },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error("OpenRouter returned an empty response.");
    }

    const parsedPolicy = aiPolicySchema.parse(JSON.parse(rawContent));
    const dedupedProtocols = [...new Set(parsedPolicy.allowedProtocolNames)];
    const dedupedSelectors = [...new Set(parsedPolicy.allowedFunctionSignatures)];

    const maxSingleTxValue = parseEther(parsedPolicy.maxSingleTxValueDot);
    const rawMaxDailyVolume = parseEther(parsedPolicy.maxDailyVolumeDot);
    const maxDailyVolume =
      rawMaxDailyVolume < maxSingleTxValue ? maxSingleTxValue : rawMaxDailyVolume;
    const xcmEnabled = parsedPolicy.xcmEnabled;
    const tier = xcmEnabled ? Math.max(parsedPolicy.tier, 2) : parsedPolicy.tier;

    return NextResponse.json({
      tier,
      maxSingleTxValue: maxSingleTxValue.toString(),
      maxDailyVolume: maxDailyVolume.toString(),
      allowedProtocols: dedupedProtocols.map((name) => PROTOCOL_REGISTRY[name]),
      allowedSelectors: dedupedSelectors.map(toSelector),
      xcmEnabled,
      reasoning: parsedPolicy.reasoning,
      model: completion.model,
    });
  } catch (error) {
    console.error("Policy interpretation error:", error);
    return NextResponse.json(
      { error: getErrorMessage(error) },
      { status: 500 },
    );
  }
}
