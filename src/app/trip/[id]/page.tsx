import { db } from "@/db";
import { trips, itineraryItems, expenses } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import TripDetailsClient from "../_components/TripDetailsClient";
import type { TripWithDetails } from "@/types";

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

  const [items, tripExpenses] = await Promise.all([
    db.select().from(itineraryItems).where(eq(itineraryItems.tripId, id)),
    db.select().from(expenses).where(eq(expenses.tripId, id)),
  ]);

  const trip: TripWithDetails = {
    ...tripRecord[0],
    itineraryItems: items,
    expenses: tripExpenses,
  };

  return <TripDetailsClient initialTrip={trip} />;
}
