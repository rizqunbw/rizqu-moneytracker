import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  const scriptUrl = process.env.ADMIN_SCRIPT_URL;
  if (!scriptUrl) return NextResponse.json({ status: 'error', message: 'Config Error' }, { status: 500 });

  try {
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'getAllUsers' }),
    });
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Internal Error' }, { status: 500 });
  }
}
