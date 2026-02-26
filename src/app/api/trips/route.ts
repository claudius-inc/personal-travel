import { db } from "@/db";
import { trips } from "@/db/schema";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createTripSchema } from "@/types";

export async function GET() {
  try {
    const allTrips = await db.select().from(trips);
    return NextResponse.json(allTrips);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to fetch trips" },
      { status: 500 },
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const parsed = createTripSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const {
      name,
      startDate,
      endDate,
      days,
      startAirport,
      endAirport,
      timeOfYear,
      style,
      budget,
    } = parsed.data;

    const id = crypto.randomUUID();
    const shareToken = crypto.randomBytes(8).toString("hex");

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const newTrip = await db
      .insert(trips)
      .values({
        id,
        name,
        startDate: start,
        endDate: end,
        days: days ? parseInt(String(days)) : null,
        startAirport: startAirport || null,
        endAirport: endAirport || null,
        timeOfYear: timeOfYear || null,
        style,
        budget,
        shareToken,
      })
      .returning();

    return NextResponse.json(newTrip[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to create trip" },
      { status: 500 },
    );
  }
}
