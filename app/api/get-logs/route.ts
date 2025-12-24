import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { scriptUrl } = await req.json();

    if (!scriptUrl) {
      return NextResponse.json({ status: 'error', message: 'Missing scriptUrl' }, { status: 400 });
    }

    const response = await fetch(scriptUrl + '?action=get_logs', {
      method: 'GET', // Google Apps Script doGet menangani ini
    });

    // Handle redirect dari Google Script jika ada (biasanya fetch nodejs handle ini otomatis, tapi untuk jaga-jaga)
    if (response.redirected) {
        const redirectedResponse = await fetch(response.url);
        const data = await redirectedResponse.json();
        return NextResponse.json(data);
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error("Get Logs Proxy Error:", error);
    return NextResponse.json({ status: 'error', message: 'Internal Server Error' }, { status: 500 });
  }
}