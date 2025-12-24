import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { token } = body;

    if (!token) {
      return NextResponse.json({ status: 'error', message: 'Token required' }, { status: 400 });
    }

    const scriptUrl = process.env.ADMIN_SCRIPT_URL;
    if (!scriptUrl) {
      return NextResponse.json({ status: 'error', message: 'Server Config Error' }, { status: 500 });
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'findDbByToken',
        token
      }),
    });

    const text = await response.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data);
    } catch (e) {
      return NextResponse.json({ status: 'error', message: 'Invalid response from Google Script' }, { status: 502 });
    }
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
