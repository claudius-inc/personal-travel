import { NextRequest, NextResponse } from "next/server";
import { removePresence } from "../../../store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { viewerId } = body;

    if (!viewerId) {
      return NextResponse.json({ error: "viewerId required" }, { status: 400 });
    }

    const presenceKey = `shared:${token}`;
    removePresence(presenceKey, viewerId);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Shared presence leave error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
