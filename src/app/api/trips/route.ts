import { db } from "@/db";
import { trips } from "@/db/schema";
import { NextResponse } from "next/server";
import crypto from "crypto";

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
    const id = crypto.randomUUID();
    const shareToken = crypto.randomBytes(8).toString("hex");

    // Parse the body
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
    } = body;

    if (!name) {
      return NextResponse.json(
        { error: "Missing required field: name" },
        { status: 400 },
      );
    }

    const start = startDate ? new Date(startDate) : null;
    const end = endDate ? new Date(endDate) : null;

    const newTrip = await db
      .insert(trips)
      .values({
        id,
        name,
        startDate: start,
        endDate: end,
        days: days ? parseInt(days) : null,
        startAirport,
        endAirport,
        timeOfYear,
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
