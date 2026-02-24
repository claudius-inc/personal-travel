import { db } from "@/db";
import { expenses } from "@/db/schema";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();

    const expenseId = crypto.randomUUID();
    const { amount, currency, description, paidBy, date } = body;

    if (amount === undefined || !description || !date) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    const expenseDate = new Date(date);

    const newExpense = await db
      .insert(expenses)
      .values({
        id: expenseId,
        tripId: id,
        amount,
        currency: currency || "USD",
        description,
        paidBy,
        date: expenseDate,
      })
      .returning();

    return NextResponse.json(newExpense[0]);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to add expense" },
      { status: 500 },
    );
  }
}
