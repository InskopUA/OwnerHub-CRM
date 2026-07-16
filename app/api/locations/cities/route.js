import { NextResponse } from "next/server";
import { searchCities } from "../../../../lib/locationLookup";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const limit = searchParams.get("limit") || 10;

  return NextResponse.json({
    ok: true,
    cities: searchCities(query, limit)
  });
}
