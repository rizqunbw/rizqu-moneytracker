import { User } from '@/types';

// Ambil URL dari environment variable
const ADMIN_SCRIPT_URL = process.env.ADMIN_SCRIPT_URL;

export type StoredUser = User & { password: string; pin: string; editCount?: number };

// Helper untuk melakukan request ke Google Sheets Admin
async function fetchAdmin(action: string, payload: any) {
  if (!ADMIN_SCRIPT_URL) {
    console.error("FATAL: ADMIN_SCRIPT_URL is missing. Check .env.local");
    return { status: 'error', message: 'Server Config Error: ADMIN_SCRIPT_URL missing' };
  }

  try {
    console.log(`[DB] Sending ${action} to Google Sheets...`);
    const res = await fetch(ADMIN_SCRIPT_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, ...payload }),
      cache: 'no-store' // Penting untuk Vercel agar data selalu fresh
    });
    
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      console.log(`[DB] Response from Google Sheets (${action}):`, data);
      return data;
    } catch (e) {
      console.error(`[DB] Invalid JSON response (${action}). Response preview: ${text.substring(0, 150)}...`);
      return { status: 'error', message: 'Invalid Response from Google Sheets (Check Permissions)' };
    }
  } catch (error) {
    console.error("DB Connection Error:", error);
    return { status: 'error', message: 'Connection Failed' };
  }
}

export const findUser = async (email: string): Promise<StoredUser | undefined> => {
  const data = await fetchAdmin('findUser', { email });
  if (data && data.status === 'success' && data.user) {
    return data.user;
  }

  return undefined;
};

export const saveUser = async (user: StoredUser) => {
  // Return response agar bisa dicek di route
  return await fetchAdmin('register', { user });
};

export const updateUser = async (email: string, updates: Partial<StoredUser>) => {
  const data = await fetchAdmin('updateUser', { email, updates });
  return data?.user || null;
};

export const incrementEditCount = async (email: string) => {
  const data = await fetchAdmin('incrementEditCount', { email });
  return data?.editCount || 0;
};