import { NextResponse } from "next/server";
import { db } from "@/db";
import { itineraryItems, locationInsights } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { updateItemSchema } from "@/types";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await context.params;

  try {
    const body = await request.json();
    const parsed = updateItemSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const updates: Record<string, unknown> = {};
    const data = parsed.data;
    if (data.dayIndex !== undefined) updates.dayIndex = data.dayIndex;
    if (data.startTime !== undefined) updates.startTime = data.startTime;
    if (data.endTime !== undefined) updates.endTime = data.endTime;
    if (data.location !== undefined) updates.location = data.location;
    if (data.description !== undefined) updates.description = data.description;
    if (data.address !== undefined) updates.address = data.address;
    if (data.lat !== undefined) updates.lat = data.lat;
    if (data.lng !== undefined) updates.lng = data.lng;
    if (data.sortOrder !== undefined) updates.sortOrder = data.sortOrder;

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: "No fields to update" },
        { status: 400 },
      );
    }

    const updated = await db
      .update(itineraryItems)
      .set(updates)
      .where(
        and(eq(itineraryItems.id, itemId), eq(itineraryItems.tripId, id)),
      )
      .returning();

    if (updated.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json(updated[0]);
  } catch (error) {
    console.error("Error updating item:", error);
    return NextResponse.json(
      { error: "Failed to update item" },
      { status: 500 },
    );
  }
}

export async function DELETE(
  _request: Request,
  context: { params: Promise<{ id: string; itemId: string }> },
) {
  const { id, itemId } = await context.params;

  try {
    // Cascade-delete insights first
    await db
      .delete(locationInsights)
      .where(eq(locationInsights.itemId, itemId));

    const deleted = await db
      .delete(itineraryItems)
      .where(
        and(eq(itineraryItems.id, itemId), eq(itineraryItems.tripId, id)),
      )
      .returning();

    if (deleted.length === 0) {
      return NextResponse.json({ error: "Item not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting item:", error);
    return NextResponse.json(
      { error: "Failed to delete item" },
      { status: 500 },
    );
  }
}
