import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, pin } = await request.json();

    if (!email || !pin) {
      return NextResponse.json({ status: 'error', message: 'Email dan PIN wajib diisi' }, { status: 400 });
    }

    const scriptUrl = process.env.ADMIN_SCRIPT_URL;
    if (!scriptUrl) {
      return NextResponse.json({ status: 'error', message: 'Server Config Error' }, { status: 500 });
    }

    // Gunakan findUser untuk mengambil data user (termasuk PIN)
    const response = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'findUser', email }),
    });

    const data = await response.json();

    if (data.status === 'success' && data.user) {
      // Verifikasi PIN di sisi server Next.js
      if (String(data.user.pin) === String(pin)) {
        return NextResponse.json({ status: 'success', message: 'PIN Terverifikasi' });
      } else {
        return NextResponse.json({ status: 'error', message: 'PIN Salah' }, { status: 401 });
      }
    }

    return NextResponse.json({ status: 'error', message: 'Email tidak ditemukan' }, { status: 404 });

  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
