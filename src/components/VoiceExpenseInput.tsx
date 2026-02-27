"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Mic, MicOff, Loader2, Check, X, Sparkles } from "lucide-react";

type ParsedExpense = {
  amount: number;
  description: string;
  currency: string;
};

type VoiceExpenseInputProps = {
  onExpenseParsed: (expense: ParsedExpense) => void;
  defaultCurrency?: string;
};

// Extend window for SpeechRecognition types
interface SpeechRecognitionEvent extends Event {
  resultIndex: number;
  results: SpeechRecognitionResultList;
}

interface SpeechRecognitionErrorEvent extends Event {
  error: string;
  message: string;
}

interface SpeechRecognition extends EventTarget {
  continuous: boolean;
  interimResults: boolean;
  lang: string;
  start: () => void;
  stop: () => void;
  abort: () => void;
  onresult: ((event: SpeechRecognitionEvent) => void) | null;
  onerror: ((event: SpeechRecognitionErrorEvent) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}

interface SpeechRecognitionConstructor {
  new (): SpeechRecognition;
}

declare global {
  interface Window {
    SpeechRecognition: SpeechRecognitionConstructor;
    webkitSpeechRecognition: SpeechRecognitionConstructor;
  }
}

const CURRENCY_MAP: Record<string, string> = {
  dollar: "USD",
  dollars: "USD",
  usd: "USD",
  euro: "EUR",
  euros: "EUR",
  eur: "EUR",
  pound: "GBP",
  pounds: "GBP",
  gbp: "GBP",
  yen: "JPY",
  jpy: "JPY",
  singapore: "SGD",
  sgd: "SGD",
  australian: "AUD",
  aud: "AUD",
  canadian: "CAD",
  cad: "CAD",
  baht: "THB",
  thb: "THB",
};

function parseExpenseText(text: string, defaultCurrency: string): ParsedExpense | null {
  const lowerText = text.toLowerCase().trim();
  
  // Patterns to match amounts
  // "5 dollars", "five dollars", "$5", "5.50", etc.
  const amountPatterns = [
    /\$(\d+(?:\.\d{1,2})?)/,
    /(\d+(?:\.\d{1,2})?)\s*(?:dollars?|usd)/i,
    /(\d+(?:\.\d{1,2})?)\s*(?:euros?|eur)/i,
    /(\d+(?:\.\d{1,2})?)\s*(?:pounds?|gbp)/i,
    /(\d+(?:\.\d{1,2})?)\s*(?:yen|jpy)/i,
    /(\d+(?:\.\d{1,2})?)\s*(?:sgd|singapore)/i,
    /(\d+(?:\.\d{1,2})?)\s*(?:aud|australian)/i,
    /(\d+(?:\.\d{1,2})?)\s*(?:cad|canadian)/i,
    /(\d+(?:\.\d{1,2})?)\s*(?:baht|thb)/i,
    /(\d+(?:\.\d{1,2})?)/,
  ];

  let amount: number | null = null;

  for (const pattern of amountPatterns) {
    const match = lowerText.match(pattern);
    if (match) {
      amount = parseFloat(match[1]);
      break;
    }
  }

  if (amount === null || isNaN(amount)) {
    return null;
  }

  // Detect currency
  let currency = defaultCurrency;
  for (const [keyword, curr] of Object.entries(CURRENCY_MAP)) {
    if (lowerText.includes(keyword)) {
      currency = curr;
      break;
    }
  }
  // Also check for $ symbol
  if (lowerText.includes("$") && !lowerText.includes("s$")) {
    currency = "USD";
  }
  if (lowerText.includes("s$") || lowerText.includes("singapore")) {
    currency = "SGD";
  }

  // Extract description
  // Remove amount and currency words to get description
  let description = text
    .replace(/\$?\d+(?:\.\d{1,2})?/g, "")
    .replace(/\b(dollars?|usd|euros?|eur|pounds?|gbp|yen|jpy|sgd|singapore|aud|australian|cad|canadian|baht|thb)\b/gi, "")
    .replace(/\b(at|for|on|spent|paid|cost|costs|was|were)\b/gi, " ")
    .replace(/\s+/g, " ")
    .trim();

  // If no description extracted, use a default
  if (!description) {
    description = "Voice expense";
  }

  // Capitalize first letter
  description = description.charAt(0).toUpperCase() + description.slice(1);

  return { amount, description, currency };
}

export function VoiceExpenseInput({ onExpenseParsed, defaultCurrency = "USD" }: VoiceExpenseInputProps) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [parsedExpense, setParsedExpense] = useState<ParsedExpense | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSupported, setIsSupported] = useState(true);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  useEffect(() => {
    // Check for browser support
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsSupported(false);
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    recognition.onstart = () => {
      setIsListening(true);
      setError(null);
      setTranscript("");
      setParsedExpense(null);
    };

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let finalTranscript = "";
      let interimTranscript = "";

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          finalTranscript += result[0].transcript;
        } else {
          interimTranscript += result[0].transcript;
        }
      }

      const currentTranscript = finalTranscript || interimTranscript;
      setTranscript(currentTranscript);

      // Try to parse the expense when we have a final result
      if (finalTranscript) {
        const parsed = parseExpenseText(finalTranscript, defaultCurrency);
        setParsedExpense(parsed);
      }
    };

    recognition.onerror = (event: SpeechRecognitionErrorEvent) => {
      console.error("Speech recognition error:", event.error);
      setIsListening(false);
      if (event.error === "not-allowed") {
        setError("Microphone access denied. Please allow microphone access.");
      } else if (event.error === "no-speech") {
        setError("No speech detected. Please try again.");
      } else {
        setError("Could not recognize speech. Please try again.");
      }
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
    };
  }, [defaultCurrency]);

  const startListening = useCallback(() => {
    if (recognitionRef.current) {
      setTranscript("");
      setParsedExpense(null);
      setError(null);
      recognitionRef.current.start();
    }
  }, []);

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
  }, []);

  const handleConfirm = () => {
    if (parsedExpense) {
      onExpenseParsed(parsedExpense);
      setTranscript("");
      setParsedExpense(null);
    }
  };

  const handleCancel = () => {
    setTranscript("");
    setParsedExpense(null);
    setError(null);
  };

  if (!isSupported) {
    return null;
  }

  return (
    <div className="space-y-3">
      {/* Voice Button */}
      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant={isListening ? "destructive" : "outline"}
          size="sm"
          onClick={isListening ? stopListening : startListening}
          className={`flex items-center gap-2 ${
            isListening 
              ? "animate-pulse" 
              : "hover:bg-indigo-50 dark:hover:bg-indigo-950/30 hover:border-indigo-300 dark:hover:border-indigo-700"
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-4 h-4" />
              Stop
            </>
          ) : (
            <>
              <Mic className="w-4 h-4" />
              Voice Input
            </>
          )}
        </Button>
        {isListening && (
          <span className="text-xs text-muted-foreground animate-pulse flex items-center gap-1">
            <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
            Listening...
          </span>
        )}
      </div>

      {/* Transcript Display */}
      {transcript && (
        <div className="bg-muted/50 rounded-lg p-3 border border-border animate-in fade-in slide-in-from-bottom-2 duration-200">
          <p className="text-sm text-foreground italic">"{transcript}"</p>
        </div>
      )}

      {/* Parsed Result */}
      {parsedExpense && (
        <div className="bg-emerald-50 dark:bg-emerald-950/30 rounded-lg p-4 border border-emerald-200 dark:border-emerald-800 animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-start gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 mt-0.5" />
            <p className="text-sm font-medium text-emerald-800 dark:text-emerald-300">
              AI parsed your expense:
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2 text-sm mb-4">
            <div>
              <span className="text-muted-foreground block text-xs">Amount</span>
              <span className="font-semibold text-foreground">
                {parsedExpense.currency} {parsedExpense.amount.toFixed(2)}
              </span>
            </div>
            <div className="col-span-2">
              <span className="text-muted-foreground block text-xs">Description</span>
              <span className="font-semibold text-foreground">{parsedExpense.description}</span>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              onClick={handleConfirm}
              className="flex-1 bg-emerald-600 hover:bg-emerald-700 dark:bg-emerald-500 dark:hover:bg-emerald-600 text-white"
            >
              <Check className="w-4 h-4 mr-1" />
              Confirm & Add
            </Button>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleCancel}
              className="text-muted-foreground"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Error Display */}
      {error && (
        <div className="bg-red-50 dark:bg-red-950/30 rounded-lg p-3 border border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Hint */}
      {!isListening && !transcript && !parsedExpense && (
        <p className="text-xs text-muted-foreground">
          Say something like "Coffee at Starbucks, 5 dollars" or "Lunch 25 euros"
        </p>
      )}
    </div>
  );
}
