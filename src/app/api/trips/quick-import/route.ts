import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { db } from "@/db";
import { trips, itineraryItems } from "@/db/schema";
import crypto from "crypto";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const responseSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    tripName: {
      type: Type.STRING,
      description: "Destination or trip title extracted from the content",
    },
    startDate: {
      type: Type.STRING,
      description: "ISO date string (YYYY-MM-DD) if found, empty string otherwise",
    },
    endDate: {
      type: Type.STRING,
      description: "ISO date string (YYYY-MM-DD) if found, empty string otherwise",
    },
    items: {
      type: Type.ARRAY,
      items: {
        type: Type.OBJECT,
        properties: {
          dayIndex: {
            type: Type.INTEGER,
            description: "1-indexed day of the trip",
          },
          startTime: { type: Type.STRING, description: "Format HH:MM" },
          endTime: { type: Type.STRING, description: "Format HH:MM" },
          location: { type: Type.STRING, description: "Name of the place" },
          description: {
            type: Type.STRING,
            description: "Details about the activity",
          },
          address: {
            type: Type.STRING,
            description: "Formatted address if found",
          },
        },
        required: ["dayIndex", "location"],
      },
    },
  },
  required: ["tripName", "items"],
};

function stripHtmlToText(html: string): string {
  return html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, "")
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
}

const PROMPT =
  "Extract the travel itinerary from this content. Return a tripName (the destination or trip title), startDate and endDate (ISO YYYY-MM-DD format if found, empty string otherwise), and an array of itinerary items with day numbers, times, locations, and descriptions. If the content doesn't contain travel information, return tripName as 'Imported Trip' and an empty items array.";

export async function POST(request: NextRequest) {
  try {
    const contentType = request.headers.get("content-type") || "";
    let aiContents: Array<{ role: string; parts: Array<Record<string, unknown>> }>;

    if (contentType.includes("multipart/form-data")) {
      // File upload path
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      if (!file) {
        return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
      }

      const arrayBuffer = await file.arrayBuffer();
      const buffer = Buffer.from(arrayBuffer);
      const base64Data = buffer.toString("base64");
      const mimeType = file.type || "image/jpeg";

      aiContents = [
        {
          role: "user",
          parts: [
            { inlineData: { data: base64Data, mimeType } },
            { text: PROMPT },
          ],
        },
      ];
    } else {
      // JSON body with URL
      const body = await request.json();
      const url = body.url;
      if (!url || typeof url !== "string") {
        return NextResponse.json(
          { error: "A url or file is required" },
          { status: 400 },
        );
      }

      // Validate URL
      try {
        new URL(url);
      } catch {
        return NextResponse.json(
          { error: "Invalid URL" },
          { status: 400 },
        );
      }

      const res = await fetch(url, {
        headers: {
          "User-Agent": "Mozilla/5.0 (compatible; TravelPlanner/1.0)",
        },
      });

      if (!res.ok) {
        return NextResponse.json(
          { error: "Failed to fetch the URL" },
          { status: 400 },
        );
      }

      const html = await res.text();
      const text = stripHtmlToText(html);
      const truncated = text.slice(0, 15000);

      aiContents = [
        {
          role: "user",
          parts: [
            {
              text: `${PROMPT}\n\nWeb page content:\n${truncated}`,
            },
          ],
        },
      ];
    }

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: aiContents,
      config: {
        responseMimeType: "application/json",
        responseSchema,
        temperature: 0.1,
      },
    });

    const parsedText = response.text;
    if (!parsedText) {
      return NextResponse.json(
        { error: "AI failed to parse content" },
        { status: 500 },
      );
    }

    const result = JSON.parse(parsedText);
    const tripName = result.tripName || "Imported Trip";
    const startDate = result.startDate ? new Date(result.startDate) : null;
    const endDate = result.endDate ? new Date(result.endDate) : null;
    const items = result.items || [];

    // Create the trip
    const tripId = crypto.randomUUID();
    const shareToken = crypto.randomBytes(8).toString("hex");

    await db.insert(trips).values({
      id: tripId,
      name: tripName,
      startDate,
      endDate,
      style: "solo",
      budget: 0,
      shareToken,
    });

    // Create itinerary items
    for (const item of items) {
      await db.insert(itineraryItems).values({
        id: crypto.randomUUID(),
        tripId,
        dayIndex: item.dayIndex,
        startTime: item.startTime || null,
        endTime: item.endTime || null,
        location: item.location,
        description: item.description || null,
        address: item.address || null,
        sortOrder: 0,
      });
    }

    return NextResponse.json({ tripId });
  } catch (err) {
    console.error("Quick import error:", err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to import itinerary",
      },
      { status: 500 },
    );
  }
}
