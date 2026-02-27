import { NextRequest, NextResponse } from "next/server";
import { updatePresence, getPresence } from "../../store";

// For shared views, we use the share token as the tripId in the presence store
// This keeps presence separate between direct trip access and shared link access

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const body = await request.json();
    const { viewerId, viewerName } = body;

    if (!viewerId || !viewerName) {
      return NextResponse.json(
        { error: "viewerId and viewerName required" },
        { status: 400 }
      );
    }

    // Use "shared:{token}" as the presence key
    const presenceKey = `shared:${token}`;
    const viewers = updatePresence(presenceKey, viewerId, viewerName);
    return NextResponse.json({ viewers });
  } catch (error) {
    console.error("Shared presence error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const presenceKey = `shared:${token}`;
    const viewers = getPresence(presenceKey);
    return NextResponse.json({ viewers });
  } catch (error) {
    console.error("Shared presence error:", error);
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
