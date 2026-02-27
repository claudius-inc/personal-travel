"use client";

import { useState } from "react";
import { format, addHours, parseISO } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Download,
  FileText,
  Calendar,
  MessageCircle,
  Share2,
  Loader2,
  Check,
} from "lucide-react";
import type { TripWithDetails, ItineraryItemRow } from "@/types";

type ExportMenuProps = {
  trip: TripWithDetails;
};

export function ExportMenu({ trip }: ExportMenuProps) {
  const [exporting, setExporting] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Generate ICS calendar file
  const generateICS = (): string => {
    const lines: string[] = [
      "BEGIN:VCALENDAR",
      "VERSION:2.0",
      "PRODID:-//Personal Travel//EN",
      "CALSCALE:GREGORIAN",
      "METHOD:PUBLISH",
    ];

    // Group items by day
    const itemsByDay = new Map<number, ItineraryItemRow[]>();
    for (const item of trip.itineraryItems) {
      const dayItems = itemsByDay.get(item.dayIndex) || [];
      dayItems.push(item);
      itemsByDay.set(item.dayIndex, dayItems);
    }

    // Create events for each item
    for (const item of trip.itineraryItems) {
      if (!trip.startDate) continue;

      const startDate = new Date(trip.startDate);
      const eventDate = new Date(startDate);
      eventDate.setDate(startDate.getDate() + item.dayIndex - 1);

      // Parse time or use defaults
      let startHour = 9;
      let startMinute = 0;
      if (item.startTime) {
        const [h, m] = item.startTime.split(":").map(Number);
        startHour = h || 9;
        startMinute = m || 0;
      }

      const eventStart = new Date(eventDate);
      eventStart.setHours(startHour, startMinute, 0, 0);
      const eventEnd = addHours(eventStart, 1);

      const formatICSDate = (date: Date) => {
        return format(date, "yyyyMMdd'T'HHmmss");
      };

      const uid = `${item.id}@personal-travel`;
      const summary = item.location.replace(/[,;\\]/g, " ");
      const description = (item.description || "").replace(/[,;\\]/g, " ");
      const location = (item.address || item.location).replace(/[,;\\]/g, " ");

      lines.push(
        "BEGIN:VEVENT",
        `UID:${uid}`,
        `DTSTAMP:${formatICSDate(new Date())}`,
        `DTSTART:${formatICSDate(eventStart)}`,
        `DTEND:${formatICSDate(eventEnd)}`,
        `SUMMARY:${summary}`,
        `DESCRIPTION:${description}`,
        `LOCATION:${location}`,
        "END:VEVENT"
      );
    }

    lines.push("END:VCALENDAR");
    return lines.join("\r\n");
  };

  // Generate PDF content (as HTML for print)
  const generatePDFContent = (): string => {
    const itemsByDay = new Map<number, ItineraryItemRow[]>();
    for (const item of trip.itineraryItems) {
      const dayItems = itemsByDay.get(item.dayIndex) || [];
      dayItems.push(item);
      itemsByDay.set(item.dayIndex, dayItems);
    }

    const sortedDays = Array.from(itemsByDay.entries()).sort(
      ([a], [b]) => a - b
    );

    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${trip.name} - Itinerary</title>
        <style>
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; 
            max-width: 800px; 
            margin: 0 auto; 
            padding: 40px 20px;
            color: #1a1a1a;
          }
          h1 { 
            color: #4f46e5; 
            border-bottom: 2px solid #4f46e5; 
            padding-bottom: 10px;
          }
          .meta { 
            color: #666; 
            margin-bottom: 30px;
          }
          .day { 
            margin-bottom: 30px; 
            page-break-inside: avoid;
          }
          .day-header { 
            background: linear-gradient(135deg, #4f46e5 0%, #7c3aed 100%); 
            color: white; 
            padding: 12px 16px; 
            border-radius: 8px; 
            margin-bottom: 16px;
            font-weight: 600;
          }
          .item { 
            padding: 12px 16px; 
            border-left: 3px solid #e5e7eb; 
            margin-bottom: 12px;
            background: #f9fafb;
            border-radius: 0 8px 8px 0;
          }
          .item-time { 
            color: #4f46e5; 
            font-weight: 500; 
            font-size: 0.9em;
          }
          .item-location { 
            font-weight: 600; 
            margin: 4px 0;
            font-size: 1.1em;
          }
          .item-description { 
            color: #666; 
            font-size: 0.9em;
          }
          .item-address { 
            color: #888; 
            font-size: 0.8em; 
            margin-top: 4px;
          }
          .expenses { 
            margin-top: 40px; 
            page-break-before: always;
          }
          .expense { 
            display: flex; 
            justify-content: space-between; 
            padding: 8px 0; 
            border-bottom: 1px solid #e5e7eb;
          }
          .total { 
            font-weight: bold; 
            font-size: 1.2em; 
            margin-top: 16px;
            padding-top: 16px;
            border-top: 2px solid #4f46e5;
          }
          @media print {
            body { padding: 20px; }
            .day { page-break-inside: avoid; }
          }
        </style>
      </head>
      <body>
        <h1>📍 ${trip.name}</h1>
        <div class="meta">
          ${
            trip.startDate && trip.endDate
              ? `${format(new Date(trip.startDate), "MMMM d")} - ${format(new Date(trip.endDate), "MMMM d, yyyy")}`
              : ""
          }
          ${trip.style ? ` • ${trip.style}` : ""}
          ${trip.budget ? ` • Budget: $${trip.budget}` : ""}
        </div>
    `;

    for (const [dayIndex, items] of sortedDays) {
      const sortedItems = items.sort(
        (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0)
      );
      
      let dayDateStr = "";
      if (trip.startDate) {
        const startDate = new Date(trip.startDate);
        const dayDate = new Date(startDate);
        dayDate.setDate(startDate.getDate() + dayIndex - 1);
        dayDateStr = ` - ${format(dayDate, "EEEE, MMMM d")}`;
      }

      html += `
        <div class="day">
          <div class="day-header">Day ${dayIndex}${dayDateStr}</div>
      `;

      for (const item of sortedItems) {
        html += `
          <div class="item">
            ${item.startTime ? `<div class="item-time">🕐 ${item.startTime}${item.endTime ? ` - ${item.endTime}` : ""}</div>` : ""}
            <div class="item-location">${item.location}</div>
            ${item.description ? `<div class="item-description">${item.description}</div>` : ""}
            ${item.address ? `<div class="item-address">📍 ${item.address}</div>` : ""}
          </div>
        `;
      }

      html += `</div>`;
    }

    // Add expenses section
    if (trip.expenses.length > 0) {
      const total = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
      html += `
        <div class="expenses">
          <h2>💰 Expenses</h2>
      `;

      for (const exp of trip.expenses) {
        html += `
          <div class="expense">
            <span>${exp.description}</span>
            <span>${exp.currency} ${exp.amount.toFixed(2)}</span>
          </div>
        `;
      }

      html += `
          <div class="total">
            <span>Total: $${total.toFixed(2)}</span>
          </div>
        </div>
      `;
    }

    html += `
      </body>
      </html>
    `;

    return html;
  };

  // Generate share message for WhatsApp/Telegram
  const generateShareMessage = (): string => {
    const lines: string[] = [];
    lines.push(`✈️ *${trip.name}*`);
    lines.push("");

    if (trip.startDate && trip.endDate) {
      lines.push(
        `📅 ${format(new Date(trip.startDate), "MMM d")} - ${format(new Date(trip.endDate), "MMM d, yyyy")}`
      );
    }

    if (trip.style) {
      lines.push(`🎒 Style: ${trip.style}`);
    }

    lines.push("");
    lines.push(`📍 *Itinerary Highlights:*`);

    // Group by day
    const itemsByDay = new Map<number, ItineraryItemRow[]>();
    for (const item of trip.itineraryItems) {
      const dayItems = itemsByDay.get(item.dayIndex) || [];
      dayItems.push(item);
      itemsByDay.set(item.dayIndex, dayItems);
    }

    const sortedDays = Array.from(itemsByDay.entries())
      .sort(([a], [b]) => a - b)
      .slice(0, 5); // Limit to first 5 days for brevity

    for (const [dayIndex, items] of sortedDays) {
      const sortedItems = items
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))
        .slice(0, 3); // Top 3 items per day
      
      lines.push("");
      lines.push(`*Day ${dayIndex}:*`);
      for (const item of sortedItems) {
        lines.push(`  • ${item.location}`);
      }
    }

    if (trip.expenses.length > 0) {
      const total = trip.expenses.reduce((sum, e) => sum + e.amount, 0);
      lines.push("");
      lines.push(`💰 Total spent: $${total.toFixed(0)}`);
    }

    lines.push("");
    lines.push("_Made with Personal Travel App_");

    return lines.join("\n");
  };

  const handleExportPDF = async () => {
    setExporting("pdf");
    try {
      const html = generatePDFContent();
      const printWindow = window.open("", "_blank");
      if (printWindow) {
        printWindow.document.write(html);
        printWindow.document.close();
        printWindow.print();
      }
      setSuccess("pdf");
      setTimeout(() => setSuccess(null), 2000);
    } finally {
      setExporting(null);
    }
  };

  const handleExportICS = async () => {
    setExporting("ics");
    try {
      const ics = generateICS();
      const blob = new Blob([ics], { type: "text/calendar;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${trip.name.replace(/\s+/g, "-")}.ics`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      setSuccess("ics");
      setTimeout(() => setSuccess(null), 2000);
    } finally {
      setExporting(null);
    }
  };

  const handleShareWhatsApp = () => {
    const message = generateShareMessage();
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleShareTelegram = () => {
    const message = generateShareMessage();
    const url = `https://t.me/share/url?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank");
  };

  const handleCopyLink = async () => {
    const shareUrl = window.location.href;
    await navigator.clipboard.writeText(shareUrl);
    setSuccess("link");
    setTimeout(() => setSuccess(null), 2000);
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size="sm" className="text-muted-foreground" data-testid="export-menu-trigger">
          <Download className="w-4 h-4 mr-1" /> Export
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Export Options</DropdownMenuLabel>
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleExportPDF} disabled={exporting === "pdf"} data-testid="export-pdf">
          {exporting === "pdf" ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : success === "pdf" ? (
            <Check className="w-4 h-4 mr-2 text-emerald-500" />
          ) : (
            <FileText className="w-4 h-4 mr-2" />
          )}
          Print / Save as PDF
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleExportICS} disabled={exporting === "ics"} data-testid="export-ics">
          {exporting === "ics" ? (
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
          ) : success === "ics" ? (
            <Check className="w-4 h-4 mr-2 text-emerald-500" />
          ) : (
            <Calendar className="w-4 h-4 mr-2" />
          )}
          Export to Calendar (.ics)
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        <DropdownMenuLabel>Share</DropdownMenuLabel>
        
        <DropdownMenuItem onClick={handleShareWhatsApp} data-testid="share-whatsapp">
          <MessageCircle className="w-4 h-4 mr-2" />
          Share to WhatsApp
        </DropdownMenuItem>
        
        <DropdownMenuItem onClick={handleShareTelegram} data-testid="share-telegram">
          <MessageCircle className="w-4 h-4 mr-2" />
          Share to Telegram
        </DropdownMenuItem>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem onClick={handleCopyLink} data-testid="copy-link">
          {success === "link" ? (
            <Check className="w-4 h-4 mr-2 text-emerald-500" />
          ) : (
            <Share2 className="w-4 h-4 mr-2" />
          )}
          Copy Link
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
