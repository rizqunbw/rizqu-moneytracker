import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { email, pin, newPassword } = await request.json();

    if (!email || !pin || !newPassword) {
      return NextResponse.json({ status: 'error', message: 'Data tidak lengkap' }, { status: 400 });
    }

    const scriptUrl = process.env.ADMIN_SCRIPT_URL;
    if (!scriptUrl) {
      return NextResponse.json({ status: 'error', message: 'Server Config Error' }, { status: 500 });
    }

    // 1. Verifikasi PIN lagi untuk keamanan ganda sebelum update
    const findRes = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'findUser', email }),
    });
    const findData = await findRes.json();

    if (findData.status !== 'success' || !findData.user || String(findData.user.pin) !== String(pin)) {
      return NextResponse.json({ status: 'error', message: 'Verifikasi Gagal. PIN mungkin salah.' }, { status: 401 });
    }

    // 2. Update Password
    const updateRes = await fetch(scriptUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        action: 'updateUser',
        email,
        updates: { password: newPassword }
      }),
    });

    const updateData = await updateRes.json();
    return NextResponse.json(updateData);

  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
