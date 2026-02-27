import { NextRequest, NextResponse } from "next/server";
import { updatePresence, getPresence } from "../store";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const body = await request.json();
    const { viewerId, viewerName } = body;

    if (!viewerId || !viewerName) {
      return NextResponse.json(
        { error: "viewerId and viewerName required" },
        { status: 400 }
      );
    }

    const viewers = updatePresence(tripId, viewerId, viewerName);
    return NextResponse.json({ viewers });
  } catch (error) {
    console.error("Presence error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ tripId: string }> }
) {
  try {
    const { tripId } = await params;
    const viewers = getPresence(tripId);
    return NextResponse.json({ viewers });
  } catch (error) {
    console.error("Presence error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
