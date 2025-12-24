import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Ambil scriptUrl dari body request (dikirim dari frontend)
    const { scriptUrl, amount, description, imageBase64, mimeType } = await request.json();

    if (!scriptUrl) return NextResponse.json({ message: 'User Script URL missing' }, { status: 400 });

    // Fetch langsung ke Script User, BUKAN ke env admin
    const res = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        action: 'add_transaction', 
        amount, 
        description, 
        imageBase64, 
        mimeType 
      }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Transaction API Error:", error);
    return NextResponse.json({ message: 'Gagal menghubungi script user' }, { status: 500 });
  }
}
