import { db } from "@/db";
import { expenses } from "@/db/schema";
import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import crypto from "crypto";
import { createExpenseSchema } from "@/types";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    const body = await request.json();
    const parsed = createExpenseSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json(
        { error: "Validation failed", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { amount, currency, description, paidBy, date } = parsed.data;
    const expenseId = crypto.randomUUID();
    const expenseDate = new Date(date);

    const newExpense = await db
      .insert(expenses)
      .values({
        id: expenseId,
        tripId: id,
        amount,
        currency,
        description,
        paidBy: paidBy || null,
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

export async function DELETE(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const expenseId = searchParams.get("expenseId");

    if (!expenseId) {
      return NextResponse.json(
        { error: "Missing expenseId query parameter" },
        { status: 400 },
      );
    }

    const deleted = await db
      .delete(expenses)
      .where(eq(expenses.id, expenseId))
      .returning();

    if (!deleted.length) {
      return NextResponse.json({ error: "Expense not found" }, { status: 404 });
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to delete expense" },
      { status: 500 },
    );
  }
}
