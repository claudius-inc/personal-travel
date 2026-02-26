import { db } from "@/db";
import { trips, itineraryItems, expenses, locationInsights } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { createItemSchema, updateTripSchema } from "@/types";

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

    const [items, tripExpenses] = await Promise.all([
      db.select().from(itineraryItems).where(eq(itineraryItems.tripId, id)),
      db.select().from(expenses).where(eq(expenses.tripId, id)),
    ]);

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
    const parsed = createItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

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
    } = parsed.data;

    const newItem = await db
      .insert(itineraryItems)
      .values({
        id: itemId,
        tripId: id,
        dayIndex,
        startTime: startTime || null,
        endTime: endTime || null,
        location,
        description: description || null,
        address: address || null,
        lat: lat || null,
        lng: lng || null,
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

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = updateTripSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {};
    const data = parsed.data;

    if (data.name !== undefined) updates.name = data.name;
    if (data.startDate !== undefined)
      updates.startDate = data.startDate ? new Date(data.startDate) : null;
    if (data.endDate !== undefined)
      updates.endDate = data.endDate ? new Date(data.endDate) : null;
    if (data.days !== undefined)
      updates.days = data.days ? parseInt(String(data.days)) : null;
    if (data.startAirport !== undefined)
      updates.startAirport = data.startAirport;
    if (data.endAirport !== undefined) updates.endAirport = data.endAirport;
    if (data.timeOfYear !== undefined) updates.timeOfYear = data.timeOfYear;
    if (data.style !== undefined) updates.style = data.style;
    if (data.budget !== undefined) updates.budget = data.budget;

    const updated = await db
      .update(trips)
      .set(updates)
      .where(eq(trips.id, id))
      .returning();

    if (!updated.length) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update trip" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;

    // Get all itinerary items to cascade-delete their insights
    const items = await db
      .select({ id: itineraryItems.id })
      .from(itineraryItems)
      .where(eq(itineraryItems.tripId, id));

    // Delete insights for each item
    for (const item of items) {
      await db
        .delete(locationInsights)
        .where(eq(locationInsights.itemId, item.id));
    }

    // Delete items, expenses, then the trip itself
    await db.delete(itineraryItems).where(eq(itineraryItems.tripId, id));
    await db.delete(expenses).where(eq(expenses.tripId, id));
    const deleted = await db.delete(trips).where(eq(trips.id, id)).returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Trip not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete trip" },
      { status: 500 },
    );
  }
}
