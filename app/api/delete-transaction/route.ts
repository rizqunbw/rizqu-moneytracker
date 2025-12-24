import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { scriptUrl, rowIndex } = await req.json();

    // Validasi: Pastikan scriptUrl dan rowIndex tersedia
    if (!scriptUrl || !rowIndex) {
      return NextResponse.json({ status: 'error', message: 'Missing parameters' }, { status: 400 });
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'deleteTransaction',
        rowIndex: rowIndex
      }),
    });

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Delete Proxy Error:", error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
