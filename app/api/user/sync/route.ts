import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, sessionToken } = await request.json();

    if (!email) {
      return NextResponse.json({ status: 'error', message: 'Email required' }, { status: 400 });
    }

    const scriptUrl = process.env.ADMIN_SCRIPT_URL;
    if (!scriptUrl) {
      return NextResponse.json({ status: 'error', message: 'Server Config Error' }, { status: 500 });
    }

    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'findUser',
        email
      }),
    });

    const data = await response.json();

    if (data.status === 'success' && data.user) {
        // Generate token terbaru dari data DB
        const currentSessionToken = Buffer.from(`${data.user.email}:${data.user.password}:${data.user.pin}`).toString('base64');

        // Bandingkan dengan token dari client
        if (sessionToken !== currentSessionToken) {
             return NextResponse.json({ status: 'error', message: 'Session expired or credentials changed' }, { status: 401 });
        }

        // Hapus password sebelum dikirim ke client
        const { password, ...userWithoutPassword } = data.user;
        return NextResponse.json({ status: 'success', user: { ...userWithoutPassword, sessionToken: currentSessionToken } });
    }

    return NextResponse.json(data);

  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
