import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { scriptUrl } = await request.json();
    if (!scriptUrl || !scriptUrl.includes('script.google.com')) {
       return NextResponse.json({ status: 'error', message: 'URL Script tidak valid' }, { status: 400 });
    }
    return NextResponse.json({ status: 'success', message: 'Connected' });
  } catch (error) {
    return NextResponse.json({ status: 'error', message: 'Error connecting' }, { status: 500 });
  }
}