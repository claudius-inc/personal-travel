"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { AirportAutocomplete } from "@/components/AirportAutocomplete";

type Trip = {
  id: string;
  name: string;
  startDate: string;
  endDate: string;
  style: string;
};

export default function Home() {
  const [trips, setTrips] = useState<Trip[]>([]);
  const [loading, setLoading] = useState(true);
  const [dbError, setDbError] = useState(false);

  // New trip form state
  const [isCreating, setIsCreating] = useState(false);
  const [newTrip, setNewTrip] = useState({
    name: "",
    startDate: "",
    endDate: "",
    days: "",
    startAirport: "",
    endAirport: "",
    timeOfYear: "",
    style: "solo",
    budget: 0,
    isFlexible: false,
  });
  const [showAdvanced, setShowAdvanced] = useState(false);

  const STYLES = ["solo", "family", "friends", "luxury", "budget"];

  const isValid =
    newTrip.name.trim().length > 0 &&
    (newTrip.isFlexible
      ? newTrip.days || newTrip.timeOfYear
      : newTrip.startDate && newTrip.endDate);

  // Toggle between exact dates and flexible
  const toggleFlexible = (flex: boolean) => {
    setNewTrip((prev) => ({
      ...prev,
      isFlexible: flex,
      startDate: flex ? "" : prev.startDate,
      endDate: flex ? "" : prev.endDate,
      days: flex ? prev.days : "",
      timeOfYear: flex ? prev.timeOfYear : "",
    }));
  };

  useEffect(() => {
    fetch("/api/trips")
      .then((res) => {
        if (!res.ok) throw new Error("Database not connected");
        return res.json();
      })
      .then((data) => {
        setTrips(data || []);
        setLoading(false);
      })
      .catch(() => {
        setDbError(true);
        setLoading(false);
      });
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTrip),
      });
      const data = await res.json();
      setTrips([...trips, data]);
      setNewTrip({
        name: "",
        startDate: "",
        endDate: "",
        days: "",
        startAirport: "",
        endAirport: "",
        timeOfYear: "",
        style: "solo",
        budget: 0,
        isFlexible: false,
      });
      setShowAdvanced(false);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="container mx-auto max-w-5xl py-12 px-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="Travel AI Logo"
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg shadow-sm border border-neutral-200"
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-neutral-900">
              Your Journeys
            </h1>
            <p className="text-neutral-500 mt-1 text-base">
              Powered by OpenClaw AI.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-medium text-neutral-900">
            Upcoming Trips
          </h2>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-neutral-400" />
            </div>
          ) : dbError ? (
            <div className="text-center py-16 px-6 border border-rose-200 rounded-xl bg-rose-50/50 shadow-sm">
              <h3 className="text-lg font-medium text-rose-900">
                Database Not Connected
              </h3>
              <p className="text-rose-700 mt-2 max-w-sm mx-auto text-sm">
                No local database fallback is configured. Please set the{" "}
                <code className="bg-rose-100 px-1 py-0.5 rounded text-rose-800">
                  TURSO_DATABASE_URL
                </code>{" "}
                and{" "}
                <code className="bg-rose-100 px-1 py-0.5 rounded text-rose-800">
                  TURSO_AUTH_TOKEN
                </code>{" "}
                environment variables to connect your Turso database.
              </p>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-20 px-6 border border-neutral-200 rounded-xl bg-neutral-50 shadow-sm">
              <h3 className="text-lg font-medium text-neutral-900">
                No trips planned
              </h3>
              <p className="text-neutral-500 mt-2 text-sm">
                Create a new itinerary to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {trips.map((trip) => (
                <Link
                  href={`/trip/${trip.id}`}
                  key={trip.id}
                  className="group block h-full"
                >
                  <Card className="h-full bg-white border-neutral-200 hover:border-neutral-300 hover:shadow-md transition-all duration-300 overflow-hidden relative shadow-sm rounded-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-medium text-neutral-900">
                        {trip.name}
                      </CardTitle>
                      <CardDescription className="text-neutral-500 pt-1 text-sm">
                        {trip.startDate && trip.endDate ? (
                          <span>
                            {format(new Date(trip.startDate), "MMM d")} -{" "}
                            {format(new Date(trip.endDate), "MMM d, yyyy")}
                          </span>
                        ) : (
                          <span>Flexible Planning Phase</span>
                        )}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-0">
                      <span className="inline-flex items-center rounded-md bg-neutral-100 px-2 py-1 text-xs font-medium text-neutral-600">
                        {trip.style}
                      </span>
                    </CardFooter>
                  </Card>
                </Link>
              ))}
            </div>
          )}
        </div>

        <div>
          <Card className="bg-white border-neutral-200 shadow-sm rounded-xl">
            <CardHeader className="border-b border-neutral-100 pb-4">
              <CardTitle className="text-lg font-medium text-neutral-900">
                Plan a New Trip
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <form onSubmit={handleCreate} className="space-y-5">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="name"
                    className="text-neutral-700 text-sm font-medium"
                  >
                    Destination / Concept
                  </Label>
                  <Input
                    id="name"
                    placeholder="e.g. Scandinavia, Summer in Japan"
                    value={newTrip.name}
                    onChange={(e) =>
                      setNewTrip({ ...newTrip, name: e.target.value })
                    }
                    required
                    className="bg-white border-neutral-200 focus-visible:ring-neutral-400 text-neutral-900 min-h-[40px]"
                  />
                </div>

                <div className="flex bg-neutral-100 p-1 rounded-md">
                  <button
                    type="button"
                    onClick={() => toggleFlexible(false)}
                    className={`flex-1 text-sm font-medium py-1.5 rounded ${!newTrip.isFlexible ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500 hover:text-neutral-700"}`}
                  >
                    Exact Dates
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFlexible(true)}
                    className={`flex-1 text-sm font-medium py-1.5 rounded ${newTrip.isFlexible ? "bg-white shadow-sm text-neutral-900" : "text-neutral-500 hover:text-neutral-700"}`}
                  >
                    Flexible
                  </button>
                </div>

                <div
                  data-testid="dates-wrapper"
                  className={`grid transition-all duration-300 ease-in-out ${newTrip.isFlexible ? "grid-rows-[0fr] opacity-0 pointer-events-none" : "grid-rows-[1fr] opacity-100"}`}
                >
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-2 gap-4 pb-1">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="start"
                          className="text-neutral-700 text-sm font-medium"
                        >
                          Start Date
                        </Label>
                        <Input
                          id="start"
                          type="date"
                          value={newTrip.startDate}
                          onChange={(e) =>
                            setNewTrip({
                              ...newTrip,
                              startDate: e.target.value,
                            })
                          }
                          required={!newTrip.isFlexible}
                          className="bg-white border-neutral-200 focus-visible:ring-neutral-400 text-neutral-900 min-h-[40px]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="end"
                          className="text-neutral-700 text-sm font-medium"
                        >
                          End Date
                        </Label>
                        <Input
                          id="end"
                          type="date"
                          value={newTrip.endDate}
                          onChange={(e) =>
                            setNewTrip({ ...newTrip, endDate: e.target.value })
                          }
                          required={!newTrip.isFlexible}
                          className="bg-white border-neutral-200 focus-visible:ring-neutral-400 text-neutral-900 min-h-[40px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div
                  data-testid="flexible-wrapper"
                  className={`grid transition-all duration-300 ease-in-out ${!newTrip.isFlexible ? "grid-rows-[0fr] opacity-0 pointer-events-none absolute" : "grid-rows-[1fr] opacity-100 relative"}`}
                >
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-2 gap-4 pb-1">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="days"
                          className="text-neutral-700 text-sm font-medium"
                        >
                          Duration (Days)
                        </Label>
                        <Input
                          id="days"
                          type="number"
                          placeholder="14"
                          value={newTrip.days}
                          onChange={(e) =>
                            setNewTrip({ ...newTrip, days: e.target.value })
                          }
                          className="bg-white border-neutral-200 focus-visible:ring-neutral-400 text-neutral-900 min-h-[40px]"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="time"
                          className="text-neutral-700 text-sm font-medium"
                        >
                          Time of Year
                        </Label>
                        <Input
                          id="time"
                          placeholder="e.g. Mid-Summer"
                          value={newTrip.timeOfYear}
                          onChange={(e) =>
                            setNewTrip({
                              ...newTrip,
                              timeOfYear: e.target.value,
                            })
                          }
                          className="bg-white border-neutral-200 focus-visible:ring-neutral-400 text-neutral-900 min-h-[40px]"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="pt-2 border-t border-neutral-100">
                  <button
                    type="button"
                    onClick={() => setShowAdvanced(!showAdvanced)}
                    className="flex items-center gap-1.5 text-xs font-semibold text-neutral-500 hover:text-neutral-900 transition-colors uppercase tracking-wider"
                  >
                    {showAdvanced ? (
                      <ChevronUp className="w-3.5 h-3.5" />
                    ) : (
                      <ChevronDown className="w-3.5 h-3.5" />
                    )}
                    Travel Details
                  </button>
                </div>

                <div
                  data-testid="travel-details-wrapper"
                  className={`grid transition-all duration-300 ease-in-out ${!showAdvanced ? "grid-rows-[0fr] opacity-0 pointer-events-none mb-0" : "grid-rows-[1fr] opacity-100 mb-2"}`}
                >
                  <div className="overflow-hidden">
                    <div className="grid grid-cols-2 gap-4 pb-1">
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="startAir"
                          className="text-neutral-700 text-sm font-medium"
                        >
                          Start Airport
                        </Label>
                        <AirportAutocomplete
                          id="startAir"
                          value={newTrip.startAirport}
                          onChange={(value) =>
                            setNewTrip({ ...newTrip, startAirport: value })
                          }
                          placeholder="Search city or code..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <Label
                          htmlFor="endAir"
                          className="text-neutral-700 text-sm font-medium"
                        >
                          End Airport
                        </Label>
                        <AirportAutocomplete
                          id="endAir"
                          value={newTrip.endAirport}
                          onChange={(value) =>
                            setNewTrip({ ...newTrip, endAirport: value })
                          }
                          placeholder="Search city or code..."
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-2.5">
                  <Label className="text-neutral-700 text-sm font-medium block">
                    Style
                  </Label>
                  <div className="flex flex-wrap gap-2">
                    {STYLES.map((style) => (
                      <button
                        key={style}
                        type="button"
                        onClick={() => setNewTrip({ ...newTrip, style })}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all border ${newTrip.style === style ? "bg-neutral-900 text-white border-neutral-900 shadow-sm" : "bg-white text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50"}`}
                      >
                        {style}
                      </button>
                    ))}
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={isCreating || !isValid}
                  className={`w-full text-white mt-4 min-h-[44px] transition-all duration-300 ${!isValid ? "bg-neutral-200 text-neutral-400 hover:bg-neutral-200 cursor-not-allowed" : "bg-neutral-900 hover:bg-neutral-800 shadow-md hover:shadow-lg"}`}
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <span className="mr-2 text-lg leading-none">+</span>
                  )}
                  Create Trip
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </main>
  );
}
