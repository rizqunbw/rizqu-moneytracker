export type DbInfo = { name: string; scriptUrl: string; token?: string; editCount?: number };
export type User = { email: string; databases: DbInfo[] | null; editCount?: number; pin?: string; sessionToken?: string };
export type Summary = { income: number; expense: number; balance: number };
export type Transaction = { rowIndex: number; timestamp: string; amount: string; description: string; image_url: string };
export type LogItem = { timestamp: string; action: string };