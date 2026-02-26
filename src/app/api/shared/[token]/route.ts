import { db } from "@/db";
import { trips, itineraryItems, expenses } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";

export async function GET(
  request: Request,
  context: { params: Promise<{ token: string }> },
) {
  try {
    const { token } = await context.params;

    // Find trip by share token
    const tripQuery = await db
      .select()
      .from(trips)
      .where(eq(trips.shareToken, token));
    if (!tripQuery.length) {
      return NextResponse.json(
        { error: "Trip not found or unauthorized" },
        { status: 404 },
      );
    }

    const trip = tripQuery[0];

    const [items, tripExpenses] = await Promise.all([
      db
        .select()
        .from(itineraryItems)
        .where(eq(itineraryItems.tripId, trip.id)),
      db.select().from(expenses).where(eq(expenses.tripId, trip.id)),
    ]);

    return NextResponse.json({
      ...trip,
      itineraryItems: items,
      expenses: tripExpenses,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}
