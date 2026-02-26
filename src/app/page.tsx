import Image from "next/image";
import Link from "next/link";
import { format } from "date-fns";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { db } from "@/db";
import { trips } from "@/db/schema";
import CreateTripForm from "./_components/CreateTripForm";
import { ThemeToggle } from "@/components/ThemeToggle";

export default async function Home() {
  let allTrips: (typeof trips.$inferSelect)[] = [];
  let dbError = false;

  try {
    allTrips = await db.select().from(trips);
  } catch {
    dbError = true;
  }

  return (
    <main className="container mx-auto max-w-5xl py-12 px-6">
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-16 gap-6">
        <div className="flex items-center gap-4">
          <Image
            src="/logo.png"
            alt="Travel AI Logo"
            width={40}
            height={40}
            className="w-10 h-10 rounded-lg shadow-sm border border-border"
          />
          <div>
            <h1 className="text-3xl md:text-4xl font-semibold tracking-tight text-foreground">
              Your Journeys
            </h1>
            <p className="text-muted-foreground mt-1 text-base">
              Powered by OpenClaw AI.
            </p>
          </div>
        </div>
        <ThemeToggle />
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
        <div className="md:col-span-2 space-y-6">
          <h2 className="text-2xl font-medium text-foreground">
            Upcoming Trips
          </h2>

          {dbError ? (
            <div className="text-center py-16 px-6 border border-rose-200 dark:border-rose-800 rounded-xl bg-rose-50/50 dark:bg-rose-950/30 shadow-sm">
              <h3 className="text-lg font-medium text-rose-900 dark:text-rose-300">
                Database Not Connected
              </h3>
              <p className="text-rose-700 dark:text-rose-400 mt-2 max-w-sm mx-auto text-sm">
                No local database fallback is configured. Please set the{" "}
                <code className="bg-rose-100 dark:bg-rose-900 px-1 py-0.5 rounded text-rose-800 dark:text-rose-300">
                  TURSO_DATABASE_URL
                </code>{" "}
                and{" "}
                <code className="bg-rose-100 dark:bg-rose-900 px-1 py-0.5 rounded text-rose-800 dark:text-rose-300">
                  TURSO_AUTH_TOKEN
                </code>{" "}
                environment variables to connect your Turso database.
              </p>
            </div>
          ) : allTrips.length === 0 ? (
            <div className="text-center py-20 px-6 border border-border rounded-xl bg-muted shadow-sm">
              <h3 className="text-lg font-medium text-foreground">
                No trips planned
              </h3>
              <p className="text-muted-foreground mt-2 text-sm">
                Create a new itinerary to get started.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {allTrips.map((trip) => (
                <Link
                  href={`/trip/${trip.id}`}
                  key={trip.id}
                  className="group block h-full"
                >
                  <Card className="h-full bg-card border-border hover:border-foreground/20 hover:shadow-md transition-all duration-300 overflow-hidden relative shadow-sm rounded-xl">
                    <CardHeader className="pb-4">
                      <CardTitle className="text-lg font-medium text-card-foreground">
                        {trip.name}
                      </CardTitle>
                      <CardDescription className="text-muted-foreground pt-1 text-sm">
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
                      <span className="inline-flex items-center rounded-md bg-muted px-2 py-1 text-xs font-medium text-muted-foreground">
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
          <CreateTripForm />
        </div>
      </div>
    </main>
  );
}
