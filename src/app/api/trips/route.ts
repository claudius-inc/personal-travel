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
    const { name, startDate, endDate, style, budget } = body;

    if (!name || !startDate || !endDate) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const start = new Date(startDate);
    const end = new Date(endDate);

    const newTrip = await db
      .insert(trips)
      .values({
        id,
        name,
        startDate: start,
        endDate: end,
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
