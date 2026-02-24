"use client";

import { useState, useEffect, useMemo } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";

type Airport = {
  iata: string;
  name: string;
  iso: string;
  type: string;
};

export function AirportAutocomplete({
  value,
  onChange,
  placeholder = "Select airport...",
  id,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  id?: string;
}) {
  const [open, setOpen] = useState(false);
  const [airports, setAirports] = useState<Airport[]>([]);
  const [search, setSearch] = useState("");

  // Load airports once on mount
  useEffect(() => {
    fetch("/data/airports.json")
      .then((res) => res.json())
      .then((data: Airport[]) => {
        // Filter out closed airports and heliports to keep the list relevant to travelers
        const validAirports = data.filter(
          (a) =>
            a.iata &&
            a.name &&
            (a.type === "airport" || a.type === "medium" || a.type === "large"),
        );
        setAirports(validAirports);
      })
      .catch((err) => console.error("Failed to load airports:", err));
  }, []);

  // Use memoized basic filtering so the UI doesn't freeze when typing on a massive 70k list
  const filteredAirports = useMemo(() => {
    if (!search) return airports.slice(0, 50); // Show top 50 by default when opened

    const lowerSearch = search.toLowerCase();

    return airports
      .filter(
        (a) =>
          a.iata?.toLowerCase().includes(lowerSearch) ||
          a.name?.toLowerCase().includes(lowerSearch) ||
          a.iso?.toLowerCase().includes(lowerSearch),
      )
      .slice(0, 50); // Limit to 50 results at a time for performance
  }, [search, airports]);

  // Find the selected airport object to display its code in the button
  const selectedAirport = airports.find((a) => a.iata === value);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between bg-white border-neutral-200 hover:bg-neutral-50 hover:text-neutral-900 text-neutral-900 min-h-[40px] font-normal px-3"
        >
          {selectedAirport ? (
            <span className="truncate flex items-center gap-2">
              <span className="font-semibold text-neutral-900">
                {selectedAirport.iata}
              </span>
              <span className="text-neutral-500 truncate max-w-[120px] sm:max-w-full">
                {selectedAirport.name}
              </span>
            </span>
          ) : (
            <span className="text-neutral-500">
              {value ? value : placeholder}
            </span>
          )}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[300px] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput
            placeholder="Search city or airport code..."
            value={search}
            onValueChange={setSearch}
          />
          <CommandList>
            {filteredAirports.length === 0 && search.length > 0 && (
              <CommandEmpty>No airport found.</CommandEmpty>
            )}
            <CommandGroup>
              {filteredAirports.map((airport) => (
                <CommandItem
                  key={airport.iata}
                  value={airport.iata}
                  onSelect={(currentValue) => {
                    onChange(currentValue === value ? "" : currentValue);
                    setOpen(false);
                  }}
                >
                  <Check
                    className={cn(
                      "mr-2 h-4 w-4",
                      value === airport.iata ? "opacity-100" : "opacity-0",
                    )}
                  />
                  <div className="flex flex-col">
                    <span className="font-medium flex items-center gap-2">
                      {airport.iata}
                      <span className="text-xs text-neutral-400 font-normal py-0.5 px-1.5 bg-neutral-100 rounded-md">
                        {airport.iso}
                      </span>
                    </span>
                    <span className="text-xs text-neutral-500 truncate mt-0.5">
                      {airport.name}
                    </span>
                  </div>
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
}
