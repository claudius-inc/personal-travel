import { NextResponse } from "next/server";
import { GoogleGenAI, Type, Schema } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

const receiptSchema: Schema = {
  type: Type.OBJECT,
  properties: {
    amount: {
      type: Type.NUMBER,
      description: "The total amount on the receipt",
    },
    merchant: {
      type: Type.STRING,
      description: "The merchant or store name",
    },
    date: {
      type: Type.STRING,
      description: "The date on the receipt in YYYY-MM-DD format",
    },
    currency: {
      type: Type.STRING,
      description: "The currency code (e.g., USD, EUR, GBP, JPY, SGD, THB)",
    },
    confidence: {
      type: Type.STRING,
      description: "Confidence level: high, medium, or low",
    },
  },
  required: ["amount", "merchant", "date", "currency", "confidence"],
};

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return NextResponse.json(
        { error: "No image provided" },
        { status: 400 }
      );
    }

    // Convert file to base64
    const bytes = await imageFile.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64Image = buffer.toString("base64");

    // Determine mime type
    const mimeType = imageFile.type || "image/jpeg";

    const prompt = `You are analyzing a receipt image. Extract the following information:
1. Total amount (the final amount paid, not subtotals)
2. Merchant/store name
3. Date of purchase (convert to YYYY-MM-DD format)
4. Currency (detect from symbols like $, €, £, ¥, S$, ฿ or text)

If you cannot clearly read a value, make your best guess based on context.
Set confidence to:
- "high" if all values are clearly readable
- "medium" if some values required interpretation
- "low" if significant guessing was required

For currency:
- $ alone typically means USD unless in Singapore (SGD) or other context
- € means EUR
- £ means GBP
- ¥ means JPY or CNY (prefer JPY for receipts)
- ฿ means THB
- S$ means SGD

If no date is visible, use today's date.
If you cannot determine the merchant, use "Unknown merchant".`;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [
        {
          role: "user",
          parts: [
            { text: prompt },
            {
              inlineData: {
                mimeType,
                data: base64Image,
              },
            },
          ],
        },
      ],
      config: {
        responseMimeType: "application/json",
        responseSchema: receiptSchema,
        temperature: 0.2,
      },
    });

    const result = JSON.parse(response.text || "{}");

    // Validate and clean up the response
    const cleanedResult = {
      amount: typeof result.amount === "number" ? result.amount : null,
      merchant:
        typeof result.merchant === "string"
          ? result.merchant.trim()
          : null,
      date:
        typeof result.date === "string"
          ? result.date
          : new Date().toISOString().split("T")[0],
      currency:
        typeof result.currency === "string"
          ? result.currency.toUpperCase()
          : "USD",
      confidence: ["high", "medium", "low"].includes(result.confidence)
        ? result.confidence
        : "low",
    };

    return NextResponse.json(cleanedResult);
  } catch (error) {
    console.error("Error scanning receipt:", error);
    return NextResponse.json(
      { error: "Failed to scan receipt" },
      { status: 500 }
    );
  }
}
