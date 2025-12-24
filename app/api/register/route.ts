import { NextResponse } from 'next/server';
import { findUser, saveUser } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, password, pin } = await request.json();

    if (!email || !password || !pin) {
      return NextResponse.json({ status: 'error', message: 'Email, password, dan PIN wajib diisi' }, { status: 400 });
    }

    const existingUser = await findUser(email);
    if (existingUser) {
      return NextResponse.json({ status: 'error', message: 'Email sudah terdaftar' }, { status: 400 });
    }

    // Simpan user baru
    const newUser = {
      email,
      password: password, // Simpan password sebagai plain text
      pin: pin,
      databases: []
    };

    // Tunggu hasil simpan dan cek statusnya
    const saveResult = await saveUser(newUser);

    if (saveResult?.status !== 'success') {
      console.error("Gagal menyimpan user:", saveResult);
      return NextResponse.json({ status: 'error', message: saveResult?.message || 'Gagal menyimpan data ke Google Sheets' }, { status: 500 });
    }

    return NextResponse.json({ status: 'success', message: 'Registrasi berhasil' });
  } catch (error) {
    console.error("Register API Error:", error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}