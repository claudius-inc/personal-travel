"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Camera, Loader2, Receipt, Check, X, Sparkles } from "lucide-react";

type ExtractedData = {
  amount: number | null;
  merchant: string | null;
  date: string | null;
  currency: string | null;
  confidence: "high" | "medium" | "low";
};

type ReceiptScannerProps = {
  onDataExtracted: (data: {
    amount: string;
    description: string;
    date: string;
    currency: string;
  }) => void;
};

export function ReceiptScanner({ onDataExtracted }: ReceiptScannerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [scanning, setScanning] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Editable fields for confirmation
  const [editAmount, setEditAmount] = useState("");
  const [editDescription, setEditDescription] = useState("");
  const [editDate, setEditDate] = useState("");
  const [editCurrency, setEditCurrency] = useState("USD");

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Create preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    setError(null);
    setExtractedData(null);

    // Scan receipt
    setScanning(true);
    try {
      const formData = new FormData();
      formData.append("image", file);

      const res = await fetch("/api/receipt/scan", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        throw new Error("Failed to scan receipt");
      }

      const data: ExtractedData = await res.json();
      setExtractedData(data);

      // Pre-fill editable fields
      setEditAmount(data.amount?.toString() || "");
      setEditDescription(data.merchant || "");
      setEditDate(data.date || new Date().toISOString().split("T")[0]);
      setEditCurrency(data.currency || "USD");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to scan receipt");
    } finally {
      setScanning(false);
    }
  };

  const handleConfirm = () => {
    onDataExtracted({
      amount: editAmount,
      description: editDescription,
      date: editDate,
      currency: editCurrency,
    });
    handleClose();
  };

  const handleClose = () => {
    setIsOpen(false);
    setPreviewUrl(null);
    setExtractedData(null);
    setError(null);
    setEditAmount("");
    setEditDescription("");
    setEditDate("");
    setEditCurrency("USD");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerCapture = () => {
    fileInputRef.current?.click();
  };

  return (
    <>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
        data-testid="receipt-scanner-button"
      >
        <Camera className="w-4 h-4" />
        Scan Receipt
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Receipt className="w-5 h-5" />
              Scan Receipt
            </DialogTitle>
            <DialogDescription>
              Take a photo of your receipt and AI will extract the details
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              capture="environment"
              onChange={handleFileSelect}
              className="hidden"
            />

            {/* No preview yet - show capture button */}
            {!previewUrl && (
              <div
                onClick={triggerCapture}
                className="border-2 border-dashed border-border rounded-xl p-8 text-center cursor-pointer hover:border-indigo-500 hover:bg-indigo-50/10 transition-colors"
              >
                <Camera className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground mb-2">
                  Tap to take a photo or select an image
                </p>
                <p className="text-xs text-muted-foreground/70">
                  Supports JPG, PNG, HEIC
                </p>
              </div>
            )}

            {/* Preview with scanning/results */}
            {previewUrl && (
              <div className="space-y-4">
                {/* Image preview */}
                <div className="relative rounded-lg overflow-hidden border border-border">
                  <img
                    src={previewUrl}
                    alt="Receipt preview"
                    className="w-full max-h-48 object-contain bg-muted"
                  />
                  {scanning && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <div className="text-center">
                        <Loader2 className="w-8 h-8 animate-spin text-white mx-auto mb-2" />
                        <p className="text-white text-sm">Analyzing receipt...</p>
                      </div>
                    </div>
                  )}
                </div>

                {/* Error message */}
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800 rounded-lg">
                    <p className="text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
                      <X className="w-4 h-4" />
                      {error}
                    </p>
                    <Button
                      variant="link"
                      size="sm"
                      onClick={triggerCapture}
                      className="text-red-600 dark:text-red-400 p-0 h-auto mt-1"
                    >
                      Try again
                    </Button>
                  </div>
                )}

                {/* Extracted data - editable form */}
                {extractedData && !error && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-2 text-sm text-emerald-600 dark:text-emerald-400">
                      <Sparkles className="w-4 h-4" />
                      <span>AI extracted the following details:</span>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Amount</Label>
                        <Input
                          type="number"
                          step="0.01"
                          value={editAmount}
                          onChange={(e) => setEditAmount(e.target.value)}
                          className="bg-muted"
                          placeholder="0.00"
                        />
                      </div>
                      <div className="space-y-1">
                        <Label className="text-xs text-muted-foreground">Currency</Label>
                        <select
                          value={editCurrency}
                          onChange={(e) => setEditCurrency(e.target.value)}
                          className="w-full h-10 rounded-md border border-border bg-muted px-3 text-sm"
                        >
                          {["USD", "EUR", "GBP", "JPY", "SGD", "AUD", "CAD", "THB"].map(
                            (c) => (
                              <option key={c} value={c}>
                                {c}
                              </option>
                            )
                          )}
                        </select>
                      </div>
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Description / Merchant</Label>
                      <Input
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="bg-muted"
                        placeholder="Restaurant, Shop, etc."
                      />
                    </div>

                    <div className="space-y-1">
                      <Label className="text-xs text-muted-foreground">Date</Label>
                      <Input
                        type="date"
                        value={editDate}
                        onChange={(e) => setEditDate(e.target.value)}
                        className="bg-muted [color-scheme:light] dark:[color-scheme:dark]"
                      />
                    </div>

                    {extractedData.confidence !== "high" && (
                      <p className="text-xs text-amber-600 dark:text-amber-400">
                        ⚠️ Some values may need verification (confidence:{" "}
                        {extractedData.confidence})
                      </p>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            {extractedData && !error && (
              <Button
                onClick={handleConfirm}
                className="bg-indigo-600 hover:bg-indigo-700"
                disabled={!editAmount || !editDescription}
              >
                <Check className="w-4 h-4 mr-2" />
                Add Expense
              </Button>
            )}
            {previewUrl && !scanning && !extractedData && (
              <Button onClick={triggerCapture} variant="outline">
                Try Again
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
