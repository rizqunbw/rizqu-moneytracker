import { NextResponse } from 'next/server';
import { findUser, updateUser } from '@/lib/db';

export async function POST(request: Request) {
  try {
    const { email, databases } = await request.json();

    const user = await findUser(email);
    if (!user) {
      return NextResponse.json({ status: 'error', message: 'User tidak ditemukan' }, { status: 404 });
    }

    // Update user dengan list database yang baru
    const updatedUser = await updateUser(email, {
      databases: databases
    });

    return NextResponse.json({ status: 'success', databases: updatedUser?.databases });
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}
