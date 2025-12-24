import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { email, updates } = body;

    if (!email || !updates) {
      return NextResponse.json({ status: 'error', message: 'Missing required fields' }, { status: 400 });
    }

    // Pastikan ADMIN_SCRIPT_URL sudah diset di .env.local
    const scriptUrl = process.env.ADMIN_SCRIPT_URL;

    if (!scriptUrl) {
      return NextResponse.json({ status: 'error', message: 'Server Config Error: ADMIN_SCRIPT_URL not set' }, { status: 500 });
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateUser',
        email,
        updates
      }),
    });

    // Handle jika Google Script mengembalikan HTML (Error Page) alih-alih JSON
    const text = await response.text();
    let data;
    try {
      data = JSON.parse(text);
    } catch (e) {
      return NextResponse.json({ status: 'error', message: 'Invalid response from Google Script' }, { status: 502 });
    }

    // Jika sukses, bersihkan password dari response dan generate sessionToken ulang
    if (data.status === 'success' && data.user) {
      const user = data.user;
      const sessionToken = Buffer.from(`${user.email}:${user.password}:${user.pin}`).toString('base64');
      const { password: _, ...userWithoutPassword } = user;
      
      return NextResponse.json({ ...data, user: { ...userWithoutPassword, sessionToken } });
    }

    return NextResponse.json(data); // Return error as is

  } catch (error) {
    console.error("API Error:", error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
