import { NextResponse } from 'next/server';
import { findUser } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    const user = await findUser(email);

    // Cek user ada, lalu bandingkan password input dengan password di database (Plain Text)
    if (!user || password !== user.password) {
      return NextResponse.json({ status: 'error', message: 'Email atau password salah' }, { status: 401 });
    }

    // Generate Session Token (Hash sederhana dari kredensial)
    // Jika password/pin berubah di DB, token ini akan berbeda dengan yang disimpan client
    const sessionToken = Buffer.from(`${email}:${user.password}:${user.pin}`).toString('base64');

    // Kembalikan data user tanpa password, tapi dengan sessionToken
    const { password: _, ...userWithoutPassword } = user;

    return NextResponse.json({ 
      status: 'success', 
      user: { ...userWithoutPassword, sessionToken }
    });
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}