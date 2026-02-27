"use client";

import { useEffect, useState } from "react";
import { Loader2, CheckCircle2, XCircle, FileText, Globe, Sparkles, Database } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";

export type ImportStep = "fetching" | "parsing" | "creating" | "done" | "error";

interface ImportProgressModalProps {
  open: boolean;
  currentStep: ImportStep;
  importType: "url" | "file";
  itemCount?: number;
  error?: string;
  onClose?: () => void;
}

const stepConfig = {
  fetching: {
    label: "Fetching content...",
    description: "Downloading and extracting content",
    icon: Globe,
  },
  parsing: {
    label: "Parsing itinerary...",
    description: "AI is extracting locations, dates, and activities",
    icon: FileText,
  },
  creating: {
    label: "Creating trip...",
    description: "Saving your itinerary to the database",
    icon: Database,
  },
  done: {
    label: "Import complete!",
    description: "Your trip has been created successfully",
    icon: CheckCircle2,
  },
  error: {
    label: "Import failed",
    description: "Something went wrong during import",
    icon: XCircle,
  },
};

const stepOrder: ImportStep[] = ["fetching", "parsing", "creating", "done"];

export default function ImportProgressModal({
  open,
  currentStep,
  importType,
  itemCount,
  error,
  onClose,
}: ImportProgressModalProps) {
  const currentStepIndex = stepOrder.indexOf(currentStep);
  const isError = currentStep === "error";
  const isDone = currentStep === "done";

  return (
    <Dialog open={open} onOpenChange={(isOpen) => !isOpen && onClose?.()}>
      <DialogContent
        className="sm:max-w-sm"
        showCloseButton={isDone || isError}
      >
        <DialogHeader className="text-center">
          <div className="flex justify-center mb-4">
            {isDone ? (
              <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
              </div>
            ) : isError ? (
              <div className="p-3 rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="w-8 h-8 text-red-500" />
              </div>
            ) : (
              <div className="p-3 rounded-full bg-indigo-100 dark:bg-indigo-900/30">
                <Sparkles className="w-8 h-8 text-indigo-500 animate-pulse" />
              </div>
            )}
          </div>
          <DialogTitle className="text-lg">
            {isDone && itemCount
              ? `${itemCount} items imported!`
              : stepConfig[currentStep].label}
          </DialogTitle>
          <DialogDescription className="text-sm pt-1">
            {isError && error
              ? error
              : stepConfig[currentStep].description}
          </DialogDescription>
        </DialogHeader>

        {!isDone && !isError && (
          <div className="space-y-3 pt-4">
            {stepOrder.slice(0, -1).map((step, index) => {
              const StepIcon = stepConfig[step].icon;
              const isActive = step === currentStep;
              const isComplete = currentStepIndex > index;

              return (
                <div
                  key={step}
                  className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${
                    isActive
                      ? "bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800"
                      : isComplete
                      ? "bg-emerald-50 dark:bg-emerald-900/20"
                      : "bg-muted/50"
                  }`}
                >
                  <div
                    className={`flex-shrink-0 ${
                      isActive
                        ? "text-indigo-500"
                        : isComplete
                        ? "text-emerald-500"
                        : "text-muted-foreground"
                    }`}
                  >
                    {isActive ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : isComplete ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <StepIcon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`text-sm font-medium ${
                      isActive
                        ? "text-indigo-700 dark:text-indigo-300"
                        : isComplete
                        ? "text-emerald-700 dark:text-emerald-300"
                        : "text-muted-foreground"
                    }`}
                  >
                    {stepConfig[step].label}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
