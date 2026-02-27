"use client";

import { useState, useEffect } from "react";
import { X, Plane, Upload, Map, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

const ONBOARDING_KEY = "personal-travel-onboarded";

interface OnboardingStep {
  icon: React.ReactNode;
  title: string;
  description: string;
}

const steps: OnboardingStep[] = [
  {
    icon: <Plane className="w-8 h-8 text-indigo-500" />,
    title: "Plan Your Journey",
    description:
      "Create a new trip by entering your destination, dates, and travel style. Our AI will help you build the perfect itinerary.",
  },
  {
    icon: <Upload className="w-8 h-8 text-emerald-500" />,
    title: "Import Existing Plans",
    description:
      "Already have an itinerary? Paste a URL from travel blogs, or upload a PDF/photo. We support Wanderlog, TripIt, Google Docs, and more.",
  },
  {
    icon: <Map className="w-8 h-8 text-amber-500" />,
    title: "Explore & Customize",
    description:
      "View your trip on an interactive map, get AI-powered insights for each location, and track expenses as you go.",
  },
];

interface OnboardingOverlayProps {
  onImportSample?: () => void;
}

export default function OnboardingOverlay({
  onImportSample,
}: OnboardingOverlayProps) {
  const [open, setOpen] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  useEffect(() => {
    // Check if user has seen onboarding
    const hasOnboarded = localStorage.getItem(ONBOARDING_KEY);
    if (!hasOnboarded) {
      setOpen(true);
    }
  }, []);

  const handleComplete = () => {
    localStorage.setItem(ONBOARDING_KEY, "true");
    setOpen(false);
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handleSkip = () => {
    handleComplete();
  };

  const handleImportSample = () => {
    handleComplete();
    onImportSample?.();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        className="sm:max-w-md"
        showCloseButton={false}
      >
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="p-3 rounded-full bg-muted">
              {steps[currentStep].icon}
            </div>
          </div>
          <DialogTitle className="text-xl">
            {steps[currentStep].title}
          </DialogTitle>
          <DialogDescription className="text-base pt-2">
            {steps[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex justify-center gap-2 py-4">
          {steps.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentStep(index)}
              className={`w-2 h-2 rounded-full transition-colors ${
                index === currentStep
                  ? "bg-indigo-500"
                  : "bg-muted-foreground/30"
              }`}
            />
          ))}
        </div>

        <div className="flex flex-col gap-3 pt-2">
          <Button
            onClick={handleNext}
            className="w-full bg-indigo-600 hover:bg-indigo-700"
          >
            {currentStep < steps.length - 1 ? (
              <>
                Next <ArrowRight className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Get Started <Sparkles className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>

          {currentStep === steps.length - 1 && onImportSample && (
            <Button
              variant="outline"
              onClick={handleImportSample}
              className="w-full"
            >
              <Upload className="w-4 h-4 mr-2" />
              Import a Sample Trip
            </Button>
          )}

          <Button
            variant="ghost"
            onClick={handleSkip}
            className="w-full text-muted-foreground"
          >
            Skip for now
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
