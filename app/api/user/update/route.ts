import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, scriptUrl } = await request.json();
    const adminScriptUrl = process.env.GOOGLE_SCRIPT_URL; // Script Admin

    if (!adminScriptUrl) {
      return NextResponse.json({ message: 'Server configuration error' }, { status: 500 });
    }

    const res = await fetch(adminScriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'update_script_url', email, scriptUrl }),
    });

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("User Update API Error:", error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
