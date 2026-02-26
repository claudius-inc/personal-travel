import { format } from "date-fns";
import { WeatherWidget } from "@/components/WeatherWidget";
import { ItineraryTimeline } from "@/components/ItineraryTimeline";
import { db } from "@/db";
import { trips, itineraryItems } from "@/db/schema";
import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";

export default async function SharedTripDetails({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  // Find trip by share token
  const tripQuery = await db
    .select()
    .from(trips)
    .where(eq(trips.shareToken, token));

  if (!tripQuery.length) {
    notFound();
  }

  const trip = tripQuery[0];

  const items = await db
    .select()
    .from(itineraryItems)
    .where(eq(itineraryItems.tripId, trip.id));

  return (
    <main className="container mx-auto max-w-4xl py-10 px-4">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent drop-shadow-sm">
          {trip.name}
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">
          {trip.startDate && trip.endDate ? (
            <>
              {format(new Date(trip.startDate), "MMMM do")} -{" "}
              {format(new Date(trip.endDate), "MMMM do, yyyy")}
            </>
          ) : (
            <span>Flexible Planning Phase</span>
          )}
        </p>
        <div className="flex justify-center mt-6">
          <WeatherWidget destination={trip.name} />
        </div>
      </header>

      <div className="mt-12">
        <ItineraryTimeline items={items} accentColor="teal" />
      </div>
    </main>
  );
}
