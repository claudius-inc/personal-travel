import { type NextRequest, NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";
import { db } from "@/db";
import { itineraryItems } from "@/db/schema";
import crypto from "crypto";

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  const ai = new GoogleGenAI({});
  try {
    const { id } = await context.params;

    const formData = await request.formData();
    const file = formData.get("file") as File;
    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const base64Data = buffer.toString("base64");
    const mimeType = file.type || "image/jpeg";

    // We want the AI to return an array of itinerary items
    const responseSchema: Schema = {
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
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            {
              inlineData: {
                data: base64Data,
                mimeType,
              },
            },
            {
              text: "Extract the itinerary from this document. Return the structured data.",
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

    const parsedText = response.text;
    if (!parsedText) {
      return NextResponse.json(
        { error: "AI failed to parse document" },
        { status: 500 },
      );
    }

    const items = JSON.parse(parsedText);
    const insertedItems = [];

    // Save extracted items to DB
    for (const item of items) {
      const itemId = crypto.randomUUID();
      const newItem = await db
        .insert(itineraryItems)
        .values({
          id: itemId,
          tripId: id,
          ...item,
        })
        .returning();
      insertedItems.push(newItem[0]);
    }

    return NextResponse.json({ success: true, items: insertedItems });
  } catch (err: unknown) {
    console.error(err);
    return NextResponse.json(
      {
        error: err instanceof Error ? err.message : "Failed to parse itinerary",
      },
      { status: 500 },
    );
  }
}
