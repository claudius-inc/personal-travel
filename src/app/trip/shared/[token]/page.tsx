import { format } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { MapPin } from "lucide-react";
import { WeatherWidget } from "@/components/WeatherWidget";
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

  const itemsByDay = items.reduce(
    (acc: Record<string, typeof items>, item) => {
      const dIndex = item.dayIndex.toString();
      if (!acc[dIndex]) acc[dIndex] = [];
      acc[dIndex].push(item);
      return acc;
    },
    {} as Record<string, typeof items>,
  );

  return (
    <main className="container mx-auto max-w-4xl py-10 px-4">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-500 to-emerald-500 bg-clip-text text-transparent drop-shadow-sm">
          {trip.name}
        </h1>
        <p className="text-neutral-500 mt-2 text-lg">
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

      {Object.keys(itemsByDay).length === 0 ? (
        <div className="text-center py-12 text-neutral-500">
          No itinerary items yet.
        </div>
      ) : (
        <div className="space-y-10 mt-12">
          {Object.keys(itemsByDay)
            .sort((a, b) => parseInt(a) - parseInt(b))
            .map((day) => (
              <div key={day} className="relative">
                <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3 text-neutral-900">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-100 text-teal-700 text-sm font-bold shadow-sm">
                    D{day}
                  </span>
                  Day {day}
                </h3>
                <div className="space-y-4 pl-4 border-l-2 border-neutral-200 ml-4">
                  {itemsByDay[day].map((item: (typeof items)[number]) => (
                    <Card
                      key={item.id}
                      className="bg-white border-neutral-200 relative -left-4 w-[calc(100%+16px)] shadow-sm hover:shadow transition-shadow"
                    >
                      <CardHeader className="py-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg text-neutral-900">
                              {item.location}
                            </CardTitle>
                            <CardDescription className="mt-1 flex items-center gap-2 text-neutral-500">
                              <MapPin className="w-3 h-3 text-neutral-400" />{" "}
                              {item.startTime} • {item.description}
                            </CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </main>
  );
}
