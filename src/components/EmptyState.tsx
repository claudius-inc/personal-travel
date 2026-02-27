"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plane, MapPin, Loader2, Sparkles } from "lucide-react";

const SAMPLE_TRIPS = [
  {
    name: "Tokyo Adventure",
    description: "5 days exploring Japan's capital",
    image: "🗼",
    url: "https://wanderlog.com/list/geoCategory/76228/things-to-do-and-places-to-visit-in-tokyo",
  },
  {
    name: "Paris Weekend",
    description: "Romantic 3-day getaway",
    image: "🗼",
    url: "https://www.tripadvisor.com/Attractions-g187147-Activities-Paris_Ile_de_France.html",
  },
  {
    name: "Bali Retreat",
    description: "7-day wellness & culture trip",
    image: "🏝️",
    url: "https://www.lonelyplanet.com/indonesia/bali",
  },
];

export default function EmptyState() {
  const router = useRouter();
  const [importing, setImporting] = useState<string | null>(null);

  const handleImportSample = async (trip: (typeof SAMPLE_TRIPS)[0]) => {
    setImporting(trip.name);
    try {
      const res = await fetch("/api/trips/quick-import", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          url: trip.url,
          name: trip.name 
        }),
      });

      if (res.ok) {
        const { tripId } = await res.json();
        router.push(`/trip/${tripId}`);
      }
    } catch (error) {
      console.error("Failed to import sample trip:", error);
    } finally {
      setImporting(null);
    }
  };

  return (
    <div className="space-y-8">
      {/* Empty state message */}
      <div className="text-center py-12 px-6 border border-border rounded-xl bg-gradient-to-b from-muted/50 to-background shadow-sm">
        <div className="flex justify-center mb-4">
          <div className="p-4 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
            <Plane className="w-8 h-8 text-indigo-500" />
          </div>
        </div>
        <h3 className="text-xl font-semibold text-foreground">
          No trips planned yet
        </h3>
        <p className="text-muted-foreground mt-2 max-w-md mx-auto">
          Start by creating a new trip, or import an existing itinerary from a URL or file.
        </p>
      </div>

      {/* Sample trips */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h4 className="text-sm font-medium text-muted-foreground">
            Try a sample trip to see how it works
          </h4>
        </div>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          {SAMPLE_TRIPS.map((trip) => (
            <Card
              key={trip.name}
              className="bg-card border-border hover:border-indigo-300 dark:hover:border-indigo-700 transition-colors cursor-pointer group"
              onClick={() => !importing && handleImportSample(trip)}
            >
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <span className="text-2xl">{trip.image}</span>
                  <div className="flex-1 min-w-0">
                    <h5 className="font-medium text-card-foreground truncate">
                      {trip.name}
                    </h5>
                    <p className="text-xs text-muted-foreground truncate">
                      {trip.description}
                    </p>
                  </div>
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="w-full mt-3 text-indigo-600 dark:text-indigo-400 group-hover:bg-indigo-50 dark:group-hover:bg-indigo-900/20"
                  disabled={!!importing}
                >
                  {importing === trip.name ? (
                    <>
                      <Loader2 className="w-3 h-3 animate-spin mr-2" />
                      Importing...
                    </>
                  ) : (
                    <>
                      <MapPin className="w-3 h-3 mr-2" />
                      Import
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Quick Import format tips */}
      <div className="bg-muted/50 border border-border rounded-lg p-4">
        <h4 className="text-sm font-medium text-foreground mb-2">
          💡 Quick Import supports:
        </h4>
        <ul className="text-sm text-muted-foreground space-y-1">
          <li>• <strong>URLs:</strong> Travel blogs, Wanderlog, TripIt, Google Docs</li>
          <li>• <strong>Files:</strong> PDFs and photos of itineraries</li>
          <li>• <strong>Formats:</strong> Day-by-day plans, location lists, flight confirmations</li>
        </ul>
      </div>
    </div>
  );
}
