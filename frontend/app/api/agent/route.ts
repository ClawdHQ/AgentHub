import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const address = searchParams.get("address");

  if (!address) {
    return NextResponse.json({ error: "Missing address parameter" }, { status: 400 });
  }

  // TODO: Fetch agent data from chain/subgraph
  return NextResponse.json({
    address,
    active: true,
    strategyDescription: "",
    riskTier: 0,
  });
}
