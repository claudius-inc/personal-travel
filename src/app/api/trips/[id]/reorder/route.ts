import { NextResponse } from "next/server";
import { db } from "@/db";
import { itineraryItems } from "@/db/schema";
import { eq, and } from "drizzle-orm";
import { reorderItemsSchema } from "@/types";

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const parsed = reorderItemsSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    // Batch update dayIndex + sortOrder for each item
    const updates = parsed.data.items.map((item) =>
      db
        .update(itineraryItems)
        .set({ dayIndex: item.dayIndex, sortOrder: item.sortOrder })
        .where(
          and(eq(itineraryItems.id, item.id), eq(itineraryItems.tripId, id)),
        ),
    );

    await Promise.all(updates);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error reordering items:", error);
    return NextResponse.json(
      { error: "Failed to reorder items" },
      { status: 500 },
    );
  }
}
