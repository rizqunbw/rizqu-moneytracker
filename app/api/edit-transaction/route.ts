// d:\MoneyTracker\money-tracker\app\api\edit-transaction\route.ts
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { scriptUrl, rowIndex, amount, description, imageBase64, mimeType } = await request.json();

    if (!scriptUrl) return NextResponse.json({ message: 'User Script URL missing' }, { status: 400 });

    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'edit_transaction', 
        rowIndex,
        amount, 
        description, 
        imageBase64, 
        mimeType 
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Edit Transaction API Error:", error);
    return NextResponse.json({ message: 'Gagal menghubungi script user' }, { status: 500 });
  }
}
