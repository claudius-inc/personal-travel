import { db } from "@/db";
import { trips, itineraryItems, expenses } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import crypto from "crypto";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    const trip = await db.select().from(trips).where(eq(trips.id, id));
    if (!trip.length) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    const items = await db
      .select()
      .from(itineraryItems)
      .where(eq(itineraryItems.tripId, id));
    const tripExpenses = await db
      .select()
      .from(expenses)
      .where(eq(expenses.tripId, id));

    return NextResponse.json({
      ...trip[0],
      itineraryItems: items,
      expenses: tripExpenses,
    });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Failed" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const itemId = crypto.randomUUID();
    const {
      dayIndex,
      startTime,
      endTime,
      location,
      description,
      address,
      lat,
      lng,
    } = body;

    if (dayIndex === undefined || !location) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const newItem = await db
      .insert(itineraryItems)
      .values({
        id: itemId,
        tripId: id,
        dayIndex,
        startTime,
        endTime,
        location,
        description,
        address,
        lat,
        lng,
      })
      .returning();

    return NextResponse.json(newItem[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to add itinerary item" },
      { status: 500 },
    );
  }
}
