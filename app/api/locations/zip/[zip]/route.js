import { NextResponse } from "next/server";
import { lookupZip } from "../../../../../lib/locationLookup";

export const dynamic = "force-dynamic";

export async function GET(_request, { params }) {
  const { zip } = await params;
  const location = lookupZip(zip);

  if (!location) {
    return NextResponse.json({ ok: false, error: "ZIP not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, location });
}
