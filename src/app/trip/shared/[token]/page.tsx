"use client";

import { useEffect, useState, use } from "react";
import { format } from "date-fns";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Loader2, MapPin } from "lucide-react";
import { WeatherWidget } from "@/components/WeatherWidget";

type Item = {
  id: string;
  dayIndex: number;
  startTime: string;
  location: string;
  description: string;
};

type Trip = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  style: string;
  itineraryItems: Item[];
  error?: string;
};

export default function SharedTripDetails({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = use(params);

  const [trip, setTrip] = useState<Trip | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrip = async () => {
      try {
        const res = await fetch(`/api/shared/${token}`);
        const data = await res.json();
        setTrip(data);
      } finally {
        setLoading(false);
      }
    };
    fetchTrip();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  if (!trip || trip.error) {
    return (
      <div className="text-center py-20 text-xl font-medium">
        Trip not found.
      </div>
    );
  }

  const itemsByDay = trip.itineraryItems.reduce(
    (acc: Record<string, Item[]>, item: Item) => {
      if (!acc[item.dayIndex]) acc[item.dayIndex] = [];
      acc[item.dayIndex].push(item);
      return acc;
    },
    {} as Record<string, Item[]>,
  );

  return (
    <main className="container mx-auto max-w-4xl py-10 px-4">
      <header className="mb-10 text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
          {trip.name}
        </h1>
        <p className="text-neutral-400 mt-2 text-lg">
          {format(new Date(trip.startDate), "MMMM do")} -{" "}
          {format(new Date(trip.endDate), "MMMM do, yyyy")}
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
                <h3 className="text-2xl font-semibold mb-6 flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-500/20 text-teal-400 text-sm">
                    D{day}
                  </span>
                  Day {day}
                </h3>
                <div className="space-y-4 pl-4 border-l-2 border-neutral-800 ml-4">
                  {itemsByDay[day].map((item: Item) => (
                    <Card
                      key={item.id}
                      className="bg-neutral-900 border-neutral-800 relative -left-4 w-[calc(100%+16px)]"
                    >
                      <CardHeader className="py-4">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg text-white">
                              {item.location}
                            </CardTitle>
                            <CardDescription className="mt-1 flex items-center gap-2">
                              <MapPin className="w-3 h-3" /> {item.startTime} •{" "}
                              {item.description}
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
