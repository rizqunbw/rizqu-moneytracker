import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { scriptUrl } = await request.json();

    if (!scriptUrl) {
      return NextResponse.json({ message: 'Script URL is required' }, { status: 400 });
    }

    // Panggil Script User dengan method GET
    const res = await fetch(`${scriptUrl}?action=get_transactions`, {
      method: 'GET',
      redirect: 'follow',
    });

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (e) {
      return NextResponse.json({ message: 'Invalid JSON from Google Script', raw: text }, { status: 502 });
    }
  } catch (error) {
    console.error("Get Transactions API Error:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}