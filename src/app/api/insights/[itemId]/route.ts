import { db } from "@/db";
import { locationInsights } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function GET(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const { itemId } = await context.params;

    const insights = await db
      .select()
      .from(locationInsights)
      .where(eq(locationInsights.itemId, itemId));
    if (!insights.length) {
      return NextResponse.json(
        { error: "Insights not found" },
        { status: 404 },
      );
    }

    return NextResponse.json(insights[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ itemId: string }> },
) {
  try {
    const { itemId } = await context.params;
    const body = await request.json();

    const insightId = crypto.randomUUID();
    const { history, funFacts, spontaneousIdeas } = body;

    const newInsight = await db
      .insert(locationInsights)
      .values({
        id: insightId,
        itemId,
        history,
        funFacts,
        spontaneousIdeas,
      })
      .returning();

    return NextResponse.json(newInsight[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to add insight" },
      { status: 500 },
    );
  }
}
