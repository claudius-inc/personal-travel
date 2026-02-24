"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
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
import { PlusCircle, MapPin, Globe, PlaneTakeoff, Loader2 } from "lucide-react";

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
    style: "solo",
    budget: 0,
  });

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
      .catch((err) => {
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
        style: "solo",
        budget: 0,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <main className="container mx-auto max-w-5xl py-12 px-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
        <div className="flex items-center gap-4">
          <img
            src="/logo.png"
            alt="Travel AI Logo"
            className="w-14 h-14 rounded-xl shadow-lg border border-neutral-800"
          />
          <div>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight bg-gradient-to-br from-indigo-400 to-cyan-300 bg-clip-text text-transparent">
              Your Journeys
            </h1>
            <p className="text-neutral-400 mt-2 text-lg">
              Powered by OpenClaw AI.
            </p>
          </div>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-semibold flex items-center gap-2">
            <Globe className="w-6 h-6 text-indigo-400" /> Upcoming Trips
          </h2>

          {loading ? (
            <div className="flex justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
            </div>
          ) : dbError ? (
            <div className="text-center py-16 px-6 border border-rose-900/50 rounded-2xl bg-rose-950/20 backdrop-blur-md">
              <div className="w-12 h-12 rounded-full bg-rose-500/20 flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-rose-400" />
              </div>
              <h3 className="text-xl font-medium text-rose-200">
                Database Not Connected
              </h3>
              <p className="text-rose-400/80 mt-2 max-w-sm mx-auto text-sm">
                No local database fallback is configured. Please set the{" "}
                <code className="bg-rose-950 px-1 py-0.5 rounded text-rose-300">
                  TURSO_DATABASE_URL
                </code>{" "}
                and{" "}
                <code className="bg-rose-950 px-1 py-0.5 rounded text-rose-300">
                  TURSO_AUTH_TOKEN
                </code>{" "}
                environment variables in your{" "}
                <code className="bg-rose-950 px-1 py-0.5 rounded text-rose-300">
                  .env
                </code>{" "}
                file to connect your Turso database.
              </p>
            </div>
          ) : trips.length === 0 ? (
            <div className="text-center py-20 px-6 border border-neutral-800 rounded-2xl bg-neutral-900/30 backdrop-blur-md">
              <PlaneTakeoff className="w-12 h-12 text-neutral-600 mx-auto mb-4" />
              <h3 className="text-xl font-medium text-neutral-300">
                No trips planned
              </h3>
              <p className="text-neutral-500 mt-2">
                Create a new itinerary or let your agent parse a PDF.
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
                  <Card className="h-full bg-neutral-900/50 border-neutral-800 hover:border-indigo-500/50 hover:bg-neutral-900 transition-all duration-300 overflow-hidden relative">
                    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <CardHeader className="pb-4">
                      <CardTitle className="text-xl">{trip.name}</CardTitle>
                      <CardDescription className="text-neutral-400 flex items-center gap-1.5 pt-1">
                        <MapPin className="w-3.5 h-3.5" />
                        {format(new Date(trip.startDate), "MMM d")} -{" "}
                        {format(new Date(trip.endDate), "MMM d, yyyy")}
                      </CardDescription>
                    </CardHeader>
                    <CardFooter className="pt-2">
                      <span className="inline-flex items-center rounded-full bg-indigo-500/10 px-2.5 py-1 text-xs font-semibold text-indigo-400">
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
          <Card className="bg-neutral-900 border-neutral-800 shadow-2xl">
            <CardHeader>
              <CardTitle className="text-xl">Plan a New Trip</CardTitle>
              <CardDescription>Manually start an itinerary.</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleCreate} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Destination / Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g. Paris Getaway"
                    value={newTrip.name}
                    onChange={(e) =>
                      setNewTrip({ ...newTrip, name: e.target.value })
                    }
                    required
                    className="bg-neutral-950 border-neutral-800 focus-visible:ring-indigo-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="start">Start Date</Label>
                    <Input
                      id="start"
                      type="date"
                      value={newTrip.startDate}
                      onChange={(e) =>
                        setNewTrip({ ...newTrip, startDate: e.target.value })
                      }
                      required
                      className="bg-neutral-950 border-neutral-800 focus-visible:ring-indigo-500 [color-scheme:dark]"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="end">End Date</Label>
                    <Input
                      id="end"
                      type="date"
                      value={newTrip.endDate}
                      onChange={(e) =>
                        setNewTrip({ ...newTrip, endDate: e.target.value })
                      }
                      required
                      className="bg-neutral-950 border-neutral-800 focus-visible:ring-indigo-500 [color-scheme:dark]"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="style">Style</Label>
                  <Input
                    id="style"
                    placeholder="solo, family, luxury..."
                    value={newTrip.style}
                    onChange={(e) =>
                      setNewTrip({ ...newTrip, style: e.target.value })
                    }
                    className="bg-neutral-950 border-neutral-800 focus-visible:ring-indigo-500"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={isCreating}
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white mt-2"
                >
                  {isCreating ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <PlusCircle className="w-4 h-4 mr-2" />
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
