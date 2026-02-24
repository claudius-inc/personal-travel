import { db } from "@/db";
import { trips, itineraryItems, expenses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import TripDetailsClient from "../_components/TripDetailsClient";
import type { Trip } from "../_components/TripDetailsClient";

export default async function TripDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const tripRecord = await db.select().from(trips).where(eq(trips.id, id));

  if (!tripRecord.length) {
    notFound();
  }

  const items = await db
    .select()
    .from(itineraryItems)
    .where(eq(itineraryItems.tripId, id));

  const tripExpenses = await db
    .select()
    .from(expenses)
    .where(eq(expenses.tripId, id));

  const trip = {
    ...tripRecord[0],
    startDate: tripRecord[0].startDate ?? null,
    endDate: tripRecord[0].endDate ?? null,
    style: tripRecord[0].style ?? "solo",
    budget: tripRecord[0].budget ?? 0,
    itineraryItems: items,
    expenses: tripExpenses,
  } as Trip;

  return <TripDetailsClient initialTrip={trip} />;
}
