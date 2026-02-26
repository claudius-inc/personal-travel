"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronDown, ChevronUp } from "lucide-react";
import { AirportAutocomplete } from "@/components/AirportAutocomplete";

export default function CreateTripForm() {
  const router = useRouter();
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
      ? newTrip.days && newTrip.timeOfYear
      : newTrip.startDate && newTrip.endDate);

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

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsCreating(true);
    try {
      const res = await fetch("/api/trips", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newTrip),
      });
      if (res.ok) {
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
        router.refresh();
      }
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <Card className="bg-card border-border shadow-sm rounded-xl">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-lg font-medium text-card-foreground">
          Plan a New Trip
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <form onSubmit={handleCreate} className="space-y-5">
          <div className="space-y-1.5">
            <Label
              htmlFor="name"
              className="text-muted-foreground text-sm font-medium"
            >
              Destination / Concept
            </Label>
            <Input
              id="name"
              placeholder="e.g. Scandinavia, Summer in Japan"
              value={newTrip.name}
              onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
              required
              className="bg-background border-border focus-visible:ring-ring text-foreground min-h-[40px]"
            />
          </div>

          <div className="flex bg-muted p-1 rounded-md">
            <button
              type="button"
              onClick={() => toggleFlexible(false)}
              className={`flex-1 text-sm font-medium py-1.5 rounded ${!newTrip.isFlexible ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
            >
              Exact Dates
            </button>
            <button
              type="button"
              onClick={() => toggleFlexible(true)}
              className={`flex-1 text-sm font-medium py-1.5 rounded ${newTrip.isFlexible ? "bg-background shadow-sm text-foreground" : "text-muted-foreground hover:text-foreground"}`}
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
                    className="text-muted-foreground text-sm font-medium"
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
                    className="bg-background border-border focus-visible:ring-ring text-foreground min-h-[40px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="end"
                    className="text-muted-foreground text-sm font-medium"
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
                    className="bg-background border-border focus-visible:ring-ring text-foreground min-h-[40px]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div
            data-testid="flexible-wrapper"
            className={`grid transition-all duration-300 ease-in-out ${!newTrip.isFlexible ? "grid-rows-[0fr] opacity-0 pointer-events-none" : "grid-rows-[1fr] opacity-100"}`}
          >
            <div className="overflow-hidden">
              <div className="grid grid-cols-2 gap-4 pb-1">
                <div className="space-y-1.5">
                  <Label
                    htmlFor="days"
                    className="text-muted-foreground text-sm font-medium"
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
                    className="bg-background border-border focus-visible:ring-ring text-foreground min-h-[40px]"
                  />
                </div>
                <div className="space-y-1.5">
                  <Label
                    htmlFor="time"
                    className="text-muted-foreground text-sm font-medium"
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
                    className="bg-background border-border focus-visible:ring-ring text-foreground min-h-[40px]"
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors uppercase tracking-wider"
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
                    className="text-muted-foreground text-sm font-medium"
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
                    className="text-muted-foreground text-sm font-medium"
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
            <Label className="text-muted-foreground text-sm font-medium block">
              Style
            </Label>
            <div className="flex flex-wrap gap-2">
              {STYLES.map((style) => (
                <button
                  key={style}
                  type="button"
                  onClick={() => setNewTrip({ ...newTrip, style })}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium capitalize transition-all border ${newTrip.style === style ? "bg-neutral-900 text-white border-neutral-900 shadow-sm dark:bg-white dark:text-neutral-900 dark:border-white" : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:bg-muted"}`}
                >
                  {style}
                </button>
              ))}
            </div>
          </div>

          <Button
            type="submit"
            disabled={isCreating || !isValid}
            className={`w-full text-white mt-4 min-h-[44px] transition-all duration-300 ${!isValid ? "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed" : "bg-neutral-900 hover:bg-neutral-800 shadow-md hover:shadow-lg dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"}`}
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
  );
}
