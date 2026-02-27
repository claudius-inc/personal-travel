"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, ChevronRight, ChevronLeft, Check, SkipForward } from "lucide-react";
import { AirportAutocomplete } from "@/components/AirportAutocomplete";

type WizardStep = 1 | 2 | 3 | 4;

const STEPS = [
  { number: 1, title: "Destination", description: "Where are you going?" },
  { number: 2, title: "When", description: "Set your travel dates" },
  { number: 3, title: "Style", description: "How do you travel?" },
  { number: 4, title: "Airports", description: "Optional flight details" },
];

export default function CreateTripForm() {
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState<WizardStep>(1);
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

  const STYLES = ["solo", "family", "friends", "luxury", "budget"];

  // Validation for each step
  const isStep1Valid = newTrip.name.trim().length > 0;
  const isStep2Valid = newTrip.isFlexible
    ? newTrip.days && newTrip.timeOfYear
    : newTrip.startDate && newTrip.endDate;
  const isStep3Valid = newTrip.style.length > 0;
  // Step 4 is always valid (optional)

  const canProceed = () => {
    switch (currentStep) {
      case 1: return isStep1Valid;
      case 2: return isStep2Valid;
      case 3: return isStep3Valid;
      case 4: return true;
      default: return false;
    }
  };

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

  const handleNext = () => {
    if (currentStep < 4) {
      setCurrentStep((prev) => (prev + 1) as WizardStep);
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep((prev) => (prev - 1) as WizardStep);
    }
  };

  const handleSkip = () => {
    if (currentStep === 4) {
      // Clear airport fields and submit
      setNewTrip((prev) => ({ ...prev, startAirport: "", endAirport: "" }));
      handleCreate();
    }
  };

  const handleCreate = async () => {
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
        setCurrentStep(1);
        router.refresh();
      }
    } finally {
      setIsCreating(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentStep === 4) {
      handleCreate();
    } else {
      handleNext();
    }
  };

  // Progress Indicator Component
  const ProgressIndicator = () => (
    <div className="flex items-center justify-between mb-8 px-2">
      {STEPS.map((step, idx) => (
        <div key={step.number} className="flex items-center flex-1 last:flex-none">
          <div className="flex flex-col items-center">
            <div
              className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold transition-all duration-300 ${
                currentStep > step.number
                  ? "bg-emerald-500 text-white"
                  : currentStep === step.number
                  ? "bg-neutral-900 text-white dark:bg-white dark:text-neutral-900 ring-4 ring-neutral-900/20 dark:ring-white/20"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {currentStep > step.number ? (
                <Check className="w-5 h-5" />
              ) : (
                step.number
              )}
            </div>
            <span
              className={`text-xs mt-2 font-medium hidden sm:block ${
                currentStep >= step.number
                  ? "text-foreground"
                  : "text-muted-foreground"
              }`}
            >
              {step.title}
            </span>
          </div>
          {idx < STEPS.length - 1 && (
            <div
              className={`flex-1 h-0.5 mx-3 transition-colors duration-300 ${
                currentStep > step.number ? "bg-emerald-500" : "bg-border"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );

  // Step 1: Destination
  const Step1 = () => (
    <div className="space-y-4 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground">Where are you going?</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Enter a destination or trip concept
        </p>
      </div>
      <div className="space-y-2">
        <Label htmlFor="name" className="text-muted-foreground text-sm font-medium">
          Destination / Concept
        </Label>
        <Input
          id="name"
          placeholder="e.g. Scandinavia, Summer in Japan, Road trip to LA"
          value={newTrip.name}
          onChange={(e) => setNewTrip({ ...newTrip, name: e.target.value })}
          autoFocus
          className="bg-background border-border focus-visible:ring-ring text-foreground min-h-[48px] text-lg"
        />
      </div>
    </div>
  );

  // Step 2: Dates
  const Step2 = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground">When are you traveling?</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Set exact dates or keep it flexible
        </p>
      </div>

      <div className="flex bg-muted p-1 rounded-md">
        <button
          type="button"
          onClick={() => toggleFlexible(false)}
          className={`flex-1 text-sm font-medium py-2 rounded transition-all ${
            !newTrip.isFlexible
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Exact Dates
        </button>
        <button
          type="button"
          onClick={() => toggleFlexible(true)}
          className={`flex-1 text-sm font-medium py-2 rounded transition-all ${
            newTrip.isFlexible
              ? "bg-background shadow-sm text-foreground"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Flexible
        </button>
      </div>

      {!newTrip.isFlexible ? (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start" className="text-muted-foreground text-sm font-medium">
              Start Date
            </Label>
            <Input
              id="start"
              type="date"
              value={newTrip.startDate}
              onChange={(e) => setNewTrip({ ...newTrip, startDate: e.target.value })}
              className="bg-background border-border focus-visible:ring-ring text-foreground min-h-[44px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end" className="text-muted-foreground text-sm font-medium">
              End Date
            </Label>
            <Input
              id="end"
              type="date"
              value={newTrip.endDate}
              onChange={(e) => setNewTrip({ ...newTrip, endDate: e.target.value })}
              className="bg-background border-border focus-visible:ring-ring text-foreground min-h-[44px]"
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="days" className="text-muted-foreground text-sm font-medium">
              Duration (Days)
            </Label>
            <Input
              id="days"
              type="number"
              placeholder="14"
              value={newTrip.days}
              onChange={(e) => setNewTrip({ ...newTrip, days: e.target.value })}
              className="bg-background border-border focus-visible:ring-ring text-foreground min-h-[44px]"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="time" className="text-muted-foreground text-sm font-medium">
              Time of Year
            </Label>
            <Input
              id="time"
              placeholder="e.g. Mid-Summer"
              value={newTrip.timeOfYear}
              onChange={(e) => setNewTrip({ ...newTrip, timeOfYear: e.target.value })}
              className="bg-background border-border focus-visible:ring-ring text-foreground min-h-[44px]"
            />
          </div>
        </div>
      )}
    </div>
  );

  // Step 3: Style
  const Step3 = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground">What's your travel style?</h3>
        <p className="text-muted-foreground text-sm mt-1">
          This helps us personalize recommendations
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {STYLES.map((style) => (
          <button
            key={style}
            type="button"
            onClick={() => setNewTrip({ ...newTrip, style })}
            className={`px-4 py-4 rounded-xl text-sm font-medium capitalize transition-all border ${
              newTrip.style === style
                ? "bg-neutral-900 text-white border-neutral-900 shadow-md dark:bg-white dark:text-neutral-900 dark:border-white"
                : "bg-background text-muted-foreground border-border hover:border-foreground/30 hover:bg-muted"
            }`}
          >
            {style === "solo" && "🚶 "}
            {style === "family" && "👨‍👩‍👧 "}
            {style === "friends" && "👯 "}
            {style === "luxury" && "💎 "}
            {style === "budget" && "💰 "}
            {style}
          </button>
        ))}
      </div>
    </div>
  );

  // Step 4: Airports (Optional)
  const Step4 = () => (
    <div className="space-y-5 animate-in fade-in slide-in-from-right-4 duration-300">
      <div className="text-center mb-6">
        <h3 className="text-xl font-semibold text-foreground">Flight details</h3>
        <p className="text-muted-foreground text-sm mt-1">
          Optional — helps with flight tracking
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="startAir" className="text-muted-foreground text-sm font-medium">
            Departure Airport
          </Label>
          <AirportAutocomplete
            id="startAir"
            value={newTrip.startAirport}
            onChange={(value) => setNewTrip({ ...newTrip, startAirport: value })}
            placeholder="Search city or code..."
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="endAir" className="text-muted-foreground text-sm font-medium">
            Return Airport
          </Label>
          <AirportAutocomplete
            id="endAir"
            value={newTrip.endAirport}
            onChange={(value) => setNewTrip({ ...newTrip, endAirport: value })}
            placeholder="Search city or code..."
          />
        </div>
      </div>
    </div>
  );

  return (
    <Card className="bg-card border-border shadow-sm rounded-xl">
      <CardHeader className="border-b border-border pb-4">
        <CardTitle className="text-lg font-medium text-card-foreground">
          Plan a New Trip
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-6">
        <ProgressIndicator />

        <form onSubmit={handleSubmit}>
          <div className="min-h-[200px]">
            {currentStep === 1 && <Step1 />}
            {currentStep === 2 && <Step2 />}
            {currentStep === 3 && <Step3 />}
            {currentStep === 4 && <Step4 />}
          </div>

          {/* Navigation */}
          <div className="flex justify-between items-center mt-8 pt-6 border-t border-border">
            <Button
              type="button"
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 1}
              className={`${currentStep === 1 ? "invisible" : ""}`}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              Back
            </Button>

            <div className="flex gap-2">
              {currentStep === 4 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSkip}
                  disabled={isCreating}
                  className="text-muted-foreground"
                >
                  <SkipForward className="w-4 h-4 mr-1" />
                  Skip for now
                </Button>
              )}

              <Button
                type="submit"
                disabled={!canProceed() || isCreating}
                className={`min-w-[120px] transition-all duration-300 ${
                  !canProceed()
                    ? "bg-muted text-muted-foreground hover:bg-muted cursor-not-allowed"
                    : "bg-neutral-900 hover:bg-neutral-800 text-white shadow-md hover:shadow-lg dark:bg-white dark:text-neutral-900 dark:hover:bg-neutral-100"
                }`}
              >
                {isCreating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : currentStep === 4 ? (
                  <>
                    Create Trip
                    <Check className="w-4 h-4 ml-2" />
                  </>
                ) : (
                  <>
                    Next
                    <ChevronRight className="w-4 h-4 ml-1" />
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
