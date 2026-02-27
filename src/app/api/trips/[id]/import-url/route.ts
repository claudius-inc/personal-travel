import { NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { db } from "@/db";
import { itineraryItems } from "@/db/schema";
import { importUrlSchema } from "@/types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const responseSchema: Schema = {
  type: Type.ARRAY,
  items: {
    type: Type.OBJECT,
    properties: {
      dayIndex: { type: Type.INTEGER },
      startTime: { type: Type.STRING },
      endTime: { type: Type.STRING },
      location: { type: Type.STRING },
      description: { type: Type.STRING },
      address: { type: Type.STRING },
    },
    required: ["dayIndex", "location"],
  },
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

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  const { id } = await context.params;

  try {
    const body = await request.json();
    const parsed = importUrlSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.flatten().fieldErrors },
        { status: 400 },
      );
    }

    const { url } = parsed.data;

    // Server-side fetch the URL
    const res = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; TravelPlanner/1.0)",
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

    // Truncate to avoid token overflow
    const truncated = text.slice(0, 15000);

    // Feed to Gemini with itinerary extraction schema
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              text: `Extract any travel itinerary, activities, or points of interest from this web page content. Return structured itinerary items with day numbers, times, locations, and descriptions. If the content doesn't contain travel information, return an empty array.\n\nWeb page content:\n${truncated}`,
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: responseSchema,
        temperature: 0.1,
      },
    });

    const items = JSON.parse(response.text || "[]");

    // Save items to DB
    const savedItems = [];
    for (const item of items) {
      const newItem = await db
        .insert(itineraryItems)
        .values({
          id: crypto.randomUUID(),
          tripId: id,
          dayIndex: item.dayIndex,
          startTime: item.startTime || null,
          endTime: item.endTime || null,
          location: item.location,
          description: item.description || null,
          address: item.address || null,
          sortOrder: 0,
        })
        .returning();
      savedItems.push(newItem[0]);
    }

    return NextResponse.json({ items: savedItems });
  } catch (error) {
    console.error("Error importing URL:", error);
    return NextResponse.json(
      { error: "Failed to import from URL" },
      { status: 500 },
    );
  }
}
